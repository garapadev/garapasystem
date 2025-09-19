import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/whatsapp/qrcode/[id] - Obter QR Code dinâmico para um colaborador específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const colaboradorId = id;
    
    console.log('[DEBUG QR API] GET /api/whatsapp/qrcode - Colaborador ID:', colaboradorId);

    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log('[DEBUG QR API] Session user:', session?.user?.email);
    
    if (!session?.user) {
      console.log('[DEBUG QR API] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o colaborador existe
    const colaborador = await prisma.colaborador.findUnique({
      where: { id: colaboradorId }
    });
    
    console.log('[DEBUG QR API] Colaborador encontrado:', !!colaborador);

    if (!colaborador) {
      console.log('[DEBUG QR API] Colaborador não encontrado');
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para acessar este colaborador
    const userColaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });
    
    console.log('[DEBUG QR API] User colaborador ID:', userColaborador?.id);
    console.log('[DEBUG QR API] Colaborador ID solicitado:', colaboradorId);

    if (!userColaborador || userColaborador.id !== colaboradorId) {
      console.log('[DEBUG QR API] Sem permissão para acessar este colaborador');
      return NextResponse.json(
        { error: 'Sem permissão para acessar este colaborador' },
        { status: 403 }
      );
    }

    // Buscar sessão WhatsApp
    const whatsappSession = await prisma.whatsAppSession.findUnique({
      where: { colaboradorId }
    });
    
    console.log('[DEBUG QR API] Sessão encontrada:', whatsappSession ? `ID: ${whatsappSession.id}, Status: ${whatsappSession.status}` : 'Nenhuma');

    if (!whatsappSession) {
      console.log('[DEBUG QR API] Sessão não encontrada');
      return NextResponse.json(
        { error: 'Sessão WhatsApp não encontrada' },
        { status: 404 }
      );
    }

    // Verificar status atual no worker para obter QR Code atualizado
    try {
      const workerUrl = `${process.env.WHATSAPP_WORKER_URL}/session`;
      const workerPayload = {
        collaboratorId: colaboradorId,
        action: 'status'
      };
      
      console.log('[DEBUG QR API] Consultando worker para QR Code:', workerUrl);
      console.log('[DEBUG QR API] Payload:', workerPayload);
      
      const workerResponse = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerPayload)
      });
      
      console.log('[DEBUG QR API] Worker response status:', workerResponse.status);

      if (workerResponse.ok) {
        const workerResult = await workerResponse.json();
        console.log('[DEBUG QR API] Worker result:', workerResult);
        
        // Atualizar sessão no banco se necessário
        if (workerResult.status !== whatsappSession.status || workerResult.qrCode !== whatsappSession.qrCode) {
          console.log('[DEBUG QR API] Atualizando sessão no banco com novos dados');
          await prisma.whatsAppSession.update({
            where: { colaboradorId },
            data: {
              status: workerResult.status,
              qrCode: workerResult.qrCode || null,
              lastActivity: new Date()
            }
          });
        }

        const response = {
          success: true,
          status: workerResult.status,
          qrCode: workerResult.qrCode,
          sessionId: whatsappSession.id,
          lastUpdate: new Date().toISOString(),
          message: getQRStatusMessage(workerResult.status)
        };
        
        console.log('[DEBUG QR API] Retornando resposta:', response);
        return NextResponse.json(response);

      } else {
        const errorText = await workerResponse.text();
        console.log('[DEBUG QR API] Worker error response:', errorText);
        throw new Error(`Worker respondeu com status ${workerResponse.status}: ${errorText}`);
      }

    } catch (error) {
      console.error('[DEBUG QR API] Erro ao comunicar com worker:', error);
      
      // Retornar dados do banco como fallback
      const response = {
        success: false,
        status: whatsappSession.status,
        qrCode: whatsappSession.qrCode,
        sessionId: whatsappSession.id,
        lastUpdate: whatsappSession.lastActivity?.toISOString(),
        message: 'Erro ao obter QR Code atualizado',
        error: 'Worker não disponível'
      };
      
      console.log('[DEBUG QR API] Retornando fallback:', response);
      return NextResponse.json(response, { status: 503 });
    }

  } catch (error) {
    console.error('Erro ao obter QR Code:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function getQRStatusMessage(status: string): string {
  switch (status) {
    case 'qr_code':
      return 'QR Code gerado. Escaneie com seu WhatsApp.';
    case 'connecting':
      return 'Conectando ao WhatsApp...';
    case 'connected':
      return 'WhatsApp conectado com sucesso!';
    case 'error':
      return 'Erro na geração do QR Code';
    case 'not_connected':
      return 'Sessão não iniciada';
    default:
      return 'Status desconhecido';
  }
}
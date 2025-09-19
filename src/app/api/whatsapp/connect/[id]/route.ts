import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/whatsapp/connect/[id] - Conectar WhatsApp para um colaborador específico
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const colaboradorId = id;
    
    console.log('[DEBUG API] POST /api/whatsapp/connect - Colaborador ID:', colaboradorId);

    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log('[DEBUG API] Session user:', session?.user?.email);
    
    if (!session?.user) {
      console.log('[DEBUG API] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o colaborador existe
    const colaborador = await prisma.colaborador.findUnique({
      where: { id: colaboradorId }
    });
    
    console.log('[DEBUG API] Colaborador encontrado:', !!colaborador);

    if (!colaborador) {
      console.log('[DEBUG API] Colaborador não encontrado');
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para conectar este colaborador
    const userColaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });
    
    console.log('[DEBUG API] User colaborador ID:', userColaborador?.id);
    console.log('[DEBUG API] Colaborador ID solicitado:', colaboradorId);

    if (!userColaborador || userColaborador.id !== colaboradorId) {
      console.log('[DEBUG API] Sem permissão para conectar este colaborador');
      return NextResponse.json(
        { error: 'Sem permissão para conectar este colaborador' },
        { status: 403 }
      );
    }

    // Verificar se já existe uma sessão ativa
    let whatsappSession = await prisma.whatsAppSession.findUnique({
      where: { colaboradorId }
    });
    
    console.log('[DEBUG API] Sessão existente:', whatsappSession ? `ID: ${whatsappSession.id}, Status: ${whatsappSession.status}` : 'Nenhuma');

    if (whatsappSession && whatsappSession.status === 'connected') {
      console.log('[DEBUG API] Já existe uma sessão conectada');
      return NextResponse.json(
        { error: 'Já existe uma sessão WhatsApp para este colaborador' },
        { status: 409 }
      );
    }

    // Criar ou atualizar sessão no banco
    if (!whatsappSession) {
      console.log('[DEBUG API] Criando nova sessão no banco');
      whatsappSession = await prisma.whatsAppSession.create({
        data: {
          colaboradorId,
          status: 'initializing',
          lastActivity: new Date()
        }
      });
    } else {
      console.log('[DEBUG API] Atualizando sessão existente para initializing');
      whatsappSession = await prisma.whatsAppSession.update({
        where: { colaboradorId },
        data: {
          status: 'initializing',
          lastActivity: new Date()
        }
      });
    }
    
    console.log('[DEBUG API] Sessão criada/atualizada:', whatsappSession.id);

    // Comunicar com o worker para iniciar a sessão
    try {
      const workerUrl = `${process.env.WHATSAPP_WORKER_URL}/session`;
      const workerPayload = {
        collaboratorId: colaboradorId,
        action: 'start'
      };
      
      console.log('[DEBUG API] Enviando para worker:', workerUrl);
      console.log('[DEBUG API] Payload:', workerPayload);
      
      const workerResponse = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerPayload)
      });
      
      console.log('[DEBUG API] Worker response status:', workerResponse.status);

      if (!workerResponse.ok) {
        const errorText = await workerResponse.text();
        console.log('[DEBUG API] Worker error response:', errorText);
        throw new Error(`Worker respondeu com status ${workerResponse.status}: ${errorText}`);
      }

      const workerResult = await workerResponse.json();
      console.log('[DEBUG API] Worker result:', workerResult);

      // Atualizar status no banco
      const updatedSession = await prisma.whatsAppSession.update({
        where: { colaboradorId },
        data: {
          status: workerResult.status,
          qrCode: workerResult.qrCode || null,
          lastActivity: new Date()
        }
      });
      
      console.log('[DEBUG API] Sessão atualizada no banco:', {
        id: updatedSession.id,
        status: updatedSession.status,
        hasQrCode: !!updatedSession.qrCode
      });

      const response = {
        success: true,
        sessionId: whatsappSession.id,
        status: workerResult.status,
        qrCode: workerResult.qrCode,
        message: 'Conexão iniciada com sucesso'
      };
      
      console.log('[DEBUG API] Retornando resposta:', response);

      return NextResponse.json(response);

    } catch (error) {
      console.error('[DEBUG API] Erro ao comunicar com worker:', error);
      
      // Atualizar status como erro
      await prisma.whatsAppSession.update({
        where: { colaboradorId },
        data: {
          status: 'error',
          lastActivity: new Date()
        }
      });

      return NextResponse.json(
        { error: 'Erro ao iniciar conexão WhatsApp' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao conectar WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
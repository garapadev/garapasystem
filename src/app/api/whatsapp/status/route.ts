import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/whatsapp/status - Obter status da sessão WhatsApp
export async function GET(request: NextRequest) {
  try {
    console.log('[DEBUG STATUS API] GET /api/whatsapp/status');
    
    const session = await getServerSession(authOptions);
    console.log('[DEBUG STATUS API] Session user:', session?.user?.email);
    
    if (!session?.user?.email) {
      console.log('[DEBUG STATUS API] Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar colaborador pelo email da sessão
    const colaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });
    
    console.log('[DEBUG STATUS API] Colaborador encontrado:', !!colaborador);

    if (!colaborador) {
      console.log('[DEBUG STATUS API] Colaborador não encontrado');
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    const colaboradorId = colaborador.id;
    console.log('[DEBUG STATUS API] Colaborador ID:', colaboradorId);

    // Buscar sessão no banco de dados
    let whatsappSession = await prisma.whatsAppSession.findUnique({
      where: {
        colaboradorId
      }
    });
    
    console.log('[DEBUG STATUS API] Sessão no banco:', whatsappSession ? `ID: ${whatsappSession.id}, Status: ${whatsappSession.status}` : 'Nenhuma');

    if (!whatsappSession) {
      console.log('[DEBUG STATUS API] Criando nova sessão com status not_connected');
      // Se não existir sessão, criar uma nova com status 'not_connected'
      whatsappSession = await prisma.whatsAppSession.create({
        data: {
          colaboradorId,
          status: 'not_connected',
          lastActivity: new Date()
        }
      });
      
      return NextResponse.json({
        id: colaboradorId,
        status: 'not_connected',
        qrCode: null,
        sessionData: null,
        message: 'Sessão não encontrada'
      });
    }

    // Verificar status no worker
    let currentStatus = whatsappSession.status;
    let qrCode = whatsappSession.qrCode;
    let sessionInfo = null;
    
    console.log('[DEBUG STATUS API] Status inicial do banco:', currentStatus);

    try {
      const workerUrl = `${process.env.WHATSAPP_WORKER_URL}/session`;
      const workerPayload = {
        collaboratorId: colaboradorId,
        action: 'status'
      };
      
      console.log('[DEBUG STATUS API] Consultando worker:', workerUrl);
      console.log('[DEBUG STATUS API] Payload:', workerPayload);
      
      const workerResponse = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workerPayload)
      });
      
      console.log('[DEBUG STATUS API] Worker response status:', workerResponse.status);

      if (workerResponse.ok) {
        const workerResult = await workerResponse.json();
        console.log('[DEBUG STATUS API] Worker result:', workerResult);
        currentStatus = workerResult.status;
        qrCode = workerResult.qrCode || qrCode;
        
        if (workerResult.sessionInfo) {
          sessionInfo = {
            phone: workerResult.sessionInfo.phone,
            name: workerResult.sessionInfo.name,
            avatar: workerResult.sessionInfo.avatar,
            connectedAt: whatsappSession.lastActivity
          };
        }

        // Se o status mudou, atualizar no banco
        if (currentStatus !== whatsappSession.status || qrCode !== whatsappSession.qrCode) {
          console.log('[DEBUG STATUS API] Status mudou, atualizando banco:', {
            statusAnterior: whatsappSession.status,
            statusNovo: currentStatus,
            qrCodeAnterior: !!whatsappSession.qrCode,
            qrCodeNovo: !!qrCode
          });
          
          await prisma.whatsAppSession.update({
            where: {
              colaboradorId
            },
            data: {
              status: currentStatus,
              qrCode,
              phoneNumber: workerResult.sessionInfo?.phone || whatsappSession.phoneNumber,
              lastActivity: new Date()
            }
          });
        } else {
          console.log('[DEBUG STATUS API] Status não mudou, mantendo dados do banco');
        }
      } else {
        console.log('[DEBUG STATUS API] Worker response não ok, usando dados do banco');
      }
    } catch (error) {
      console.error('[DEBUG STATUS API] Erro ao verificar status no worker:', error);
      // Usar dados do banco se o worker não responder
    }

    const response = {
      id: colaboradorId,
      status: currentStatus,
      qrCode,
      sessionData: sessionInfo,
      lastUpdate: new Date().toISOString(),
      message: getStatusMessage(currentStatus),
      workerConnected: true
    };
    
    console.log('[DEBUG STATUS API] Retornando resposta:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro ao obter status da sessão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case 'connected':
      return 'WhatsApp conectado com sucesso';
    case 'connecting':
      return 'Conectando ao WhatsApp...';
    case 'qr_code':
      return 'Escaneie o QR Code com seu WhatsApp';
    case 'disconnected':
      return 'WhatsApp desconectado';
    case 'error':
      return 'Erro na conexão com WhatsApp';
    case 'not_connected':
    default:
      return 'WhatsApp não conectado';
  }
}
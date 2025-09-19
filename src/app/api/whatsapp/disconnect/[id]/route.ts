import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/whatsapp/disconnect/[id] - Desconectar WhatsApp para um colaborador específico
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const colaboradorId = id;

    // Buscar colaborador pelo ID
    const colaborador = await prisma.colaborador.findUnique({
      where: { id: colaboradorId }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para desconectar este colaborador
    const userColaborador = await prisma.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            email: session.user.email
          }
        }
      }
    });

    if (!userColaborador || userColaborador.id !== colaboradorId) {
      return NextResponse.json(
        { error: 'Sem permissão para desconectar este colaborador' },
        { status: 403 }
      );
    }

    // Buscar sessão WhatsApp
    const whatsappSession = await prisma.whatsAppSession.findUnique({
      where: { colaboradorId }
    });

    if (!whatsappSession) {
      return NextResponse.json(
        { error: 'Sessão WhatsApp não encontrada' },
        { status: 404 }
      );
    }

    // Comunicar com o worker para parar a sessão
    try {
      const workerResponse = await fetch(`${process.env.WHATSAPP_WORKER_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaboratorId: colaboradorId,
          action: 'stop'
        })
      });

      if (!workerResponse.ok) {
        console.warn(`Worker respondeu com status ${workerResponse.status}`);
      }

    } catch (error) {
      console.error('Erro ao comunicar com worker:', error);
      // Continuar mesmo com erro do worker
    }

    // Atualizar status no banco para desconectado
    await prisma.whatsAppSession.update({
      where: { colaboradorId },
      data: {
        status: 'not_connected',
        qrCode: null,
        phoneNumber: null,
        lastActivity: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
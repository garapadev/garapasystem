import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/whatsapp/sessions - Buscar sessão individual do colaborador
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
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

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Buscar APENAS a sessão do colaborador logado (individual)
    const whatsappSession = await prisma.whatsAppSession.findUnique({
      where: {
        colaboradorId: colaborador.id
      },
      include: {
        colaborador: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!whatsappSession) {
      return NextResponse.json({
        colaboradorId: colaborador.id,
        colaboradorNome: colaborador.nome,
        status: 'not_created',
        message: 'Sessão WhatsApp não criada para este colaborador'
      });
    }

    // Verificar status no worker
    let workerStatus = null;
    try {
      const workerResponse = await fetch(`${process.env.WHATSAPP_WORKER_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaboratorId: colaborador.id,
          action: 'status'
        })
      });

      if (workerResponse.ok) {
        workerStatus = await workerResponse.json();
      }
    } catch (error) {
      console.error('Erro ao verificar status no worker:', error);
    }

    return NextResponse.json({
      id: whatsappSession.id,
      colaboradorId: whatsappSession.colaboradorId,
      colaboradorNome: whatsappSession.colaborador.nome,
      status: workerStatus?.status || whatsappSession.status,
      phoneNumber: whatsappSession.phoneNumber,
      qrCode: workerStatus?.qrCode || whatsappSession.qrCode,
      lastActivity: whatsappSession.lastActivity,
      createdAt: whatsappSession.createdAt,
      workerConnected: !!workerStatus
    });

  } catch (error) {
    console.error('Erro ao buscar sessão WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/sessions - Iniciar sessão WhatsApp individual
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body; // "start", "stop", "restart"

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

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se existe sessão no banco, se não criar
    let whatsappSession = await prisma.whatsAppSession.findUnique({
      where: {
        colaboradorId: colaborador.id
      }
    });

    if (!whatsappSession && action === 'start') {
      // Criar nova sessão no banco
      whatsappSession = await prisma.whatsAppSession.create({
        data: {
          colaboradorId: colaborador.id,
          status: 'initializing',
          lastActivity: new Date()
        }
      });
    }

    if (!whatsappSession) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      );
    }

    // Comunicar com o worker
    try {
      const workerResponse = await fetch(`${process.env.WHATSAPP_WORKER_URL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaboratorId: colaborador.id,
          action: action || 'start'
        })
      });

      if (!workerResponse.ok) {
        throw new Error(`Worker respondeu com status ${workerResponse.status}`);
      }

      const workerResult = await workerResponse.json();

      // Atualizar status no banco de dados
      await prisma.whatsAppSession.update({
        where: {
          colaboradorId: colaborador.id
        },
        data: {
          status: workerResult.status,
          qrCode: workerResult.qrCode || null,
          lastActivity: new Date()
        }
      });

      return NextResponse.json({
        id: whatsappSession.id,
        colaboradorId: colaborador.id,
        colaboradorNome: colaborador.nome,
        status: workerResult.status,
        qrCode: workerResult.qrCode,
        message: workerResult.error || 'Operação realizada com sucesso',
        lastActivity: new Date()
      });

    } catch (error) {
      console.error('Erro ao comunicar com worker:', error);
      
      // Atualizar status como erro no banco
      await prisma.whatsAppSession.update({
        where: {
          colaboradorId: colaborador.id
        },
        data: {
          status: 'error',
          lastActivity: new Date()
        }
      });

      return NextResponse.json(
        { error: 'Erro ao comunicar com o serviço WhatsApp' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar sessão WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
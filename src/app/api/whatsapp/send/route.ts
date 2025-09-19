import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/whatsapp/send - Enviar mensagem via WhatsApp
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { to, message, type = 'text' } = body;

    if (!to || !message) {
      return NextResponse.json({ 
        error: 'Destinatário e mensagem são obrigatórios' 
      }, { status: 400 });
    }

    const colaboradorId = colaborador.id;

    // Enviar mensagem através do worker
    try {
      const workerResponse = await fetch(`${process.env.WHATSAPP_WORKER_URL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaboratorId: colaboradorId,
          to,
          message,
          messageType: type
        })
      });

      if (!workerResponse.ok) {
        const errorData = await workerResponse.json();
        throw new Error(errorData.error || `Worker respondeu com status ${workerResponse.status}`);
      }

      const result = await workerResponse.json();

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Mensagem enviada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return NextResponse.json({ 
        error: 'Erro ao enviar mensagem' 
      }, { status: 500 });
    }

    // Buscar ou criar conversa
    let conversa = await db.whatsAppConversation.findFirst({
      where: {
        colaboradorId,
        chatId: to
      }
    });

    if (!conversa) {
      // Criar nova conversa
      conversa = await db.whatsAppConversation.create({
        data: {
          colaboradorId,
          chatId: to,
          nome: to, // Será atualizado quando recebermos o nome do contato
          telefone: to,
          lastMessageAt: new Date()
        }
      });
    } else {
      // Atualizar timestamp da última mensagem
      await db.whatsAppConversation.update({
        where: { id: conversa.id },
        data: { lastMessageAt: new Date() }
      });
    }

    // Salvar mensagem no banco de dados
    const novaMensagem = await db.whatsAppMessage.create({
      data: {
        id: result.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        conversaId: conversa.id,
        colaboradorId,
        from: colaboradorId,
        to,
        body: message,
        timestamp: new Date(),
        type: type as any,
        isFromMe: true,
        status: 'sent'
      }
    });

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: {
        id: novaMensagem.id,
        conversaId: conversa.id,
        from: colaboradorId,
        to,
        body: message,
        timestamp: novaMensagem.timestamp,
        type,
        isFromMe: true,
        status: 'sent'
      }
    });

  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/whatsapp/send - Verificar status do serviço de envio
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.colaborador) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const colaboradorId = session.user.colaborador.id;
    const sessionStatus = await whatsappService.getSessionStatus(colaboradorId);

    return NextResponse.json({
      status: sessionStatus,
      canSend: sessionStatus === 'connected',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao verificar status de envio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
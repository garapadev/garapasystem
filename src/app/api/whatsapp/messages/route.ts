import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/whatsapp/messages - Buscar mensagens de uma conversa
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

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'ID da conversa é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a conversa pertence ao colaborador
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        colaboradorId: colaborador.id
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Buscar mensagens da conversa
    const messages = await prisma.whatsAppMessage.findMany({
      where: {
        conversationId
      },
      orderBy: {
        timestamp: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Formatar mensagens para o frontend
    const messagesFormatted = messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      messageId: msg.messageId,
      content: msg.content,
      messageType: msg.messageType,
      isFromMe: msg.isFromMe,
      timestamp: msg.timestamp,
      status: msg.status,
      mediaUrl: msg.mediaUrl,
      mediaType: msg.mediaType,
      createdAt: msg.createdAt
    }));

    return NextResponse.json({
      messages: messagesFormatted.reverse(), // Reverter para ordem cronológica
      total: messages.length,
      hasMore: messages.length === limit,
      conversation: {
        id: conversation.id,
        contactName: conversation.contactName,
        contactPhone: conversation.contactPhone
      }
    });

  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/messages - Enviar mensagem
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
    const { conversationId, content, messageType = 'text' } = body;

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: 'ID da conversa e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se a conversa pertence ao colaborador
    const conversation = await prisma.whatsAppConversation.findFirst({
      where: {
        id: conversationId,
        colaboradorId: colaborador.id
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404 }
      );
    }

    // Enviar mensagem através do worker
    try {
      const workerResponse = await fetch(`${process.env.WHATSAPP_WORKER_URL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaboratorId: colaborador.id,
          to: conversation.contactPhone,
          message: content,
          messageType
        })
      });

      if (!workerResponse.ok) {
        const errorData = await workerResponse.json();
        throw new Error(errorData.error || `Worker respondeu com status ${workerResponse.status}`);
      }

      const workerResult = await workerResponse.json();

      return NextResponse.json({
        success: true,
        messageId: workerResult.messageId,
        message: 'Mensagem enviada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro ao processar envio de mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
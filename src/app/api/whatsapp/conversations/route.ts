import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/whatsapp/conversations - Buscar conversas do colaborador
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    // Buscar conversas do colaborador
    const whereClause: any = {
      colaboradorId: colaborador.id
    };

    if (search) {
      whereClause.OR = [
        {
          contactName: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          contactPhone: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    const conversations = await prisma.whatsAppConversation.findMany({
      where: whereClause,
      orderBy: {
        lastMessageAt: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        _count: {
          select: {
            messages: {
              where: {
                isFromMe: false
              }
            }
          }
        }
      }
    });

    // Formatar conversas para o frontend
    const conversasFormatadas = conversations.map(conv => ({
      id: conv.id,
      contactId: conv.contactId,
      contactName: conv.contactName,
      contactPhone: conv.contactPhone,
      lastMessage: conv.lastMessage,
      lastMessageAt: conv.lastMessageAt,
      unreadCount: conv.unreadCount,
      messageCount: conv._count.messages,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

    return NextResponse.json({
      conversations: conversasFormatadas,
      total: conversations.length,
      hasMore: conversations.length === limit
    });

  } catch (error) {
    console.error('Erro ao buscar conversas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/conversations - Criar nova conversa
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
    const { contactPhone, contactName } = body;

    if (!contactPhone) {
      return NextResponse.json({ error: 'Telefone é obrigatório' }, { status: 400 });
    }

    // Verificar se a conversa já existe
    const conversaExistente = await prisma.whatsAppConversation.findFirst({
      where: {
        contactPhone,
        colaboradorId: colaborador.id
      }
    });

    if (conversaExistente) {
      return NextResponse.json({
        success: true,
        conversation: {
          id: conversaExistente.id,
          contactId: conversaExistente.contactId,
          contactName: conversaExistente.contactName,
          contactPhone: conversaExistente.contactPhone,
          lastMessage: conversaExistente.lastMessage,
          lastMessageAt: conversaExistente.lastMessageAt,
          unreadCount: conversaExistente.unreadCount,
          createdAt: conversaExistente.createdAt,
          updatedAt: conversaExistente.updatedAt
        }
      });
    }

    // Criar nova conversa
    const novaConversa = await prisma.whatsAppConversation.create({
      data: {
        colaboradorId: colaborador.id,
        contactId: contactPhone.replace(/\D/g, ''), // Remove caracteres não numéricos
        contactName: contactName || contactPhone,
        contactPhone,
        lastMessageAt: new Date(),
        unreadCount: 0
      }
    });

    return NextResponse.json({
      success: true,
      conversation: {
        id: novaConversa.id,
        contactId: novaConversa.contactId,
        contactName: novaConversa.contactName,
        contactPhone: novaConversa.contactPhone,
        lastMessage: novaConversa.lastMessage,
        lastMessageAt: novaConversa.lastMessageAt,
        unreadCount: novaConversa.unreadCount,
        createdAt: novaConversa.createdAt,
        updatedAt: novaConversa.updatedAt
      }
    });

  } catch (error) {
    console.error('Erro ao criar conversa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
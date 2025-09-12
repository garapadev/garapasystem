import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TicketAuditService } from '@/lib/helpdesk/ticket-audit-service';

// Schema para criação de mensagem
const createMensagemSchema = z.object({
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  tipoConteudo: z.enum(['TEXTO', 'HTML', 'MARKDOWN']).default('TEXTO'),
  remetenteNome: z.string().min(1, 'Nome do remetente é obrigatório'),
  remetenteEmail: z.string().email('Email inválido'),
  isInterno: z.boolean().default(false),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Listar mensagens do ticket
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: params.id }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Buscar mensagens do ticket
    const mensagens = await db.helpdeskMensagem.findMany({
      where: {
        ticketId: params.id
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        anexos: {
          select: {
            id: true,
            nomeArquivo: true,
            tipoConteudo: true,
            tamanho: true,
            createdAt: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return NextResponse.json(mensagens);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova mensagem
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = createMensagemSchema.parse(body);

    // Verificar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: params.id }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Buscar colaborador pelo session user id
    const colaborador = await db.colaborador.findFirst({
      where: {
        usuarios: {
          some: {
            id: session.user.id
          }
        }
      }
    });

    // Criar mensagem
    const mensagem = await db.helpdeskMensagem.create({
      data: {
        ticketId: params.id,
        conteudo: data.conteudo,
        tipoConteudo: data.tipoConteudo,
        remetenteNome: data.remetenteNome,
        remetenteEmail: data.remetenteEmail,
        isInterno: data.isInterno,
        autorId: colaborador?.id,
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        anexos: true
      }
    });

    // Atualizar data da última resposta no ticket
    await db.helpdeskTicket.update({
      where: { id: params.id },
      data: {
        dataUltimaResposta: new Date()
      }
    });

    // Registrar adição de mensagem no log de auditoria
    const auditContext = TicketAuditService.getAuditContext(
      session.user?.name || 'Usuário',
      session.user?.email || 'usuario@sistema.com',
      session.user?.id
    );

    await TicketAuditService.logMessageAdded(
      params.id,
      {
        remetenteNome: data.remetenteNome,
        remetenteEmail: data.remetenteEmail,
        isInterno: data.isInterno,
        conteudo: data.conteudo
      },
      auditContext
    );

    return NextResponse.json(mensagem, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
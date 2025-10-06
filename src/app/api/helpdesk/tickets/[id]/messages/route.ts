import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// Schema para criação de mensagem
const createMessageSchema = z.object({
  conteudo: z.string().min(1, 'Conteúdo é obrigatório'),
  tipoConteudo: z.enum(['TEXTO', 'HTML']).optional().default('TEXTO'),
  visibilidade: z.enum(['PUBLICA', 'INTERNA']).optional().default('PUBLICA'),
  remetenteNome: z.string().optional(),
  remetenteEmail: z.string().email().optional()
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Listar mensagens do ticket
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ticketId = id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeInternal = searchParams.get('includeInternal') === 'true';

    // Verificar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: ticketId },
      select: { id: true, departamentoId: true }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {
      ticketId
    };

    // Se não incluir mensagens internas, filtrar apenas públicas
    if (!includeInternal) {
      where.visibilidade = 'PUBLICA';
    }

    // Buscar mensagens
    const [mensagens, total] = await Promise.all([
      db.helpdeskMensagem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { criadoEm: 'asc' },
        include: {
          autor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          anexos: {
            select: {
              id: true,
              nomeArquivo: true,
              tamanho: true,
              tipoMime: true,
              criadoEm: true
            }
          }
        }
      }),
      db.helpdeskMensagem.count({ where })
    ]);

    return NextResponse.json({
      mensagens,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
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

// POST - Criar nova mensagem
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      );
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ticketId = id;
    const body = await request.json();
    const validatedData = createMessageSchema.parse(body);

    // Verificar se o ticket existe
    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: ticketId },
      select: { 
        id: true, 
        status: true, 
        departamentoId: true,
        numero: true,
        assunto: true
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o ticket não está fechado
    if (ticket.status === 'FECHADO') {
      return NextResponse.json(
        { error: 'Não é possível adicionar mensagens a um ticket fechado' },
        { status: 400 }
      );
    }

    // Criar mensagem
    const mensagem = await db.helpdeskMensagem.create({
      data: {
        ticketId,
        conteudo: validatedData.conteudo,
        tipoConteudo: validatedData.tipoConteudo,
        visibilidade: validatedData.visibilidade,
        autorId: session.user.id,
        remetenteNome: validatedData.remetenteNome || session.user.name || 'Usuário',
        remetenteEmail: validatedData.remetenteEmail || session.user.email || ''
      },
      include: {
        autor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        anexos: {
          select: {
            id: true,
            nomeArquivo: true,
            tamanho: true,
            tipoMime: true,
            criadoEm: true
          }
        }
      }
    });

    // Atualizar timestamp do ticket
    await db.helpdeskTicket.update({
      where: { id: ticketId },
      data: { 
        atualizadoEm: new Date(),
        // Se estava resolvido, voltar para em andamento
        status: ticket.status === 'RESOLVIDO' ? 'EM_ANDAMENTO' : ticket.status
      }
    });

    return NextResponse.json(mensagem, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar mensagem
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mensagemId = searchParams.get('mensagemId');

    if (!mensagemId) {
      return NextResponse.json(
        { error: 'ID da mensagem é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { conteudo, visibilidade } = body;

    // Verificar se a mensagem existe e pertence ao usuário
    const mensagem = await db.helpdeskMensagem.findFirst({
      where: {
        id: mensagemId,
        ticketId: params.id,
        autorId: session.user.id
      }
    });

    if (!mensagem) {
      return NextResponse.json(
        { error: 'Mensagem não encontrada ou sem permissão para editar' },
        { status: 404 }
      );
    }

    // Verificar se a mensagem não é muito antiga (limite de 24 horas)
    const agora = new Date();
    const limiteTempo = new Date(mensagem.criadoEm.getTime() + 24 * 60 * 60 * 1000);
    
    if (agora > limiteTempo) {
      return NextResponse.json(
        { error: 'Não é possível editar mensagens com mais de 24 horas' },
        { status: 400 }
      );
    }

    // Atualizar mensagem
    const mensagemAtualizada = await db.helpdeskMensagem.update({
      where: { id: mensagemId },
      data: {
        conteudo: conteudo || mensagem.conteudo,
        visibilidade: visibilidade || mensagem.visibilidade,
        editadoEm: new Date()
      },
      include: {
        autor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        anexos: {
          select: {
            id: true,
            nomeArquivo: true,
            tamanho: true,
            tipoMime: true,
            criadoEm: true
          }
        }
      }
    });

    return NextResponse.json(mensagemAtualizada);

  } catch (error) {
    console.error('Erro ao atualizar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
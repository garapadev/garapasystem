import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { HelpdeskMiddleware } from '@/lib/helpdesk/helpdesk-middleware';
import { TicketAuditService } from '@/lib/helpdesk/ticket-audit-service';

// Schema para criação de ticket
const createTicketSchema = z.object({
  assunto: z.string().min(1, 'Assunto é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  clienteId: z.string().optional(),
  solicitanteNome: z.string().min(1, 'Nome do solicitante é obrigatório'),
  solicitanteEmail: z.string().email('Email inválido'),
  solicitanteTelefone: z.string().optional(),
  departamentoId: z.string(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
  responsavelId: z.string().optional(),
});

// Schema para listagem com filtros
const listTicketsSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  status: z.string().optional(),
  prioridade: z.string().optional(),
  departamentoId: z.string().optional(),
  responsavelId: z.string().optional(),
  clienteId: z.string().optional(),
});

interface TicketData {
  assunto: string;
  descricao: string;
  clienteId?: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  solicitanteTelefone?: string;
  departamentoId: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  responsavelId?: string;
}

// Função para gerar número sequencial do ticket
async function gerarNumeroTicket(): Promise<number> {
  const ano = new Date().getFullYear();
  
  // Buscar o último ticket do ano
  const ultimoTicket = await db.helpdeskTicket.findFirst({
    where: {
      numero: {
        gte: parseInt(`${ano}000`),
        lt: parseInt(`${ano + 1}000`)
      }
    },
    orderBy: {
      numero: 'desc'
    }
  });

  let proximoNumero = 1;
  if (ultimoTicket) {
    const numeroAtual = ultimoTicket.numero % 1000;
    proximoNumero = numeroAtual + 1;
  }

  return parseInt(`${ano}${proximoNumero.toString().padStart(3, '0')}`);
}

// GET - Listar tickets
export async function GET(request: NextRequest) {
  try {
    // Validar acesso ao helpdesk
    const authResult = await HelpdeskMiddleware.validateHelpdeskAccess(request);
    if (!authResult.hasAccess) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = listTicketsSchema.parse(Object.fromEntries(searchParams));
    
    const page = parseInt(params.page);
    const limit = parseInt(params.limit);
    const skip = (page - 1) * limit;

    // Construir filtros base
    const where: any = {};
    
    if (params.search) {
      where.OR = [
        { numero: { contains: params.search, mode: 'insensitive' } },
        { assunto: { contains: params.search, mode: 'insensitive' } },
        { cliente: { nome: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    
    if (params.status) {
      where.status = params.status;
    }
    
    if (params.prioridade) {
      where.prioridade = params.prioridade;
    }
    
    if (params.responsavelId) {
      where.responsavelId = params.responsavelId;
    }
    
    if (params.clienteId) {
      where.clienteId = params.clienteId;
    }

    // Aplicar filtro de departamento baseado no grupo hierárquico
    if (params.departamentoId) {
      // Se um departamento específico foi solicitado, verificar se o colaborador pode acessá-lo
      const canAccess = await HelpdeskMiddleware.canAccessDepartamento(
        authResult.grupoHierarquicoId || null,
        params.departamentoId
      );
      
      if (!canAccess) {
        return NextResponse.json({ error: 'Sem permissão para acessar este departamento' }, { status: 403 });
      }
      
      where.departamentoId = params.departamentoId;
    } else {
      // Se nenhum departamento específico foi solicitado, filtrar por grupo hierárquico
      const isAdmin = HelpdeskMiddleware.isHelpdeskAdmin(authResult.colaborador);
      
      if (!isAdmin) {
        // Para não-administradores, filtrar apenas departamentos do seu grupo hierárquico
        const departamentoFilter = HelpdeskMiddleware.buildDepartamentoFilter(authResult.grupoHierarquicoId);
        where.departamento = departamentoFilter;
      }
      // Administradores podem ver tickets de todos os departamentos
    }

    // Buscar tickets
    const [tickets, total] = await Promise.all([
      db.helpdeskTicket.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
            }
          },
          departamento: {
            select: {
              id: true,
              nome: true,
            }
          },
          responsavel: {
            select: {
              id: true,
              nome: true,
              email: true,
            }
          },
          _count: {
            select: {
              mensagens: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit,
      }),
      db.helpdeskTicket.count({ where })
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar tickets:', error);
    
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

// POST - Criar ticket
export async function POST(request: NextRequest) {
  try {
    // Validar acesso ao helpdesk
    const authResult = await HelpdeskMiddleware.validateHelpdeskAccess(request);
    if (!authResult.hasAccess) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const body = await request.json();
    const data = createTicketSchema.parse(body) as TicketData;

    // Verificar se o departamento existe
    const departamento = await db.helpdeskDepartamento.findUnique({
      where: { id: data.departamentoId }
    });
    
    if (!departamento) {
      return NextResponse.json(
        { error: 'Departamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o colaborador pode criar tickets neste departamento
    const canAccess = await HelpdeskMiddleware.canAccessDepartamento(
      authResult.grupoHierarquicoId || null,
      data.departamentoId
    );
    
    if (!canAccess) {
      return NextResponse.json(
        { error: 'Sem permissão para criar tickets neste departamento' },
        { status: 403 }
      );
    }

    // Verificar se o responsável existe (se fornecido)
    if (data.responsavelId) {
      const responsavel = await db.colaborador.findUnique({
        where: { id: data.responsavelId }
      });
      
      if (!responsavel) {
        return NextResponse.json(
          { error: 'Responsável não encontrado' },
          { status: 404 }
        );
      }
    }

    // Verificar se o cliente existe (se fornecido)
    if (data.clienteId) {
      const cliente = await db.cliente.findUnique({
        where: { id: data.clienteId }
      });
      
      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente não encontrado' },
          { status: 404 }
        );
      }
    }

    // Gerar número do ticket
    const numero = await gerarNumeroTicket();

    // Criar ticket
    const ticket = await db.helpdeskTicket.create({
      data: {
        numero,
        assunto: data.assunto,
        descricao: data.descricao,
        solicitanteNome: data.solicitanteNome,
        solicitanteEmail: data.solicitanteEmail,
        solicitanteTelefone: data.solicitanteTelefone,
        clienteId: data.clienteId,
        departamentoId: data.departamentoId,
        prioridade: data.prioridade,
        responsavelId: data.responsavelId,
        status: 'ABERTO',
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        departamento: {
          select: {
            id: true,
            nome: true,
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },

      }
    });

    // Criar mensagem inicial do sistema
    await db.helpdeskMensagem.create({
      data: {
        ticketId: ticket.id,
        conteudo: data.descricao || 'Ticket criado.',
        remetenteNome: data.solicitanteNome,
        remetenteEmail: data.solicitanteEmail,
        isInterno: false
      }
    });

    // Registrar criação do ticket no log de auditoria
    const auditContext = TicketAuditService.getAuditContext(
      authResult.colaborador?.nome || 'Sistema',
      authResult.colaborador?.email || 'sistema@helpdesk.com',
      authResult.colaborador?.id
    );

    await TicketAuditService.logTicketCreation(
      ticket.id,
      {
        assunto: ticket.assunto,
        prioridade: ticket.prioridade,
        status: ticket.status,
        solicitanteNome: ticket.solicitanteNome
      },
      auditContext
    );

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar ticket:', error);
    
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
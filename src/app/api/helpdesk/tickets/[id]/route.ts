import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Schema para atualização de ticket
const updateTicketSchema = z.object({
  assunto: z.string().min(1, 'Assunto é obrigatório').optional(),
  descricao: z.string().optional(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  status: z.enum(['ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO']).optional(),
  responsavelId: z.string().optional(),
  solicitanteNome: z.string().optional(),
  solicitanteEmail: z.string().email().optional(),
  solicitanteTelefone: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Buscar ticket por ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ticket = await db.helpdeskTicket.findUnique({
      where: { id: params.id },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          }
        },
        departamento: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        },
        mensagens: {
          include: {
            autor: {
              select: {
                id: true,
                nome: true,
                email: true,
              }
            },
            anexos: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Erro ao buscar ticket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar ticket
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateTicketSchema.parse(body);

    // Verificar se o ticket existe
    const ticketExistente = await db.helpdeskTicket.findUnique({
      where: { id: params.id }
    });

    if (!ticketExistente) {
      return NextResponse.json(
        { error: 'Ticket não encontrado' },
        { status: 404 }
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

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (data.assunto !== undefined) updateData.assunto = data.assunto;
    if (data.descricao !== undefined) updateData.descricao = data.descricao;
    if (data.prioridade !== undefined) updateData.prioridade = data.prioridade;
    if (data.status !== undefined) {
      updateData.status = data.status;
      
      // Se o status for FECHADO ou RESOLVIDO, definir data de fechamento
      if (data.status === 'FECHADO' || data.status === 'RESOLVIDO') {
        updateData.dataFechamento = new Date();
      } else {
        updateData.dataFechamento = null;
      }
    }
    if (data.responsavelId !== undefined) updateData.responsavelId = data.responsavelId;
    if (data.solicitanteNome !== undefined) updateData.solicitanteNome = data.solicitanteNome;
    if (data.solicitanteEmail !== undefined) updateData.solicitanteEmail = data.solicitanteEmail;
    if (data.solicitanteTelefone !== undefined) updateData.solicitanteTelefone = data.solicitanteTelefone;

    // Atualizar ticket
    const ticket = await db.helpdeskTicket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          }
        },
        departamento: {
          select: {
            id: true,
            nome: true,
            descricao: true,
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Erro ao atualizar ticket:', error);
    
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

// DELETE - Excluir ticket
export async function DELETE(
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

    // Excluir ticket (as mensagens e anexos serão excluídos em cascata)
    await db.helpdeskTicket.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Ticket excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir ticket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
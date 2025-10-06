import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do ticket é obrigatório' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { grupoHierarquicoId, observacao } = await request.json();
    const ticketId = id;

    if (!grupoHierarquicoId) {
      return NextResponse.json(
        { error: 'Grupo hierárquico é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se o ticket existe
    const ticket = await prisma.helpdeskTicket.findUnique({
      where: { id: ticketId },
      include: {
        departamento: {
          include: {
            grupoHierarquico: true
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

    // Verificar se o grupo hierárquico existe
    const novoGrupo = await prisma.grupoHierarquico.findUnique({
      where: { id: grupoHierarquicoId }
    });

    if (!novoGrupo) {
      return NextResponse.json(
        { error: 'Grupo hierárquico não encontrado' },
        { status: 404 }
      );
    }

    // Encontrar um departamento ativo no novo grupo
    const departamentoDestino = await prisma.helpdeskDepartamento.findFirst({
      where: {
        grupoHierarquicoId: grupoHierarquicoId,
        ativo: true
      }
    });
    
    if (!departamentoDestino) {
      return NextResponse.json(
        { error: 'Nenhum departamento ativo encontrado no grupo de destino' },
        { status: 400 }
      );
    }

    // Atualizar o ticket para o novo departamento
    const ticketAtualizado = await prisma.helpdeskTicket.update({
      where: { id: ticketId },
      data: {
        departamentoId: departamentoDestino.id,
        updatedAt: new Date()
      },
      include: {
        departamento: {
          include: {
            grupoHierarquico: {
              include: {
                parent: true
              }
            }
          }
        }
      }
    });

    // Criar mensagem de histórico do encaminhamento
    const grupoAnterior = ticket.departamento.grupoHierarquico;
    const mensagemHistorico = `Ticket encaminhado de "${grupoAnterior?.nome || 'Sem grupo'}" para "${novoGrupo.nome}"${observacao ? `. Observação: ${observacao}` : ''}`;

    await prisma.helpdeskMensagem.create({
      data: {
        ticketId: ticketId,
        conteudo: mensagemHistorico,
        tipoConteudo: 'TEXTO',
        isInterno: true,
        remetenteNome: session.user.name || 'Sistema',
        remetenteEmail: session.user.email || 'sistema@empresa.com',
        autorId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      ticket: ticketAtualizado,
      message: 'Ticket encaminhado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao encaminhar ticket:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
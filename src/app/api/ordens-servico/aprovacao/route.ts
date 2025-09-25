import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');

    if (!codigo) {
      return NextResponse.json(
        { error: 'Código de aprovação é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar ordem de serviço pelo código de aprovação
    const ordemServico = await db.ordemServico.findFirst({
      where: {
        codigoAprovacao: codigo,
        status: 'AGUARDANDO_APROVACAO'
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
            documento: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        itens: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        comentarios: {
          where: {
            visibilidadeCliente: true
          },
          include: {
            colaborador: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        anexos: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Código de aprovação inválido ou ordem de serviço não está aguardando aprovação' },
        { status: 404 }
      );
    }

    return NextResponse.json(ordemServico);
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço para aprovação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ordem de serviço' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigo, acao, observacoes, nomeCliente, emailCliente } = body;

    // Validar dados obrigatórios
    if (!codigo || !acao) {
      return NextResponse.json(
        { error: 'Código de aprovação e ação são obrigatórios' },
        { status: 400 }
      );
    }

    if (!['aprovar', 'rejeitar'].includes(acao)) {
      return NextResponse.json(
        { error: 'Ação deve ser "aprovar" ou "rejeitar"' },
        { status: 400 }
      );
    }

    // Buscar ordem de serviço pelo código de aprovação
    const ordemServico = await db.ordemServico.findFirst({
      where: {
        codigoAprovacao: codigo,
        status: 'AGUARDANDO_APROVACAO'
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Código de aprovação inválido ou ordem de serviço não está aguardando aprovação' },
        { status: 404 }
      );
    }

    const novoStatus = acao === 'aprovar' ? 'APROVADA' : 'REJEITADA';
    const dataAprovacao = acao === 'aprovar' ? new Date() : null;

    // Atualizar ordem de serviço
    const ordemServicoAtualizada = await db.ordemServico.update({
      where: { id: ordemServico.id },
      data: {
        status: novoStatus,
        dataAprovacao,
        codigoAprovacao: null, // Limpar código após uso
        updatedAt: new Date(),
        historico: {
          create: {
            acao: `${acao === 'aprovar' ? 'Aprovada' : 'Rejeitada'} pelo cliente`,
            valorAnterior: 'AGUARDANDO_APROVACAO',
            valorNovo: novoStatus,
            observacoes: observacoes || `${acao === 'aprovar' ? 'Aprovação' : 'Rejeição'} via portal do cliente`
          }
        }
      }
    });

    // Se houver comentário do cliente, adicionar
    if (observacoes) {
      await db.comentarioOrdemServico.create({
        data: {
          comentario: observacoes,
          visibilidadeCliente: true,
          ordemServicoId: ordemServico.id,
          // Não temos colaboradorId para cliente, deixar null
          colaboradorId: null
        }
      });
    }

    // TODO: Enviar notificações
    // - Notificar responsável sobre a decisão do cliente
    // - Enviar confirmação para o cliente
    // - Se aprovada, notificar equipe para iniciar execução

    return NextResponse.json({
      message: `Ordem de serviço ${acao === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso`,
      ordemServico: {
        id: ordemServicoAtualizada.id,
        titulo: ordemServicoAtualizada.titulo,
        status: ordemServicoAtualizada.status,
        dataAprovacao: ordemServicoAtualizada.dataAprovacao
      }
    });
  } catch (error) {
    console.error('Erro ao processar aprovação:', error);
    return NextResponse.json(
      { error: 'Erro ao processar aprovação' },
      { status: 500 }
    );
  }
}
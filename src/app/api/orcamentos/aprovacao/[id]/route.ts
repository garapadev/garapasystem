import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Verificar se orçamento existe
    const orcamento = await db.orcamento.findUnique({
      where: { id: params.id },
      include: {
        ordemServico: {
          include: {
            cliente: true
          }
        }
      }
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se orçamento está em status válido para aprovação
    if (orcamento.status !== 'ENVIADO' && orcamento.status !== 'EM_ANALISE') {
      return NextResponse.json(
        { error: 'Orçamento não está em status válido para aprovação' },
        { status: 400 }
      );
    }

    // Verificar se orçamento não está vencido
    if (orcamento.dataValidade && new Date() > orcamento.dataValidade) {
      return NextResponse.json(
        { error: 'Orçamento vencido. Solicite um novo orçamento.' },
        { status: 400 }
      );
    }

    const aprovado = body.aprovado === true;
    const comentarios = body.comentarios || null;

    // Atualizar orçamento
    const orcamentoAtualizado = await db.orcamento.update({
      where: { id: params.id },
      data: {
        aprovadoCliente: aprovado,
        dataAprovacao: new Date(),
        comentariosCliente: comentarios,
        status: aprovado ? 'APROVADO' : 'REJEITADO',
        updatedAt: new Date(),
        historico: {
          create: {
            acao: aprovado ? 'aprovado_cliente' : 'rejeitado_cliente',
            descricao: `Orçamento ${aprovado ? 'aprovado' : 'rejeitado'} pelo cliente${comentarios ? ': ' + comentarios : ''}`,
            colaboradorId: null // Ação do cliente, não de um colaborador
          }
        }
      },
      include: {
        ordemServico: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true
              }
            }
          }
        },
        laudoTecnico: {
          select: {
            id: true,
            numero: true,
            titulo: true
          }
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        itens: true,
        historico: {
          include: {
            colaborador: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    // Se aprovado, atualizar status da ordem de serviço
    if (aprovado) {
      await db.ordemServico.update({
        where: { id: orcamento.ordemServicoId },
        data: {
          status: 'AGUARDANDO_APROVACAO_CLIENTE',
          valorOrcamento: orcamento.valorTotal,
          historico: {
            create: {
              acao: 'orcamento_aprovado',
              descricao: `Orçamento ${orcamento.numero} aprovado pelo cliente`,
              colaboradorId: null
            }
          }
        }
      });
    }

    return NextResponse.json({
      message: `Orçamento ${aprovado ? 'aprovado' : 'rejeitado'} com sucesso`,
      orcamento: orcamentoAtualizado
    });
  } catch (error) {
    console.error('Erro ao processar aprovação do orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao processar aprovação do orçamento' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Buscar orçamento para visualização pública (sem dados sensíveis)
    const orcamento = await db.orcamento.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        numero: true,
        titulo: true,
        descricao: true,
        valorTotal: true,
        valorDesconto: true,
        percentualDesconto: true,
        dataValidade: true,
        observacoes: true,
        status: true,
        aprovadoCliente: true,
        dataAprovacao: true,
        comentariosCliente: true,
        createdAt: true,
        ordemServico: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true
              }
            }
          }
        },
        laudoTecnico: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            problemaRelatado: true,
            diagnostico: true,
            solucaoRecomendada: true
          }
        },
        itens: {
          select: {
            id: true,
            tipo: true,
            descricao: true,
            quantidade: true,
            valorUnitario: true,
            valorTotal: true,
            observacoes: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se orçamento pode ser visualizado
    if (orcamento.status === 'RASCUNHO') {
      return NextResponse.json(
        { error: 'Orçamento não está disponível para visualização' },
        { status: 403 }
      );
    }

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error('Erro ao buscar orçamento para aprovação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar orçamento' },
      { status: 500 }
    );
  }
}
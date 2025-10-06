import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      );
    }

    const orcamento = await db.orcamento.findUnique({
      where: { id },
      include: {
        ordemServico: {
          include: {
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true,
                telefone: true,
                documento: true,
                endereco: true
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
        anexos: {
          include: {
            criadoPor: {
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
        },
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

    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar orçamento' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verificar se orçamento existe
    const orcamentoExistente = await db.orcamento.findUnique({
      where: { id }
    });

    if (!orcamentoExistente) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // Validar dados obrigatórios
    if (body.titulo && !body.titulo.trim()) {
      return NextResponse.json(
        { error: 'Título é obrigatório' },
        { status: 400 }
      );
    }

    if (body.valorTotal && parseFloat(body.valorTotal) <= 0) {
      return NextResponse.json(
        { error: 'Valor total deve ser maior que zero' },
        { status: 400 }
      );
    }

    // Verificar se ordem de serviço existe (se fornecida)
    if (body.ordemServicoId) {
      const ordemServico = await db.ordemServico.findUnique({
        where: { id: body.ordemServicoId }
      });

      if (!ordemServico) {
        return NextResponse.json(
          { error: 'Ordem de serviço não encontrada' },
          { status: 404 }
        );
      }
    }

    // Verificar se laudo técnico existe (se fornecido)
    if (body.laudoTecnicoId) {
      const laudoTecnico = await db.laudoTecnico.findUnique({
        where: { id: body.laudoTecnicoId }
      });

      if (!laudoTecnico) {
        return NextResponse.json(
          { error: 'Laudo técnico não encontrado' },
          { status: 404 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    if (body.titulo) updateData.titulo = body.titulo;
    if (body.descricao !== undefined) updateData.descricao = body.descricao;
    if (body.valorTotal) updateData.valorTotal = parseFloat(body.valorTotal);
    if (body.valorDesconto !== undefined) updateData.valorDesconto = body.valorDesconto ? parseFloat(body.valorDesconto) : null;
    if (body.percentualDesconto !== undefined) updateData.percentualDesconto = body.percentualDesconto ? parseFloat(body.percentualDesconto) : null;
    if (body.dataValidade) updateData.dataValidade = new Date(body.dataValidade);
    if (body.observacoes !== undefined) updateData.observacoes = body.observacoes;
    if (body.status) updateData.status = body.status;
    if (body.aprovadoCliente !== undefined) updateData.aprovadoCliente = body.aprovadoCliente;
    if (body.dataAprovacao) updateData.dataAprovacao = new Date(body.dataAprovacao);
    if (body.comentariosCliente !== undefined) updateData.comentariosCliente = body.comentariosCliente;
    if (body.ordemServicoId) updateData.ordemServicoId = body.ordemServicoId;
    if (body.laudoTecnicoId !== undefined) updateData.laudoTecnicoId = body.laudoTecnicoId;

    // Atualizar orçamento
    const orcamento = await db.orcamento.update({
      where: { id: params.id },
      data: {
        ...updateData,
        updatedAt: new Date(),
        historico: {
          create: {
            acao: 'atualizado',
            descricao: `Orçamento atualizado${body.observacaoHistorico ? ': ' + body.observacaoHistorico : ''}`,
            colaboradorId: body.atualizadoPorId || orcamentoExistente.criadoPorId
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

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar orçamento' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID do orçamento é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se orçamento existe
    const orcamento = await db.orcamento.findUnique({
      where: { id },
      include: {
        itens: true,
        anexos: true,
        historico: true
      }
    });

    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se orçamento pode ser excluído
    if (orcamento.status === 'APROVADO') {
      return NextResponse.json(
        { error: 'Não é possível excluir orçamento aprovado' },
        { status: 400 }
      );
    }

    // Excluir orçamento e todos os registros relacionados
    await db.orcamento.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Orçamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir orçamento' },
      { status: 500 }
    );
  }
}
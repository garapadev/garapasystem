import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ordemServico = await db.ordemServico.findUnique({
      where: { id },
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
        oportunidade: {
          select: {
            id: true,
            titulo: true
          }
        },
        itens: {
          orderBy: {
            createdAt: 'asc'
          }
        },
        checklists: {
          include: {
            template: {
              select: {
                id: true,
                nome: true
              }
            },
            itens: {
              orderBy: {
                ordem: 'asc'
              }
            }
          }
        },
        comentarios: {
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
        },
        anexos: {
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

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(ordemServico);
  } catch (error) {
    console.error('Erro ao buscar ordem de serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar ordem de serviço' },
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
    const body = await request.json();

    // Verificar se ordem de serviço existe
    const ordemServicoExistente = await db.ordemServico.findUnique({
      where: { id }
    });

    if (!ordemServicoExistente) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se responsável existe (se fornecido)
    if (body.responsavelId) {
      const responsavel = await db.colaborador.findUnique({
        where: { id: body.responsavelId }
      });

      if (!responsavel) {
        return NextResponse.json(
          { error: 'Responsável não encontrado' },
          { status: 404 }
        );
      }
    }

    // Validar colaboradorId para histórico (se fornecido)
    let colaboradorIdValido = null;
    if (body.atualizadoPorId) {
      const colaborador = await db.colaborador.findUnique({
        where: { id: body.atualizadoPorId }
      });

      if (colaborador) {
        colaboradorIdValido = body.atualizadoPorId;
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};
    const historicoEntries: any[] = [];

    // Campos que podem ser atualizados
    const camposPermitidos = [
      'titulo', 'descricao', 'localExecucao', 'dataInicio', 'dataFim',
      'valorOrcamento', 'valorFinal', 'prioridade', 'observacoesInternas',
      'responsavelId'
    ];

    camposPermitidos.forEach(campo => {
      if (body[campo] !== undefined) {
        let valor = body[campo];
        
        // Converter datas
        if (['dataInicio', 'dataFim'].includes(campo) && valor) {
          valor = new Date(valor);
        }
        
        // Converter valores numéricos
        if (['valorOrcamento', 'valorFinal'].includes(campo) && valor) {
          valor = parseFloat(valor);
        }

        updateData[campo] = valor;

        // Registrar mudança no histórico se valor mudou
        if (ordemServicoExistente[campo as keyof typeof ordemServicoExistente] !== valor) {
          historicoEntries.push({
            acao: `${campo} alterado`,
            descricao: `Campo ${campo} foi alterado`,
            valorAnterior: String(ordemServicoExistente[campo as keyof typeof ordemServicoExistente] || ''),
            valorNovo: String(valor || ''),
            ordemServicoId: id,
            colaboradorId: colaboradorIdValido
          });
        }
      }
    });

    // Processar itens se fornecidos
    if (body.itens !== undefined) {
      // Primeiro, deletar todos os itens existentes
      await db.itemOrdemServico.deleteMany({
        where: { ordemServicoId: id }
      });

      // Criar novos itens
      if (Array.isArray(body.itens) && body.itens.length > 0) {
        const itensData = body.itens.map((item: any) => ({
          descricao: item.descricao,
          quantidade: parseInt(item.quantidade) || 0,
          valorUnitario: parseFloat(item.valorUnitario) || 0,
          valorTotal: (parseInt(item.quantidade) || 0) * (parseFloat(item.valorUnitario) || 0),
          observacoes: item.observacoes || null,
          ordemServicoId: id
        }));

        await db.itemOrdemServico.createMany({
          data: itensData
        });

        // Calcular valor total dos itens
        const valorTotalItens = itensData.reduce((total, item) => total + item.valorTotal, 0);
        updateData.valorFinal = valorTotalItens;

        historicoEntries.push({
          acao: 'itens atualizados',
          descricao: `Itens da ordem de serviço foram atualizados`,
          valorAnterior: '',
          valorNovo: `${body.itens.length} item(ns) - Total: R$ ${valorTotalItens.toFixed(2)}`,
          ordemServicoId: id,
          colaboradorId: colaboradorIdValido
        });
      }
    }

    // Atualizar ordem de serviço
    const ordemServico = await db.ordemServico.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
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
          },
          take: 10
        }
      }
    });

    // Criar entradas de histórico se houver e se colaboradorId for válido
    if (historicoEntries.length > 0 && colaboradorIdValido) {
      await db.historicoOrdemServico.createMany({
        data: historicoEntries
      });
    }

    return NextResponse.json(ordemServico);
  } catch (error) {
    console.error('Erro ao atualizar ordem de serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar ordem de serviço' },
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
    // Verificar se ordem de serviço existe
    const ordemServico = await db.ordemServico.findUnique({
      where: { id }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se pode ser deletada (apenas rascunhos podem ser deletados)
    if (ordemServico.status !== 'RASCUNHO') {
      return NextResponse.json(
        { error: 'Apenas ordens de serviço em rascunho podem ser deletadas' },
        { status: 400 }
      );
    }

    // Deletar ordem de serviço (cascade irá deletar relacionamentos)
    await db.ordemServico.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Ordem de serviço deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar ordem de serviço:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar ordem de serviço' },
      { status: 500 }
    );
  }
}
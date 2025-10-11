import { prisma } from '@/lib/prisma';

/**
 * Configurações e utilitários para integração entre módulos
 */

export interface IntegrationConfig {
  compras: {
    autoCreateEstoque: boolean;
    autoCreateTombamento: boolean;
    aprovacaoObrigatoria: boolean;
  };
  estoque: {
    alertaEstoqueMinimo: boolean;
    integrarComCompras: boolean;
    integrarComTombamento: boolean;
  };
  tombamento: {
    integrarComEstoque: boolean;
    depreciacaoAutomatica: boolean;
    alertaGarantia: boolean;
  };
}

export const defaultIntegrationConfig: IntegrationConfig = {
  compras: {
    autoCreateEstoque: true,
    autoCreateTombamento: false,
    aprovacaoObrigatoria: true
  },
  estoque: {
    alertaEstoqueMinimo: true,
    integrarComCompras: true,
    integrarComTombamento: true
  },
  tombamento: {
    integrarComEstoque: true,
    depreciacaoAutomatica: false,
    alertaGarantia: true
  }
};

/**
 * Integração: Compras → Estoque
 * Quando um pedido de compra é recebido, automaticamente cria entrada no estoque
 */
export async function integrarCompraParaEstoque(
  pedidoCompraId: string,
  colaboradorId: string
) {
  try {
    const pedido = await prisma.pedidoCompra.findUnique({
      where: { id: pedidoCompraId },
      include: {
        itens: {
          include: {
            produto: true
          }
        }
      }
    });

    if (!pedido) {
      throw new Error('Pedido de compra não encontrado');
    }

    // Criar movimentações de entrada no estoque para cada item
    const movimentacoes = await Promise.all(
      pedido.itens.map(async (item) => {
        // Verificar se já existe estoque para o produto
        let estoque = await prisma.estoqueProduto.findFirst({
          where: {
            produtoId: item.produtoId,
            centroCustoId: null // Estoque geral
          }
        });

        const quantidadeAnterior = estoque?.quantidade || 0;
        const novaQuantidade = quantidadeAnterior + item.quantidade;

        // Criar movimentação de entrada
        const movimentacao = await prisma.movimentacaoEstoque.create({
          data: {
            produtoId: item.produtoId,
            tipo: 'ENTRADA',
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
            quantidadeAnterior,
            quantidadeAtual: novaQuantidade,
            observacoes: `Entrada automática - Pedido ${pedido.numero}`,
            documentoReferencia: pedido.numero,
            responsavelId: colaboradorId
          }
        });

        // Atualizar ou criar registro de estoque
        if (estoque) {
          await prisma.estoqueProduto.update({
            where: { id: estoque.id },
            data: {
              quantidade: novaQuantidade,
              valorUnitario: item.valorUnitario,
              valorTotal: novaQuantidade * item.valorUnitario
            }
          });
        } else {
          await prisma.estoqueProduto.create({
            data: {
              produtoId: item.produtoId,
              quantidade: novaQuantidade,
              valorUnitario: item.valorUnitario,
              valorTotal: novaQuantidade * item.valorUnitario
            }
          });
        }

        return movimentacao;
      })
    );

    return movimentacoes;
  } catch (error) {
    console.error('Erro na integração compra → estoque:', error);
    throw error;
  }
}

/**
 * Integração: Estoque → Tombamento
 * Quando um item é retirado do estoque para uso permanente, pode ser tombado
 */
export async function integrarEstoqueParaTombamento(
  movimentacaoEstoqueId: string,
  dadosTombamento: {
    numeroTombamento: string;
    categoria: string;
    localizacao: string;
    responsavel?: string;
    centroCustoId: string;
    observacoes?: string;
  }
) {
  try {
    const movimentacao = await prisma.movimentacaoEstoque.findUnique({
      where: { id: movimentacaoEstoqueId },
      include: {
        produto: true
      }
    });

    if (!movimentacao) {
      throw new Error('Movimentação de estoque não encontrada');
    }

    if (movimentacao.tipo !== 'SAIDA') {
      throw new Error('Apenas saídas de estoque podem ser tombadas');
    }

    // Criar item de tombamento
    const itemTombamento = await prisma.itemTombamento.create({
      data: {
        numeroTombamento: dadosTombamento.numeroTombamento,
        descricao: movimentacao.produto.nome,
        categoria: dadosTombamento.categoria,
        marca: movimentacao.produto.marca || '',
        modelo: movimentacao.produto.modelo || '',
        valorAquisicao: movimentacao.valorUnitario,
        dataAquisicao: movimentacao.createdAt,
        centroCustoId: dadosTombamento.centroCustoId,
        localizacao: dadosTombamento.localizacao,
        responsavel: dadosTombamento.responsavel,
        observacoes: `${dadosTombamento.observacoes || ''} - Originado da movimentação de estoque ${movimentacaoEstoqueId}`,
        status: 'ATIVO'
      }
    });

    // Criar movimentação inicial do tombamento
    await prisma.movimentacaoTombamento.create({
      data: {
        itemTombamentoId: itemTombamento.id,
        tipo: 'INVENTARIO',
        localizacaoDestino: dadosTombamento.localizacao,
        responsavelDestino: dadosTombamento.responsavel,
        observacoes: 'Tombamento inicial a partir do estoque',
        documentoReferencia: `MOV-${movimentacaoEstoqueId}`,
        responsavelId: movimentacao.responsavelId
      }
    });

    return itemTombamento;
  } catch (error) {
    console.error('Erro na integração estoque → tombamento:', error);
    throw error;
  }
}

/**
 * Verificar alertas de estoque mínimo
 */
export async function verificarAlertasEstoque() {
  try {
    const produtosComEstoqueBaixo = await prisma.produto.findMany({
      where: {
        AND: [
          { estoqueMinimo: { gt: 0 } },
          { ativo: true }
        ]
      },
      include: {
        estoque: true,
        categoria: {
          select: { nome: true }
        }
      }
    });

    const alertas = produtosComEstoqueBaixo.filter(produto => {
      const estoqueTotal = produto.estoque.reduce((total, est) => total + est.quantidade, 0);
      return estoqueTotal <= (produto.estoqueMinimo || 0);
    });

    return alertas.map(produto => ({
      produtoId: produto.id,
      codigo: produto.codigo,
      nome: produto.nome,
      categoria: produto.categoria?.nome,
      estoqueAtual: produto.estoque.reduce((total, est) => total + est.quantidade, 0),
      estoqueMinimo: produto.estoqueMinimo,
      diferenca: (produto.estoqueMinimo || 0) - produto.estoque.reduce((total, est) => total + est.quantidade, 0)
    }));
  } catch (error) {
    console.error('Erro ao verificar alertas de estoque:', error);
    throw error;
  }
}

/**
 * Verificar alertas de garantia vencendo
 */
export async function verificarAlertasGarantia(diasAntecedencia: number = 30) {
  try {
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + diasAntecedencia);

    const itensComGarantiaVencendo = await prisma.itemTombamento.findMany({
      where: {
        AND: [
          { status: 'ATIVO' },
          { garantiaMeses: { gt: 0 } },
          {
            dataAquisicao: {
              lte: new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)) // Pelo menos 30 dias atrás
            }
          }
        ]
      },
      include: {
        centroCusto: {
          select: { nome: true, codigo: true }
        }
      }
    });

    const alertas = itensComGarantiaVencendo.filter(item => {
      if (!item.garantiaMeses) return false;
      
      const dataVencimentoGarantia = new Date(item.dataAquisicao);
      dataVencimentoGarantia.setMonth(dataVencimentoGarantia.getMonth() + item.garantiaMeses);
      
      return dataVencimentoGarantia <= dataLimite;
    });

    return alertas.map(item => {
      const dataVencimentoGarantia = new Date(item.dataAquisicao);
      dataVencimentoGarantia.setMonth(dataVencimentoGarantia.getMonth() + (item.garantiaMeses || 0));
      
      return {
        itemId: item.id,
        numeroTombamento: item.numeroTombamento,
        descricao: item.descricao,
        centroCusto: item.centroCusto?.nome,
        dataAquisicao: item.dataAquisicao,
        dataVencimentoGarantia,
        diasRestantes: Math.ceil((dataVencimentoGarantia.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
      };
    });
  } catch (error) {
    console.error('Erro ao verificar alertas de garantia:', error);
    throw error;
  }
}

/**
 * Relatório consolidado de integração
 */
export async function gerarRelatorioIntegracao() {
  try {
    const [
      totalSolicitacoesCompra,
      totalPedidosCompra,
      totalMovimentacoesEstoque,
      totalItensTombamento,
      alertasEstoque,
      alertasGarantia
    ] = await Promise.all([
      prisma.solicitacaoCompra.count(),
      prisma.pedidoCompra.count(),
      prisma.movimentacaoEstoque.count(),
      prisma.itemTombamento.count({ where: { status: 'ATIVO' } }),
      verificarAlertasEstoque(),
      verificarAlertasGarantia()
    ]);

    return {
      resumo: {
        totalSolicitacoesCompra,
        totalPedidosCompra,
        totalMovimentacoesEstoque,
        totalItensTombamento
      },
      alertas: {
        estoqueBaixo: alertasEstoque.length,
        garantiaVencendo: alertasGarantia.length
      },
      detalhes: {
        alertasEstoque,
        alertasGarantia
      }
    };
  } catch (error) {
    console.error('Erro ao gerar relatório de integração:', error);
    throw error;
  }
}
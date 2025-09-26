import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Gerar orçamento automático baseado no laudo técnico
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; laudoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: ordemServicoId, laudoId } = params;

    // Verificar se o laudo existe e pertence à ordem de serviço
    const laudoExistente = await prisma.laudoTecnico.findFirst({
      where: {
        id: laudoId,
        ordemServicoId
      },
      include: {
        itens: true,
        ordemServico: {
          include: {
            cliente: true
          }
        }
      }
    });

    if (!laudoExistente) {
      return NextResponse.json({ error: 'Laudo técnico não encontrado' }, { status: 404 });
    }

    // Verificar se o laudo está concluído
    if (laudoExistente.status !== 'CONCLUIDO') {
      return NextResponse.json({ error: 'Laudo técnico deve estar concluído para gerar orçamento' }, { status: 400 });
    }

    // Gerar itens do orçamento baseado no laudo
    const itensOrcamento = laudoExistente.itens
      .filter(item => item.valorUnitario && item.quantidade)
      .map(item => ({
        descricao: item.descricao,
        quantidade: item.quantidade!,
        valorUnitario: item.valorUnitario!,
        valorTotal: item.valorTotal || (item.quantidade! * item.valorUnitario!)
      }));

    if (itensOrcamento.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum item com valores encontrado no laudo para gerar orçamento' 
      }, { status: 400 });
    }

    const valorTotal = itensOrcamento.reduce((total, item) => total + item.valorTotal, 0);

    // Criar orçamento
    const orcamento = await prisma.$transaction(async (tx) => {
      // Verificar se já existe um orçamento para esta ordem de serviço
      const orcamentoExistente = await tx.orcamento.findFirst({
        where: { ordemServicoId }
      });

      if (orcamentoExistente) {
        // Atualizar orçamento existente
        const orcamentoAtualizado = await tx.orcamento.update({
          where: { id: orcamentoExistente.id },
          data: {
            valorTotal,
            observacoes: `Orçamento gerado automaticamente baseado no laudo técnico ${laudoId}`,
            status: 'PENDENTE',
            itens: {
              deleteMany: {}, // Remove itens existentes
              create: itensOrcamento
            }
          },
          include: {
            itens: true,
            ordemServico: {
              include: {
                cliente: true
              }
            }
          }
        });

        // Registrar histórico no laudo
        await tx.historicoLaudoTecnico.create({
          data: {
            laudoTecnicoId: laudoId,
            acao: 'ORCAMENTO_GERADO',
            descricao: `Orçamento atualizado automaticamente - Valor total: R$ ${valorTotal.toFixed(2)}`,
            tecnicoId: laudoExistente.tecnicoId
          }
        });

        return orcamentoAtualizado;
      } else {
        // Criar novo orçamento
        const novoOrcamento = await tx.orcamento.create({
          data: {
            ordemServicoId,
            valorTotal,
            observacoes: `Orçamento gerado automaticamente baseado no laudo técnico ${laudoId}`,
            status: 'PENDENTE',
            validadeAte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
            itens: {
              create: itensOrcamento
            }
          },
          include: {
            itens: true,
            ordemServico: {
              include: {
                cliente: true
              }
            }
          }
        });

        // Registrar histórico no laudo
        await tx.historicoLaudoTecnico.create({
          data: {
            laudoTecnicoId: laudoId,
            acao: 'ORCAMENTO_GERADO',
            descricao: `Orçamento criado automaticamente - Valor total: R$ ${valorTotal.toFixed(2)}`,
            tecnicoId: laudoExistente.tecnicoId
          }
        });

        // Atualizar status da ordem de serviço
        await tx.ordemServico.update({
          where: { id: ordemServicoId },
          data: {
            status: 'ORCAMENTO_ENVIADO'
          }
        });

        return novoOrcamento;
      }
    });

    return NextResponse.json({
      message: 'Orçamento gerado com sucesso',
      orcamento
    });
  } catch (error) {
    console.error('Erro ao gerar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
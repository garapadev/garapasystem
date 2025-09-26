import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const laudoUpdateSchema = z.object({
  diagnostico: z.string().min(1, 'Diagnóstico é obrigatório'),
  solucaoRecomendada: z.string().min(1, 'Solução recomendada é obrigatória'),
  observacoes: z.string().optional(),
  gerarOrcamentoAutomatico: z.boolean().default(false),
  itens: z.array(z.object({
    id: z.string().optional(),
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    tipo: z.enum(['DIAGNOSTICO', 'SOLUCAO', 'RECOMENDACAO', 'OBSERVACAO']),
    valorUnitario: z.number().optional(),
    quantidade: z.number().optional(),
    valorTotal: z.number().optional()
  })).default([])
});

// GET - Buscar laudo específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; laudoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: ordemServicoId, laudoId } = params;

    const laudo = await prisma.laudoTecnico.findFirst({
      where: {
        id: laudoId,
        ordemServicoId
      },
      include: {
        tecnico: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        itens: {
          orderBy: { createdAt: 'asc' }
        },
        anexos: {
          orderBy: { createdAt: 'desc' }
        },
        historico: {
          include: {
            tecnico: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!laudo) {
      return NextResponse.json({ error: 'Laudo técnico não encontrado' }, { status: 404 });
    }

    return NextResponse.json(laudo);
  } catch (error) {
    console.error('Erro ao buscar laudo técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar laudo técnico
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; laudoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id: ordemServicoId, laudoId } = params;
    const body = await request.json();

    // Validar dados
    const validatedData = laudoUpdateSchema.parse(body);

    // Verificar se o laudo existe e pertence à ordem de serviço
    const laudoExistente = await prisma.laudoTecnico.findFirst({
      where: {
        id: laudoId,
        ordemServicoId
      }
    });

    if (!laudoExistente) {
      return NextResponse.json({ error: 'Laudo técnico não encontrado' }, { status: 404 });
    }

    // Verificar se o laudo pode ser editado
    if (laudoExistente.status !== 'RASCUNHO') {
      return NextResponse.json({ error: 'Laudo técnico não pode ser editado neste status' }, { status: 400 });
    }

    // Calcular valor total do orçamento se necessário
    let valorTotalOrcamento = 0;
    if (validatedData.gerarOrcamentoAutomatico) {
      valorTotalOrcamento = validatedData.itens.reduce((total, item) => {
        return total + (item.valorTotal || 0);
      }, 0);
    }

    // Atualizar laudo técnico
    const laudo = await prisma.$transaction(async (tx) => {
      // Remover itens existentes
      await tx.itemLaudoTecnico.deleteMany({
        where: { laudoTecnicoId: laudoId }
      });

      // Atualizar laudo
      const laudoAtualizado = await tx.laudoTecnico.update({
        where: { id: laudoId },
        data: {
          diagnostico: validatedData.diagnostico,
          solucaoRecomendada: validatedData.solucaoRecomendada,
          observacoes: validatedData.observacoes,
          valorTotalOrcamento: validatedData.gerarOrcamentoAutomatico ? valorTotalOrcamento : null,
          gerarOrcamentoAutomatico: validatedData.gerarOrcamentoAutomatico,
          itens: {
            create: validatedData.itens.map(item => ({
              descricao: item.descricao,
              tipo: item.tipo,
              valorUnitario: item.valorUnitario,
              quantidade: item.quantidade,
              valorTotal: item.valorTotal
            }))
          },
          historico: {
            create: {
              acao: 'ATUALIZADO',
              descricao: 'Laudo técnico atualizado',
              tecnicoId: laudoExistente.tecnicoId
            }
          }
        },
        include: {
          tecnico: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          itens: {
            orderBy: { createdAt: 'asc' }
          },
          anexos: {
            orderBy: { createdAt: 'desc' }
          },
          historico: {
            include: {
              tecnico: {
                select: {
                  id: true,
                  nome: true,
                  email: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return laudoAtualizado;
    });

    return NextResponse.json(laudo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar laudo técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir laudo técnico
export async function DELETE(
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
      }
    });

    if (!laudoExistente) {
      return NextResponse.json({ error: 'Laudo técnico não encontrado' }, { status: 404 });
    }

    // Verificar se o laudo pode ser excluído
    if (laudoExistente.status !== 'RASCUNHO') {
      return NextResponse.json({ error: 'Laudo técnico não pode ser excluído neste status' }, { status: 400 });
    }

    // Excluir laudo técnico (cascade irá remover itens, anexos e histórico)
    await prisma.laudoTecnico.delete({
      where: { id: laudoId }
    });

    return NextResponse.json({ message: 'Laudo técnico excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir laudo técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
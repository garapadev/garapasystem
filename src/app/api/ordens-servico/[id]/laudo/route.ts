import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const laudoSchema = z.object({
  tecnicoId: z.string().min(1, 'Técnico é obrigatório'),
  diagnostico: z.string().min(1, 'Diagnóstico é obrigatório'),
  solucaoRecomendada: z.string().min(1, 'Solução recomendada é obrigatória'),
  observacoes: z.string().optional(),
  gerarOrcamentoAutomatico: z.boolean().default(false),
  itens: z.array(z.object({
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    tipo: z.enum(['DIAGNOSTICO', 'SOLUCAO', 'RECOMENDACAO', 'OBSERVACAO']),
    valorUnitario: z.number().optional(),
    quantidade: z.number().optional(),
    valorTotal: z.number().optional()
  })).default([])
});

// GET - Buscar laudo técnico da ordem de serviço
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ordemServicoId = params.id;

    // Verificar se a ordem de serviço existe
    const ordemServico = await prisma.ordemServico.findUnique({
      where: { id: ordemServicoId }
    });

    if (!ordemServico) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Buscar laudo técnico
    const laudo = await prisma.laudoTecnico.findUnique({
      where: { ordemServicoId },
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

// POST - Criar novo laudo técnico
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const ordemServicoId = params.id;
    const body = await request.json();

    // Validar dados
    const validatedData = laudoSchema.parse(body);

    // Verificar se a ordem de serviço existe
    const ordemServico = await prisma.ordemServico.findUnique({
      where: { id: ordemServicoId }
    });

    if (!ordemServico) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada' }, { status: 404 });
    }

    // Verificar se já existe um laudo para esta ordem
    const laudoExistente = await prisma.laudoTecnico.findUnique({
      where: { ordemServicoId }
    });

    if (laudoExistente) {
      return NextResponse.json({ error: 'Já existe um laudo técnico para esta ordem de serviço' }, { status: 400 });
    }

    // Verificar se o técnico existe
    const tecnico = await prisma.colaborador.findUnique({
      where: { id: validatedData.tecnicoId }
    });

    if (!tecnico) {
      return NextResponse.json({ error: 'Técnico não encontrado' }, { status: 404 });
    }

    // Calcular valor total do orçamento se necessário
    let valorTotalOrcamento = 0;
    if (validatedData.gerarOrcamentoAutomatico) {
      valorTotalOrcamento = validatedData.itens.reduce((total, item) => {
        return total + (item.valorTotal || 0);
      }, 0);
    }

    // Criar laudo técnico
    const laudo = await prisma.laudoTecnico.create({
      data: {
        ordemServicoId,
        tecnicoId: validatedData.tecnicoId,
        diagnostico: validatedData.diagnostico,
        solucaoRecomendada: validatedData.solucaoRecomendada,
        observacoes: validatedData.observacoes,
        status: 'RASCUNHO',
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
            acao: 'CRIADO',
            descricao: 'Laudo técnico criado',
            tecnicoId: validatedData.tecnicoId
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

    return NextResponse.json(laudo, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar laudo técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
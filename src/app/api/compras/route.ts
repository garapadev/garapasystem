import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const solicitacaoCompraSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  justificativa: z.string().min(1, 'Justificativa é obrigatória'),
  centroCustoId: z.string().min(1, 'Centro de custo é obrigatório'),
  dataLimite: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string().min(1, 'Produto é obrigatório'),
    quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
    valorEstimado: z.number().min(0, 'Valor estimado deve ser positivo'),
    observacoes: z.string().optional()
  })).min(1, 'Pelo menos um item é obrigatório')
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const centroCustoId = searchParams.get('centroCustoId');

    const where: any = {};
    if (status) where.status = status;
    if (centroCustoId) where.centroCustoId = centroCustoId;

    const [solicitacoes, total] = await Promise.all([
      prisma.solicitacaoCompra.findMany({
        where,
        include: {
          solicitante: {
            select: { id: true, nome: true, email: true }
          },
          aprovador: {
            select: { id: true, nome: true, email: true }
          },
          centroCusto: {
            select: { id: true, nome: true, codigo: true }
          },
          itens: {
            include: {
              produto: {
                select: { id: true, nome: true, codigo: true, unidadeMedida: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.solicitacaoCompra.count({ where })
    ]);

    return NextResponse.json({
      solicitacoes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar solicitações de compra:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = solicitacaoCompraSchema.parse(body);

    // Buscar o colaborador do usuário logado
    const colaborador = await prisma.colaborador.findFirst({
      where: { usuarioId: session.user.id }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o centro de custo existe
    const centroCusto = await prisma.centroCusto.findUnique({
      where: { id: validatedData.centroCustoId }
    });

    if (!centroCusto) {
      return NextResponse.json(
        { error: 'Centro de custo não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se todos os produtos existem
    const produtoIds = validatedData.itens.map(item => item.produtoId);
    const produtos = await prisma.produto.findMany({
      where: { id: { in: produtoIds } }
    });

    if (produtos.length !== produtoIds.length) {
      return NextResponse.json(
        { error: 'Um ou mais produtos não foram encontrados' },
        { status: 404 }
      );
    }

    // Criar a solicitação de compra com os itens
    const solicitacao = await prisma.solicitacaoCompra.create({
      data: {
        descricao: validatedData.descricao,
        justificativa: validatedData.justificativa,
        centroCustoId: validatedData.centroCustoId,
        solicitanteId: colaborador.id,
        dataLimite: validatedData.dataLimite ? new Date(validatedData.dataLimite) : null,
        observacoes: validatedData.observacoes,
        status: 'PENDENTE',
        itens: {
          create: validatedData.itens.map(item => ({
            produtoId: item.produtoId,
            quantidade: item.quantidade,
            valorEstimado: item.valorEstimado,
            observacoes: item.observacoes
          }))
        }
      },
      include: {
        solicitante: {
          select: { id: true, nome: true, email: true }
        },
        centroCusto: {
          select: { id: true, nome: true, codigo: true }
        },
        itens: {
          include: {
            produto: {
              select: { id: true, nome: true, codigo: true, unidadeMedida: true }
            }
          }
        }
      }
    });

    return NextResponse.json(solicitacao, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar solicitação de compra:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
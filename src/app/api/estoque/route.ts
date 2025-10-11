import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const movimentacaoSchema = z.object({
  produtoId: z.string().min(1, 'Produto é obrigatório'),
  tipo: z.enum(['ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'AJUSTE']),
  quantidade: z.number().min(0.01, 'Quantidade deve ser maior que 0'),
  valorUnitario: z.number().min(0, 'Valor unitário deve ser positivo'),
  observacoes: z.string().optional(),
  documentoReferencia: z.string().optional(),
  centroCustoId: z.string().optional()
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
    const produtoId = searchParams.get('produtoId');
    const centroCustoId = searchParams.get('centroCustoId');

    const where: any = {};
    if (produtoId) where.produtoId = produtoId;
    if (centroCustoId) where.centroCustoId = centroCustoId;

    const [estoques, total] = await Promise.all([
      prisma.estoqueProduto.findMany({
        where,
        include: {
          produto: {
            select: { 
              id: true, 
              nome: true, 
              codigo: true, 
              unidadeMedida: true,
              categoria: {
                select: { id: true, nome: true }
              }
            }
          },
          centroCusto: {
            select: { id: true, nome: true, codigo: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.estoqueProduto.count({ where })
    ]);

    return NextResponse.json({
      estoques,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estoque:', error);
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
    const validatedData = movimentacaoSchema.parse(body);

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

    // Verificar se o produto existe
    const produto = await prisma.produto.findUnique({
      where: { id: validatedData.produtoId }
    });

    if (!produto) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // Buscar ou criar registro de estoque
    let estoque = await prisma.estoqueProduto.findFirst({
      where: {
        produtoId: validatedData.produtoId,
        centroCustoId: validatedData.centroCustoId || null
      }
    });

    const quantidadeAnterior = estoque?.quantidade || 0;
    let novaQuantidade = quantidadeAnterior;

    // Calcular nova quantidade baseada no tipo de movimentação
    switch (validatedData.tipo) {
      case 'ENTRADA':
      case 'AJUSTE':
        novaQuantidade = quantidadeAnterior + validatedData.quantidade;
        break;
      case 'SAIDA':
        novaQuantidade = quantidadeAnterior - validatedData.quantidade;
        if (novaQuantidade < 0) {
          return NextResponse.json(
            { error: 'Quantidade insuficiente em estoque' },
            { status: 400 }
          );
        }
        break;
      case 'TRANSFERENCIA':
        // Para transferência, seria necessário implementar lógica mais complexa
        // Por enquanto, tratamos como saída
        novaQuantidade = quantidadeAnterior - validatedData.quantidade;
        if (novaQuantidade < 0) {
          return NextResponse.json(
            { error: 'Quantidade insuficiente em estoque' },
            { status: 400 }
          );
        }
        break;
    }

    // Usar transação para garantir consistência
    const resultado = await prisma.$transaction(async (tx) => {
      // Criar a movimentação
      const movimentacao = await tx.movimentacaoEstoque.create({
        data: {
          produtoId: validatedData.produtoId,
          tipo: validatedData.tipo,
          quantidade: validatedData.quantidade,
          valorUnitario: validatedData.valorUnitario,
          valorTotal: validatedData.quantidade * validatedData.valorUnitario,
          quantidadeAnterior,
          quantidadeAtual: novaQuantidade,
          observacoes: validatedData.observacoes,
          documentoReferencia: validatedData.documentoReferencia,
          responsavelId: colaborador.id,
          centroCustoId: validatedData.centroCustoId
        },
        include: {
          produto: {
            select: { id: true, nome: true, codigo: true, unidadeMedida: true }
          },
          responsavel: {
            select: { id: true, nome: true, email: true }
          },
          centroCusto: {
            select: { id: true, nome: true, codigo: true }
          }
        }
      });

      // Atualizar ou criar o registro de estoque
      if (estoque) {
        await tx.estoqueProduto.update({
          where: { id: estoque.id },
          data: {
            quantidade: novaQuantidade,
            valorUnitario: validatedData.valorUnitario,
            valorTotal: novaQuantidade * validatedData.valorUnitario
          }
        });
      } else {
        await tx.estoqueProduto.create({
          data: {
            produtoId: validatedData.produtoId,
            quantidade: novaQuantidade,
            valorUnitario: validatedData.valorUnitario,
            valorTotal: novaQuantidade * validatedData.valorUnitario,
            centroCustoId: validatedData.centroCustoId
          }
        });
      }

      return movimentacao;
    });

    return NextResponse.json(resultado, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar movimentação de estoque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
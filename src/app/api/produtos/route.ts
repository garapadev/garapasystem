import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const produtoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  categoriaId: z.string().min(1, 'Categoria é obrigatória'),
  unidadeMedida: z.string().min(1, 'Unidade de medida é obrigatória'),
  valorReferencia: z.number().min(0, 'Valor de referência deve ser positivo').optional(),
  estoqueMinimo: z.number().min(0, 'Estoque mínimo deve ser positivo').optional(),
  estoqueMaximo: z.number().min(0, 'Estoque máximo deve ser positivo').optional(),
  ativo: z.boolean().default(true),
  observacoes: z.string().optional()
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
    const categoriaId = searchParams.get('categoriaId');
    const ativo = searchParams.get('ativo');
    const search = searchParams.get('search');

    const where: any = {};
    if (categoriaId) where.categoriaId = categoriaId;
    if (ativo !== null) where.ativo = ativo === 'true';
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        include: {
          categoria: {
            select: { id: true, nome: true, codigo: true }
          },
          estoque: {
            select: { 
              id: true, 
              quantidade: true, 
              valorUnitario: true,
              centroCusto: {
                select: { id: true, nome: true, codigo: true }
              }
            }
          }
        },
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.produto.count({ where })
    ]);

    return NextResponse.json({
      produtos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
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
    const validatedData = produtoSchema.parse(body);

    // Verificar se o código já existe
    const existingProduto = await prisma.produto.findUnique({
      where: { codigo: validatedData.codigo }
    });

    if (existingProduto) {
      return NextResponse.json(
        { error: 'Código de produto já existe' },
        { status: 400 }
      );
    }

    // Verificar se a categoria existe
    const categoria = await prisma.categoriaProduto.findUnique({
      where: { id: validatedData.categoriaId }
    });

    if (!categoria) {
      return NextResponse.json(
        { error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }

    // Validar estoque mínimo e máximo
    if (validatedData.estoqueMinimo && validatedData.estoqueMaximo) {
      if (validatedData.estoqueMinimo > validatedData.estoqueMaximo) {
        return NextResponse.json(
          { error: 'Estoque mínimo não pode ser maior que o máximo' },
          { status: 400 }
        );
      }
    }

    const produto = await prisma.produto.create({
      data: validatedData,
      include: {
        categoria: {
          select: { id: true, nome: true, codigo: true }
        }
      }
    });

    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
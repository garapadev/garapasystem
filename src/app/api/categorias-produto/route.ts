import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const categoriaProdutoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true)
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
    const ativo = searchParams.get('ativo');
    const search = searchParams.get('search');

    const where: any = {};
    if (ativo !== null) where.ativo = ativo === 'true';
    if (search) {
      where.OR = [
        { codigo: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [categorias, total] = await Promise.all([
      prisma.categoriaProduto.findMany({
        where,
        include: {
          _count: {
            select: { produtos: true }
          }
        },
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.categoriaProduto.count({ where })
    ]);

    return NextResponse.json({
      categorias,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar categorias de produto:', error);
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
    const validatedData = categoriaProdutoSchema.parse(body);

    // Verificar se o código já existe
    const existingCategoria = await prisma.categoriaProduto.findUnique({
      where: { codigo: validatedData.codigo }
    });

    if (existingCategoria) {
      return NextResponse.json(
        { error: 'Código de categoria já existe' },
        { status: 400 }
      );
    }

    const categoria = await prisma.categoriaProduto.create({
      data: validatedData
    });

    return NextResponse.json(categoria, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar categoria de produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
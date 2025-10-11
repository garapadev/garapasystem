import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const centroCustoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  responsavel: z.string().optional(),
  orcamentoAnual: z.number().min(0, 'Orçamento anual deve ser positivo').optional(),
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
        { descricao: { contains: search, mode: 'insensitive' } },
        { responsavel: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [centrosCusto, total] = await Promise.all([
      prisma.centroCusto.findMany({
        where,
        orderBy: { codigo: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.centroCusto.count({ where })
    ]);

    return NextResponse.json({
      centrosCusto,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar centros de custo:', error);
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
    const validatedData = centroCustoSchema.parse(body);

    // Verificar se o código já existe
    const existingCentroCusto = await prisma.centroCusto.findUnique({
      where: { codigo: validatedData.codigo }
    });

    if (existingCentroCusto) {
      return NextResponse.json(
        { error: 'Código de centro de custo já existe' },
        { status: 400 }
      );
    }

    const centroCusto = await prisma.centroCusto.create({
      data: validatedData
    });

    return NextResponse.json(centroCusto, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar centro de custo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
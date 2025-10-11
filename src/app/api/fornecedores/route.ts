import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const fornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  documento: z.string().min(1, 'Documento é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  contato: z.string().optional(),
  observacoes: z.string().optional(),
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
        { nome: { contains: search, mode: 'insensitive' } },
        { documento: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contato: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [fornecedores, total] = await Promise.all([
      prisma.fornecedor.findMany({
        where,
        orderBy: { nome: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.fornecedor.count({ where })
    ]);

    return NextResponse.json({
      fornecedores,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
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
    const validatedData = fornecedorSchema.parse(body);

    // Verificar se o documento já existe
    const existingFornecedor = await prisma.fornecedor.findUnique({
      where: { documento: validatedData.documento }
    });

    if (existingFornecedor) {
      return NextResponse.json(
        { error: 'Documento já cadastrado para outro fornecedor' },
        { status: 400 }
      );
    }

    const fornecedor = await prisma.fornecedor.create({
      data: validatedData
    });

    return NextResponse.json(fornecedor, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
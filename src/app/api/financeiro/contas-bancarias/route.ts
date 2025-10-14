import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const contaBancariaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  saldo_inicial: z.number().optional(),
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

    // Scaffold: retornar lista vazia por enquanto
    return NextResponse.json({
      contasBancarias: [],
      pagination: { page, limit, total: 0, pages: 0 }
    });
  } catch (error) {
    console.error('Erro ao buscar contas bancárias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = contaBancariaSchema.parse(body);

    // Scaffold: retornar eco do objeto até implementar persistência
    return NextResponse.json({ id: 'temp', ...validated }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Erro ao criar conta bancária:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
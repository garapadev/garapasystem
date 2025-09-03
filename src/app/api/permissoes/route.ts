import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const recurso = searchParams.get('recurso') || '';
    const acao = searchParams.get('acao') || '';

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (recurso) {
      where.recurso = recurso;
    }

    if (acao) {
      where.acao = acao;
    }

    const [permissoes, total] = await Promise.all([
      db.permissao.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          recurso: 'asc',
          acao: 'asc'
        }
      }),
      db.permissao.count({ where })
    ]);

    return NextResponse.json({
      data: permissoes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar permissões' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.nome || !body.recurso || !body.acao) {
      return NextResponse.json(
        { error: 'Nome, recurso e ação são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se permissão com mesmo nome já existe
    const existingPermissao = await db.permissao.findUnique({
      where: { nome: body.nome }
    });

    if (existingPermissao) {
      return NextResponse.json(
        { error: 'Já existe uma permissão com este nome' },
        { status: 400 }
      );
    }

    // Verificar se já existe permissão para o mesmo recurso e ação
    const duplicatePermissao = await db.permissao.findFirst({
      where: {
        recurso: body.recurso,
        acao: body.acao
      }
    });

    if (duplicatePermissao) {
      return NextResponse.json(
        { error: 'Já existe uma permissão para este recurso e ação' },
        { status: 400 }
      );
    }

    // Criar permissão
    const permissao = await db.permissao.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || null,
        recurso: body.recurso,
        acao: body.acao
      }
    });

    return NextResponse.json(permissao, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar permissão:', error);
    return NextResponse.json(
      { error: 'Erro ao criar permissão' },
      { status: 500 }
    );
  }
}
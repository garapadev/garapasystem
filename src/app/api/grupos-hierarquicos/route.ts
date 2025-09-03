import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const parentId = searchParams.get('parentId') || '';

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (parentId === 'null') {
      where.parentId = null;
    } else if (parentId) {
      where.parentId = parentId;
    }

    const [grupos, total] = await Promise.all([
      db.grupoHierarquico.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              nome: true
            }
          },
          children: {
            select: {
              id: true,
              nome: true
            }
          },
          _count: {
            select: {
              clientes: true,
              colaboradores: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          nome: 'asc'
        }
      }),
      db.grupoHierarquico.count({ where })
    ]);

    return NextResponse.json({
      data: grupos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar grupos hierárquicos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar grupos hierárquicos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se grupo com mesmo nome já existe no mesmo nível
    const where: any = {
      nome: body.nome
    };

    if (body.parentId) {
      where.parentId = body.parentId;
    } else {
      where.parentId = null;
    }

    const existingGrupo = await db.grupoHierarquico.findFirst({ where });

    if (existingGrupo) {
      return NextResponse.json(
        { error: 'Já existe um grupo com este nome neste nível' },
        { status: 400 }
      );
    }

    // Criar grupo hierárquico
    const grupo = await db.grupoHierarquico.create({
      data: {
        nome: body.nome,
        descricao: body.descricao || null,
        ativo: body.ativo !== false, // padrão true
        parentId: body.parentId || null
      },
      include: {
        parent: {
          select: {
            id: true,
            nome: true
          }
        },
        children: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    return NextResponse.json(grupo, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar grupo hierárquico:', error);
    return NextResponse.json(
      { error: 'Erro ao criar grupo hierárquico' },
      { status: 500 }
    );
  }
}
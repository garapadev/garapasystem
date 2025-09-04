import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Construir a consulta com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [perfis, total] = await Promise.all([
      db.perfil.findMany({
        where,
        include: {
          permissoes: {
            include: {
              permissao: true
            }
          },
          colaboradores: true
        },
        skip,
        take: limit,
        orderBy: { nome: 'asc' }
      }),
      db.perfil.count({ where })
    ]);

    return NextResponse.json({
      data: perfis,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfis' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      nome,
      descricao,
      permissoesIds = []
    } = body;

    // Validações básicas
    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se perfil com mesmo nome já existe
    const existingPerfil = await db.perfil.findUnique({
      where: { nome }
    });

    if (existingPerfil) {
      return NextResponse.json(
        { error: 'Perfil com este nome já existe' },
        { status: 400 }
      );
    }

    // Verificar se as permissões existem
    if (permissoesIds.length > 0) {
      const permissoesCount = await db.permissao.count({
        where: {
          id: {
            in: permissoesIds
          }
        }
      });

      if (permissoesCount !== permissoesIds.length) {
        return NextResponse.json(
          { error: 'Uma ou mais permissões não foram encontradas' },
          { status: 400 }
        );
      }
    }

    // Criar o perfil
    const perfil = await db.perfil.create({
      data: {
        nome,
        descricao,
        permissoes: {
          create: permissoesIds.map((permissaoId: string) => ({
            permissaoId
          }))
        }
      },
      include: {
        permissoes: {
          include: {
            permissao: true
          }
        },
        colaboradores: true
      }
    });

    return NextResponse.json(perfil, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao criar perfil' },
      { status: 500 }
    );
  }
}
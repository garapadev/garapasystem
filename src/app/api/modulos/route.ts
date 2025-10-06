import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const ativo = searchParams.get('ativo') || '';
    const categoria = searchParams.get('categoria') || '';
    const core = searchParams.get('core') || '';

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { titulo: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (ativo !== '') {
      where.ativo = ativo === 'true';
    }

    if (categoria) {
      where.categoria = categoria;
    }

    if (core !== '') {
      where.core = core === 'true';
    }

    const [modulos, total] = await Promise.all([
      db.ModuloSistema.findMany({
        where,
        include: {
          logs: {
            take: 5,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              autor: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: [
          { ordem: 'asc' },
          { titulo: 'asc' }
        ]
      }),
      db.ModuloSistema.count({ where })
    ]);

    return NextResponse.json({
      data: modulos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar módulos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário tem permissão de administrador
    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      include: {
        colaborador: {
          include: {
            perfil: {
              include: {
                permissoes: {
                  include: {
                    permissao: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const isAdmin = usuario?.admin || 
      usuario?.colaborador?.perfil?.permissoes.some(
        p => p.permissao.nome === 'admin.modules'
      );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Permissão insuficiente' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.nome || !body.titulo) {
      return NextResponse.json(
        { error: 'Nome e título são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se nome já existe
    const existingModulo = await db.ModuloSistema.findUnique({
      where: { nome: body.nome }
    });

    if (existingModulo) {
      return NextResponse.json(
        { error: 'Nome do módulo já existe' },
        { status: 400 }
      );
    }

    // Criar o módulo
    const modulo = await db.ModuloSistema.create({
      data: {
        nome: body.nome,
        titulo: body.titulo,
        ativo: body.ativo ?? true,
        core: body.core ?? false,
        icone: body.icone,
        ordem: body.ordem ?? 999,
        permissao: body.permissao,
        rota: body.rota,
        categoria: body.categoria,
      },
      include: {
        logs: {
          include: {
            autor: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });

    // Registrar log de criação
    await db.ModuloSistemaLog.create({
      data: {
        moduloId: modulo.id,
        acao: 'CRIADO',
        detalhes: `Módulo '${modulo.titulo}' criado`,
        autorId: usuario?.colaborador?.id,
      }
    });

    return NextResponse.json(modulo, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar módulo:', error);
    return NextResponse.json(
      { error: 'Erro ao criar módulo' },
      { status: 500 }
    );
  }
}
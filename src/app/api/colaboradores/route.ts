import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const ativo = searchParams.get('ativo') || '';
    const grupoId = searchParams.get('grupoId') || '';
    const perfilId = searchParams.get('perfilId') || '';

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { cargo: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (ativo !== '') {
      where.ativo = ativo === 'true';
    }

    if (grupoId) {
      where.grupoHierarquicoId = grupoId;
    }

    if (perfilId) {
      where.perfilId = perfilId;
    }

    const [colaboradores, total] = await Promise.all([
      db.colaborador.findMany({
        where,
        include: {
          perfil: {
            select: {
              id: true,
              nome: true
            }
          },
          grupoHierarquico: {
            select: {
              id: true,
              nome: true
            }
          },
          usuarios: {
            select: {
              id: true,
              email: true,
              ativo: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          nome: 'asc'
        }
      }),
      db.colaborador.count({ where })
    ]);

    return NextResponse.json({
      data: colaboradores,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar colaboradores:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar colaboradores' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.nome || !body.email) {
      return NextResponse.json(
        { error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingColaborador = await db.colaborador.findUnique({
      where: { email: body.email }
    });

    if (existingColaborador) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Verificar se documento já existe (se fornecido)
    if (body.documento) {
      const documentoExists = await db.colaborador.findFirst({
        where: { documento: body.documento }
      });

      if (documentoExists) {
        return NextResponse.json(
          { error: 'Documento já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Validar perfil e grupo se fornecidos
    if (body.perfilId) {
      const perfil = await db.perfil.findUnique({
        where: { id: body.perfilId }
      });

      if (!perfil) {
        return NextResponse.json(
          { error: 'Perfil não encontrado' },
          { status: 400 }
        );
      }
    }

    if (body.grupoHierarquicoId) {
      const grupo = await db.grupoHierarquico.findUnique({
        where: { id: body.grupoHierarquicoId }
      });

      if (!grupo) {
        return NextResponse.json(
          { error: 'Grupo hierárquico não encontrado' },
          { status: 400 }
        );
      }
    }

    // Criar colaborador
    const colaborador = await db.colaborador.create({
      data: {
        nome: body.nome,
        email: body.email,
        telefone: body.telefone || null,
        documento: body.documento || null,
        cargo: body.cargo || null,
        dataAdmissao: body.dataAdmissao ? new Date(body.dataAdmissao) : null,
        ativo: body.ativo !== false, // padrão true
        perfilId: body.perfilId || null,
        grupoHierarquicoId: body.grupoHierarquicoId || null
      },
      include: {
        perfil: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        },
        grupoHierarquico: {
          select: {
            id: true,
            nome: true,
            descricao: true
          }
        }
      }
    });

    return NextResponse.json(colaborador, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar colaborador:', error);
    return NextResponse.json(
      { error: 'Erro ao criar colaborador' },
      { status: 500 }
    );
  }
}
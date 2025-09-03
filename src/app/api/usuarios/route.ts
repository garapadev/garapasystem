import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const ativo = searchParams.get('ativo') || '';

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { nome: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (ativo !== '') {
      where.ativo = ativo === 'true';
    }

    const [usuarios, total] = await Promise.all([
      db.usuario.findMany({
        where,
        include: {
          colaborador: {
            select: {
              id: true,
              nome: true,
              email: true,
              cargo: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.usuario.count({ where })
    ]);

    return NextResponse.json({
      data: usuarios,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.email || !body.senha || !body.nome) {
      return NextResponse.json(
        { error: 'Email, senha e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUsuario = await db.usuario.findUnique({
      where: { email: body.email }
    });

    if (existingUsuario) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Verificar se colaborador existe (se fornecido)
    if (body.colaboradorId) {
      const colaborador = await db.colaborador.findUnique({
        where: { id: body.colaboradorId }
      });

      if (!colaborador) {
        return NextResponse.json(
          { error: 'Colaborador não encontrado' },
          { status: 400 }
        );
      }

      // Verificar se colaborador já tem usuário
      const existingUserForCollaborator = await db.usuario.findFirst({
        where: { colaboradorId: body.colaboradorId }
      });

      if (existingUserForCollaborator) {
        return NextResponse.json(
          { error: 'Colaborador já possui um usuário associado' },
          { status: 400 }
        );
      }
    }

    // Em uma implementação real, você deve hash a senha
    // const hashedPassword = await bcrypt.hash(body.senha, 10);

    // Criar usuário
    const usuario = await db.usuario.create({
      data: {
        email: body.email,
        senha: body.senha, // Em produção, usar hash
        nome: body.nome,
        ativo: body.ativo !== false, // padrão true
        colaboradorId: body.colaboradorId || null
      },
      include: {
        colaborador: {
          select: {
            id: true,
            nome: true,
            email: true,
            cargo: true
          }
        }
      }
    });

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
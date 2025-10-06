import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Listar laudos técnicos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const tecnicoId = searchParams.get('tecnicoId') || '';

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { numero: { contains: search, mode: 'insensitive' } },
        { titulo: { contains: search, mode: 'insensitive' } },
        { tecnico: { nome: { contains: search, mode: 'insensitive' } } },
        { ordemServico: { numero: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (tecnicoId) {
      where.tecnicoId = tecnicoId;
    }

    // Contar total de registros
    const totalCount = await prisma.laudoTecnico.count({ where });

    // Buscar laudos com paginação
    const laudos = await prisma.laudoTecnico.findMany({
      where,
      include: {
        tecnico: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        ordemServico: {
          select: {
            id: true,
            numero: true,
            titulo: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      laudos,
      totalCount,
      totalPages,
      currentPage: page,
      pageSize
    });
  } catch (error) {
    console.error('Erro ao buscar laudos técnicos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const ativo = searchParams.get('ativo');
    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (ativo !== null) {
      where.ativo = ativo === 'true';
    }

    const [templates, total] = await Promise.all([
      db.templateChecklist.findMany({
        where,
        include: {
          itens: {
            orderBy: {
              ordem: 'asc'
            }
          },
          criadoPor: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          nome: 'asc'
        },
        skip,
        take: limit
      }),
      db.templateChecklist.count({ where })
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar templates de checklist:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar templates de checklist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, descricao, itens, criadoPorId } = body;

    // Validar dados obrigatórios
    if (!nome || !criadoPorId) {
      return NextResponse.json(
        { error: 'Nome e criador são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se colaborador existe
    const colaborador = await db.colaborador.findUnique({
      where: { id: criadoPorId }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se já existe template com mesmo nome
    const templateExistente = await db.templateChecklist.findFirst({
      where: { nome }
    });

    if (templateExistente) {
      return NextResponse.json(
        { error: 'Já existe um template com este nome' },
        { status: 400 }
      );
    }

    // Preparar itens do template
    const itensTemplate = itens?.map((item: any, index: number) => ({
      titulo: item.titulo,
      descricao: item.descricao,
      obrigatorio: item.obrigatorio || false,
      ordem: item.ordem || index + 1
    })) || [];

    // Criar template
    const template = await db.templateChecklist.create({
      data: {
        nome,
        descricao,
        ativo: true,
        criadoPorId,
        itens: {
          create: itensTemplate
        }
      },
      include: {
        itens: {
          orderBy: {
            ordem: 'asc'
          }
        },
        criadoPor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar template de checklist:', error);
    return NextResponse.json(
      { error: 'Erro ao criar template de checklist' },
      { status: 500 }
    );
  }
}
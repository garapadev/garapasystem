import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const grupoId = searchParams.get('grupoId') || '';

    const skip = (page - 1) * limit;

    // Construir a query com filtros
    const where: any = {};
    
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (grupoId) {
      where.grupoHierarquicoId = grupoId;
    }

    const [clientes, total] = await Promise.all([
      db.cliente.findMany({
        where,
        include: {
          grupoHierarquico: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      db.cliente.count({ where })
    ]);

    return NextResponse.json({
      data: clientes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar clientes' },
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

    // Verificar se email já existe (se fornecido)
    if (body.email) {
      const existingCliente = await db.cliente.findUnique({
        where: { email: body.email }
      });

      if (existingCliente) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Criar cliente
    const cliente = await db.cliente.create({
      data: {
        nome: body.nome,
        email: body.email || null,
        telefone: body.telefone || null,
        documento: body.documento || null,
        tipo: body.tipo || 'PESSOA_FISICA',
        status: body.status || 'LEAD',
        endereco: body.endereco || null,
        cidade: body.cidade || null,
        estado: body.estado || null,
        cep: body.cep || null,
        observacoes: body.observacoes || null,
        valorPotencial: body.valorPotencial ? parseFloat(body.valorPotencial) : null,
        grupoHierarquicoId: body.grupoHierarquicoId || null
      },
      include: {
        grupoHierarquico: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cliente' },
      { status: 500 }
    );
  }
}
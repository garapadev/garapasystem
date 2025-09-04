import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getSocketIO } from '@/lib/socket';

// Schema de validação para oportunidade
const oportunidadeSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  valor: z.number().positive().optional(),
  probabilidade: z.number().min(0).max(100).optional(),
  dataFechamento: z.string().datetime().optional(),
  observacoes: z.string().optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  responsavelId: z.string().optional(),
  etapaId: z.string().min(1, 'Etapa é obrigatória')
});

// GET - Listar oportunidades
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const etapaId = searchParams.get('etapaId');
    const clienteId = searchParams.get('clienteId');
    const responsavelId = searchParams.get('responsavelId');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: any = {};
    if (etapaId) where.etapaId = etapaId;
    if (clienteId) where.clienteId = clienteId;
    if (responsavelId) where.responsavelId = responsavelId;
    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { cliente: { nome: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [oportunidades, total] = await Promise.all([
      db.oportunidade.findMany({
        where,
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true,
              status: true
            }
          },
          responsavel: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          etapa: {
            select: {
              id: true,
              nome: true,
              cor: true,
              ordem: true
            }
          }
        },
        orderBy: [
          { etapa: { ordem: 'asc' } },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      db.oportunidade.count({ where })
    ]);

    return NextResponse.json({
      oportunidades,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar oportunidades:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova oportunidade
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = oportunidadeSchema.parse(body);

    // Verificar se cliente existe
    const cliente = await db.cliente.findUnique({
      where: { id: validatedData.clienteId }
    });
    if (!cliente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se etapa existe
    const etapa = await db.etapaPipeline.findUnique({
      where: { id: validatedData.etapaId }
    });
    if (!etapa) {
      return NextResponse.json(
        { error: 'Etapa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se responsável existe (se fornecido)
    if (validatedData.responsavelId) {
      const responsavel = await db.colaborador.findUnique({
        where: { id: validatedData.responsavelId }
      });
      if (!responsavel) {
        return NextResponse.json(
          { error: 'Responsável não encontrado' },
          { status: 404 }
        );
      }
    }

    // Criar oportunidade
    const oportunidade = await db.oportunidade.create({
      data: {
        ...validatedData,
        dataFechamento: validatedData.dataFechamento 
          ? new Date(validatedData.dataFechamento)
          : null
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            email: true,
            status: true
          }
        },
        responsavel: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        },
        etapa: {
          select: {
            id: true,
            nome: true,
            cor: true,
            ordem: true
          }
        }
      }
    });

    // Registrar no histórico
    await db.historicoOportunidade.create({
      data: {
        oportunidadeId: oportunidade.id,
        acao: 'criada',
        valorNovo: JSON.stringify({
          titulo: oportunidade.titulo,
          valor: oportunidade.valor,
          etapa: etapa.nome
        }),
        usuarioId: session.user.id
      }
    });

    // Emitir evento Socket.IO
    const io = getSocketIO();
    if (io) {
      io.emit('oportunidade-notification', {
        action: 'created',
        oportunidadeId: oportunidade.id,
        oportunidadeTitulo: oportunidade.titulo,
        etapaNome: etapa.nome,
        clienteNome: cliente.nome,
        userId: session.user.id
      });
    }

    return NextResponse.json({ oportunidade }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar oportunidade:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
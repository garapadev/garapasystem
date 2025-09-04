import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { getSocketIO } from '@/lib/socket';

// Schema de validação para etapa
const etapaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
  cor: z.string().min(1, 'Cor é obrigatória'),
  ordem: z.number().int().positive()
});

// GET - Listar etapas do pipeline
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const etapas = await db.etapaPipeline.findMany({
      orderBy: {
        ordem: 'asc'
      },
      include: {
        _count: {
          select: {
            oportunidades: true
          }
        }
      }
    });

    return NextResponse.json({ etapas });

  } catch (error) {
    console.error('Erro ao buscar etapas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar nova etapa
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = etapaSchema.parse(body);

    // Verificar se já existe etapa com a mesma ordem
    const etapaExistente = await db.etapaPipeline.findFirst({
      where: { ordem: validatedData.ordem }
    });

    if (etapaExistente) {
      return NextResponse.json(
        { error: 'Já existe uma etapa com esta ordem' },
        { status: 400 }
      );
    }

    const etapa = await db.etapaPipeline.create({
      data: validatedData
    });

    // Emitir evento Socket.IO
    const io = getSocketIO();
    if (io) {
      io.emit('etapa-notification', {
        action: 'created',
        etapaId: etapa.id,
        etapaNome: etapa.nome,
        userId: session.user.id
      });
    }

    return NextResponse.json({ etapa }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao criar etapa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
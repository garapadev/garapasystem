import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getSocketIO } from '@/lib/socket';
import { db } from '@/lib/db';

// Schema de validação para reordenação de etapas
const reorderSchema = z.object({
  etapas: z.array(z.object({
    id: z.string(),
    ordem: z.number().min(1)
  }))
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    // Verificar se todas as etapas existem
    const etapasIds = validatedData.etapas.map(e => e.id);
    const etapasExistentes = await db.etapaPipeline.findMany({
      where: {
        id: { in: etapasIds }
      }
    });

    if (etapasExistentes.length !== etapasIds.length) {
      return NextResponse.json(
        { error: 'Uma ou mais etapas não foram encontradas' },
        { status: 404 }
      );
    }

    // Verificar se não há ordens duplicadas
    const ordens = validatedData.etapas.map(e => e.ordem);
    const ordensUnicas = new Set(ordens);
    if (ordens.length !== ordensUnicas.size) {
      return NextResponse.json(
        { error: 'Ordens duplicadas não são permitidas' },
        { status: 400 }
      );
    }

    // Atualizar as ordens das etapas em uma transação
    await db.$transaction(async (tx) => {
      for (const etapa of validatedData.etapas) {
        await tx.etapaPipeline.update({
          where: { id: etapa.id },
          data: { ordem: etapa.ordem }
        });
      }
    });

    // Buscar etapas atualizadas
    const etapasAtualizadas = await db.etapaPipeline.findMany({
      where: {
        id: { in: etapasIds }
      },
      orderBy: { ordem: 'asc' }
    });

    // Emitir evento Socket.IO
    const io = getSocketIO();
    if (io) {
      io.emit('etapa-notification', {
        action: 'reordered',
        etapas: etapasAtualizadas,
        userId: session.user.id
      });
    }

    return NextResponse.json({
      message: 'Etapas reordenadas com sucesso',
      etapas: etapasAtualizadas
    });

  } catch (error) {
    console.error('Erro ao reordenar etapas:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
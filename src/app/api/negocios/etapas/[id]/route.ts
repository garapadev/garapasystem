import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { getSocketIO } from '@/lib/socket';
import { db } from '@/lib/db';

// Schema de validação para atualização de etapa
const updateEtapaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  descricao: z.string().optional(),
  cor: z.string().min(1, 'Cor é obrigatória').optional(),
  ordem: z.number().int().positive().optional()
});

// GET - Buscar etapa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const etapa = await db.etapaPipeline.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            oportunidades: true
          }
        },
        oportunidades: {
          select: {
            id: true,
            titulo: true,
            valor: true,
            probabilidade: true,
            cliente: {
              select: {
                id: true,
                nome: true
              }
            },
            responsavel: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!etapa) {
      return NextResponse.json(
        { error: 'Etapa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ etapa });

  } catch (error) {
    console.error('Erro ao buscar etapa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar etapa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateEtapaSchema.parse(body);

    // Verificar se etapa existe
    const etapaExistente = await db.etapaPipeline.findUnique({
      where: { id: params.id }
    });

    if (!etapaExistente) {
      return NextResponse.json(
        { error: 'Etapa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se já existe etapa com a mesma ordem (se ordem foi alterada)
    if (validatedData.ordem && validatedData.ordem !== etapaExistente.ordem) {
      const etapaComMesmaOrdem = await db.etapaPipeline.findFirst({
        where: {
          ordem: validatedData.ordem,
          id: { not: params.id }
        }
      });

      if (etapaComMesmaOrdem) {
        return NextResponse.json(
          { error: 'Já existe uma etapa com esta ordem' },
          { status: 400 }
        );
      }
    }

    // Atualizar etapa
    const etapaAtualizada = await db.etapaPipeline.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        _count: {
          select: {
            oportunidades: true
          }
        }
      }
    });

    // Emitir evento Socket.IO
    const io = getSocketIO();
    if (io) {
      io.emit('etapa-notification', {
        action: 'updated',
        etapaId: params.id,
        etapaNome: etapaAtualizada.nome,
        userId: session.user.id
      });
    }

    return NextResponse.json({ etapa: etapaAtualizada });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao atualizar etapa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir etapa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar se etapa existe
    const etapa = await db.etapaPipeline.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { oportunidades: true }
        }
      }
    });

    if (!etapa) {
      return NextResponse.json(
        { error: 'Etapa não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se existem oportunidades nesta etapa
    if (etapa._count.oportunidades > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir etapa que possui oportunidades' },
        { status: 400 }
      );
    }

    // Excluir etapa
    await db.etapaPipeline.delete({
      where: { id: params.id }
    });

    // Emitir evento Socket.IO
    const io = getSocketIO();
    if (io) {
      io.emit('etapa-notification', {
        action: 'deleted',
        etapaId: params.id,
        etapaNome: etapa.nome,
        userId: session.user.id
      });
    }

    return NextResponse.json(
      { message: 'Etapa excluída com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao excluir etapa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Buscar laudo técnico por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const laudo = await prisma.laudoTecnico.findUnique({
      where: { id },
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
            titulo: true,
            cliente: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          }
        },
        itens: {
          orderBy: { createdAt: 'asc' }
        },
        anexos: {
          orderBy: { createdAt: 'desc' }
        },
        historico: {
          include: {
            tecnico: {
              select: {
                id: true,
                nome: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!laudo) {
      return NextResponse.json({ error: 'Laudo técnico não encontrado' }, { status: 404 });
    }

    return NextResponse.json(laudo);
  } catch (error) {
    console.error('Erro ao buscar laudo técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir laudo técnico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se o laudo existe
    const laudo = await prisma.laudoTecnico.findUnique({
      where: { id }
    });

    if (!laudo) {
      return NextResponse.json({ error: 'Laudo técnico não encontrado' }, { status: 404 });
    }

    // Verificar se o laudo pode ser excluído (não pode estar aprovado)
    if (laudo.status === 'APROVADO') {
      return NextResponse.json(
        { error: 'Não é possível excluir um laudo técnico aprovado' },
        { status: 400 }
      );
    }

    // Excluir o laudo e seus relacionamentos
    await prisma.$transaction(async (tx) => {
      // Excluir itens do laudo
      await tx.itemLaudoTecnico.deleteMany({
        where: { laudoId: id }
      });

      // Excluir anexos do laudo
      await tx.anexoLaudoTecnico.deleteMany({
        where: { laudoId: id }
      });

      // Excluir histórico do laudo
      await tx.historicoLaudoTecnico.deleteMany({
        where: { laudoId: id }
      });

      // Excluir o laudo
      await tx.laudoTecnico.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: 'Laudo técnico excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir laudo técnico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
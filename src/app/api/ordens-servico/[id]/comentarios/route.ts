import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Verificar se ordem de serviço existe
    const ordemServico = await db.ordemServico.findUnique({
      where: { id: params.id },
      select: { id: true }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    const [comentarios, total] = await Promise.all([
      db.comentarioOrdemServico.findMany({
        where: { ordemServicoId: params.id },
        include: {
          colaborador: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.comentarioOrdemServico.count({
        where: { ordemServicoId: params.id }
      })
    ]);

    return NextResponse.json({
      comentarios,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar comentários' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { comentario, colaboradorId, visibilidadeCliente = false } = body;

    // Validar dados obrigatórios
    if (!comentario || !colaboradorId) {
      return NextResponse.json(
        { error: 'Comentário e colaborador são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se ordem de serviço existe
    const ordemServico = await db.ordemServico.findUnique({
      where: { id: params.id },
      select: { id: true, titulo: true }
    });

    if (!ordemServico) {
      return NextResponse.json(
        { error: 'Ordem de serviço não encontrada' },
        { status: 404 }
      );
    }

    // Verificar se colaborador existe
    const colaborador = await db.colaborador.findUnique({
      where: { id: colaboradorId },
      select: { id: true, nome: true, email: true }
    });

    if (!colaborador) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 404 }
      );
    }

    // Criar comentário
    const novoComentario = await db.comentarioOrdemServico.create({
      data: {
        comentario,
        visibilidadeCliente,
        ordemServicoId: params.id,
        colaboradorId
      },
      include: {
        colaborador: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // Registrar no histórico
    await db.historicoOrdemServico.create({
      data: {
        acao: 'Comentário adicionado',
        valorNovo: visibilidadeCliente ? 'Comentário visível ao cliente' : 'Comentário interno',
        ordemServicoId: params.id,
        colaboradorId
      }
    });

    // TODO: Enviar notificação se comentário for visível ao cliente

    return NextResponse.json(novoComentario, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar comentário' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApiMiddleware, API_PERMISSIONS } from '@/lib/api-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar comentários', 403);
    }

    // Verificar se a tarefa existe
    const task = await db.task.findUnique({
      where: { id: params.id }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    const comments = await db.taskComment.findMany({
      where: { taskId: params.id },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(comments);
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
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'POST')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para criar comentários', 403);
    }

    const body = await request.json();

    // Validar dados obrigatórios
    if (!body.conteudo) {
      return NextResponse.json(
        { error: 'Conteúdo do comentário é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se a tarefa existe
    const task = await db.task.findUnique({
      where: { id: params.id }
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Tarefa não encontrada' },
        { status: 404 }
      );
    }

    // Obter ID do colaborador
    let colaboradorId = null;
    if (auth.user?.id) {
      const colaborador = await db.colaborador.findFirst({
        where: { 
          usuarios: {
            some: {
              id: auth.user.id
            }
          }
        }
      });
      colaboradorId = colaborador?.id || null;
    }

    if (!colaboradorId) {
      return NextResponse.json(
        { error: 'Colaborador não encontrado' },
        { status: 400 }
      );
    }

    // Criar comentário
    const comment = await db.taskComment.create({
      data: {
        taskId: params.id,
        autorId: colaboradorId,
        conteudo: body.conteudo,
        isInterno: body.interno || false
      },
      include: {
        autor: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    // Criar log do comentário
    await db.taskLog.create({
      data: {
        taskId: params.id,
        autorId: colaboradorId,
        tipo: 'COMENTARIO_ADICIONADO',
        descricao: `Comentário adicionado${body.interno ? ' (interno)' : ''}`,
        valorAnterior: null,
        valorNovo: JSON.stringify({ comentario: body.conteudo })
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar comentário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar comentário' },
      { status: 500 }
    );
  }
}
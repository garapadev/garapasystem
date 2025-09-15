import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { RecurrenceService } from '@/lib/tasks/recurrence-service';

// PUT /api/tasks/recurrence/[id] - Alternar status da recorrência
export async function PUT(
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
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'PUT')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para alterar tarefas recorrentes', 403);
    }

    const { id } = params;
    const body = await request.json();
    const { active } = body;

    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo active deve ser boolean' },
        { status: 400 }
      );
    }

    const result = await RecurrenceService.toggleRecurrence(id, active);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao alternar status da recorrência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/recurrence/[id] - Excluir recorrência
export async function DELETE(
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
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'DELETE')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para excluir tarefas recorrentes', 403);
    }

    const { id } = params;

    await RecurrenceService.deleteRecurrence(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir recorrência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { TaskCommentsService } from '@/lib/tasks/task-comments-service';

// GET /api/tasks/[id]/audit-trail - Buscar audit trail de uma tarefa
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
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar audit trail', 403);
    }

    const taskId = params.id;
    const result = await TaskCommentsService.getTaskAuditTrail(taskId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error === 'Tarefa não encontrada' ? 404 : 403 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: result.logs
    });
  } catch (error) {
    console.error('Erro ao buscar audit trail:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
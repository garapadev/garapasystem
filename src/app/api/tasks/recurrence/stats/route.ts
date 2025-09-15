import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { RecurrenceService } from '@/lib/tasks/recurrence-service';

// GET /api/tasks/recurrence/stats - Obter estatísticas das tarefas recorrentes
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar estatísticas de recorrência', 403);
    }

    const stats = await RecurrenceService.getRecurrenceStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao obter estatísticas de recorrência:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
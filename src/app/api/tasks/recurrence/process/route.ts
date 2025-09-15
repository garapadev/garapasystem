import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { RecurrenceService } from '@/lib/tasks/recurrence-service';

// POST /api/tasks/recurrence/process - Processar tarefas recorrentes pendentes
export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'POST')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para processar tarefas recorrentes', 403);
    }

    const result = await RecurrenceService.processRecurrences();

    return NextResponse.json({
      message: 'Processamento concluído',
      tasksCreated: result.processed?.length || 0,
      tasks: result.processed || [],
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('Erro ao processar tarefas recorrentes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { TaskCalendarService } from '@/lib/tasks/task-calendar-service';

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar calendário de tarefas', 403);
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const targetDate = searchParams.get('targetDate');
    const clienteId = searchParams.get('clienteId');
    const responsavelId = searchParams.get('responsavelId');
    const status = searchParams.get('status');
    const prioridade = searchParams.get('prioridade');

    switch (action) {
      case 'events':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'Parâmetros startDate e endDate são obrigatórios' },
            { status: 400 }
          );
        }

        const events = await TaskCalendarService.getCalendarEvents(
          auth,
          new Date(startDate),
          new Date(endDate),
          {
            clienteId: clienteId || undefined,
            responsavelId: responsavelId || undefined,
            status: status as any || undefined,
            prioridade: prioridade as any || undefined,
          }
        );

        return NextResponse.json(events);

      case 'day-tasks':
        if (!targetDate) {
          return NextResponse.json(
            { error: 'Parâmetro targetDate é obrigatório' },
            { status: 400 }
          );
        }

        const dayTasks = await TaskCalendarService.getTasksForDay(
          auth,
          new Date(targetDate),
          {
            clienteId: clienteId || undefined,
            responsavelId: responsavelId || undefined,
            status: status as any || undefined,
            prioridade: prioridade as any || undefined,
          }
        );

        return NextResponse.json(dayTasks);

      case 'statistics':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'Parâmetros startDate e endDate são obrigatórios' },
            { status: 400 }
          );
        }

        const statistics = await TaskCalendarService.getCalendarStatistics(
          session,
          new Date(startDate),
          new Date(endDate)
        );

        return NextResponse.json(statistics);

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida. Use: events, day-tasks ou statistics' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro na API de calendário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, dataInicio, dataVencimento } = body;

    if (!taskId) {
      return NextResponse.json(
        { error: 'ID da tarefa é obrigatório' },
        { status: 400 }
      );
    }

    if (!dataInicio && !dataVencimento) {
      return NextResponse.json(
        { error: 'Pelo menos uma data deve ser fornecida' },
        { status: 400 }
      );
    }

    await TaskCalendarService.updateTaskDates(
      session,
      taskId,
      dataInicio ? new Date(dataInicio) : undefined,
      dataVencimento ? new Date(dataVencimento) : undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar datas da tarefa:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
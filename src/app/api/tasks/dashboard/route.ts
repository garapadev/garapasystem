import { NextRequest, NextResponse } from 'next/server';
import { TaskDashboardService } from '@/lib/tasks/task-dashboard-service';
import { ApiMiddleware } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar dashboard de tarefas', 403);
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'metrics';
    
    // Extrair filtros dos parâmetros da URL
    const filters = {
      dataInicio: searchParams.get('dataInicio') || undefined,
      dataFim: searchParams.get('dataFim') || undefined,
      responsavelId: searchParams.get('responsavelId') || undefined,
      clienteId: searchParams.get('clienteId') || undefined,
      status: searchParams.get('status')?.split(',') || undefined,
      prioridade: searchParams.get('prioridade')?.split(',') || undefined,
    };

    switch (type) {
      case 'metrics':
        const metrics = await TaskDashboardService.getTaskMetrics(filters);
        return NextResponse.json(metrics);
        
      case 'report':
        const report = await TaskDashboardService.getTasksReport(filters);
        return NextResponse.json(report);
        
      case 'responsaveis':
        const responsaveis = await TaskDashboardService.getResponsaveis();
        return NextResponse.json(responsaveis);
        
      case 'clientes':
        const clientes = await TaskDashboardService.getClientes();
        return NextResponse.json(clientes);
        
      default:
        return NextResponse.json(
          { error: 'Tipo de consulta inválido' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Erro na API do dashboard:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
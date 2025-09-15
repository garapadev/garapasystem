import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { EmailTaskService } from '@/lib/tasks/email-task-service';

// GET /api/tasks/from-email/check?emailId=xxx - Verificar se email já foi transformado em tarefa
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para verificar emails', 403);
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json(
        { error: 'ID do email é obrigatório' },
        { status: 400 }
      );
    }

    const isAlreadyTask = await EmailTaskService.isEmailAlreadyTask(emailId);
    const assignees = await EmailTaskService.getAvailableAssignees();
    const clients = await EmailTaskService.getAvailableClients();

    return NextResponse.json({
      success: true,
      isAlreadyTask,
      assignees,
      clients
    });
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
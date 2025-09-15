import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { EmailTaskService, CreateTaskFromEmailData } from '@/lib/tasks/email-task-service';
import { z } from 'zod';

// Schema de validação para criação de tarefa a partir de email
const createTaskFromEmailSchema = z.object({
  emailId: z.string().min(1, 'ID do email é obrigatório'),
  titulo: z.string().optional(),
  descricao: z.string().optional(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']).optional(),
  dataVencimento: z.string().datetime().optional(),
  responsavelId: z.string().optional(),
  clienteId: z.string().optional(),
  oportunidadeId: z.string().optional()
});

// POST /api/tasks/from-email - Criar tarefa a partir de email
export async function POST(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'POST')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para criar tarefas de email', 403);
    }

    const body = await request.json();
    const validatedData = createTaskFromEmailSchema.parse(body);

    // Converter dataVencimento se fornecida
    const taskData: CreateTaskFromEmailData = {
      ...validatedData,
      dataVencimento: validatedData.dataVencimento 
        ? new Date(validatedData.dataVencimento)
        : undefined
    };

    const result = await EmailTaskService.createTaskFromEmail(taskData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      task: result.task
    });
  } catch (error) {
    console.error('Erro ao criar tarefa a partir do email:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// GET /api/tasks/from-email - Listar tarefas criadas a partir de emails
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar tarefas de email', 403);
    }

    const tasks = await EmailTaskService.getTasksFromEmails(auth.user.id);

    return NextResponse.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Erro ao buscar tarefas de emails:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
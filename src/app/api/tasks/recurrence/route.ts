import { NextRequest, NextResponse } from 'next/server';
import { ApiMiddleware } from '@/lib/api-middleware';
import { RecurrenceService } from '@/lib/tasks/recurrence-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/tasks/recurrence - Listar tarefas recorrentes
export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, '/api/tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar tarefas recorrentes', 403);
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const recurrences = await RecurrenceService.getRecurrenceStats();

    return NextResponse.json(recurrences);
  } catch (error) {
    console.error('Erro ao listar tarefas recorrentes:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST /api/tasks/recurrence - Criar nova tarefa recorrente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      titulo,
      descricao,
      prioridade,
      tempoEstimado,
      responsavelId,
      clienteId,
      oportunidadeId,
      pattern
    } = body;

    // Validação básica
    if (!titulo || !responsavelId || !pattern) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: titulo, responsavelId, pattern' },
        { status: 400 }
      );
    }

    const template = {
      titulo,
      descricao,
      prioridade: prioridade || 'MEDIA',
      tempoEstimado,
      responsavelId,
      clienteId,
      oportunidadeId,
      pattern
    };

    const result = await RecurrenceService.createRecurrence(
      template,
      pattern,
      new Date(),
      session.user.id
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar tarefa recorrente:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiMiddleware } from '@/lib/api-middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação
    const auth = await ApiMiddleware.validateAuth(request);
    if (!auth.valid) {
      return ApiMiddleware.createErrorResponse(auth.error || 'Não autorizado');
    }

    // Verificar permissões
    if (!ApiMiddleware.hasAuthPermission(auth, 'tasks', 'GET')) {
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar estatísticas de automação', 403);
    }

    // Buscar estatísticas de automação
    const totalTasks = await prisma.task.count();
    const automatedTasks = await prisma.task.count({
      where: {
        description: {
          contains: 'Criada automaticamente'
        }
      }
    });

    const activeRules = 3; // Número fixo por enquanto
    const lastExecution = new Date();

    const stats = {
      totalTasks,
      automatedTasks,
      activeRules,
      lastExecution,
      successRate: automatedTasks > 0 ? (automatedTasks / totalTasks) * 100 : 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas de automação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
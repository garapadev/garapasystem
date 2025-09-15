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
      return ApiMiddleware.createErrorResponse('Sem permissão para visualizar resumo de automação', 403);
    }

    // Buscar dados para o resumo
    const totalTasks = await prisma.task.count();
    const automatedTasks = await prisma.task.count({
      where: {
        descricao: {
          contains: 'Criada automaticamente'
        }
      }
    });

    const totalOportunidades = await prisma.oportunidade.count();
    const oportunidadesComTarefas = await prisma.oportunidade.count({
      where: {
        Task: {
          some: {}
        }
      }
    });

    const summary = {
      automacao: {
        tarefasAutomatizadas: automatedTasks,
        totalTarefas: totalTasks,
        percentualAutomacao: totalTasks > 0 ? Math.round((automatedTasks / totalTasks) * 100) : 0
      },
      integracao: {
        oportunidadesComTarefas,
        totalOportunidades,
        percentualIntegracao: totalOportunidades > 0 ? Math.round((oportunidadesComTarefas / totalOportunidades) * 100) : 0
      },
      regras: {
        ativas: 2,
        inativas: 1,
        total: 3
      },
      ultimaExecucao: new Date(),
      proximaExecucao: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
      status: 'ATIVO'
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Erro ao buscar resumo de automação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
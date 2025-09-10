import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailSyncMonitor } from '@/lib/email/sync-monitor';
import { z } from 'zod';

// Schema de validação para parâmetros de consulta
const querySchema = z.object({
  emailConfigId: z.string().optional(),
  limit: z.string().transform(Number).optional(),
  type: z.enum(['logs', 'metrics', 'report']).optional().default('logs')
});

// GET - Obter logs e métricas de monitoramento
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = querySchema.parse({
      emailConfigId: searchParams.get('emailConfigId'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type')
    });

    const { emailConfigId, limit, type } = validatedParams;

    switch (type) {
      case 'logs':
        if (emailConfigId) {
          // Logs de uma configuração específica
          const logs = emailSyncMonitor.getLogs(emailConfigId, limit);
          return NextResponse.json({
            success: true,
            data: {
              emailConfigId,
              logs,
              total: logs.length
            }
          });
        } else {
          // Logs globais não implementados diretamente, retornar erro
          return NextResponse.json(
            { error: 'emailConfigId é obrigatório para consultar logs' },
            { status: 400 }
          );
        }

      case 'metrics':
        if (emailConfigId) {
          // Métricas de uma configuração específica
          const metrics = emailSyncMonitor.getMetrics(emailConfigId);
          if (!metrics) {
            return NextResponse.json(
              { error: 'Nenhuma métrica encontrada para esta configuração' },
              { status: 404 }
            );
          }
          return NextResponse.json({
            success: true,
            data: {
              emailConfigId,
              metrics
            }
          });
        } else {
          // Métricas globais
          const globalMetrics = emailSyncMonitor.getGlobalMetrics();
          return NextResponse.json({
            success: true,
            data: {
              global: true,
              metrics: globalMetrics
            }
          });
        }

      case 'report':
        // Relatório completo de sincronização
        const report = emailSyncMonitor.generateSyncReport();
        return NextResponse.json({
          success: true,
          data: {
            report,
            generatedAt: new Date().toISOString()
          }
        });

      default:
        return NextResponse.json(
          { error: 'Tipo de consulta inválido' },
          { status: 400 }
        );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao obter dados de monitoramento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Limpar logs antigos ou resetar métricas
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, hours } = body;

    switch (action) {
      case 'clearLogs':
        const hoursToKeep = hours || 24;
        emailSyncMonitor.clearOldLogs(hoursToKeep);
        return NextResponse.json({
          success: true,
          message: `Logs antigos removidos (mais de ${hoursToKeep}h)`
        });

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Erro ao executar ação de monitoramento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
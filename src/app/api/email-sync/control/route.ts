import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { emailSyncScheduler } from '@/lib/email/sync-scheduler';
import { z } from 'zod';

// Schema de validação para controle do worker
const controlSchema = z.object({
  action: z.enum(['start', 'stop', 'restart', 'status']),
  colaboradorId: z.string().optional(), // Para controlar sync específico
});

// GET - Obter status do worker de sincronização
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const status = emailSyncScheduler.getGlobalStatus();
    const activeJobs = emailSyncScheduler.getActiveJobs();

    return NextResponse.json({
      success: true,
      data: {
        globalEnabled: status.isEnabled,
        activeJobs: activeJobs.length,
        jobs: activeJobs.map(job => ({
          emailConfigId: job.emailConfigId,
          isRunning: job.isRunning,
          startedAt: job.startedAt
        }))
      }
    });

  } catch (error) {
    console.error('Erro ao obter status do worker:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Controlar worker de sincronização
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
    const validatedData = controlSchema.parse(body);
    const { action, colaboradorId } = validatedData;

    let result: any = { success: false };

    switch (action) {
      case 'start':
        if (colaboradorId) {
          // Iniciar sincronização para colaborador específico
          const started = await emailSyncScheduler.startSyncForUser(colaboradorId);
          result = {
            success: started,
            message: started 
              ? `Sincronização iniciada para colaborador ${colaboradorId}`
              : `Falha ao iniciar sincronização para colaborador ${colaboradorId}`
          };
        } else {
          // Iniciar sincronização global
          emailSyncScheduler.enableGlobalSync();
          await emailSyncScheduler.startAllActiveConfigs();
          result = {
            success: true,
            message: 'Sincronização global iniciada'
          };
        }
        break;

      case 'stop':
        if (colaboradorId) {
          // Parar sincronização para colaborador específico
          const stopped = emailSyncScheduler.stopSyncForUser(colaboradorId);
          result = {
            success: stopped,
            message: stopped 
              ? `Sincronização parada para colaborador ${colaboradorId}`
              : `Nenhuma sincronização ativa encontrada para colaborador ${colaboradorId}`
          };
        } else {
          // Parar sincronização global
          emailSyncScheduler.disableGlobalSync();
          emailSyncScheduler.stopAllSyncs();
          result = {
            success: true,
            message: 'Sincronização global parada'
          };
        }
        break;

      case 'restart':
        if (colaboradorId) {
          // Reiniciar sincronização para colaborador específico
          emailSyncScheduler.stopSyncForUser(colaboradorId);
          const restarted = await emailSyncScheduler.startSyncForUser(colaboradorId);
          result = {
            success: restarted,
            message: restarted 
              ? `Sincronização reiniciada para colaborador ${colaboradorId}`
              : `Falha ao reiniciar sincronização para colaborador ${colaboradorId}`
          };
        } else {
          // Reiniciar sincronização global
          emailSyncScheduler.stopAllSyncs();
          emailSyncScheduler.enableGlobalSync();
          await emailSyncScheduler.startAllActiveConfigs();
          result = {
            success: true,
            message: 'Sincronização global reiniciada'
          };
        }
        break;

      case 'status':
        // Retornar status detalhado
        const status = emailSyncScheduler.getGlobalStatus();
        const activeJobs = emailSyncScheduler.getActiveJobs();
        
        result = {
          success: true,
          data: {
            globalEnabled: status.isEnabled,
            activeJobs: activeJobs.length,
            jobs: activeJobs.map(job => ({
              emailConfigId: job.emailConfigId,
              isRunning: job.isRunning,
              startedAt: job.startedAt
            }))
          }
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Ação inválida' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erro ao controlar worker:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
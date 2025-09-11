import { NextRequest, NextResponse } from 'next/server';
import { syncService, SyncOptions } from '@/lib/helpdesk/sync-service';
import { z } from 'zod';

const syncOptionsSchema = z.object({
  batchSize: z.number().min(1).max(100).optional(),
  maxRetries: z.number().min(1).max(5).optional(),
  syncUnassociatedOnly: z.boolean().optional(),
  syncClientData: z.boolean().optional(),
  syncTicketHistory: z.boolean().optional(),
  incremental: z.boolean().optional().default(false)
});

// POST /api/helpdesk/sync - Iniciar sincronização
export async function POST(request: NextRequest) {
  try {
    // Verificar se já está executando
    if (syncService.isSyncRunning()) {
      return NextResponse.json(
        { 
          error: 'Sincronização já está em execução',
          isRunning: true
        },
        { status: 409 }
      );
    }

    // Validar opções
    const body = await request.json().catch(() => ({}));
    const options = syncOptionsSchema.parse(body);
    
    // Executar sincronização
    let stats;
    if (options.incremental) {
      stats = await syncService.incrementalSync(options);
    } else {
      stats = await syncService.fullSync(options);
    }

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída com sucesso',
      stats,
      type: options.incremental ? 'incremental' : 'full'
    });

  } catch (error) {
    console.error('Erro na sincronização:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Opções de sincronização inválidas',
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false
      },
      { status: 500 }
    );
  }
}

// GET /api/helpdesk/sync - Obter status da sincronização
export async function GET() {
  try {
    const [isRunning, lastSyncTime, syncStats] = await Promise.all([
      syncService.isSyncRunning(),
      syncService.getLastSyncTime(),
      syncService.getSyncStats()
    ]);

    return NextResponse.json({
      isRunning,
      lastSyncTime,
      stats: syncStats,
      nextRecommendedSync: lastSyncTime 
        ? new Date(lastSyncTime.getTime() + 60 * 60 * 1000) // 1 hora depois
        : new Date() // Agora se nunca sincronizou
    });

  } catch (error) {
    console.error('Erro ao obter status da sincronização:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
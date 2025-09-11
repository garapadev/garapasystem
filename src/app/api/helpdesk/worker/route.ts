import { NextRequest, NextResponse } from 'next/server';
import { workerManager } from '@/lib/helpdesk/worker-manager';

/**
 * GET /api/helpdesk/worker
 * Retorna o status do worker de processamento de emails
 */
export async function GET() {
  try {
    const status = workerManager.getStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        isInitialized: status.isInitialized,
        isRunning: status.workerStatus.isRunning,
        syncInterval: status.workerStatus.syncInterval,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[Worker API] Erro ao obter status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/helpdesk/worker
 * Controla o worker (start, stop, restart)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Ação não especificada ou inválida'
        },
        { status: 400 }
      );
    }

    switch (action.toLowerCase()) {
      case 'start':
        await workerManager.initialize();
        return NextResponse.json({
          success: true,
          message: 'Worker iniciado com sucesso',
          data: workerManager.getStatus()
        });

      case 'stop':
        workerManager.shutdown();
        return NextResponse.json({
          success: true,
          message: 'Worker parado com sucesso',
          data: workerManager.getStatus()
        });

      case 'restart':
        await workerManager.restart();
        return NextResponse.json({
          success: true,
          message: 'Worker reiniciado com sucesso',
          data: workerManager.getStatus()
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Ação '${action}' não reconhecida. Use: start, stop ou restart`
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Worker API] Erro ao processar ação:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/helpdesk/worker
 * Atualiza configurações do worker
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { autoStart } = body;

    // Por enquanto, apenas retorna status atual
    // Futuras implementações podem incluir configurações dinâmicas
    
    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas',
      data: {
        autoStart: autoStart ?? true,
        currentStatus: workerManager.getStatus()
      }
    });
  } catch (error) {
    console.error('[Worker API] Erro ao atualizar configurações:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/logs/debug-config:
 *   get:
 *     summary: Lista configurações de debug por módulo
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Lista de configurações de debug
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 configs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       module:
 *                         type: string
 *                       debug_enabled:
 *                         type: boolean
 *                       debug_level:
 *                         type: string
 *                       log_retention_days:
 *                         type: number
 */
export async function GET() {
  try {
    // Buscar configurações de debug existentes
    const debugConfigs = await db.configuracao.findMany({
      where: {
        chave: {
          startsWith: 'debug_'
        }
      }
    });

    // Módulos padrão do sistema
    const defaultModules = [
      'garapasystem',
      'helpdesk-worker', 
      'webmail-sync-worker',
      'webmail',
      'helpdesk',
      'tarefas',
      'clientes',
      'negocios'
    ];

    // Organizar configurações por módulo
    const configs = defaultModules.map(module => {
      const debugEnabled = debugConfigs.find(c => c.chave === `debug_${module}_enabled`)?.valor === 'true';
      const debugLevel = debugConfigs.find(c => c.chave === `debug_${module}_level`)?.valor || 'info';
      const logRetention = parseInt(debugConfigs.find(c => c.chave === `debug_${module}_retention`)?.valor || '7');

      return {
        module,
        debug_enabled: debugEnabled,
        debug_level: debugLevel,
        log_retention_days: logRetention,
        display_name: getModuleDisplayName(module)
      };
    });

    return NextResponse.json({
      success: true,
      configs
    });

  } catch (error) {
    console.error('Erro ao buscar configurações de debug:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/logs/debug-config:
 *   put:
 *     summary: Atualiza configurações de debug por módulo
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               module:
 *                 type: string
 *               debug_enabled:
 *                 type: boolean
 *               debug_level:
 *                 type: string
 *                 enum: [error, warn, info, debug]
 *               log_retention_days:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 365
 *     responses:
 *       200:
 *         description: Configuração atualizada com sucesso
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { module, debug_enabled, debug_level, log_retention_days } = body;

    if (!module) {
      return NextResponse.json(
        { success: false, error: 'Módulo é obrigatório' },
        { status: 400 }
      );
    }

    // Atualizar ou criar configurações
    const updates = [];

    if (debug_enabled !== undefined) {
      updates.push(
        db.configuracao.upsert({
          where: { chave: `debug_${module}_enabled` },
          update: { valor: debug_enabled.toString() },
          create: {
            chave: `debug_${module}_enabled`,
            valor: debug_enabled.toString(),
            descricao: `Debug habilitado para o módulo ${module}`
          }
        })
      );
    }

    if (debug_level) {
      updates.push(
        db.configuracao.upsert({
          where: { chave: `debug_${module}_level` },
          update: { valor: debug_level },
          create: {
            chave: `debug_${module}_level`,
            valor: debug_level,
            descricao: `Nível de debug para o módulo ${module}`
          }
        })
      );
    }

    if (log_retention_days !== undefined) {
      updates.push(
        db.configuracao.upsert({
          where: { chave: `debug_${module}_retention` },
          update: { valor: log_retention_days.toString() },
          create: {
            chave: `debug_${module}_retention`,
            valor: log_retention_days.toString(),
            descricao: `Dias de retenção de logs para o módulo ${module}`
          }
        })
      );
    }

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `Configurações de debug atualizadas para o módulo ${module}`
    });

  } catch (error) {
    console.error('Erro ao atualizar configurações de debug:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function getModuleDisplayName(module: string): string {
  const displayNames: Record<string, string> = {
    'garapasystem': 'Sistema Principal',
    'helpdesk-worker': 'Worker Helpdesk',
    'webmail-sync-worker': 'Worker Webmail',
    'webmail': 'Webmail',
    'helpdesk': 'Helpdesk',
    'tarefas': 'Tarefas',
    'clientes': 'Clientes',
    'negocios': 'Negócios'
  };

  return displayNames[module] || module;
}
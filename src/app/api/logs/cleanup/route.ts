import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

/**
 * @swagger
 * /api/logs/cleanup:
 *   post:
 *     summary: Executar limpeza automática de logs
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Limpeza automática executada
 */
export async function POST() {
  try {
    // Chamar a API de retenção para executar a limpeza
    const cleanupResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/logs/retention`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!cleanupResponse.ok) {
      throw new Error('Falha na limpeza automática');
    }

    const result = await cleanupResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Limpeza automática executada com sucesso',
      ...result
    });
  } catch (error) {
    console.error('Erro na limpeza automática:', error);
    return NextResponse.json(
      { success: false, error: 'Erro na limpeza automática' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/logs/cleanup:
 *   get:
 *     summary: Verificar status da limpeza automática
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Status da limpeza automática
 */
export async function GET() {
  try {
    // Verificar se existe um cron job para limpeza automática
    const { stdout } = await execAsync('crontab -l 2>/dev/null || echo "No crontab"');
    const hasCleanupCron = stdout.includes('/api/logs/cleanup');

    // Obter configuração de retenção
    const configResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/logs/retention`);
    const configData = await configResponse.json();

    return NextResponse.json({
      success: true,
      autoCleanupEnabled: hasCleanupCron,
      lastCleanup: configData.config?.lastCleanup,
      globalRetentionDays: configData.config?.globalRetentionDays || 30
    });
  } catch (error) {
    console.error('Erro ao verificar status da limpeza automática:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * @swagger
 * /api/logs/system:
 *   get:
 *     summary: Lista logs do sistema por módulo
 *     tags: [Logs]
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *           enum: [garapasystem, helpdesk-worker, webmail-sync-worker, all]
 *         description: Módulo específico ou 'all' para todos
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [combined, error, out]
 *           default: combined
 *         description: Tipo de log
 *       - in: query
 *         name: lines
 *         schema:
 *           type: integer
 *           default: 100
 *           maximum: 1000
 *         description: Número de linhas para retornar
 *       - in: query
 *         name: realtime
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Retornar logs em tempo real via PM2
 *     responses:
 *       200:
 *         description: Lista de logs do sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       module:
 *                         type: string
 *                       type:
 *                         type: string
 *                       content:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                 modules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       pid:
 *                         type: number
 *                       cpu:
 *                         type: string
 *                       memory:
 *                         type: string
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module') || 'all';
    const lines = parseInt(searchParams.get('lines') || '100');

    // Obter informações dos processos PM2 para pegar os caminhos dos logs
    const { stdout: pm2List } = await execAsync('pm2 jlist');
    const processes = JSON.parse(pm2List);
    
    const moduleLogFiles: Record<string, string> = {};
    
    // Mapear processos para seus arquivos de log
    processes.forEach((proc: any) => {
      if (proc.pm2_env && proc.pm2_env.pm_log_path) {
        moduleLogFiles[proc.name] = proc.pm2_env.pm_log_path;
      }
    });

    console.log('Arquivos de log encontrados:', moduleLogFiles);

    let logs: any[] = [];

    if (module === 'all') {
      // Ler logs de todos os módulos
      for (const [moduleName, logFile] of Object.entries(moduleLogFiles)) {
        try {
          const linesPerModule = Math.ceil(lines / Object.keys(moduleLogFiles).length);
          const { stdout: tailOutput } = await execAsync(`tail -n ${linesPerModule} "${logFile}"`);
          const fileLines = tailOutput.split('\n').filter(line => line.trim());
          const moduleLogs = fileLines.map((line, index) => {
            return parseLogLine(line, moduleName, index);
          });
          logs.push(...moduleLogs);
        } catch (error) {
          console.warn(`Erro ao ler arquivo de log ${logFile}:`, error);
        }
      }
    } else {
      // Ler logs de um módulo específico
      const logFile = moduleLogFiles[module];
      if (!logFile) {
        return NextResponse.json(
          { success: false, error: 'Módulo não encontrado' },
          { status: 404 }
        );
      }

      try {
        // Usar tail para ler apenas as últimas linhas do arquivo
        const { stdout: tailOutput } = await execAsync(`tail -n ${lines} "${logFile}"`);
        const fileLines = tailOutput.split('\n').filter(line => line.trim());
        console.log(`Arquivo ${logFile} lido com sucesso. Total de linhas: ${fileLines.length}`);
        logs = fileLines.map((line, index) => {
          return parseLogLine(line, module, index);
        });
        console.log(`Logs processados: ${logs.length}`);
      } catch (error) {
        console.warn(`Erro ao ler arquivo de log ${logFile}:`, error);
        logs = [];
      }
    }

    // Ordenar logs por timestamp (mais recentes primeiro)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      success: true,
      logs: logs.slice(0, lines)
    });

  } catch (error) {
    console.error('Erro ao buscar logs do sistema:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

function parseLogLine(line: string, moduleName: string, index: number) {
  // Formato típico: 2025-09-24T15:12:48: [Worker Monitor] [2025-09-24T18:12:48.845Z] Mensagem
  const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
  const workerMatch = line.match(/\[([^\]]+)\]/);
  
  let timestamp = new Date().toISOString();
  let level = 'info';
  let content = line;

  if (timestampMatch) {
    timestamp = new Date(timestampMatch[1]).toISOString();
  }

  // Determinar o nível do log baseado no conteúdo
  if (line.toLowerCase().includes('error')) {
    level = 'error';
  } else if (line.toLowerCase().includes('warn')) {
    level = 'warn';
  } else if (line.toLowerCase().includes('debug')) {
    level = 'debug';
  }

  // Extrair apenas a mensagem, removendo timestamp inicial
  content = line.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}:\s*/, '').trim() || line;

  return {
    id: `log-${moduleName}-${index}`,
    timestamp,
    level,
    module: moduleName,
    message: content
  };
}

/**
 * @swagger
 * /api/logs/system:
 *   post:
 *     summary: Controla debug e coleta de logs por módulo
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [start_debug, stop_debug, restart_module, clear_logs]
 *               module:
 *                 type: string
 *               debug_level:
 *                 type: string
 *                 enum: [error, warn, info, debug]
 *                 default: info
 *     responses:
 *       200:
 *         description: Ação executada com sucesso
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, module, debug_level = 'info' } = body;

    if (!action || !module) {
      return NextResponse.json(
        { success: false, error: 'Ação e módulo são obrigatórios' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'start_debug':
        // Ativar debug para o módulo específico
        try {
          await execAsync(`pm2 set ${module}:log_level ${debug_level}`);
          result = { message: `Debug ativado para ${module} com nível ${debug_level}` };
        } catch (error) {
          throw new Error(`Erro ao ativar debug: ${error}`);
        }
        break;

      case 'stop_debug':
        // Desativar debug para o módulo
        try {
          await execAsync(`pm2 set ${module}:log_level error`);
          result = { message: `Debug desativado para ${module}` };
        } catch (error) {
          throw new Error(`Erro ao desativar debug: ${error}`);
        }
        break;

      case 'restart_module':
        // Reiniciar módulo específico
        try {
          await execAsync(`pm2 restart ${module}`);
          result = { message: `Módulo ${module} reiniciado` };
        } catch (error) {
          throw new Error(`Erro ao reiniciar módulo: ${error}`);
        }
        break;

      case 'clear_logs':
        // Limpar logs do módulo
        try {
          await execAsync(`pm2 flush ${module}`);
          result = { message: `Logs do módulo ${module} limpos` };
        } catch (error) {
          throw new Error(`Erro ao limpar logs: ${error}`);
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erro ao executar ação:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
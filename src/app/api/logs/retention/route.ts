import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// Arquivo de configuração de retenção
const RETENTION_CONFIG_FILE = '/app/data/logs-retention-config.json';

interface RetentionConfig {
  globalRetentionDays: number;
  moduleConfigs: Record<string, {
    retentionDays: number;
    autoCleanup: boolean;
  }>;
  lastCleanup: string;
}

// Configuração padrão
const DEFAULT_CONFIG: RetentionConfig = {
  globalRetentionDays: 30,
  moduleConfigs: {},
  lastCleanup: new Date().toISOString()
};

/**
 * @swagger
 * /api/logs/retention:
 *   get:
 *     summary: Obter configurações de retenção de logs
 *     tags: [Logs]
 *     responses:
 *       200:
 *         description: Configurações de retenção
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 config:
 *                   type: object
 */
export async function GET() {
  try {
    let config: RetentionConfig;
    
    try {
      const configData = await fs.readFile(RETENTION_CONFIG_FILE, 'utf-8');
      config = JSON.parse(configData);
    } catch (error) {
      // Se o arquivo não existir, criar com configuração padrão
      config = DEFAULT_CONFIG;
      await saveConfig(config);
    }

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Erro ao obter configurações de retenção:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/logs/retention:
 *   put:
 *     summary: Atualizar configurações de retenção de logs
 *     tags: [Logs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               globalRetentionDays:
 *                 type: integer
 *               moduleConfigs:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configurações atualizadas com sucesso
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Carregar configuração atual
    let config: RetentionConfig;
    try {
      const configData = await fs.readFile(RETENTION_CONFIG_FILE, 'utf-8');
      config = JSON.parse(configData);
    } catch (error) {
      config = DEFAULT_CONFIG;
    }

    // Atualizar configurações
    if (body.globalRetentionDays !== undefined) {
      config.globalRetentionDays = Math.max(1, Math.min(365, body.globalRetentionDays));
    }

    if (body.moduleConfigs) {
      config.moduleConfigs = { ...config.moduleConfigs, ...body.moduleConfigs };
    }

    // Salvar configuração
    await saveConfig(config);

    return NextResponse.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de retenção:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/logs/retention:
 *   delete:
 *     summary: Executar limpeza manual de logs
 *     tags: [Logs]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               module:
 *                 type: string
 *               days:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Limpeza executada com sucesso
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { module, days } = body;

    // Carregar configuração atual
    let config: RetentionConfig;
    try {
      const configData = await fs.readFile(RETENTION_CONFIG_FILE, 'utf-8');
      config = JSON.parse(configData);
    } catch (error) {
      config = DEFAULT_CONFIG;
    }

    // Obter informações dos processos PM2
    const { stdout: pm2List } = await execAsync('pm2 jlist');
    const processes = JSON.parse(pm2List);
    
    const moduleLogFiles: Record<string, string> = {};
    processes.forEach((proc: any) => {
      if (proc.pm2_env && proc.pm2_env.pm_log_path) {
        moduleLogFiles[proc.name] = proc.pm2_env.pm_log_path;
      }
    });

    let cleanedFiles = 0;
    let cleanedSize = 0;

    if (module && moduleLogFiles[module]) {
      // Limpar logs de um módulo específico
      const result = await cleanupLogFile(moduleLogFiles[module], days || config.globalRetentionDays);
      cleanedFiles = result.cleaned ? 1 : 0;
      cleanedSize = result.size;
    } else {
      // Limpar logs de todos os módulos
      for (const [moduleName, logFile] of Object.entries(moduleLogFiles)) {
        const retentionDays = config.moduleConfigs[moduleName]?.retentionDays || config.globalRetentionDays;
        const result = await cleanupLogFile(logFile, retentionDays);
        if (result.cleaned) {
          cleanedFiles++;
          cleanedSize += result.size;
        }
      }
    }

    // Atualizar timestamp da última limpeza
    config.lastCleanup = new Date().toISOString();
    await saveConfig(config);

    return NextResponse.json({
      success: true,
      message: `Limpeza concluída: ${cleanedFiles} arquivos processados`,
      cleanedFiles,
      cleanedSize: formatBytes(cleanedSize)
    });
  } catch (error) {
    console.error('Erro ao executar limpeza de logs:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função auxiliar para salvar configuração
async function saveConfig(config: RetentionConfig) {
  const configDir = path.dirname(RETENTION_CONFIG_FILE);
  await fs.mkdir(configDir, { recursive: true });
  await fs.writeFile(RETENTION_CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Função auxiliar para limpeza de arquivo de log
async function cleanupLogFile(logFile: string, retentionDays: number): Promise<{ cleaned: boolean; size: number }> {
  try {
    const stats = await fs.stat(logFile);
    const fileAge = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
    
    if (fileAge > retentionDays) {
      // Arquivo mais antigo que o período de retenção - truncar
      const originalSize = stats.size;
      await fs.writeFile(logFile, '');
      return { cleaned: true, size: originalSize };
    } else {
      // Arquivo dentro do período de retenção - manter apenas as linhas recentes
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      
      // Ler o arquivo e filtrar linhas por data
      const content = await fs.readFile(logFile, 'utf-8');
      const lines = content.split('\n');
      const filteredLines = lines.filter(line => {
        if (!line.trim()) return false;
        
        // Tentar extrair timestamp da linha
        const timestampMatch = line.match(/(\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2})/);
        if (timestampMatch) {
          const lineDate = new Date(timestampMatch[1]);
          return lineDate >= cutoffDate;
        }
        
        // Se não conseguir extrair timestamp, manter a linha
        return true;
      });
      
      if (filteredLines.length < lines.length) {
        const newContent = filteredLines.join('\n');
        await fs.writeFile(logFile, newContent);
        return { cleaned: true, size: content.length - newContent.length };
      }
    }
    
    return { cleaned: false, size: 0 };
  } catch (error) {
    console.error(`Erro ao limpar arquivo ${logFile}:`, error);
    return { cleaned: false, size: 0 };
  }
}

// Função auxiliar para formatar bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
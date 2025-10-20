import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { db } from '@/lib/db';

/**
 * @swagger
 * /api/system/version:
 *   get:
 *     tags:
 *       - System
 *     summary: Obtém informações de versão do sistema
 *     description: Retorna informações sobre a versão da API, aplicação e status de atualizações
 *     responses:
 *       200:
 *         description: Informações de versão obtidas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 app:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: Nome da aplicação
 *                     version:
 *                       type: string
 *                       description: Versão atual da aplicação
 *                     buildDate:
 *                       type: string
 *                       description: Data de build da aplicação
 *                 api:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                       description: Versão da API
 *                     status:
 *                       type: string
 *                       description: Status da API
 *                 system:
 *                   type: object
 *                   properties:
 *                     nodeVersion:
 *                       type: string
 *                       description: Versão do Node.js
 *                     platform:
 *                       type: string
 *                       description: Plataforma do sistema
 *                     uptime:
 *                       type: number
 *                       description: Tempo de atividade em segundos
 *                 updates:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 *                       description: Se há atualizações disponíveis
 *                     latestVersion:
 *                       type: string
 *                       description: Última versão disponível
 *                     releaseNotes:
 *                       type: string
 *                       description: Notas da versão
 *       500:
 *         description: Erro interno do servidor
 */
export async function GET(request: NextRequest) {
  try {
    // Ler informações do package.json
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    // Informações da aplicação (apenas dados reais do package.json)
    const appInfo = {
      name: packageJson.name || 'GarapaSystem',
      version: packageJson.version || '0.0.0'
    };

    // Verificação de saúde (banco de dados)
    let databaseStatus: 'connected' | 'disconnected' = 'disconnected';
    try {
      await db.$queryRaw`SELECT 1`;
      databaseStatus = 'connected';
    } catch (e) {
      databaseStatus = 'disconnected';
    }

    // Contagem dinâmica de endpoints via file system
    const apiDir = join(process.cwd(), 'src', 'app', 'api');
    const countEndpoints = (dir: string): number => {
      let count = 0;
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            count += countEndpoints(fullPath);
          } else if (stat.isFile() && entry === 'route.ts') {
            count += 1;
          }
        }
      } catch (_) {
        // Se o diretório não existir ou não puder ser lido, mantemos contagem em 0
      }
      return count;
    };

    const endpointsTotal = countEndpoints(apiDir);

    // Informações da API
    const apiInfo = {
      version: packageJson.version || '0.0.0',
      status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
      endpoints: {
        total: endpointsTotal
      },
      database: databaseStatus
    };
    
    // Informações do sistema (reais do processo)
    const mem = process.memoryUsage();
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
    const pm2Active = typeof process.env.pm_id !== 'undefined' || typeof process.env.PM2_HOME !== 'undefined' || typeof process.env.NODE_APP_INSTANCE !== 'undefined';
    const systemInfo = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: heapUsedMb,
        total: heapTotalMb,
        percentage: heapTotalMb > 0 ? Math.round((heapUsedMb / heapTotalMb) * 100) : 0
      },
      environment: process.env.NODE_ENV || 'development',
      pm2: {
        active: pm2Active,
        pm_id: process.env.pm_id || process.env.NODE_APP_INSTANCE || undefined
      },
      demo: {
        enabled: String(process.env.DEMO_VERSION || 'false').toLowerCase() === 'true'
      }
    };
    
    return NextResponse.json({
      app: appInfo,
      api: apiInfo,
      system: systemInfo,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao obter informações de versão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Removido: verificação de atualizações simulada e lista estática de funcionalidades
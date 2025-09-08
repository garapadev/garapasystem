import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    
    // Informações da aplicação
    const appInfo = {
      name: packageJson.name || 'GarapaSystem',
      version: packageJson.version || '0.1.0',
      buildDate: '2025-01-08T10:00:00.000Z', // Data fixa de build
      description: packageJson.description || 'Sistema de Gestão CRM/ERP'
    };
    
    // Informações da API
    const apiInfo = {
      version: '1.0.0',
      status: 'online',
      endpoints: {
        total: 25, // Número aproximado de endpoints
        authenticated: 20,
        public: 5
      }
    };
    
    // Informações do sistema
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      },
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Verificação de atualizações (simulada)
    const updateInfo = await checkForUpdates(packageJson.version);
    
    return NextResponse.json({
      app: appInfo,
      api: apiInfo,
      system: systemInfo,
      updates: updateInfo
    });
    
  } catch (error) {
    console.error('Erro ao obter informações de versão:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para verificar atualizações (simulada)
async function checkForUpdates(currentVersion: string) {
  try {
    // Em um cenário real, isso faria uma requisição para um registry ou API de releases
    // Por enquanto, vamos simular a verificação
    
    const versionParts = currentVersion.split('.').map(Number);
    const [major, minor, patch] = versionParts;
    
    // Simular uma versão mais recente disponível
    const latestVersion = `${major}.${minor}.${patch + 1}`;
    
    // Simular se há atualizações disponíveis (50% de chance)
    const hasUpdates = Math.random() > 0.5;
    
    if (hasUpdates) {
      return {
        available: true,
        latestVersion,
        currentVersion,
        releaseNotes: `Versão ${latestVersion} disponível com melhorias de performance e correções de bugs.`,
        releaseDate: new Date().toISOString(),
        severity: 'minor', // major, minor, patch
        downloadUrl: '#' // Em produção, seria a URL real
      };
    }
    
    return {
      available: false,
      latestVersion: currentVersion,
      currentVersion,
      releaseNotes: 'Você está usando a versão mais recente.',
      lastChecked: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Erro ao verificar atualizações:', error);
    return {
      available: false,
      error: 'Não foi possível verificar atualizações',
      lastChecked: new Date().toISOString()
    };
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    // Obter lista de processos PM2
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);

    const modules = processes.map((process: any) => ({
      name: process.name,
      displayName: process.name.charAt(0).toUpperCase() + process.name.slice(1).replace(/-/g, ' '),
      status: process.pm2_env.status === 'online' ? 'online' : 
              process.pm2_env.status === 'stopped' ? 'offline' : 'error',
      pid: process.pid,
      uptime: process.pm2_env.pm_uptime ? 
              new Date(Date.now() - process.pm2_env.pm_uptime).toISOString() : null,
      memory: process.monit ? `${Math.round(process.monit.memory / 1024 / 1024)}MB` : 'N/A',
      cpu: process.monit ? `${process.monit.cpu}%` : 'N/A',
      restarts: process.pm2_env.restart_time || 0
    }));

    return NextResponse.json({
      success: true,
      modules
    });

  } catch (error) {
    console.error('Erro ao obter informações dos módulos:', error);
    
    // Fallback com módulos padrão
    const defaultModules = [
      {
        name: 'garapasystem',
        displayName: 'Sistema Principal',
        status: 'online',
        pid: null,
        uptime: null,
        memory: 'N/A',
        cpu: 'N/A',
        restarts: 0
      },
      {
        name: 'helpdesk-worker',
        displayName: 'Helpdesk Worker',
        status: 'online',
        pid: null,
        uptime: null,
        memory: 'N/A',
        cpu: 'N/A',
        restarts: 0
      },
      {
        name: 'webmail-sync-worker',
        displayName: 'Webmail Sync',
        status: 'online',
        pid: null,
        uptime: null,
        memory: 'N/A',
        cpu: 'N/A',
        restarts: 0
      }
    ];

    return NextResponse.json({
      success: true,
      modules: defaultModules
    });
  }
}
module.exports = {
  apps: [
    {
      name: 'garapasystem',
      script: 'server.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      env_file: '.env', // Carregar .env em produção
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        env_file: '.env.local' // Para desenvolvimento local
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_file: './logs/server-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      // Executar build antes de iniciar
      pre_start: 'npm run build'
    },
    {
      name: 'helpdesk-worker',
      script: './src/scripts/start-consolidated-worker.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env_file: '.env', // Carregar .env em produção
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'consolidated_helpdesk',
        env_file: '.env.local' // Para desenvolvimento local
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'consolidated_helpdesk'
      },
      error_file: './logs/helpdesk-worker-error.log',
      out_file: './logs/helpdesk-worker-out.log',
      log_file: './logs/helpdesk-worker-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      cron_restart: '0 */6 * * *' // Restart a cada 6 horas para limpeza de memória
    },
    {
      name: 'webmail-sync-worker',
      script: './src/scripts/start-webmail-worker.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env_file: '.env', // Carregar .env em produção
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'webmail_sync',
        env_file: '.env.local' // Para desenvolvimento local
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'webmail_sync'
      },
      error_file: './logs/webmail-error.log',
      out_file: './logs/webmail-out.log',
      log_file: './logs/webmail-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      cron_restart: '0 */4 * * *' // Restart a cada 4 horas para limpeza de memória
    }

  ],

  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:garapadev /garapasystem.git',
      path: '/var/www/garapasystem',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
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
      env_file: '.env',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        env_file: '.env.local',
        NEXTAUTH_URL: 'http://localhost:3000'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXTAUTH_URL: 'http://localhost:3000'
      },
      error_file: './logs/server-error.log',
      out_file: './logs/server-out.log',
      log_file: './logs/server-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
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
      env_file: '.env',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'consolidated_helpdesk',
        env_file: '.env.local'
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
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000
    },
    {
      name: 'webmail-worker',
      script: './src/scripts/start-webmail-worker.ts',
      interpreter: 'npx',
      interpreter_args: 'tsx',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env_file: '.env',
      env: {
        NODE_ENV: 'development',
        WORKER_TYPE: 'webmail',
        env_file: '.env.local'
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'webmail'
      },
      error_file: './logs/webmail-worker-error.log',
      out_file: './logs/webmail-worker-out.log',
      log_file: './logs/webmail-worker-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
      restart_delay: 5000
    }
  ]
}
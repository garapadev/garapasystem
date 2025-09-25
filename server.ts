// server.ts - Next.js Standalone + Socket.IO
// Inicializar telemetria ANTES de qualquer outra importação
import './telemetry';

import { setupSocket, setSocketIO } from '@/lib/socket';
import { createServer } from 'http';
import { Server } from 'socket.io';
import next from 'next';
import { initializeAutoSync } from './src/lib/email/auto-sync-initializer';
import { createSpan, getTracer, createMetrics, withSpan } from '@/lib/telemetry';

const dev = process.env.NODE_ENV !== 'production';
const currentPort = parseInt(process.env.PORT || '3000', 10);
const hostname = '0.0.0.0';

// Inicializar métricas
const metrics = createMetrics();

// Custom server with Socket.IO integration
async function createCustomServer() {
  try {
    // Create Next.js app
    const nextApp = next({ 
      dev,
      dir: process.cwd(),
      // In production, use the current directory where .next is located
      conf: dev ? undefined : { distDir: './.next' }
    });

    await nextApp.prepare();
    const handle = nextApp.getRequestHandler();

    // Create HTTP server that will handle both Next.js and Socket.IO
    const server = createServer({
      // Increase limits to prevent 431 errors
      maxHeaderSize: 32768, // 32KB instead of default 8KB
      headersTimeout: 60000,
      requestTimeout: 60000
    }, (req, res) => {
      const startTime = Date.now();
      
      // Instrumentação HTTP
      const span = createSpan('http-server', 'http.request', {
        'http.method': req.method || 'UNKNOWN',
        'http.url': req.url || '',
        'http.user_agent': req.headers['user-agent'] || '',
        'http.remote_addr': req.socket.remoteAddress || ''
      });

      // Interceptar o final da resposta para métricas
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        const duration = Date.now() - startTime;
        const statusCode = res.statusCode;
        
        // Registrar métricas
        metrics.recordHttpRequest(
          req.method || 'UNKNOWN',
          req.url || '',
          statusCode,
          duration
        );
        
        // Atualizar span
        span.setAttributes({
          'http.status_code': statusCode,
          'http.response_time_ms': duration
        });
        
        if (statusCode >= 400) {
          span.setStatus({ 
            code: 2, // ERROR
            message: `HTTP ${statusCode}` 
          });
          
          if (statusCode >= 500) {
            metrics.recordError('http_error', `HTTP ${statusCode} - ${req.url}`);
          }
        } else {
          span.setStatus({ code: 1 }); // OK
        }
        
        span.end();
        return originalEnd.apply(this, args);
      };
      
      // Skip socket.io requests from Next.js handler
      if (req.url?.startsWith('/api/socketio')) {
        // Let Socket.IO handle these requests
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: 'Socket.IO endpoint - use WebSocket connection',
          message: 'This endpoint is reserved for Socket.IO WebSocket connections.'
        }));
        return;
      }
      handle(req, res);
    });

    // Additional server configurations
    server.maxHeadersCount = 0; // No limit on header count
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;

    // Setup Socket.IO
    const io = new Server(server, {
      path: '/api/socketio',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    setSocketIO(io);
    setupSocket(io);

    // Start the server
    server.listen(currentPort, hostname, async () => {
      console.log(`> Ready on http://${hostname}:${currentPort}`);
      console.log(`> Socket.IO server running at ws://${hostname}:${currentPort}/api/socketio`);
      
      // Telemetria já inicializada via telemetry.js
      // Criar span para startup do servidor usando o sistema já inicializado
      try {
        const span = createSpan('server-startup', 'server.started', {
          'server.port': currentPort,
          'server.hostname': hostname,
          'server.environment': dev ? 'development' : 'production'
        });
        span.end();
        console.log('✅ Telemetria já inicializada via telemetry.js');
      } catch (error) {
        console.log('ℹ️ Telemetria não disponível para spans customizados, mas sistema base está funcionando');
      }
      
      // Inicializar sincronização automática de e-mail após o servidor estar pronto
      try {
        console.log('Inicializando sincronização automática de e-mail...');
        await withSpan('email-sync', 'email.auto_sync.initialize', async () => {
          await initializeAutoSync();
        });
        console.log('Sincronização automática de e-mail inicializada com sucesso');
      } catch (error) {
        console.error('Erro ao inicializar sincronização automática:', error);
        metrics.recordError('email_sync_init', error instanceof Error ? error.message : 'Unknown error');
        // Não parar o servidor por causa disso
      }
    });

  } catch (err) {
    console.error('Server startup error:', err);
    process.exit(1);
  }
}

// Start the server
createCustomServer();

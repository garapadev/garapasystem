// api-instrumentation.ts - Instrumentação automática para rotas da API
import { NextRequest, NextResponse } from 'next/server';
import { createSpan, createMetrics, withSpan } from '@/lib/telemetry';
import { extractTelemetryContext } from './telemetry-middleware';

// Inicializar métricas globais
const metrics = createMetrics();

// Tipos para handlers da API
type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;
type ApiHandlers = {
  GET?: ApiHandler;
  POST?: ApiHandler;
  PUT?: ApiHandler;
  PATCH?: ApiHandler;
  DELETE?: ApiHandler;
  HEAD?: ApiHandler;
  OPTIONS?: ApiHandler;
};

// Wrapper para instrumentação automática de rotas da API
export function instrumentApiRoute(handlers: ApiHandlers, routeName?: string) {
  const instrumentedHandlers: ApiHandlers = {};

  Object.entries(handlers).forEach(([method, handler]) => {
    if (handler) {
      instrumentedHandlers[method as keyof ApiHandlers] = async (req: NextRequest, context?: any) => {
        const startTime = Date.now();
        const pathname = new URL(req.url).pathname;
        const route = routeName || pathname;
        
        // Extrair contexto de telemetria do middleware
        const telemetryContext = extractTelemetryContext(req);
        
        // Criar span manualmente para ter acesso ao objeto span
        const span = createSpan(
          `api-${method.toLowerCase()}`,
          'http.api',
          {
            'http.method': method,
            'http.route': route,
            'http.url': pathname,
            'http.user_agent': req.headers.get('user-agent') || '',
            'http.content_type': req.headers.get('content-type') || '',
            'http.content_length': req.headers.get('content-length') || '0',
            'api.route_name': route,
            'api.handler_method': method
          }
        );

        // Adicionar contexto de trace se disponível
        if (telemetryContext.traceId) {
          span.setAttributes({
            'parent.trace_id': telemetryContext.traceId,
            'parent.span_id': telemetryContext.spanId
          });
        }

        let response: NextResponse;
        let error: Error | null = null;

        try {
              // Executar o handler original
              response = await handler(req, context);
              
              // Registrar métricas de sucesso
              const duration = Date.now() - startTime;
              metrics.recordHttpRequest(method, route, response.status, duration);
              
              // Adicionar atributos de resposta
              span.setAttributes({
                'http.status_code': response.status,
                'http.response_time_ms': duration,
                'http.response_size': response.headers.get('content-length') || '0',
                'http.response_content_type': response.headers.get('content-type') || ''
              });

              // Definir status do span
              if (response.status >= 400) {
                span.setStatus({ 
                  code: 2, // ERROR
                  message: `HTTP ${response.status}` 
                });
                
                if (response.status >= 500) {
                  metrics.recordError('api_error', `${method} ${route} - HTTP ${response.status}`);
                }
              } else {
                span.setStatus({ code: 1 }); // OK
              }

              // Adicionar headers de telemetria
              response.headers.set('X-Trace-Id', span.spanContext().traceId);
              response.headers.set('X-Span-Id', span.spanContext().spanId);
              response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

              return response;

            } catch (err) {
              error = err as Error;
              const duration = Date.now() - startTime;
              
              // Registrar erro
              metrics.recordError('api_exception', `${method} ${route} - ${error.message}`);
              
              // Atualizar span com erro
              span.setStatus({ 
                code: 2, // ERROR
                message: error.message 
              });
              
              span.setAttributes({
                'error': true,
                'error.name': error.name,
                'error.message': error.message,
                'error.stack': error.stack || '',
                'http.response_time_ms': duration
              });

              // Retornar resposta de erro
              response = NextResponse.json(
                { 
                  error: 'Internal Server Error',
                  message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred',
                  traceId: span.spanContext().traceId
                },
                { status: 500 }
              );

              response.headers.set('X-Trace-Id', span.spanContext().traceId);
              response.headers.set('X-Span-Id', span.spanContext().spanId);
              response.headers.set('X-Response-Time', `${duration}ms`);

              return response;
            } finally {
              span.end();
            }
          };
        }
      });

  return instrumentedHandlers;
}

// Wrapper simplificado para uma única função handler
export function instrumentApiHandler(handler: ApiHandler, method: string, routeName?: string) {
  return instrumentApiRoute({ [method]: handler }, routeName)[method as keyof ApiHandlers]!;
}

// Decorator para instrumentação de funções específicas
export function instrumentFunction<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string,
  operationType: string = 'function'
): T {
  return ((...args: any[]) => {
    return withSpan(
      operationName, 
      operationType, 
      async () => {
        const startTime = Date.now();
        
        try {
          const result = await fn(...args);
          
          // Registrar métricas de sucesso
          metrics.recordMetric('function_duration', Date.now() - startTime, {
            'function.name': fn.name || operationName,
            'function.success': 'true'
          });
          
          return result;
          
        } catch (error) {
          const err = error as Error;
          
          // Registrar erro
          metrics.recordError('function_error', `${operationName} - ${err.message}`);
          
          throw error;
        }
      },
      {
        'function.name': fn.name || operationName,
        'operation.type': operationType
      }
    );
  }) as T;
}

// Instrumentação para operações de banco de dados
export function instrumentDatabaseOperation<T extends (...args: any[]) => any>(
  fn: T,
  operation: string,
  table?: string
): T {
  return instrumentFunction(fn, `db.${operation}`, 'db.operation') as T;
}

// Instrumentação para operações de email
export function instrumentEmailOperation<T extends (...args: any[]) => any>(
  fn: T,
  operation: string
): T {
  return instrumentFunction(fn, `email.${operation}`, 'email.operation') as T;
}
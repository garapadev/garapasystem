import { NextRequest, NextResponse } from 'next/server';
import { createSpan, createMetrics, getTelemetryConfig } from './index';
import { SpanStatusCode } from '@opentelemetry/api';

// Middleware para instrumentação automática
export function telemetryMiddleware() {
  const metrics = createMetrics();
  const config = getTelemetryConfig();

  return async function middleware(request: NextRequest) {
    const startTime = Date.now();
    const method = request.method;
    const url = request.url;
    const pathname = new URL(url).pathname;

    // Filtrar URLs que não devem ser instrumentadas
    if (config.dataFiltering.excludeUrls.some(excludeUrl => pathname.includes(excludeUrl))) {
      return NextResponse.next();
    }

    // Criar span para a requisição
    const span = createSpan('http-middleware', `${method} ${pathname}`, {
      'http.method': method,
      'http.url': url,
      'http.route': pathname,
      'http.user_agent': request.headers.get('user-agent') || 'unknown'
    });

    try {
      // Processar requisição
      const response = NextResponse.next();
      
      // Calcular duração
      const duration = Date.now() - startTime;
      const statusCode = response.status;

      // Registrar métricas
      metrics.recordHttpRequest(method, pathname, statusCode, duration);

      // Atualizar span com informações de resposta
      span.setAttributes({
        'http.status_code': statusCode,
        'http.response_size': response.headers.get('content-length') || 0,
        'http.duration_ms': duration
      });

      // Definir status do span baseado no código de resposta
      if (statusCode >= 400) {
        span.setStatus({ 
          code: SpanStatusCode.ERROR, 
          message: `HTTP ${statusCode}` 
        });
        
        // Registrar erro se for 5xx
        if (statusCode >= 500) {
          metrics.recordError('http_error', `HTTP ${statusCode} on ${pathname}`);
        }
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Registrar erro
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
      span.recordException(error as Error);
      
      metrics.recordError('middleware_error', error instanceof Error ? error.message : 'Unknown error');
      metrics.recordHttpRequest(method, pathname, 500, duration);

      throw error;
    } finally {
      span.end();
    }
  };
}

// Wrapper para API routes
export function withTelemetry<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const span = createSpan('api-handler', operationName);
    const startTime = Date.now();

    try {
      const result = await handler(...args);
      
      span.setAttributes({
        'operation.duration_ms': Date.now() - startTime,
        'operation.success': true
      });
      span.setStatus({ code: SpanStatusCode.OK });
      
      return result;
    } catch (error) {
      span.setAttributes({
        'operation.duration_ms': Date.now() - startTime,
        'operation.success': false,
        'error.name': error instanceof Error ? error.name : 'Unknown',
        'error.message': error instanceof Error ? error.message : 'Unknown error'
      });
      
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
      span.recordException(error as Error);
      
      const metrics = createMetrics();
      metrics.recordError('api_handler_error', error instanceof Error ? error.message : 'Unknown error');
      
      throw error;
    } finally {
      span.end();
    }
  };
}

// Decorator para instrumentação de funções
export function traced(operationName?: string) {
  return function <T extends any[], R>(
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<(...args: T) => Promise<R>>
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return;

    descriptor.value = async function (...args: T): Promise<R> {
      const span = createSpan('method-trace', operationName || `${target.constructor.name}.${propertyKey}`);
      const startTime = Date.now();

      try {
        const result = await originalMethod.apply(this, args);
        
        span.setAttributes({
          'method.duration_ms': Date.now() - startTime,
          'method.success': true
        });
        span.setStatus({ code: SpanStatusCode.OK });
        
        return result;
      } catch (error) {
        span.setAttributes({
          'method.duration_ms': Date.now() - startTime,
          'method.success': false
        });
        
        span.setStatus({ 
          code: SpanStatusCode.ERROR, 
          message: error instanceof Error ? error.message : 'Unknown error' 
        });
        span.recordException(error as Error);
        
        throw error;
      } finally {
        span.end();
      }
    };
  };
}

// Função para instrumentar operações de banco de dados
export async function traceDatabase<T>(
  operation: string,
  query: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = createSpan('database', operation, {
    'db.statement': query,
    'db.type': 'postgresql'
  });
  
  const startTime = Date.now();

  try {
    const result = await fn();
    
    span.setAttributes({
      'db.duration_ms': Date.now() - startTime,
      'db.success': true
    });
    span.setStatus({ code: SpanStatusCode.OK });
    
    return result;
  } catch (error) {
    span.setAttributes({
      'db.duration_ms': Date.now() - startTime,
      'db.success': false
    });
    
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error instanceof Error ? error.message : 'Database error' 
    });
    span.recordException(error as Error);
    
    const metrics = createMetrics();
    metrics.recordError('database_error', error instanceof Error ? error.message : 'Database error');
    
    throw error;
  } finally {
    span.end();
  }
}

// Função para instrumentar operações de email
export async function traceEmail<T>(
  operation: string,
  recipient: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = createSpan('email', operation, {
    'email.operation': operation,
    'email.recipient_domain': recipient.split('@')[1] || 'unknown'
  });
  
  const startTime = Date.now();

  try {
    const result = await fn();
    
    span.setAttributes({
      'email.duration_ms': Date.now() - startTime,
      'email.success': true
    });
    span.setStatus({ code: SpanStatusCode.OK });
    
    return result;
  } catch (error) {
    span.setAttributes({
      'email.duration_ms': Date.now() - startTime,
      'email.success': false
    });
    
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error instanceof Error ? error.message : 'Email error' 
    });
    span.recordException(error as Error);
    
    const metrics = createMetrics();
    metrics.recordError('email_error', error instanceof Error ? error.message : 'Email error');
    
    throw error;
  } finally {
    span.end();
  }
}
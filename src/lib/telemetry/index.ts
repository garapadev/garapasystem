import { initializeTelemetry, getTelemetryConfig, validateTelemetryConfig } from './config';
import { trace, metrics, context, SpanStatusCode } from '@opentelemetry/api';
import type { NodeSDK } from '@opentelemetry/sdk-node';

let telemetrySDK: NodeSDK | null = null;
let isInitialized = false;

// Função para inicializar a telemetria
export async function startTelemetry(): Promise<boolean> {
  try {
    if (isInitialized) {
      console.log('Telemetria já inicializada');
      return true;
    }

    const config = getTelemetryConfig();
    
    // Validar configuração
    if (!validateTelemetryConfig(config)) {
      console.error('Configuração de telemetria inválida');
      return false;
    }

    // Inicializar SDK
    telemetrySDK = initializeTelemetry();
    await telemetrySDK.start();

    isInitialized = true;
    console.log(`Telemetria inicializada para empresa: ${config.companyId}, instância: ${config.instanceId}`);
    
    // Criar span inicial para marcar o início da aplicação
    const tracer = trace.getTracer('garapasystem-startup');
    const span = tracer.startSpan('application.startup');
    span.setAttributes({
      'company.id': config.companyId,
      'instance.id': config.instanceId,
      'service.version': config.serviceVersion,
      'startup.timestamp': Date.now()
    });
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    return true;
  } catch (error) {
    console.error('Erro ao inicializar telemetria:', error);
    return false;
  }
}

// Função para parar a telemetria
export async function stopTelemetry(): Promise<void> {
  if (telemetrySDK && isInitialized) {
    try {
      await telemetrySDK.shutdown();
      isInitialized = false;
      console.log('Telemetria finalizada');
    } catch (error) {
      console.error('Erro ao finalizar telemetria:', error);
    }
  }
}

// Função para obter o tracer
export function getTracer(name: string = 'garapasystem') {
  return trace.getTracer(name);
}

// Função para obter o meter
export function getMeter(name: string = 'garapasystem') {
  return metrics.getMeter(name);
}

// Função para criar span customizado
export function createSpan(
  tracerName: string,
  spanName: string,
  attributes: Record<string, string | number | boolean> = {}
) {
  const tracer = getTracer(tracerName);
  const config = getTelemetryConfig();
  
  const span = tracer.startSpan(spanName);
  span.setAttributes({
    'company.id': config.companyId,
    'instance.id': config.instanceId,
    'service.version': config.serviceVersion,
    ...attributes
  });
  
  return span;
}

// Função para executar código com span
export async function withSpan<T>(
  tracerName: string,
  spanName: string,
  fn: () => Promise<T>,
  attributes: Record<string, string | number | boolean> = {}
): Promise<T> {
  const span = createSpan(tracerName, spanName, attributes);
  
  try {
    const result = await context.with(trace.setSpan(context.active(), span), fn);
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({ 
      code: SpanStatusCode.ERROR, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}

// Função para criar métricas customizadas
export function createMetrics() {
  const meter = getMeter();
  const config = getTelemetryConfig();
  
  // Contador de requisições HTTP
  const httpRequestsCounter = meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests'
  });
  
  // Histograma de duração de requisições
  const httpRequestDuration = meter.createHistogram('http_request_duration_ms', {
    description: 'HTTP request duration in milliseconds'
  });
  
  // Gauge para conexões ativas
  const activeConnections = meter.createUpDownCounter('active_connections', {
    description: 'Number of active connections'
  });
  
  // Contador de erros
  const errorsCounter = meter.createCounter('errors_total', {
    description: 'Total number of errors'
  });
  
  return {
    httpRequestsCounter,
    httpRequestDuration,
    activeConnections,
    errorsCounter,
    // Função helper para incrementar requisições HTTP
    recordHttpRequest: (method: string, route: string, statusCode: number, duration: number) => {
      const labels = {
        'company.id': config.companyId,
        'instance.id': config.instanceId,
        'http.method': method,
        'http.route': route,
        'http.status_code': statusCode.toString()
      };
      
      httpRequestsCounter.add(1, labels);
      httpRequestDuration.record(duration, labels);
    },
    
    // Função helper para registrar erros
    recordError: (errorType: string, errorMessage: string) => {
      errorsCounter.add(1, {
        'company.id': config.companyId,
        'instance.id': config.instanceId,
        'error.type': errorType,
        'error.message': errorMessage
      });
    }
  };
}

// Status da telemetria
export function getTelemetryStatus() {
  return {
    initialized: isInitialized,
    config: getTelemetryConfig()
  };
}

// Exportar configuração
export { getTelemetryConfig, validateTelemetryConfig } from './config';
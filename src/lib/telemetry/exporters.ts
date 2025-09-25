// exporters.ts - Configuração de exportadores personalizados
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION, SEMRESATTRS_SERVICE_NAMESPACE, SEMRESATTRS_SERVICE_INSTANCE_ID, SEMRESATTRS_DEPLOYMENT_ENVIRONMENT } from '@opentelemetry/semantic-conventions';

// Configuração base do resource
export function createTelemetryResource() {
  return resourceFromAttributes({
    [SEMRESATTRS_SERVICE_NAME]: process.env.TELEMETRY_SERVICE_NAME || 'garapasystem',
    [SEMRESATTRS_SERVICE_VERSION]: process.env.TELEMETRY_SERVICE_VERSION || '1.0.0',
    [SEMRESATTRS_SERVICE_NAMESPACE]: process.env.TELEMETRY_SERVICE_NAMESPACE || 'production',
    [SEMRESATTRS_SERVICE_INSTANCE_ID]: process.env.TELEMETRY_INSTANCE_ID || 'instance-1',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    
    // Atributos customizados
    'company.id': process.env.TELEMETRY_COMPANY_ID || 'default',
    'region': process.env.TELEMETRY_REGION || 'us-east-1',
    'cluster': process.env.TELEMETRY_CLUSTER || 'main',
    'node.id': process.env.HOSTNAME || 'localhost',
    'application.type': 'web-api',
    'framework': 'nextjs',
    'runtime': 'nodejs'
  });
}

// Configuração do exportador OTLP para traces
export function createOTLPTraceExporter() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 
                   process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 
                   'http://localhost:4318/v1/traces';
  
  return new OTLPTraceExporter({
    url: endpoint,
    headers: {
      'Authorization': process.env.OTEL_EXPORTER_OTLP_HEADERS_AUTHORIZATION || '',
      'X-API-Key': process.env.OTEL_EXPORTER_OTLP_API_KEY || ''
    },
    timeoutMillis: parseInt(process.env.OTEL_EXPORTER_OTLP_TIMEOUT || '10000')
  });
}

// Configuração do exportador OTLP para métricas
export function createOTLPMetricExporter() {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 
                   process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 
                   'http://localhost:4318/v1/metrics';
  
  return new OTLPMetricExporter({
    url: endpoint,
    headers: {
      'Authorization': process.env.OTEL_EXPORTER_OTLP_HEADERS_AUTHORIZATION || '',
      'X-API-Key': process.env.OTEL_EXPORTER_OTLP_API_KEY || ''
    },
    timeoutMillis: parseInt(process.env.OTEL_EXPORTER_OTLP_TIMEOUT || '10000')
  });
}

// Configuração do exportador Prometheus
export function createPrometheusExporter() {
  const port = parseInt(process.env.PROMETHEUS_EXPORTER_PORT || '9464');
  const endpoint = process.env.PROMETHEUS_EXPORTER_ENDPOINT || '/metrics';
  
  return new PrometheusExporter({
    port,
    endpoint,
    preventServerStart: process.env.PROMETHEUS_PREVENT_SERVER_START === 'true'
  });
}

// Configuração do exportador Jaeger
export function createJaegerExporter() {
  const endpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
  
  return new JaegerExporter({
    endpoint,
    username: process.env.JAEGER_USERNAME,
    password: process.env.JAEGER_PASSWORD
  });
}

// Configuração do exportador Console (para desenvolvimento)
export function createConsoleExporters() {
  return {
    traceExporter: new ConsoleSpanExporter(),
    metricExporter: new ConsoleMetricExporter()
  };
}

// Factory para criar exportadores baseado no ambiente
export function createExporters() {
  const environment = process.env.NODE_ENV || 'development';
  const enabledExporters = (process.env.OTEL_ENABLED_EXPORTERS || 'console,otlp').split(',');
  
  const exporters = {
    traces: [] as any[],
    metrics: [] as any[]
  };

  // Console exporters (sempre habilitado em desenvolvimento)
  if (environment === 'development' || enabledExporters.includes('console')) {
    const consoleExporters = createConsoleExporters();
    exporters.traces.push(consoleExporters.traceExporter);
    exporters.metrics.push(consoleExporters.metricExporter);
  }

  // OTLP exporters
  if (enabledExporters.includes('otlp')) {
    exporters.traces.push(createOTLPTraceExporter());
    exporters.metrics.push(createOTLPMetricExporter());
  }

  // Prometheus exporter
  if (enabledExporters.includes('prometheus')) {
    exporters.metrics.push(createPrometheusExporter());
  }

  // Jaeger exporter
  if (enabledExporters.includes('jaeger')) {
    exporters.traces.push(createJaegerExporter());
  }

  return exporters;
}

// Configuração de batching para exportadores
export function getBatchConfig() {
  return {
    // Configuração para trace batching
    trace: {
      maxExportBatchSize: parseInt(process.env.OTEL_BSP_MAX_EXPORT_BATCH_SIZE || '512'),
      exportTimeoutMillis: parseInt(process.env.OTEL_BSP_EXPORT_TIMEOUT || '30000'),
      scheduledDelayMillis: parseInt(process.env.OTEL_BSP_SCHEDULE_DELAY || '5000'),
      maxQueueSize: parseInt(process.env.OTEL_BSP_MAX_QUEUE_SIZE || '2048')
    },
    
    // Configuração para metric batching
    metric: {
      exportIntervalMillis: parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || '60000'),
      exportTimeoutMillis: parseInt(process.env.OTEL_METRIC_EXPORT_TIMEOUT || '30000')
    }
  };
}

// Configuração de sampling
export function getSamplingConfig() {
  const samplingRate = parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1.0');
  const samplerType = process.env.OTEL_TRACES_SAMPLER || 'always_on';
  
  return {
    type: samplerType,
    rate: samplingRate,
    // Configurações específicas para diferentes tipos de sampling
    parentBased: process.env.OTEL_TRACES_SAMPLER_PARENT_BASED === 'true',
    remoteUrl: process.env.OTEL_TRACES_SAMPLER_REMOTE_URL,
    rules: {
      // Sempre fazer sample de erros
      alwaysSampleErrors: true,
      // Fazer sample reduzido de health checks
      healthCheckSamplingRate: 0.1,
      // Fazer sample completo de operações críticas
      criticalOperationsSamplingRate: 1.0
    }
  };
}

// Configuração de filtros
export function getFilterConfig() {
  return {
    // Filtros para traces
    traces: {
      // Ignorar health checks frequentes
      ignoreHealthChecks: process.env.TELEMETRY_IGNORE_HEALTH_CHECKS === 'true',
      // Ignorar assets estáticos
      ignoreStaticAssets: process.env.TELEMETRY_IGNORE_STATIC_ASSETS === 'true',
      // Filtros customizados por URL
      urlFilters: (process.env.TELEMETRY_URL_FILTERS || '').split(',').filter(Boolean),
      // Filtros por user agent
      userAgentFilters: (process.env.TELEMETRY_USER_AGENT_FILTERS || 'bot,crawler,spider').split(',')
    },
    
    // Filtros para métricas
    metrics: {
      // Filtros por nome da métrica
      nameFilters: (process.env.TELEMETRY_METRIC_FILTERS || '').split(',').filter(Boolean),
      // Limite de cardinalidade
      cardinalityLimit: parseInt(process.env.TELEMETRY_CARDINALITY_LIMIT || '10000')
    },
    
    // Filtros para logs
    logs: {
      // Nível mínimo de log
      minLevel: process.env.TELEMETRY_LOG_LEVEL || 'info',
      // Filtros por origem
      sourceFilters: (process.env.TELEMETRY_LOG_SOURCE_FILTERS || '').split(',').filter(Boolean)
    }
  };
}

// Configuração de retenção
export function getRetentionConfig() {
  return {
    traces: {
      // Retenção padrão para traces
      defaultRetentionDays: parseInt(process.env.TELEMETRY_TRACES_RETENTION_DAYS || '7'),
      // Retenção estendida para traces com erro
      errorRetentionDays: parseInt(process.env.TELEMETRY_ERROR_TRACES_RETENTION_DAYS || '30'),
      // Retenção para traces críticos
      criticalRetentionDays: parseInt(process.env.TELEMETRY_CRITICAL_TRACES_RETENTION_DAYS || '90')
    },
    
    metrics: {
      // Retenção para métricas de alta resolução
      highResRetentionDays: parseInt(process.env.TELEMETRY_METRICS_HIGH_RES_RETENTION_DAYS || '1'),
      // Retenção para métricas de baixa resolução
      lowResRetentionDays: parseInt(process.env.TELEMETRY_METRICS_LOW_RES_RETENTION_DAYS || '30'),
      // Retenção para métricas agregadas
      aggregatedRetentionDays: parseInt(process.env.TELEMETRY_METRICS_AGGREGATED_RETENTION_DAYS || '365')
    },
    
    logs: {
      // Retenção padrão para logs
      defaultRetentionDays: parseInt(process.env.TELEMETRY_LOGS_RETENTION_DAYS || '30'),
      // Retenção para logs de erro
      errorRetentionDays: parseInt(process.env.TELEMETRY_ERROR_LOGS_RETENTION_DAYS || '90'),
      // Retenção para logs de auditoria
      auditRetentionDays: parseInt(process.env.TELEMETRY_AUDIT_LOGS_RETENTION_DAYS || '2555') // 7 anos
    }
  };
}
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import type { IncomingMessage, ServerResponse } from 'http';

// Importar novas funcionalidades
import { 
  createExporters, 
  createTelemetryResource, 
  getBatchConfig, 
  getSamplingConfig,
  getFilterConfig,
  getRetentionConfig
} from './exporters';
import { 
  getTLSConfig, 
  getRateLimitConfig, 
  getAuditConfig, 
  getComplianceConfig,
  securitySpanProcessor,
  hasUserConsent,
  maskSensitiveData
} from './security';

// Configurações de telemetria baseadas em variáveis de ambiente
export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  companyId: string;
  instanceId: string;
  environment: string;
  collectorEndpoint: string;
  enabledExporters: string[];
  dataFiltering: {
    excludeUrls: string[];
    excludeHeaders: string[];
    sensitiveFields: string[];
  };
  retention: {
    traces: number; // dias
    metrics: number; // dias
    logs: number; // dias
  };
  // Novas configurações de segurança
  security: {
    tls: {
      enabled: boolean;
      cert?: string;
      key?: string;
      ca?: string;
    };
    maskPII: boolean;
    auditEnabled: boolean;
    rateLimit: {
      enabled: boolean;
      maxRequestsPerMinute: number;
    };
  };
  // Configurações de compliance
  compliance: {
    gdpr: boolean;
    ccpa: boolean;
    consentRequired: boolean;
    dataRetentionDays: number;
  };
  // Configurações de performance
  performance: {
    batchSize: number;
    exportInterval: number;
    maxQueueSize: number;
    sampling: {
      type: string;
      rate: number;
    };
  };
}

// Configuração padrão
const defaultConfig: TelemetryConfig = {
  serviceName: process.env.OTEL_SERVICE_NAME || 'garapasystem',
  serviceVersion: process.env.OTEL_SERVICE_VERSION || '0.1.35',
  companyId: process.env.COMPANY_ID || 'default',
  instanceId: process.env.INSTANCE_ID || 'local',
  environment: process.env.NODE_ENV || 'development',
  collectorEndpoint: process.env.OTEL_COLLECTOR_ENDPOINT || 'http://app.garapasystem.com:4318',
  enabledExporters: (process.env.OTEL_ENABLED_EXPORTERS || 'otlp,prometheus').split(','),
  dataFiltering: {
    excludeUrls: [
      '/health',
      '/api/health',
      '/favicon.ico',
      '/_next/static',
      '/api/socketio'
    ],
    excludeHeaders: [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token'
    ],
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential'
    ]
  },
  retention: {
    traces: parseInt(process.env.OTEL_TRACES_RETENTION_DAYS || '7'),
    metrics: parseInt(process.env.OTEL_METRICS_RETENTION_DAYS || '30'),
    logs: parseInt(process.env.OTEL_LOGS_RETENTION_DAYS || '7')
  },
  // Novas configurações de segurança
  security: {
    tls: {
      enabled: process.env.TELEMETRY_TLS_ENABLED === 'true',
      cert: process.env.TELEMETRY_TLS_CERT_PATH,
      key: process.env.TELEMETRY_TLS_KEY_PATH,
      ca: process.env.TELEMETRY_TLS_CA_PATH
    },
    maskPII: process.env.TELEMETRY_MASK_PII === 'true' || process.env.NODE_ENV === 'production',
    auditEnabled: process.env.TELEMETRY_AUDIT_ENABLED === 'true',
    rateLimit: {
      enabled: process.env.TELEMETRY_RATE_LIMIT_ENABLED === 'true',
      maxRequestsPerMinute: parseInt(process.env.TELEMETRY_RATE_LIMIT_PER_MINUTE || '1000')
    }
  },
  // Configurações de compliance
  compliance: {
    gdpr: process.env.TELEMETRY_GDPR_ENABLED === 'true',
    ccpa: process.env.TELEMETRY_CCPA_ENABLED === 'true',
    consentRequired: process.env.TELEMETRY_CONSENT_REQUIRED === 'true',
    dataRetentionDays: parseInt(process.env.TELEMETRY_DATA_RETENTION_DAYS || '90')
  },
  // Configurações de performance
  performance: {
    batchSize: parseInt(process.env.OTEL_BSP_MAX_EXPORT_BATCH_SIZE || '512'),
    exportInterval: parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || '60000'),
    maxQueueSize: parseInt(process.env.OTEL_BSP_MAX_QUEUE_SIZE || '2048'),
    sampling: {
      type: process.env.OTEL_TRACES_SAMPLER || 'always_on',
      rate: parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1.0')
    }
  }
};

// Função para criar resource com labels personalizados
function createResource(config: TelemetryConfig) {
  return Resource.default().merge(new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: config.instanceId,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
    // Labels customizados para rastreamento
    'company.id': config.companyId,
    'instance.id': config.instanceId,
    'system.version': config.serviceVersion,
    'deployment.type': 'self-hosted',
    'telemetry.sdk.name': 'opentelemetry',
    'telemetry.sdk.language': 'nodejs',
    'telemetry.sdk.version': '1.0.0'
  }));
}

// Função para criar exportadores baseados na configuração
function createExporters(config: TelemetryConfig) {
  const exporters: any = {
    traces: [],
    metrics: []
  };

  // OTLP Exporter (para coletor centralizado)
  if (config.enabledExporters.includes('otlp')) {
    const otlpTraceExporter = new OTLPTraceExporter({
      url: `${config.collectorEndpoint}/v1/traces`,
      headers: {
        'x-company-id': config.companyId,
        'x-instance-id': config.instanceId,
        'x-service-version': config.serviceVersion
      }
    });

    const otlpMetricExporter = new OTLPMetricExporter({
      url: `${config.collectorEndpoint}/v1/metrics`,
      headers: {
        'x-company-id': config.companyId,
        'x-instance-id': config.instanceId,
        'x-service-version': config.serviceVersion
      }
    });

    exporters.traces.push(new BatchSpanProcessor(otlpTraceExporter));
    exporters.metrics.push(new PeriodicExportingMetricReader({
      exporter: otlpMetricExporter,
      exportIntervalMillis: 30000 // 30 segundos
    }));
  }

  // Prometheus Exporter (para métricas locais)
  if (config.enabledExporters.includes('prometheus')) {
    const prometheusExporter = new PrometheusExporter({
      port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
      endpoint: '/metrics'
    });

    exporters.metrics.push(prometheusExporter);
  }

  // Jaeger Exporter (para traces locais)
  if (config.enabledExporters.includes('jaeger')) {
    const jaegerExporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      tags: [
        { key: 'company.id', value: config.companyId },
        { key: 'instance.id', value: config.instanceId }
      ]
    });

    exporters.traces.push(new BatchSpanProcessor(jaegerExporter));
  }

  return exporters;
}

// Função para filtrar dados sensíveis
function createInstrumentationConfig(config: TelemetryConfig) {
  return getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-http': {
      requestHook: (span, request: any) => {
        // Filtrar URLs sensíveis
        const url = (request as IncomingMessage).url || '';
        if (config.dataFiltering.excludeUrls.some(excludeUrl => url.includes(excludeUrl))) {
          span.setStatus({ code: 2, message: 'Filtered URL' });
          return;
        }

        // Adicionar labels customizados
        span.setAttributes({
          'company.id': config.companyId,
          'instance.id': config.instanceId,
          'service.version': config.serviceVersion
        });
      },
      responseHook: (span, response: any) => {
        // Adicionar informações de resposta sem dados sensíveis
        const res = response as IncomingMessage;
        span.setAttributes({
          'http.response.status_code': (res as any).statusCode || 200,
          'http.response.content_length': res.headers?.['content-length'] || 0
        });
      },
      ignoreIncomingRequestHook: (req: IncomingMessage) => {
        const url = req.url || '';
        return config.dataFiltering.excludeUrls.some(excludeUrl => url.includes(excludeUrl));
      }
    },
    '@opentelemetry/instrumentation-express': {
      enabled: true
    },
    '@opentelemetry/instrumentation-fs': {
      enabled: process.env.NODE_ENV === 'development'
    }
  });
}

// Função principal para inicializar o SDK
export function initializeTelemetry(customConfig?: Partial<TelemetryConfig>): NodeSDK {
  const config = { ...defaultConfig, ...customConfig };
  
  // Verificar consentimento se necessário
  if (config.compliance.consentRequired && !hasUserConsent()) {
    console.log('Telemetry disabled: user consent not given');
    throw new Error('Telemetry disabled: user consent not given');
  }

  // Usar o novo sistema de resource
  const resource = createTelemetryResource();
  
  // Usar o novo sistema de exportadores
  const exporters = createExporters();
  const batchConfig = getBatchConfig();
  
  // Configurar processadores de span com configurações de performance
  const spanProcessors = [];
  for (const exporter of exporters.traces) {
    spanProcessors.push(new BatchSpanProcessor(exporter, {
      maxExportBatchSize: config.performance.batchSize,
      exportTimeoutMillis: batchConfig.trace.exportTimeoutMillis,
      scheduledDelayMillis: batchConfig.trace.scheduledDelayMillis,
      maxQueueSize: config.performance.maxQueueSize
    }));
  }

  // Configurar leitores de métricas
  const metricReaders = exporters.metrics.map(exporter => 
    new PeriodicExportingMetricReader({
      exporter,
      exportIntervalMillis: config.performance.exportInterval,
      exportTimeoutMillis: batchConfig.metric.exportTimeoutMillis
    })
  );

  const instrumentations = createInstrumentationConfig(config);

  const sdk = new NodeSDK({
    resource,
    spanProcessors,
    metricReaders,
    instrumentations: [instrumentations]
  });

  return sdk;
}

// Função para obter a configuração atual
export function getTelemetryConfig(): TelemetryConfig {
  return defaultConfig;
}

// Função auxiliar para verificar consentimento do usuário
function hasUserConsent(): boolean {
  // Verificar variável de ambiente
  if (process.env.TELEMETRY_CONSENT === 'true') {
    return true;
  }

  // Verificar arquivo de consentimento local
  try {
    const fs = require('fs');
    const path = require('path');
    const consentFile = path.join(process.cwd(), '.telemetry-consent');
    return fs.existsSync(consentFile);
  } catch (error) {
    return false;
  }
}

// Função para validar configuração
export function validateTelemetryConfig(config: TelemetryConfig): boolean {
  const required = ['serviceName', 'companyId', 'instanceId', 'collectorEndpoint'];
  return required.every(field => config[field as keyof TelemetryConfig]);
}
// telemetry.js - Deve ser carregado ANTES da aplicação
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { resourceFromAttributes, defaultResource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { BatchSpanProcessor } = require('@opentelemetry/sdk-trace-node');

// Configuração baseada em variáveis de ambiente
const config = {
  serviceName: process.env.OTEL_SERVICE_NAME || 'garapasystem',
  serviceVersion: process.env.OTEL_SERVICE_VERSION || '0.1.35',
  companyId: process.env.COMPANY_ID || 'default',
  instanceId: process.env.INSTANCE_ID || 'local',
  environment: process.env.NODE_ENV || 'development',
  collectorEndpoint: process.env.OTEL_COLLECTOR_ENDPOINT || 'http://app.garapasystem.com:4318',
  enabledExporters: (process.env.OTEL_ENABLED_EXPORTERS || 'otlp,prometheus').split(','),
  excludeUrls: [
    '/health',
    '/api/health',
    '/favicon.ico',
    '/_next/static',
    '/api/socketio',
    '/metrics'
  ]
};

// Criar resource com labels personalizados
const customAttributes = {
  [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
  [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
  [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: config.instanceId,
  [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
  'company.id': config.companyId,
  'instance.id': config.instanceId,
  'system.version': config.serviceVersion,
  'deployment.type': 'self-hosted',
  'telemetry.sdk.name': 'opentelemetry',
  'telemetry.sdk.language': 'nodejs'
};

const resource = resourceFromAttributes(customAttributes);

// Configurar exportadores
const spanProcessors = [];
const metricReaders = [];

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

  spanProcessors.push(new BatchSpanProcessor(otlpTraceExporter));
  metricReaders.push(new PeriodicExportingMetricReader({
    exporter: otlpMetricExporter,
    exportIntervalMillis: 30000
  }));
}

// Prometheus Exporter (para métricas locais)
if (config.enabledExporters.includes('prometheus')) {
  const prometheusExporter = new PrometheusExporter({
    port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
    endpoint: '/metrics'
  });
  metricReaders.push(prometheusExporter);
}

// Configurar instrumentações
const instrumentations = getNodeAutoInstrumentations({
  '@opentelemetry/instrumentation-http': {
    requestHook: (span, request) => {
      // Adicionar labels customizados
      span.setAttributes({
        'company.id': config.companyId,
        'instance.id': config.instanceId,
        'service.version': config.serviceVersion
      });
    },
    ignoreIncomingRequestHook: (req) => {
      const url = req.url || '';
      return config.excludeUrls.some(excludeUrl => url.includes(excludeUrl));
    }
  },
  '@opentelemetry/instrumentation-express': {
    enabled: true
  },
  '@opentelemetry/instrumentation-fs': {
    enabled: process.env.NODE_ENV === 'development'
  }
});

// Inicializar SDK
const sdk = new NodeSDK({
  resource,
  spanProcessors,
  metricReaders,
  instrumentations: [instrumentations]
});

// Inicializar telemetria
try {
  sdk.start();
  console.log(`🔍 Telemetria inicializada para empresa: ${config.companyId}, instância: ${config.instanceId}`);
  console.log(`📊 Exportadores habilitados: ${config.enabledExporters.join(', ')}`);
  console.log(`🎯 Coletor centralizado: ${config.collectorEndpoint}`);
} catch (error) {
  console.error('❌ Erro ao inicializar telemetria:', error);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await sdk.shutdown();
    console.log('🔍 Telemetria finalizada');
  } catch (error) {
    console.error('❌ Erro ao finalizar telemetria:', error);
  }
});

module.exports = { sdk, config };
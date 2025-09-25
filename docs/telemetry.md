# 📊 Stack de Telemetria GarapaSystem

Este documento descreve como configurar e usar o stack de telemetria centralizado do GarapaSystem.

## 🎯 Visão Geral

O stack de telemetria inclui:

- **OpenTelemetry Collector**: Coleta e processa traces, métricas e logs
- **Jaeger**: Visualização de traces distribuídos
- **Prometheus**: Coleta e armazenamento de métricas
- **Grafana**: Dashboards e visualizações
- **Elasticsearch**: Armazenamento de logs e traces
- **Kibana**: Análise de logs

## 🚀 Início Rápido

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.telemetry .env

# Editar variáveis (IMPORTANTE: alterar senhas padrão)
nano .env
```

### 2. Iniciar o Stack

```bash
# Tornar o script executável
chmod +x telemetry-stack.sh

# Validar configuração
./telemetry-stack.sh validate

# Iniciar todos os serviços
./telemetry-stack.sh start

# Verificar status
./telemetry-stack.sh status
```

### 3. Acessar Interfaces

```bash
# Mostrar URLs dos serviços
./telemetry-stack.sh urls
```

## 🔧 Comandos Disponíveis

```bash
./telemetry-stack.sh <comando>
```

### Comandos Principais

- `start` - Iniciar todos os serviços
- `stop` - Parar todos os serviços
- `restart` - Reiniciar todos os serviços
- `status` - Mostrar status dos serviços

### Comandos de Monitoramento

- `logs [serviço]` - Mostrar logs (todos ou de um serviço específico)
- `health` - Verificar saúde dos serviços
- `urls` - Mostrar URLs de acesso

### Comandos de Manutenção

- `clean` - Limpar volumes e dados
- `validate` - Validar configuração
- `test` - Testar integração completa

## 📊 Interfaces Web

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Grafana | http://localhost:3001 | Dashboards e métricas |
| Jaeger | http://localhost:16686 | Traces distribuídos |
| Prometheus | http://localhost:9090 | Métricas e alertas |
| Kibana | http://localhost:5601 | Análise de logs |

### Credenciais Padrão

- **Grafana**: admin / admin (alterar no primeiro acesso)
- **Elasticsearch**: elastic / changeme_elastic_password

## 🔍 Configuração da Aplicação

### Variáveis de Ambiente da Aplicação

```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=garapasystem
OTEL_RESOURCE_ATTRIBUTES=service.version=1.0.0,deployment.environment=production

# Métricas
PROMETHEUS_ENDPOINT=http://localhost:9090
```

### Configuração no Código

O sistema já está configurado via `telemetry.js`. Certifique-se de que:

1. A telemetria está sendo inicializada corretamente
2. As métricas estão sendo coletadas
3. Os traces estão sendo enviados

## 📈 Dashboards Disponíveis

### GarapaSystem Overview
- Response time (percentis 50 e 95)
- Taxa de requisições por status
- Uso de CPU e memória
- Traces recentes

### Como Adicionar Novos Dashboards

1. Criar arquivo JSON em `grafana/dashboards/`
2. Reiniciar o Grafana: `./telemetry-stack.sh restart grafana`

## 🚨 Alertas

### Configuração de Alertas

Os alertas são configurados via:
- **Prometheus**: Regras de alerta em `prometheus-rules/`
- **Alertmanager**: Configuração de notificações
- **Grafana**: Alertas visuais nos dashboards

### Alertas Padrão

- Alta latência de resposta (>1s)
- Taxa de erro elevada (>5%)
- Uso de CPU alto (>80%)
- Uso de memória alto (>80%)

## 🔧 Troubleshooting

### Problemas Comuns

#### Serviços não iniciam
```bash
# Verificar logs
./telemetry-stack.sh logs

# Verificar configuração
./telemetry-stack.sh validate

# Limpar e reiniciar
./telemetry-stack.sh clean
./telemetry-stack.sh start
```

#### Métricas não aparecem
```bash
# Testar integração
./telemetry-stack.sh test

# Verificar configuração do OTEL Collector
docker logs garapasystem-otel-collector

# Verificar se a aplicação está enviando dados
curl http://localhost:4318/v1/metrics
```

#### Grafana não carrega dashboards
```bash
# Verificar datasources
curl http://localhost:3001/api/datasources

# Reiniciar Grafana
./telemetry-stack.sh restart grafana
```

### Logs Úteis

```bash
# OTEL Collector
docker logs garapasystem-otel-collector

# Prometheus
docker logs garapasystem-prometheus

# Jaeger
docker logs garapasystem-jaeger

# Grafana
docker logs garapasystem-grafana
```

## 📊 Métricas Personalizadas

### Adicionando Novas Métricas

```javascript
// No código da aplicação
const { metrics } = require('./telemetry');

// Counter
const requestCounter = metrics.createCounter({
  name: 'http_requests_total',
  description: 'Total number of HTTP requests'
});

// Histogram
const responseTime = metrics.createHistogram({
  name: 'http_request_duration_seconds',
  description: 'HTTP request duration'
});

// Uso
requestCounter.add(1, { method: 'GET', status: '200' });
responseTime.record(0.1, { method: 'GET' });
```

## 🔒 Segurança

### Configurações de Segurança

1. **Alterar senhas padrão** no arquivo `.env`
2. **Configurar HTTPS** para produção
3. **Restringir acesso** às interfaces web
4. **Configurar autenticação** no Grafana

### Produção

Para ambiente de produção:

1. Usar certificados SSL válidos
2. Configurar proxy reverso (Nginx)
3. Implementar autenticação robusta
4. Configurar backup dos dados
5. Monitorar recursos do sistema

## 📚 Recursos Adicionais

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)

## 🆘 Suporte

Para problemas ou dúvidas:

1. Verificar logs dos serviços
2. Executar `./telemetry-stack.sh test`
3. Consultar documentação oficial
4. Abrir issue no repositório
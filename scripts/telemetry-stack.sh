#!/bin/bash

# Script de gerenciamento do Stack de Telemetria GarapaSystem
# Uso: ./telemetry-stack.sh [start|stop|restart|status|logs|clean]

set -e

COMPOSE_FILE="docker-compose.telemetry.yml"
PROJECT_NAME="garapasystem-telemetry"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Verificar se Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        error "Docker não está rodando. Por favor, inicie o Docker primeiro."
        exit 1
    fi
}

# Verificar se docker-compose está disponível
check_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        error "docker-compose não encontrado. Por favor, instale o docker-compose."
        exit 1
    fi
}

# Criar diretórios necessários
create_directories() {
    log "Criando diretórios necessários..."
    mkdir -p logs/otel
    mkdir -p ssl/certs
    mkdir -p ssl/private
    mkdir -p grafana/provisioning/datasources
    mkdir -p grafana/provisioning/dashboards
    mkdir -p grafana/dashboards
}

# Iniciar o stack
start_stack() {
    log "Iniciando stack de telemetria..."
    check_docker
    check_compose
    create_directories
    
    # Verificar se o arquivo de configuração existe
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Arquivo $COMPOSE_FILE não encontrado!"
        exit 1
    fi
    
    # Iniciar serviços
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" up -d
    
    log "Stack de telemetria iniciado com sucesso!"
    info "Aguardando serviços ficarem prontos..."
    sleep 30
    
    show_urls
}

# Parar o stack
stop_stack() {
    log "Parando stack de telemetria..."
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down
    log "Stack de telemetria parado!"
}

# Reiniciar o stack
restart_stack() {
    log "Reiniciando stack de telemetria..."
    stop_stack
    sleep 5
    start_stack
}

# Mostrar status dos serviços
show_status() {
    log "Status dos serviços de telemetria:"
    docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" ps
}

# Mostrar logs
show_logs() {
    local service=$2
    if [ -n "$service" ]; then
        log "Mostrando logs do serviço: $service"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f "$service"
    else
        log "Mostrando logs de todos os serviços:"
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" logs -f
    fi
}

# Limpar dados (cuidado!)
clean_stack() {
    warn "Esta operação irá remover TODOS os dados de telemetria!"
    read -p "Tem certeza? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Parando e removendo containers..."
        docker-compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" down -v --remove-orphans
        
        log "Removendo volumes..."
        docker volume rm $(docker volume ls -q | grep garapasystem) 2>/dev/null || true
        
        log "Limpeza concluída!"
    else
        info "Operação cancelada."
    fi
}

# Mostrar URLs dos serviços
show_urls() {
    log "URLs dos serviços de telemetria:"
    echo
    info "🔍 Jaeger UI (Traces):           http://localhost:16686"
    info "📊 Grafana (Dashboards):        http://localhost:3001 (admin/admin123)"
    info "📈 Prometheus (Metrics):        http://localhost:9090"
    info "🔎 Zipkin (Traces):             http://localhost:9411"
    info "📋 Kibana (Logs):               http://localhost:5601"
    info "🏥 OTEL Collector Health:       http://localhost:13133/health"
    info "🔧 OTEL Collector ZPages:       http://localhost:55679"
    info "📊 Node Exporter:               http://localhost:9100"
    info "🐳 cAdvisor:                    http://localhost:8080"
    echo
    info "🔌 OTEL Endpoints:"
    info "   - gRPC: localhost:4317"
    info "   - HTTP: localhost:4318"
    echo
}

# Verificar saúde dos serviços
health_check() {
    log "Verificando saúde dos serviços..."
    
    # OTEL Collector
    if curl -s http://localhost:13133/health > /dev/null; then
        log "✅ OTEL Collector: Saudável"
    else
        error "❌ OTEL Collector: Não responsivo"
    fi
    
    # Prometheus
    if curl -s http://localhost:9090/-/healthy > /dev/null; then
        log "✅ Prometheus: Saudável"
    else
        error "❌ Prometheus: Não responsivo"
    fi
    
    # Grafana
    if curl -s http://localhost:3001/api/health > /dev/null; then
        log "✅ Grafana: Saudável"
    else
        error "❌ Grafana: Não responsivo"
    fi
    
    # Jaeger
    if curl -s http://localhost:16686 > /dev/null; then
        log "✅ Jaeger: Saudável"
    else
        error "❌ Jaeger: Não responsivo"
    fi
}

# Validar configuração
validate_config() {
    echo -e "${BLUE}🔧 Validando configuração do Docker Compose...${NC}"
    
    if docker-compose -f $COMPOSE_FILE config > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Configuração do Docker Compose válida${NC}"
    else
        echo -e "${RED}❌ Erro na configuração do Docker Compose${NC}"
        docker-compose -f $COMPOSE_FILE config
        return 1
    fi
    
    echo -e "${BLUE}🔧 Verificando arquivos de configuração...${NC}"
    
    configs=(
        "otel-collector-config.yaml:Configuração do OTEL Collector"
        "prometheus.yml:Configuração do Prometheus"
        "grafana/provisioning/datasources/datasources.yml:Datasources do Grafana"
        "grafana/provisioning/dashboards/dashboards.yml:Dashboards do Grafana"
    )
    
    for config in "${configs[@]}"; do
        file=$(echo $config | cut -d: -f1)
        desc=$(echo $config | cut -d: -f2)
        
        if [ -f "$file" ]; then
            echo -e "${GREEN}✅ $desc encontrada${NC}"
        else
            echo -e "${YELLOW}⚠️  $desc não encontrada: $file${NC}"
        fi
    done
}

# Testar integração da telemetria
test_telemetry_integration() {
    echo -e "${BLUE}🧪 Testando integração da telemetria...${NC}"
    
    # Verificar se os serviços estão rodando
    if ! docker-compose -f $COMPOSE_FILE ps | grep -q "Up"; then
        echo -e "${RED}❌ Stack de telemetria não está rodando. Execute: $0 start${NC}"
        return 1
    fi
    
    echo -e "${BLUE}🔍 Testando endpoints...${NC}"
    
    # Testar OTEL Collector
    if curl -s -f http://localhost:13133/health > /dev/null; then
        echo -e "${GREEN}✅ OTEL Collector health check OK${NC}"
    else
        echo -e "${RED}❌ OTEL Collector health check falhou${NC}"
    fi
    
    # Testar Prometheus
    if curl -s -f http://localhost:9090/-/healthy > /dev/null; then
        echo -e "${GREEN}✅ Prometheus health check OK${NC}"
    else
        echo -e "${RED}❌ Prometheus health check falhou${NC}"
    fi
    
    # Testar Jaeger
    if curl -s -f http://localhost:16686/ > /dev/null; then
        echo -e "${GREEN}✅ Jaeger UI acessível${NC}"
    else
        echo -e "${RED}❌ Jaeger UI não acessível${NC}"
    fi
    
    # Testar Grafana
    if curl -s -f http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✅ Grafana health check OK${NC}"
    else
        echo -e "${RED}❌ Grafana health check falhou${NC}"
    fi
    
    echo -e "${BLUE}📊 Testando envio de métricas de teste...${NC}"
    
    # Enviar métrica de teste via OTLP HTTP
    test_metric='{
        "resourceMetrics": [{
            "resource": {
                "attributes": [{
                    "key": "service.name",
                    "value": {"stringValue": "telemetry-test"}
                }]
            },
            "scopeMetrics": [{
                "scope": {"name": "test-scope"},
                "metrics": [{
                    "name": "test_counter",
                    "description": "Test counter metric",
                    "unit": "1",
                    "sum": {
                        "dataPoints": [{
                            "attributes": [],
                            "timeUnixNano": "'$(date +%s%N)'",
                            "asInt": 1
                        }],
                        "aggregationTemporality": 2,
                        "isMonotonic": true
                    }
                }]
            }]
        }]
    }'
    
    if curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$test_metric" \
        http://localhost:4318/v1/metrics > /dev/null; then
        echo -e "${GREEN}✅ Envio de métrica de teste OK${NC}"
    else
        echo -e "${RED}❌ Falha no envio de métrica de teste${NC}"
    fi
    
    echo -e "${BLUE}🎯 Teste de integração concluído!${NC}"
}

# Menu principal
case "$1" in
    start)
        start_stack
        ;;
    stop)
        stop_stack
        ;;
    restart)
        restart_stack
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    clean)
        clean_stack
        ;;
    urls)
        show_urls
        ;;
    health)
        health_check
        ;;
    test)
        echo -e "${BLUE}🧪 Testando integração da telemetria...${NC}"
        test_telemetry_integration
        ;;
    validate)
        echo -e "${BLUE}✅ Validando configuração...${NC}"
        validate_config
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|logs [service]|clean|urls|health|test|validate}"
        echo
        echo "Comandos:"
        echo "  start    - Iniciar o stack de telemetria"
        echo "  stop     - Parar o stack de telemetria"
        echo "  restart  - Reiniciar o stack de telemetria"
        echo "  status   - Mostrar status dos serviços"
        echo "  logs     - Mostrar logs (opcionalmente de um serviço específico)"
        echo "  clean    - Limpar todos os dados (CUIDADO!)"
        echo "  urls     - Mostrar URLs dos serviços"
        echo "  health   - Verificar saúde dos serviços"
        echo "  test     - Testar integração da telemetria"
        echo "  validate - Validar configuração"
        echo
        exit 1
        ;;
esac
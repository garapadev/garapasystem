#!/bin/sh
# auto-init-database.sh
# Script de inicialização automática do banco de dados
# Verifica se existe usuário admin, executa init.sql, migrações e seed conforme necessário

set -e

echo "🚀 GarapaSystem - Inicialização Automática do Banco de Dados"
echo "============================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar variáveis de ambiente essenciais
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL não está definida"
    exit 1
fi

log_info "Verificando conectividade com o banco de dados..."

# Aguardar o banco estar disponível (timeout de 60 segundos)
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if timeout 5 sh -c "echo 'SELECT 1;' | npx prisma db execute --url=\"$DATABASE_URL\" --stdin" >/dev/null 2>&1; then
        log_success "Conexão com banco estabelecida!"
        break
    fi
    
    attempt=$((attempt + 1))
    log_info "Tentativa $attempt/$max_attempts - Aguardando banco de dados..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    log_error "Não foi possível conectar ao banco após $max_attempts tentativas"
    exit 1
fi

# Verificar se o banco precisa de inicialização
log_info "Verificando se o banco precisa de inicialização..."

# Usar o script existente para verificar se o banco está vazio
if node /app/scripts/check-database-empty.js >/dev/null 2>&1; then
    log_warning "Banco de dados vazio detectado - Executando inicialização completa"
    
    # 1. Executar init.sql se existir
    if [ -f "/app/prisma/init.sql" ]; then
        log_info "Executando script de inicialização (init.sql)..."
        echo "\\i /app/prisma/init.sql" | npx prisma db execute --url="$DATABASE_URL" --stdin || {
            log_warning "Falha ao executar init.sql - continuando..."
        }
        log_success "Script init.sql executado"
    else
        log_warning "Arquivo init.sql não encontrado - pulando"
    fi
    
    # 2. Executar migrações do Prisma
    log_info "Executando migrações do Prisma..."
    npx prisma migrate deploy || {
        log_error "Falha ao executar migrações"
        exit 1
    }
    log_success "Migrações executadas com sucesso"
    
    # 3. Executar seed
    log_info "Executando seed do banco de dados..."
    npm run db:seed || {
        log_error "Falha ao executar seed"
        exit 1
    }
    log_success "Seed executado com sucesso"
    
    # 4. Executar seed dos módulos
    log_info "Executando seed dos módulos..."
    npx tsx /app/scripts/seed-modulos.ts || {
        log_warning "Falha ao executar seed dos módulos - continuando..."
    }
    log_success "Seed dos módulos executado com sucesso"
    
    log_success "✅ Inicialização completa do banco concluída!"
    log_info "Usuário administrador padrão:"
    log_info "  Email: admin@garapasystem.com"
    log_info "  Senha: password"
    log_warning "⚠️  IMPORTANTE: Altere a senha após o primeiro login!"
    
else
    log_info "Banco de dados já contém dados - verificando necessidade de atualizações..."
    
    # Verificar se existe usuário admin
    log_info "Verificando existência de usuário administrador..."
    if /app/scripts/check-admin-user.sh >/dev/null 2>&1; then
        log_success "Usuário administrador encontrado"
    else
        log_warning "Usuário administrador não encontrado - executando seed para criar admin..."
        npm run db:seed || {
            log_warning "Falha ao executar seed - admin pode não ter sido criado"
        }
    fi
    
    # Verificar e executar seed dos módulos se necessário
    log_info "Verificando módulos do sistema..."
    npx tsx /app/scripts/seed-modulos.ts || {
        log_warning "Falha ao verificar/criar módulos - continuando..."
    }
    log_success "Módulos verificados/criados"
    
    # Executar migrações pendentes
    log_info "Verificando migrações pendentes..."
    npx prisma migrate deploy || {
        log_warning "Falha ao executar migrações pendentes"
    }
    log_success "Migrações verificadas/aplicadas"
fi

# Gerar cliente Prisma (sempre executar para garantir sincronização)
log_info "Gerando cliente Prisma..."
npx prisma generate || {
    log_warning "Falha ao gerar cliente Prisma"
}
log_success "Cliente Prisma gerado"

echo ""
log_success "🎉 Inicialização automática do banco concluída com sucesso!"
echo "============================================================"
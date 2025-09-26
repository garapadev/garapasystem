#!/bin/bash

# Script de configuração automática do GarapaSystem
# Este script é executado durante a instalação para garantir que o banco seja inicializado corretamente

set -e

echo "🚀 Iniciando configuração automática do GarapaSystem..."

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

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    log_error "Node.js não está instalado. Por favor, instale o Node.js antes de continuar."
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    log_error "npm não está instalado. Por favor, instale o npm antes de continuar."
    exit 1
fi

# Verificar se as variáveis de ambiente estão configuradas
if [ ! -f ".env" ] && [ ! -f ".env.local" ]; then
    log_warning "Arquivo .env não encontrado. Certifique-se de configurar as variáveis de ambiente."
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências do projeto..."
    npm install
    log_success "Dependências instaladas com sucesso!"
fi

# Aguardar o banco de dados estar disponível
log_info "Aguardando banco de dados estar disponível..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if npx prisma db push --accept-data-loss &> /dev/null; then
        log_success "Banco de dados está disponível!"
        break
    fi
    
    attempt=$((attempt + 1))
    log_info "Tentativa $attempt/$max_attempts - Aguardando banco de dados..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    log_error "Não foi possível conectar ao banco de dados após $max_attempts tentativas."
    log_error "Verifique se o banco de dados está rodando e as configurações estão corretas."
    exit 1
fi

# Verificar se o banco está vazio usando nosso script
log_info "Verificando se o banco de dados está vazio..."
if node scripts/check-database-empty.js; then
    log_info "Banco de dados vazio detectado. Executando configuração inicial..."
    
    # Executar migrations
    log_info "Executando migrations do banco de dados..."
    npx prisma migrate deploy
    log_success "Migrations executadas com sucesso!"
    
    # Executar seed inicial
    log_info "Executando seed inicial do banco de dados..."
    npm run db:seed
    log_success "Seed inicial executado com sucesso!"
    
    log_success "✅ Configuração inicial do banco de dados concluída!"
    log_info "Usuário administrador criado:"
    log_info "  Email: admin@garapasystem.com"
    log_info "  Senha: password"
    log_warning "⚠️  IMPORTANTE: Altere a senha do administrador após o primeiro login!"
    
else
    log_info "Banco de dados já contém dados. Executando apenas migrations pendentes..."
    
    # Executar apenas migrations pendentes
    npx prisma migrate deploy
    log_success "Migrations pendentes executadas com sucesso!"
fi

# Gerar cliente Prisma
log_info "Gerando cliente Prisma..."
npx prisma generate
log_success "Cliente Prisma gerado com sucesso!"

# Verificar se o build é necessário
if [ ! -d ".next" ]; then
    log_info "Executando build do projeto..."
    npm run build
    log_success "Build executado com sucesso!"
fi

log_success "🎉 Configuração automática do GarapaSystem concluída!"
log_info "O sistema está pronto para uso."
log_info "Para iniciar o servidor de desenvolvimento: npm run dev"
log_info "Para iniciar o servidor de produção: npm start"
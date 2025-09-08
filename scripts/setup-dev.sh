#!/bin/bash

# Script de configuração para ambiente de desenvolvimento local
# GarapaSystem - Setup Development Environment

set -e

echo "🚀 Configurando ambiente de desenvolvimento local..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Este script deve ser executado no diretório raiz do projeto!"
    exit 1
fi

# Verificar se .env.local existe
if [ ! -f ".env.local" ]; then
    print_error "Arquivo .env.local não encontrado!"
    print_status "Criando .env.local a partir do template..."
    
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        print_success "Arquivo .env.local criado a partir do template"
    else
        print_warning "Template .env.local.example não encontrado"
        print_status "Você precisa configurar manualmente o .env.local"
    fi
else
    print_success "Arquivo .env.local encontrado"
fi

# Verificar Node.js
print_status "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js encontrado: $NODE_VERSION"
else
    print_error "Node.js não encontrado! Instale Node.js 18+ antes de continuar."
    exit 1
fi

# Verificar npm
print_status "Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm encontrado: $NPM_VERSION"
else
    print_error "npm não encontrado!"
    exit 1
fi

# Instalar dependências
print_status "Instalando dependências..."
if npm install; then
    print_success "Dependências instaladas com sucesso"
else
    print_error "Falha ao instalar dependências"
    exit 1
fi

# Verificar PostgreSQL
print_status "Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    POSTGRES_VERSION=$(psql --version | head -n1)
    print_success "PostgreSQL encontrado: $POSTGRES_VERSION"
    
    # Verificar se o serviço está rodando
    if systemctl is-active --quiet postgresql 2>/dev/null || brew services list | grep postgresql | grep started &>/dev/null; then
        print_success "Serviço PostgreSQL está rodando"
    else
        print_warning "Serviço PostgreSQL não está rodando"
        print_status "Tentando iniciar PostgreSQL..."
        
        if command -v systemctl &> /dev/null; then
            sudo systemctl start postgresql || print_warning "Falha ao iniciar PostgreSQL via systemctl"
        elif command -v brew &> /dev/null; then
            brew services start postgresql || print_warning "Falha ao iniciar PostgreSQL via brew"
        fi
    fi
else
    print_warning "PostgreSQL não encontrado!"
    print_status "Instruções para instalar PostgreSQL:"
    echo "  Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql"
    echo "  Windows: Baixe do site oficial postgresql.org"
fi

# Gerar cliente Prisma
print_status "Gerando cliente Prisma..."
if npm run db:generate; then
    print_success "Cliente Prisma gerado com sucesso"
else
    print_warning "Falha ao gerar cliente Prisma (pode ser normal se o banco não estiver configurado)"
fi

# Verificar conexão com banco
print_status "Verificando conexão com banco de dados..."
source .env.local 2>/dev/null || true

if [ -n "$DATABASE_URL" ]; then
    print_status "DATABASE_URL encontrada: ${DATABASE_URL}"
    
    # Tentar conectar ao banco
    if npx prisma db push --accept-data-loss 2>/dev/null; then
        print_success "Conexão com banco de dados estabelecida"
        
        # Executar migrações
        print_status "Executando migrações..."
        if npm run db:migrate; then
            print_success "Migrações executadas com sucesso"
        else
            print_warning "Falha ao executar migrações"
        fi
        
        # Executar seed (opcional)
        print_status "Executando seed do banco..."
        if npm run db:seed 2>/dev/null; then
            print_success "Seed executado com sucesso"
        else
            print_warning "Falha ao executar seed (pode ser normal)"
        fi
    else
        print_warning "Não foi possível conectar ao banco de dados"
        print_status "Verifique as configurações no .env.local"
    fi
else
    print_warning "DATABASE_URL não encontrada no .env.local"
fi

# Verificar se o servidor está rodando
print_status "Verificando se o servidor está rodando..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_warning "Servidor já está rodando na porta 3000"
else
    print_status "Porta 3000 disponível"
fi

echo ""
print_success "🎉 Configuração do ambiente de desenvolvimento concluída!"
echo ""
print_status "Próximos passos:"
echo "  1. Verifique as configurações no .env.local"
echo "  2. Configure o banco de dados PostgreSQL se necessário"
echo "  3. Execute 'npm run dev' para iniciar o servidor de desenvolvimento"
echo "  4. Acesse http://localhost:3000 no seu navegador"
echo ""
print_status "Comandos úteis:"
echo "  npm run dev          - Iniciar servidor de desenvolvimento"
echo "  npm run db:migrate   - Executar migrações do banco"
echo "  npm run db:reset     - Resetar banco de dados"
echo "  npx prisma studio    - Abrir Prisma Studio"
echo ""
print_status "Para mais informações, consulte o arquivo DEVELOPMENT.md"
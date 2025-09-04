#!/bin/bash

# Script para validar configuração Docker sem executar build

set -e

echo "🔍 Validando configuração Docker..."

# Verificar se arquivos necessários existem
echo "📁 Verificando arquivos necessários..."

files=(
    "Dockerfile"
    "docker-compose.yml"
    ".dockerignore"
    ".env.docker"
    "package.json"
    "prisma/schema.prisma"
    "server.ts"
)

for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file - OK"
    else
        echo "❌ $file - FALTANDO"
        exit 1
    fi
done

# Verificar sintaxe do Dockerfile
echo "\n🐳 Validando sintaxe do Dockerfile..."
if grep -q "FROM node:18-alpine" Dockerfile; then
    echo "✅ Base image - OK"
else
    echo "❌ Base image não encontrada"
    exit 1
fi

if grep -q "WORKDIR /app" Dockerfile; then
    echo "✅ Working directory - OK"
else
    echo "❌ Working directory não definido"
    exit 1
fi

if grep -q "EXPOSE 3000" Dockerfile; then
    echo "✅ Port exposure - OK"
else
    echo "❌ Porta não exposta"
    exit 1
fi

# Verificar docker-compose.yml
echo "\n📋 Validando docker-compose.yml..."
if grep -q "version:" docker-compose.yml; then
    echo "✅ Version definida - OK"
else
    echo "❌ Version não definida"
    exit 1
fi

if grep -q "postgres:" docker-compose.yml; then
    echo "✅ Serviço PostgreSQL - OK"
else
    echo "❌ Serviço PostgreSQL não encontrado"
    exit 1
fi

if grep -q "app:" docker-compose.yml; then
    echo "✅ Serviço da aplicação - OK"
else
    echo "❌ Serviço da aplicação não encontrado"
    exit 1
fi

# Verificar variáveis de ambiente
echo "\n🔧 Validando variáveis de ambiente..."
if grep -q "DATABASE_URL" .env.docker; then
    echo "✅ DATABASE_URL - OK"
else
    echo "❌ DATABASE_URL não definida"
    exit 1
fi

if grep -q "NEXTAUTH_SECRET" .env.docker; then
    echo "✅ NEXTAUTH_SECRET - OK"
else
    echo "❌ NEXTAUTH_SECRET não definida"
    exit 1
fi

# Verificar dependências críticas no package.json
echo "\n📦 Verificando dependências críticas..."
critical_deps=(
    "next"
    "@prisma/client"
    "prisma"
    "tsx"
)

for dep in "${critical_deps[@]}"; do
    if grep -q "\"$dep\"" package.json; then
        echo "✅ $dep - OK"
    else
        echo "❌ $dep - FALTANDO"
        exit 1
    fi
done

# Verificar estrutura de diretórios
echo "\n📂 Verificando estrutura de diretórios..."
dirs=(
    "src/app"
    "src/components"
    "src/lib"
    "prisma"
    "public"
)

for dir in "${dirs[@]}"; do
    if [[ -d "$dir" ]]; then
        echo "✅ $dir/ - OK"
    else
        echo "❌ $dir/ - FALTANDO"
        exit 1
    fi
done

echo "\n✅ Todas as validações passaram!"
echo "🐳 Configuração Docker está pronta para uso."
echo "\n📋 Próximos passos:"
echo "   1. Instalar Docker e Docker Compose"
echo "   2. Executar: docker-compose up -d --build"
echo "   3. Executar: docker-compose exec app npx prisma migrate deploy"
echo "   4. Acessar: http://localhost:3000"
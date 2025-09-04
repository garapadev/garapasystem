#!/bin/bash

# Script de teste para validar a configuração de containerização
# Este script simula o que aconteceria durante a inicialização do container

set -e

echo "🧪 Testando configuração de containerização..."
echo "================================================"

# Verificar arquivos necessários
echo "📁 Verificando arquivos necessários:"

files_to_check=(
    "docker-compose.yml"
    "docker/Dockerfile.postgres"
    "docker/entrypoint.sh"
    "docker/init-database.sh"
    "docker/init-db.sql"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file - OK"
    else
        echo "  ❌ $file - FALTANDO"
        exit 1
    fi
done

# Verificar permissões dos scripts
echo "\n🔐 Verificando permissões dos scripts:"
scripts_to_check=(
    "docker/entrypoint.sh"
    "docker/init-database.sh"
    "scripts/export-dev-data.sh"
)

for script in "${scripts_to_check[@]}"; do
    if [ -x "$script" ]; then
        echo "  ✅ $script - Executável"
    else
        echo "  ❌ $script - Não executável"
        exit 1
    fi
done

# Verificar conteúdo do docker-compose.yml
echo "\n🐳 Verificando configuração do docker-compose:"
if grep -q "dockerfile: docker/Dockerfile.postgres" docker-compose.yml; then
    echo "  ✅ Dockerfile customizado configurado"
else
    echo "  ❌ Dockerfile customizado não configurado"
    exit 1
fi

if grep -q "init-db.sql:/docker-entrypoint-initdb.d/02-init-db.sql" docker-compose.yml; then
    echo "  ✅ Volume de dados configurado"
else
    echo "  ❌ Volume de dados não configurado"
    exit 1
fi

# Verificar dados exportados
echo "\n📊 Verificando dados exportados:"
if [ -s "docker/init-db.sql" ]; then
    lines=$(wc -l < docker/init-db.sql)
    echo "  ✅ Arquivo de dados existe ($lines linhas)"
    
    # Verificar se contém dados das tabelas principais
    if grep -q "INSERT INTO" docker/init-db.sql; then
        echo "  ✅ Contém comandos INSERT"
    else
        echo "  ⚠️  Não contém comandos INSERT"
    fi
else
    echo "  ❌ Arquivo de dados vazio ou inexistente"
    exit 1
fi

# Verificar configuração do Dockerfile.postgres
echo "\n🐘 Verificando Dockerfile.postgres:"
if grep -q "FROM postgres:15-alpine" docker/Dockerfile.postgres; then
    echo "  ✅ Imagem base PostgreSQL configurada"
else
    echo "  ❌ Imagem base PostgreSQL não configurada"
    exit 1
fi

if grep -q "ENTRYPOINT.*entrypoint.sh" docker/Dockerfile.postgres; then
    echo "  ✅ Entrypoint customizado configurado"
else
    echo "  ❌ Entrypoint customizado não configurado"
    exit 1
fi

# Verificar variáveis de ambiente no .env
echo "\n🔧 Verificando configuração do ambiente:"
if grep -q "DATABASE_URL.*5434" .env; then
    echo "  ✅ DATABASE_URL configurada para desenvolvimento (porta 5434)"
else
    echo "  ⚠️  DATABASE_URL não está na porta 5434"
fi

echo "\n🎉 Todos os testes passaram!"
echo "================================================"
echo "📋 Resumo da configuração:"
echo "  • Docker Compose configurado com Dockerfile customizado"
echo "  • PostgreSQL com entrypoint personalizado"
echo "  • Scripts de inicialização criados e executáveis"
echo "  • Dados do desenvolvimento exportados"
echo "  • Configuração pronta para containerização"
echo ""
echo "🚀 Para usar em produção:"
echo "  1. Instale Docker e Docker Compose"
echo "  2. Execute: docker-compose up -d"
echo "  3. O banco será criado automaticamente com os dados atuais"
echo ""
echo "✅ Configuração de containerização validada com sucesso!"
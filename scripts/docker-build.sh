#!/bin/bash

# Script para build e deploy da aplicação com Docker

set -e

echo "🐳 Iniciando build da aplicação CRM/ERP..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Remover imagens antigas (opcional)
read -p "🗑️  Deseja remover imagens antigas? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removendo imagens antigas..."
    docker-compose down --rmi all
fi

# Build das imagens
echo "🔨 Fazendo build das imagens..."
docker-compose build --no-cache

# Subir os serviços
echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar o banco de dados ficar pronto
echo "⏳ Aguardando banco de dados ficar pronto..."
sleep 10

# Executar migrações do Prisma
echo "📊 Executando migrações do banco de dados..."
docker-compose exec app npx prisma migrate deploy

# Verificar status dos containers
echo "📋 Status dos containers:"
docker-compose ps

echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: http://localhost:3000"
echo "🗄️  Adminer disponível em: http://localhost:8080"
echo "📊 Para ver logs: docker-compose logs -f"
echo "🛑 Para parar: docker-compose down"
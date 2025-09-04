#!/bin/bash

# Script de inicialização do banco de dados para container
# Este script será executado quando o container PostgreSQL for iniciado

set -e

echo "🚀 Iniciando configuração do banco de dados..."

# Aguardar PostgreSQL estar completamente pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
for i in {1..30}; do
  if pg_isready -h localhost -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    echo "✅ PostgreSQL está pronto!"
    break
  fi
  echo "Tentativa $i/30 - PostgreSQL ainda não está pronto..."
  sleep 2
done

# Verificar se o banco já foi inicializado
echo "🔍 Verificando se o banco já foi inicializado..."
if psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios';" | grep -q "1 row"; then
  echo "📊 Banco de dados já foi inicializado anteriormente."
  exit 0
fi

echo "🔧 Banco de dados não inicializado. Executando setup..."

# Configurar ambiente para Prisma
export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB?schema=public"

# Executar schema do Prisma
echo "📋 Aplicando schema do banco de dados..."
cd /app
npx prisma db push --force-reset --accept-data-loss

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "🎉 Inicialização do banco de dados concluída!"
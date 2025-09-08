#!/bin/bash

# Script de inicialização do banco de dados
# Verifica se o banco está vazio e executa migrações + seed automaticamente

set -e

echo "🔍 Verificando estado do banco de dados..."

# Aguarda o banco estar disponível
echo "⏳ Aguardando banco de dados estar disponível..."
until pg_isready -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER"; do
  echo "Banco não está pronto ainda. Aguardando..."
  sleep 2
done

echo "✅ Banco de dados está disponível!"

# Verifica se o banco já tem dados (verifica se existe a tabela usuarios)
TABLE_COUNT=$(PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -eq "0" ]; then
    echo "📊 Banco vazio detectado. Executando migrações..."
    
    # Executa as migrações do Prisma
    echo "🔄 Executando migrações do Prisma..."
    npx prisma migrate deploy
    
    echo "🌱 Executando seed com dados iniciais..."
    
    # Executa o seed com os dados exportados
    # Primeiro desabilita triggers para evitar problemas com foreign keys circulares
    PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SET session_replication_role = replica;"
    
    # Executa o arquivo de seed
    PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -f /app/prisma/seed-data.sql
    
    # Reabilita triggers
    PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "SET session_replication_role = DEFAULT;"
    
    echo "✅ Banco inicializado com sucesso!"
else
    echo "📋 Banco já contém dados. Pulando inicialização."
    
    # Apenas executa migrações pendentes
    echo "🔄 Verificando migrações pendentes..."
    npx prisma migrate deploy
fi

echo "🚀 Inicialização do banco concluída!"
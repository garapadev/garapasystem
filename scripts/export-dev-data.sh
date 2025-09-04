#!/bin/bash

# Script para exportar dados do banco de desenvolvimento
# Este script será usado para popular o container com dados atuais

set -e

echo "🔄 Exportando dados do banco de desenvolvimento..."

# Configurações do banco de desenvolvimento
DB_HOST="localhost"
DB_PORT="5434"
DB_NAME="crm_erp"
DB_USER="crm_user"
DB_PASSWORD="crm_password"

# Arquivo de saída
OUTPUT_FILE="./docker/init-db.sql"

# Criar diretório se não existir
mkdir -p ./docker

# Exportar apenas os dados (sem estrutura)
echo "📦 Exportando dados das tabelas..."
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --data-only \
  --inserts \
  --no-owner \
  --no-privileges \
  --disable-triggers \
  > "$OUTPUT_FILE"

echo "✅ Dados exportados para: $OUTPUT_FILE"
echo "📊 Tamanho do arquivo: $(du -h $OUTPUT_FILE | cut -f1)"
echo "📝 Linhas exportadas: $(wc -l < $OUTPUT_FILE)"

echo "🎉 Exportação concluída com sucesso!"
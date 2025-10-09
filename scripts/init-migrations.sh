#!/bin/sh
# init-migrations.sh
# Script de inicialização para lidar com migrações do Prisma no container

set -e

echo "🚀 Iniciando processo de migrações do GarapaSystem..."

# Debug: Mostrar variáveis de ambiente
echo "🔧 Variáveis de ambiente:"
echo "DB_HOST: $DB_HOST"
echo "DB_PORT: $DB_PORT"
echo "DB_NAME: $DB_NAME"
echo "DB_USER: $DB_USER"
echo "DATABASE_URL: $DATABASE_URL"

# Verificar se o banco está acessível
echo "🔍 Verificando conectividade com o banco de dados..."

# Tentar conectar com timeout e mais informações de erro
echo "🔍 Testando conectividade básica..."
timeout 10 sh -c "echo 'SELECT 1;' | npx prisma db execute --url=\"$DATABASE_URL\" --stdin" 2>&1 || {
    echo "❌ Erro ao conectar com o banco de dados"
    echo "🔍 Detalhes do erro:"
    echo "SELECT 1;" | npx prisma db execute --url="$DATABASE_URL" --stdin 2>&1 || true
    echo "🔍 Tentando aguardar e tentar novamente..."
    sleep 5
    echo "SELECT 1;" | npx prisma db execute --url="$DATABASE_URL" --stdin 2>&1 || {
        echo "❌ Falha definitiva na conectividade"
        exit 1
    }
}

echo "✅ Conexão com banco estabelecida"

# Verificar status das migrações
echo "📋 Verificando status das migrações..."
MIGRATE_STATUS=$(npx prisma migrate status 2>&1 || echo "PENDING")

if echo "$MIGRATE_STATUS" | grep -q "Database schema is not empty"; then
    echo "⚠️  Banco não vazio detectado - aplicando baseline das migrações..."
    /app/scripts/baseline-migrations.sh
elif echo "$MIGRATE_STATUS" | grep -q "pending"; then
    echo "🔄 Migrações pendentes detectadas - aplicando..."
    npx prisma migrate deploy
else
    echo "✅ Migrações já estão em dia"
fi

# Gerar cliente Prisma
echo "🔧 Gerando cliente Prisma..."
npx prisma generate

echo "✨ Processo de migrações concluído com sucesso!"
#!/bin/bash

# Entrypoint customizado para PostgreSQL com inicialização automática
# Este script combina o entrypoint padrão do PostgreSQL com nossa configuração

set -e

echo "🐘 Iniciando PostgreSQL com configuração customizada..."

# Função para executar a inicialização do banco
init_database() {
    echo "🔧 Executando inicialização do banco de dados..."
    
    # Aguardar PostgreSQL estar completamente operacional
    echo "⏳ Aguardando PostgreSQL estar operacional..."
    for i in {1..60}; do
        if pg_isready -h localhost -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
            echo "✅ PostgreSQL operacional!"
            break
        fi
        echo "Tentativa $i/60 - Aguardando PostgreSQL..."
        sleep 2
    done
    
    # Verificar se já foi inicializado
    if psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios';" 2>/dev/null | grep -q "1 row"; then
        echo "📊 Banco já inicializado."
        return 0
    fi
    
    echo "🚀 Inicializando banco com dados do desenvolvimento..."
    
    # Configurar ambiente
    export DATABASE_URL="postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5432/$POSTGRES_DB?schema=public"
    
    # Aplicar schema
    cd /app
    echo "📋 Aplicando schema..."
    npx prisma db push --force-reset --accept-data-loss
    
    # Gerar cliente
    echo "🔧 Gerando cliente Prisma..."
    npx prisma generate
    
    # Importar dados se disponível
    if [ -f "/docker-entrypoint-initdb.d/02-init-db.sql" ]; then
        echo "📦 Importando dados do desenvolvimento..."
        psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "/docker-entrypoint-initdb.d/02-init-db.sql"
        echo "✅ Dados importados!"
    else
        echo "⚠️  Dados não encontrados, executando seed padrão..."
        npx prisma db seed
    fi
    
    echo "🎉 Inicialização concluída!"
}

# Se for o comando padrão do postgres, executar inicialização em background
if [ "$1" = 'postgres' ]; then
    # Iniciar PostgreSQL em background
    echo "🚀 Iniciando PostgreSQL..."
    docker-entrypoint.sh postgres &
    POSTGRES_PID=$!
    
    # Aguardar um pouco para PostgreSQL iniciar
    sleep 10
    
    # Executar inicialização
    init_database
    
    # Aguardar o processo do PostgreSQL
    wait $POSTGRES_PID
else
    # Para outros comandos, executar normalmente
    exec docker-entrypoint.sh "$@"
fi
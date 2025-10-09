#!/bin/sh
set -e
echo "🚀 GarapaSystem v0.2.38.17 - Iniciando configuração..."
if [ "$SKIP_DB_CHECK" != "true" ]; then
  echo "🗄️  Configurando banco de dados..."
  # Usar o novo script de inicialização automática
  if [ -x "/app/scripts/auto-init-database.sh" ]; then
    /app/scripts/auto-init-database.sh
  elif [ -x "/app/scripts/init-migrations.sh" ]; then
    echo "⚠️  Usando script legado init-migrations.sh"
    /app/scripts/init-migrations.sh
  else
    echo "❌ Nenhum script de inicialização encontrado"
    exit 1
  fi
else
  echo "⏭️  Pulando verificações de banco de dados..."
fi
echo "🌟 Iniciando aplicação..."
pm2-runtime start ecosystem.config.js --only garapasystem --env production
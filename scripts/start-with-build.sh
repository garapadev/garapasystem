#!/bin/bash
set -e

echo "🔧 Pre-start: build automático (PM2)"

# Permite pular o build com variável de ambiente
if [ "$SKIP_BUILD" = "true" ]; then
  echo "⏭️  SKIP_BUILD=true, pulando build."
else
  # Se já existe build (.next), evita rebuild desnecessário
  if [ -d ".next" ]; then
    echo "ℹ️  Build existente encontrado (.next)."
  else
    if [ "$NODE_ENV" = "production" ]; then
      echo "🏗️  Executando build de produção..."
      npm run build
    else
      echo "🏗️  Executando build (dev)..."
      npm run build
    fi
  fi
fi

echo "🚀 Iniciando server.ts com tsx"
exec npx tsx server.ts
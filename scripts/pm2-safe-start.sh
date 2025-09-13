#!/bin/bash

# Script para iniciar PM2 com build garantido
echo "🔧 Iniciando processo de build e start do PM2..."

# Parar todos os processos PM2 existentes
echo "⏹️  Parando processos PM2 existentes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Limpar cache do Next.js
echo "🧹 Limpando cache do Next.js..."
rm -rf .next
rm -rf node_modules/.cache

# Executar build
echo "🏗️  Executando build do Next.js..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build! Abortando..."
    exit 1
fi

# Verificar se o build foi criado corretamente
if [ ! -d ".next" ]; then
    echo "❌ Pasta .next não encontrada após o build!"
    exit 1
fi

echo "✅ Build concluído com sucesso!"

# Iniciar PM2
echo "🚀 Iniciando PM2..."
pm2 start ecosystem.config.js --env development

if [ $? -eq 0 ]; then
    echo "✅ PM2 iniciado com sucesso!"
    pm2 status
else
    echo "❌ Erro ao iniciar PM2!"
    exit 1
fi

echo "🎉 Processo concluído!"
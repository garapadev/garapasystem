#!/bin/bash

# Script para deploy no container
echo "🚀 Iniciando deploy do GarapaSystem v0.2.38.16 para container..."

# Backup do .env atual
if [ -f ".env" ]; then
    echo "📦 Fazendo backup do .env atual..."
    cp .env .env.backup
fi

# Copiar configurações do container
echo "⚙️ Aplicando configurações do container..."
cp .env.container .env

# Verificar se o Prisma está funcionando
echo "🔍 Verificando status das migrações..."
npx prisma migrate status

# Fazer build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    
    # Reiniciar PM2
    echo "🔄 Reiniciando PM2..."
    pm2 restart garapasystem
    
    echo "🎉 Deploy concluído com sucesso!"
    echo "📊 Status dos processos PM2:"
    pm2 list
else
    echo "❌ Erro no build. Restaurando configurações anteriores..."
    if [ -f ".env.backup" ]; then
        cp .env.backup .env
    fi
    exit 1
fi
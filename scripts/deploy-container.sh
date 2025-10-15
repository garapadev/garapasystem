#!/bin/bash

# Script para deploy no container
APP_VERSION=$(node -p "require('./package.json').version")
echo "🚀 Iniciando build e deploy do GarapaSystem v$APP_VERSION para container..."

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

echo "🔨 Fazendo build da imagem Docker..."
npm run docker:build

# Verificar se o build foi bem-sucedido
if [ $? -eq 0 ]; then
    echo "✅ Imagem criada com sucesso!"
    echo "📤 Publicando a imagem no DockerHub..."
    npm run docker:push
    echo "🎉 Deploy de container concluído! Imagem: garapadev/garapasystem:$APP_VERSION"
else
    echo "❌ Erro no build de imagem. Restaurando configurações anteriores..."
    if [ -f ".env.backup" ]; then
        cp .env.backup .env
    fi
    exit 1
fi
#!/bin/bash

# Script para configurar limpeza automática de logs
# Este script configura um cron job para executar a limpeza de logs diariamente

APP_URL="${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
CRON_TIME="${LOG_CLEANUP_CRON:-0 2 * * *}"  # Default: 2:00 AM todos os dias

echo "Configurando limpeza automática de logs..."

# Verificar se curl está disponível
if ! command -v curl &> /dev/null; then
    echo "Erro: curl não está instalado"
    exit 1
fi

# Criar o comando do cron job
CRON_COMMAND="$CRON_TIME curl -X POST $APP_URL/api/logs/cleanup >/dev/null 2>&1"

# Obter crontab atual
CURRENT_CRONTAB=$(crontab -l 2>/dev/null || echo "")

# Verificar se o job já existe
if echo "$CURRENT_CRONTAB" | grep -q "/api/logs/cleanup"; then
    echo "Limpeza automática já está configurada. Atualizando..."
    # Remover job existente e adicionar o novo
    NEW_CRONTAB=$(echo "$CURRENT_CRONTAB" | grep -v "/api/logs/cleanup")
else
    echo "Adicionando nova configuração de limpeza automática..."
    NEW_CRONTAB="$CURRENT_CRONTAB"
fi

# Adicionar o novo job
if [ -n "$NEW_CRONTAB" ]; then
    echo -e "$NEW_CRONTAB\n$CRON_COMMAND" | crontab -
else
    echo "$CRON_COMMAND" | crontab -
fi

echo "Limpeza automática configurada com sucesso!"
echo "Horário: $CRON_TIME"
echo "URL: $APP_URL/api/logs/cleanup"

# Verificar se o cron service está rodando
if systemctl is-active --quiet cron 2>/dev/null; then
    echo "Serviço cron está ativo."
elif systemctl is-active --quiet crond 2>/dev/null; then
    echo "Serviço crond está ativo."
else
    echo "Aviso: Serviço cron pode não estar ativo. Verifique manualmente."
fi

echo "Configuração concluída!"
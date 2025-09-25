#!/bin/bash

# Script de Demonstração da API GAZAPI
# Este script testa todos os endpoints implementados

echo "=== TESTE DA API GAZAPI ==="
echo "Servidor: http://localhost:3000"
echo "Data: $(date)"
echo ""

BASE_URL="http://localhost:3000/api/gazapi"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}Testando:${NC} $description"
    echo -e "${YELLOW}$method${NC} $BASE_URL$endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    # Separar response body e status code
    http_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ Status: $http_code${NC}"
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo -e "${YELLOW}⚠ Status: $http_code (Esperado - erro de autenticação/validação)${NC}"
    else
        echo -e "${RED}✗ Status: $http_code${NC}"
    fi
    
    # Mostrar resposta (limitada)
    echo "Resposta: $(echo "$response_body" | head -c 200)..."
    echo ""
}

echo "=== ENDPOINTS DE INFORMAÇÃO ==="

# Ping
test_endpoint "GET" "/ping" "" "Ping - Verificar conectividade"

# Info
test_endpoint "GET" "/info" "" "Info - Listar endpoints disponíveis"

echo "=== ENDPOINTS DE SESSÃO ==="

# Start Session
test_endpoint "POST" "/start" '{"colaboradorId":"test_user"}' "Start - Iniciar sessão (sem auth)"

# Get Session Status
test_endpoint "POST" "/getSessionStatus" '{"session":"test","sessionKey":"key","token":"invalid"}' "Get Session Status"

# Get QR Code
test_endpoint "POST" "/getQrCode" '{"session":"test","sessionKey":"key","token":"invalid"}' "Get QR Code"

# Close Session
test_endpoint "POST" "/close" '{"session":"test","sessionKey":"key","token":"invalid"}' "Close Session"

echo "=== ENDPOINTS DE MENSAGENS ==="

# Send Text
test_endpoint "POST" "/sendText" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","message":"teste"}' "Send Text"

# Send Image
test_endpoint "POST" "/sendImage" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","mediaUrl":"http://example.com/image.jpg"}' "Send Image"

# Send Video
test_endpoint "POST" "/sendVideo" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","mediaUrl":"http://example.com/video.mp4"}' "Send Video"

# Send Audio
test_endpoint "POST" "/sendAudio" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","mediaUrl":"http://example.com/audio.mp3"}' "Send Audio"

# Send Document
test_endpoint "POST" "/sendDocument" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","mediaUrl":"http://example.com/doc.pdf","filename":"documento.pdf"}' "Send Document"

# Send Contact
test_endpoint "POST" "/sendContact" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","contactName":"João","phoneNumber":"5511999999999"}' "Send Contact"

# Send Location
test_endpoint "POST" "/sendLocation" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","latitude":-23.5505,"longitude":-46.6333,"address":"São Paulo, SP"}' "Send Location"

# Send Sticker
test_endpoint "POST" "/sendSticker" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","mediaUrl":"http://example.com/sticker.webp"}' "Send Sticker"

# Get Messages
test_endpoint "POST" "/getMessages" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","limit":10}' "Get Messages"

# Mark as Read
test_endpoint "POST" "/markAsRead" '{"session":"test","sessionKey":"key","token":"invalid","chatId":"123","messageId":"msg123"}' "Mark as Read"

echo "=== ENDPOINTS DE GRUPOS ==="

# Create Group
test_endpoint "POST" "/createGroup" '{"session":"test","sessionKey":"key","token":"invalid","groupName":"Grupo Teste","participants":["5511999999999","5511888888888"]}' "Create Group"

# Get Groups
test_endpoint "POST" "/getGroups" '{"session":"test","sessionKey":"key","token":"invalid"}' "Get Groups"

echo "=== ENDPOINTS DE CONTATOS ==="

# Get Contacts
test_endpoint "POST" "/getContacts" '{"session":"test","sessionKey":"key","token":"invalid"}' "Get Contacts"

# Check Number
test_endpoint "POST" "/checkNumber" '{"session":"test","sessionKey":"key","token":"invalid","phoneNumber":"5511999999999"}' "Check Number"

echo "=== ENDPOINTS DE WEBHOOKS ==="

# Set Webhook
test_endpoint "POST" "/setWebhook" '{"session":"test","sessionKey":"key","token":"invalid","webhookUrl":"https://example.com/webhook","events":["message","status"],"enabled":true}' "Set Webhook"

# Get Webhook
test_endpoint "POST" "/getWebhook" '{"session":"test","sessionKey":"key","token":"invalid"}' "Get Webhook"

echo "=== ENDPOINTS ADMINISTRATIVOS ==="

# Stats
test_endpoint "POST" "/stats" '{"token":"invalid_admin_token"}' "Stats - Estatísticas da API"

echo ""
echo "=== RESUMO DOS TESTES ==="
echo -e "${GREEN}✓${NC} Todos os endpoints foram testados"
echo -e "${YELLOW}⚠${NC} Erros de autenticação são esperados (401/403)"
echo -e "${BLUE}ℹ${NC} Para testes completos, configure autenticação válida"
echo ""
echo "Para mais informações, consulte: /app/GAZAPI_README.md"
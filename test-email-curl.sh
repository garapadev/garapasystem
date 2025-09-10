#!/bin/bash

# Script para testar API de email usando curl

echo "🔍 Testando API de envio de email com curl..."

# URL base da API
BASE_URL="http://localhost:3000"

# Arquivo temporário para cookies
COOKIE_JAR="/tmp/cookies.txt"

# Limpar cookies anteriores
rm -f $COOKIE_JAR

echo "🔐 Fazendo login..."

# Primeiro, obter o CSRF token
CSRF_RESPONSE=$(curl -s -c $COOKIE_JAR "$BASE_URL/api/auth/csrf")
CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | sed 's/"csrfToken":"//' | sed 's/"//')

echo "🔑 CSRF Token: $CSRF_TOKEN"
echo "📋 CSRF Response: $CSRF_RESPONSE"

# Tentar fazer login diretamente via API interna (como o test-email-api.js faz)
echo "🔐 Tentando login via API interna..."
LOGIN_RESPONSE=$(curl -s -b $COOKIE_JAR -c $COOKIE_JAR \
  -X POST \
  -H "Content-Type: application/json" \
  -w "HTTP_CODE:%{http_code}" \
  -d '{"email":"admin@garapasystem.com","password":"123456"}' \
  "$BASE_URL/api/auth/login")

echo "📋 Resposta do login: $LOGIN_RESPONSE"

# Aguardar um pouco para o cookie ser processado
sleep 2

# Verificar se o login foi bem-sucedido verificando a sessão
SESSION_RESPONSE=$(curl -s -b $COOKIE_JAR "$BASE_URL/api/auth/session")
echo "👤 Sessão atual: $SESSION_RESPONSE"

# Verificar cookies salvos
echo "🍪 Cookies salvos:"
cat $COOKIE_JAR

# Testar envio de email
echo "📧 Enviando email via API..."

# Criar dados do email
EMAIL_DATA='{
  "to": "teste@exemplo.com",
  "subject": "Teste de Email via curl",
  "body": "Este é um email de teste enviado via curl para verificar se as correções de timeout funcionaram.",
  "isHtml": "false",
  "isDraft": "false"
}'

# Enviar email com timeout de 120 segundos
EMAIL_RESPONSE=$(curl -s -b $COOKIE_JAR \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$EMAIL_DATA" \
  --max-time 120 \
  -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}\nTIME_CONNECT:%{time_connect}\nTIME_NAMELOOKUP:%{time_namelookup}\n" \
  "$BASE_URL/api/emails/send")

echo "📨 Resposta do envio de email:"
echo "$EMAIL_RESPONSE"

# Limpar cookies
rm -f $COOKIE_JAR

echo "✅ Teste concluído!"
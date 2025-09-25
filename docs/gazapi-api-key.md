# GAZAPI - Informações da API Key

## API Key de Teste

**Token:** `test-gazapi-token-2024`
**Nome:** Test GAZAPI Key
**Status:** Ativo
**Permissões:** 
- gazapi.read
- gazapi.write  
- gazapi.admin

## Como usar

### Headers de Autenticação
```
Authorization: Bearer test-gazapi-token-2024
Content-Type: application/json
```

### Endpoints Testados e Funcionando

#### 1. Iniciar Sessão WhatsApp
```bash
curl -X POST http://localhost:3000/api/gazapi/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-gazapi-token-2024" \
  -d '{
    "colaboradorId": "test123"
  }'
```

#### 2. Iniciar Sessão (Endpoint Alternativo)
```bash
curl -X POST http://localhost:3000/api/gazapi/startSession \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-gazapi-token-2024" \
  -d '{
    "session": "test123",
    "sessionKey": "key_test123",
    "token": "gazapi_admin_2024"
  }'
```

#### 3. Verificar Status da Sessão
```bash
curl -X POST http://localhost:3000/api/gazapi/getSessionStatus \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-gazapi-token-2024" \
  -d '{
    "colaboradorId": "test123"
  }'
```

## Respostas Esperadas

### Sucesso na Criação de Sessão
```json
{
  "success": true,
  "message": "Sessão iniciada com sucesso",
  "data": {
    "session": "test123",
    "status": "qr_required",
    "qrCode": "2@PcYqF55YTSG4K8u8XUZddp5+bl5jbsO6Kp+2c6dK3nc2tS+tlzEWffLBmjHXdD+ERwuZza5tjb58I5n+HrPMpBPsobRFAK0oat0=,yRoNpNpl/8KXIu0PF9kvW1wat7aE1kTuNz2PFVauQUk=,WRj6xYk8n2IaA9w5/xMbTirrQK9s3OIkfqjNdxpv+TI=,tRZ74GPwjx6lu2vJOF4ga5+/6mxilQXWxjBEsi1aCbI="
  }
}
```

### Status da Sessão
```json
{
  "success": true,
  "message": "Status da sessão obtido com sucesso",
  "data": {
    "session": "test123",
    "status": "qr_required",
    "qrCode": "..."
  }
}
```

## Notas Importantes

1. **Worker WhatsApp:** O worker está rodando no PM2 e funcionando corretamente
2. **Autenticação:** O problema anterior era que o token da API key não coincidia com o hash armazenado no banco
3. **Parâmetros:** Para endpoints com API key, use `colaboradorId` em vez de `session` diretamente
4. **QR Code:** O QR Code é retornado quando a sessão precisa ser conectada ao WhatsApp

## Problema Resolvido

O problema de autenticação foi causado por:
- Token da API key gerado aleatoriamente pelo script `create-test-apikey.js`
- Hash armazenado no banco não coincidia com o token usado nos testes
- Solução: Criada nova API key com token conhecido `test-gazapi-token-2024`

Data da resolução: 2025-01-19
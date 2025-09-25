# GAZAPI - WhatsApp API Gateway

Uma API REST completa para integração com WhatsApp Web, construída com Next.js e TypeScript.

## 🚀 Características

- ✅ Gerenciamento completo de sessões WhatsApp
- ✅ Envio de mensagens (texto, imagem, áudio, vídeo, documentos, stickers, contatos, localização)
- ✅ Gerenciamento de grupos e contatos
- ✅ Sistema de webhooks para eventos em tempo real
- ✅ Verificação de números no WhatsApp
- ✅ Marcação de mensagens como lidas
- ✅ Estatísticas e monitoramento
- ✅ API RESTful com respostas JSON padronizadas

## 📋 Pré-requisitos

- Node.js 18+
- PM2 (para gerenciamento de processos)
- Acesso à internet para conectar ao WhatsApp Web

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev

# Ou usar PM2 para produção
pm2 start ecosystem.config.js
```

## 🔧 Configuração

A API usa as seguintes configurações padrão:

```typescript
{
  adminToken: 'admin_token_123',
  sessionTimeout: 300000, // 5 minutos
  messageDelay: 1000,     // 1 segundo
  maxRetries: 3,
  workerUrl: 'http://localhost:3001'
}
```

## 📚 Endpoints da API

### 🔐 Autenticação

Todos os endpoints (exceto `/info` e `/ping`) requerem:
- `token`: Token administrativo
- `session`: ID da sessão
- `sessionKey`: Chave da sessão

### 📱 Gerenciamento de Sessões

#### Iniciar Sessão
```http
POST /api/gazapi/startSession
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123"
}
```

#### Obter QR Code
```http
POST /api/gazapi/getQrCode
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123"
}
```

#### Status da Sessão
```http
POST /api/gazapi/getSessionStatus
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123"
}
```

#### Fechar Sessão
```http
POST /api/gazapi/closeSession
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123"
}
```

### 💬 Envio de Mensagens

#### Texto
```http
POST /api/gazapi/sendText
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123",
  "chatId": "5511999999999@s.whatsapp.net",
  "message": "Olá! Como posso ajudar?"
}
```

#### Imagem
```http
POST /api/gazapi/sendImage
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123",
  "chatId": "5511999999999@s.whatsapp.net",
  "mediaUrl": "https://exemplo.com/imagem.jpg",
  "caption": "Legenda da imagem"
}
```

#### Localização
```http
POST /api/gazapi/sendLocation
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123",
  "chatId": "5511999999999@s.whatsapp.net",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "address": "São Paulo, SP"
}
```

#### Contato
```http
POST /api/gazapi/sendContact
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123",
  "chatId": "5511999999999@s.whatsapp.net",
  "contactName": "João Silva",
  "contactPhone": "5511888888888"
}
```

### 👥 Grupos e Contatos

#### Criar Grupo
```http
POST /api/gazapi/createGroup
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123",
  "groupName": "Meu Grupo",
  "participants": ["5511999999999", "5511888888888"]
}
```

#### Listar Grupos
```http
POST /api/gazapi/getGroups
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123"
}
```

#### Listar Contatos
```http
POST /api/gazapi/getContacts
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123"
}
```

#### Verificar Número
```http
POST /api/gazapi/checkNumber
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123",
  "phoneNumber": "5511999999999"
}
```

### 🔔 Webhooks

#### Configurar Webhook
```http
POST /api/gazapi/setWebhook
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123",
  "webhookUrl": "https://meusite.com/webhook",
  "events": ["message", "status", "connection"],
  "enabled": true
}
```

#### Obter Webhook
```http
POST /api/gazapi/getWebhook
Content-Type: application/json

{
  "session": "minha_sessao",
  "sessionKey": "chave_secreta",
  "token": "admin_token_123"
}
```

### 📊 Monitoramento

#### Ping
```http
GET /api/gazapi/ping
```

#### Informações da API
```http
GET /api/gazapi/info
```

#### Estatísticas
```http
POST /api/gazapi/stats
Content-Type: application/json

{
  "token": "admin_token_123"
}
```

## 📝 Formato de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "message": "Descrição da operação",
  "data": {
    // Dados específicos do endpoint
  },
  "error": "Código do erro (apenas em caso de falha)"
}
```

## 🔄 Códigos de Status HTTP

- `200`: Sucesso
- `400`: Erro de validação ou parâmetros
- `401`: Não autorizado (token inválido)
- `405`: Método não permitido
- `500`: Erro interno do servidor

## 🎯 Eventos de Webhook

Quando configurado, o webhook receberá eventos:

### Mensagem Recebida
```json
{
  "event": "message",
  "session": "minha_sessao",
  "data": {
    "messageId": "msg_123",
    "chatId": "5511999999999@s.whatsapp.net",
    "fromMe": false,
    "messageType": "text",
    "content": "Olá!",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### Mudança de Status
```json
{
  "event": "status",
  "session": "minha_sessao",
  "data": {
    "status": "connected",
    "phoneNumber": "5511999999999",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

## 🛡️ Segurança

- Use tokens seguros em produção
- Configure HTTPS para webhooks
- Valide sempre as chaves de sessão
- Monitore logs para atividades suspeitas

## 🐛 Troubleshooting

### Sessão não conecta
1. Verifique se o QR Code foi escaneado
2. Confirme se a internet está estável
3. Tente reiniciar a sessão

### Mensagens não são enviadas
1. Verifique se a sessão está conectada
2. Confirme o formato do chatId
3. Verifique se o número existe no WhatsApp

### Webhook não recebe eventos
1. Confirme se a URL está acessível
2. Verifique se os eventos estão habilitados
3. Monitore logs de erro

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Verifique os logs da aplicação
- Use o endpoint `/api/gazapi/stats` para diagnósticos
- Consulte a documentação dos endpoints em `/api/gazapi/info`

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.
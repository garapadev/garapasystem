# Módulo WhatsApp - API GarapaSystem

## Visão Geral

O módulo WhatsApp do GarapaSystem oferece uma integração completa com APIs de WhatsApp, permitindo o envio e recebimento de mensagens, gerenciamento de sessões e automação de comunicação. O sistema suporta múltiplas APIs (WuzAPI e WAHA) através de um padrão de adaptadores, oferecendo flexibilidade e escalabilidade.

## Características Principais

### 🔌 Múltiplas APIs Suportadas
- **WuzAPI**: API local para WhatsApp Web
- **WAHA**: WhatsApp HTTP API (Web Application for HTTP API)
- Padrão de adaptadores para fácil extensão

### 📱 Gerenciamento de Sessões
- Criação e gerenciamento de sessões por colaborador
- Autenticação via QR Code
- Monitoramento de status em tempo real
- Reconexão automática

### 💬 Envio de Mensagens
- Mensagens de texto
- Suporte a diferentes tipos de mídia
- Validação de destinatários
- Controle de status de entrega

### 🔄 Proxy Inteligente
- Roteamento automático entre APIs
- Autenticação transparente
- Headers de CORS configurados
- Logs detalhados para debug

### 🎯 Webhooks
- Recebimento de mensagens em tempo real
- Eventos de status de sessão
- Processamento de QR Codes
- Sistema de eventos extensível

## Relacionamentos entre Entidades

### Colaborador ↔ WhatsApp Token
```
Colaborador {
  id: string
  whatsappToken: string?
  whatsappInstanceName: string?
}
```

### Configurações de API
```
Configuracao {
  chave: string
  valor: string
}

// Chaves relacionadas ao WhatsApp:
- whatsapp_api_type: 'wuzapi' | 'waha'
- wuzapi_url: string
- wuzapi_admin_token: string
- waha_url: string
- waha_api_key: string
```

## Endpoints da API

### 1. Rotas Dinâmicas do WhatsApp
**Endpoint:** `/api/whatsapp/[...path]`

#### Listar Status
```http
GET /api/whatsapp/status
```

**Resposta:**
```json
{
  "status": "online",
  "version": "1.0.0",
  "adapter": "wuzapi"
}
```

#### Listar Sessões
```http
GET /api/whatsapp/sessions
```

**Resposta:**
```json
{
  "sessions": [
    {
      "id": "session_123",
      "name": "Colaborador 1",
      "status": "working",
      "qr": null
    }
  ]
}
```

#### Criar Sessão
```http
POST /api/whatsapp/sessions
Content-Type: application/json

{
  "name": "Nova Sessão",
  "token": "session_token_123"
}
```

#### Obter Status da Sessão
```http
GET /api/whatsapp/sessions/{sessionId}
```

#### Deletar Sessão
```http
DELETE /api/whatsapp/sessions/{sessionId}
```

#### Enviar Mensagem
```http
POST /api/whatsapp/send
Content-Type: application/json
X-Session-Id: session_123

{
  "to": "5511999999999",
  "body": "Olá! Esta é uma mensagem de teste.",
  "type": "text"
}
```

**Resposta:**
```json
{
  "success": true,
  "messageId": "msg_abc123"
}
```

### 2. Proxy WuzAPI
**Endpoint:** `/api/wuzapi/[...path]`

Proxy transparente para a API WuzAPI com:
- Autenticação automática
- Roteamento de endpoints
- Logs detalhados
- Headers CORS

#### Exemplo de Uso
```http
POST /api/wuzapi/session_123/send-message
Content-Type: application/json

{
  "phone": "5511999999999",
  "message": "Mensagem via proxy"
}
```

### 3. Token do WhatsApp para Colaboradores
**Endpoint:** `/api/colaboradores/whatsapp-token`

#### Obter Token
```http
GET /api/colaboradores/whatsapp-token
Authorization: Bearer {session_token}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "collab_123",
    "whatsappToken": "token_abc123",
    "whatsappInstanceName": "Instância Principal"
  },
  "authType": "session"
}
```

#### Atualizar Token
```http
PUT /api/colaboradores/whatsapp-token
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "whatsappToken": "novo_token_123",
  "whatsappInstanceName": "Nova Instância"
}
```

### 4. Webhook do WhatsApp
**Endpoint:** `/api/webhooks/whatsapp`

#### Receber Eventos
```http
POST /api/webhooks/whatsapp
Content-Type: application/json

{
  "event": "message",
  "data": {
    "from": "5511999999999",
    "body": "Mensagem recebida",
    "timestamp": 1640995200
  }
}
```

#### Verificar Status
```http
GET /api/webhooks/whatsapp
```

**Resposta:**
```json
{
  "status": "active",
  "endpoint": "/api/webhooks/whatsapp",
  "message": "Webhook WhatsApp está ativo"
}
```

## Códigos de Status HTTP

| Código | Descrição | Uso |
|--------|-----------|-----|
| 200 | Sucesso | Operação realizada com sucesso |
| 201 | Criado | Sessão/usuário criado com sucesso |
| 400 | Requisição Inválida | Dados de entrada inválidos |
| 401 | Não Autorizado | Token de autenticação inválido |
| 403 | Proibido | Permissões insuficientes |
| 404 | Não Encontrado | Sessão/usuário não encontrado |
| 500 | Erro Interno | Erro no servidor ou API externa |

## Validações e Regras de Negócio

### Autenticação
- Todas as rotas requerem autenticação válida
- API Keys têm permissões específicas por endpoint
- Sessões de usuário são validadas por email

### Sessões
- Uma sessão por colaborador
- Token único por sessão
- Status válidos: `starting`, `scan_qr`, `working`, `failed`, `stopped`

### Mensagens
- Destinatário obrigatório (formato internacional)
- Corpo da mensagem obrigatório
- Sessão deve estar ativa (`working`)

### Configurações
- URLs de API devem ser válidas
- Tokens de autenticação são obrigatórios
- Tipo de API deve ser `wuzapi` ou `waha`

## Segurança

### Controle de Acesso
- Autenticação por sessão ou API Key
- Validação de permissões por endpoint
- Isolamento de dados por colaborador

### Validação de Dados
- Sanitização de inputs
- Validação de formatos de telefone
- Escape de caracteres especiais

### Logs e Auditoria
- Logs detalhados de requisições
- Rastreamento de erros
- Monitoramento de uso

## Performance e Otimização

### Cache
- Cache de configurações de API
- Reutilização de adaptadores
- Conexões WebSocket persistentes

### Rate Limiting
- Controle de taxa por colaborador
- Throttling de mensagens
- Proteção contra spam

### Monitoramento
- Health checks das APIs
- Métricas de performance
- Alertas de falhas

## Integração com Outros Módulos

### Colaboradores
- Associação de tokens por colaborador
- Validação de permissões
- Histórico de atividades

### Notificações
- Eventos de mensagens recebidas
- Alertas de desconexão
- Status de entrega

### Configurações
- Gerenciamento de APIs ativas
- Configurações globais
- Fallbacks automáticos

## Exemplos de Uso

### Inicializar Sessão
```javascript
// 1. Configurar token do colaborador
const response = await fetch('/api/colaboradores/whatsapp-token', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer ' + sessionToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    whatsappToken: 'meu_token_123',
    whatsappInstanceName: 'Atendimento'
  })
});

// 2. Criar sessão
const sessionResponse = await fetch('/api/whatsapp/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Sessão Atendimento',
    token: 'meu_token_123'
  })
});

// 3. Verificar status (pode retornar QR Code)
const statusResponse = await fetch('/api/whatsapp/sessions/meu_token_123');
const status = await statusResponse.json();

if (status.status === 'scan_qr' && status.qr) {
  // Exibir QR Code para o usuário
  console.log('QR Code:', status.qr);
}
```

### Enviar Mensagem
```javascript
const messageResponse = await fetch('/api/whatsapp/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Session-Id': 'meu_token_123'
  },
  body: JSON.stringify({
    to: '5511999999999',
    body: 'Olá! Como posso ajudá-lo hoje?',
    type: 'text'
  })
});

const result = await messageResponse.json();
if (result.success) {
  console.log('Mensagem enviada:', result.messageId);
}
```

### Processar Webhook
```javascript
// No webhook handler
app.post('/api/webhooks/whatsapp', (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'message':
      console.log('Nova mensagem:', data);
      // Processar mensagem recebida
      break;
    case 'status':
      console.log('Status atualizado:', data);
      // Atualizar status da sessão
      break;
    case 'qr':
      console.log('QR Code gerado:', data);
      // Enviar QR Code para o frontend
      break;
  }
  
  res.json({ success: true });
});
```

## Webhooks e Eventos

### Eventos Suportados
- `message`: Nova mensagem recebida
- `status`: Mudança de status da sessão
- `qr`: QR Code gerado/atualizado
- `session.ready`: Sessão conectada
- `session.disconnected`: Sessão desconectada

### Configuração de Webhooks
```json
{
  "webhooks": [
    {
      "url": "https://meuapp.com/api/webhooks/whatsapp",
      "events": ["message", "session.status"],
      "secret": "webhook_secret_123"
    }
  ]
}
```

## Troubleshooting

### Problemas Comuns

#### Sessão não conecta
- Verificar se a API está online
- Validar token de autenticação
- Verificar configurações de rede

#### QR Code não aparece
- Verificar status da sessão
- Tentar recriar a sessão
- Verificar logs da API

#### Mensagens não são enviadas
- Verificar se a sessão está ativa
- Validar formato do número de telefone
- Verificar rate limits

### Logs Importantes
```bash
# Logs do proxy
WuzAPI Proxy: { targetUrl, apiPath, authMethod }

# Logs de webhook
📨 Webhook WhatsApp recebido: { event, data }

# Logs de erro
❌ Erro ao processar webhook WhatsApp: error
```

## Relatórios e Métricas

### Métricas Disponíveis
- Número de sessões ativas
- Mensagens enviadas/recebidas
- Taxa de sucesso de entrega
- Tempo de resposta das APIs
- Erros por tipo

### Dashboards
- Status das sessões por colaborador
- Volume de mensagens por período
- Performance das APIs
- Alertas de falhas

## Changelog

### v1.0.0 (Atual)
- ✅ Suporte a WuzAPI e WAHA
- ✅ Gerenciamento de sessões
- ✅ Envio de mensagens
- ✅ Sistema de webhooks
- ✅ Proxy transparente
- ✅ Autenticação por colaborador

### Próximas Versões
- 🔄 Suporte a mensagens de mídia
- 🔄 Chat em tempo real
- 🔄 Automação de respostas
- 🔄 Integração com CRM
- 🔄 Analytics avançados

## Suporte

### Documentação Técnica
- Código fonte: `/app/src/app/api/whatsapp/`
- Adaptadores: `/app/src/lib/whatsapp/adapters/`
- Tipos: `/app/src/lib/whatsapp/types.ts`

### APIs Externas
- [WuzAPI Documentation](https://github.com/wuzapi/wuzapi)
- [WAHA Documentation](https://waha.devlike.pro/)

### Contato
- Email: suporte@garapasystem.com
- Documentação: `/app/docs/`
- Issues: Sistema interno de tickets
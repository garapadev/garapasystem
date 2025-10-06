# Troubleshooting - API GarapaSystem

## Problemas Comuns e Soluções

### 1. Autenticação

#### Erro 401: Unauthorized

**Problema**: Token inválido ou expirado
```json
{
  "error": "Unauthorized",
  "message": "Token inválido ou expirado"
}
```

**Soluções**:
1. Verificar se o token está sendo enviado corretamente:
```javascript
// ✅ Correto
headers: {
  'Authorization': 'Bearer YOUR_API_KEY'
}

// ❌ Incorreto
headers: {
  'Authorization': 'YOUR_API_KEY'
}
```

2. Verificar se a API Key não expirou:
```bash
# Verificar validade da API Key
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://seu-dominio.com/api/auth/validate
```

3. Gerar nova API Key se necessário:
```javascript
// POST /api/api-keys
const novaChave = await fetch('/api/api-keys', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ADMIN_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    nome: 'Nova Chave',
    permissoes: ['clientes.read', 'clientes.write']
  })
});
```

#### Erro 403: Forbidden

**Problema**: Usuário autenticado mas sem permissão
```json
{
  "error": "Forbidden",
  "message": "Permissão insuficiente para acessar este recurso"
}
```

**Soluções**:
1. Verificar permissões da API Key:
```javascript
// GET /api/auth/permissions
const permissoes = await fetch('/api/auth/permissions', {
  headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
}).then(res => res.json());

console.log('Permissões:', permissoes);
```

2. Solicitar permissões adicionais ao administrador
3. Usar API Key com permissão 'admin' para acesso total

### 2. Rate Limiting

#### Erro 429: Too Many Requests

**Problema**: Limite de requisições excedido
```json
{
  "error": "Too Many Requests",
  "message": "Limite de requisições excedido",
  "retryAfter": 60
}
```

**Soluções**:
1. Implementar retry com backoff:
```javascript
async function requestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || 60;
        console.log(`Rate limited, waiting ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

2. Monitorar headers de rate limit:
```javascript
const response = await fetch('/api/clientes');
console.log('Rate Limit Info:', {
  limit: response.headers.get('X-RateLimit-Limit'),
  remaining: response.headers.get('X-RateLimit-Remaining'),
  reset: response.headers.get('X-RateLimit-Reset')
});
```

3. Implementar cache para reduzir requisições:
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function getCachedData(key, fetchFn) {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 3. Validação de Dados

#### Erro 422: Unprocessable Entity

**Problema**: Dados inválidos ou campos obrigatórios ausentes
```json
{
  "error": "Validation Error",
  "message": "Os dados fornecidos são inválidos",
  "details": {
    "email": ["Email é obrigatório", "Formato de email inválido"],
    "telefone": ["Telefone deve ter pelo menos 10 dígitos"]
  }
}
```

**Soluções**:
1. Validar dados no frontend antes de enviar:
```javascript
function validateCliente(cliente) {
  const errors = {};
  
  if (!cliente.nome || cliente.nome.trim().length < 2) {
    errors.nome = ['Nome deve ter pelo menos 2 caracteres'];
  }
  
  if (!cliente.email || !/\S+@\S+\.\S+/.test(cliente.email)) {
    errors.email = ['Email é obrigatório e deve ser válido'];
  }
  
  if (!cliente.telefone || cliente.telefone.replace(/\D/g, '').length < 10) {
    errors.telefone = ['Telefone deve ter pelo menos 10 dígitos'];
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
}

// Uso
const errors = validateCliente(dadosCliente);
if (errors) {
  console.error('Dados inválidos:', errors);
  return;
}
```

2. Tratar erros de validação da API:
```javascript
async function createCliente(dados) {
  try {
    const response = await fetch('/api/clientes', {
      method: 'POST',
      headers: defaultHeaders,
      body: JSON.stringify(dados)
    });
    
    if (response.status === 422) {
      const error = await response.json();
      
      // Exibir erros específicos por campo
      Object.entries(error.details).forEach(([field, messages]) => {
        const fieldElement = document.querySelector(`[name="${field}"]`);
        if (fieldElement) {
          fieldElement.setCustomValidity(messages.join(', '));
          fieldElement.reportValidity();
        }
      });
      
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    return null;
  }
}
```

### 4. Problemas de Conectividade

#### Erro de Rede/Timeout

**Problema**: Falha na conexão ou timeout
```javascript
// TypeError: Failed to fetch
// ou
// TimeoutError: Request timeout
```

**Soluções**:
1. Implementar timeout personalizado:
```javascript
async function fetchWithTimeout(url, options = {}, timeout = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

2. Verificar conectividade:
```javascript
async function checkConnectivity() {
  try {
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch {
    return false;
  }
}

// Uso
if (!(await checkConnectivity())) {
  console.error('Sem conexão com a API');
  // Mostrar mensagem de erro para o usuário
}
```

3. Implementar retry automático:
```javascript
async function retryRequest(fn, maxRetries = 3, delay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      console.log(`Tentativa ${i + 1} falhou, tentando novamente...`);
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
    }
  }
}
```

### 5. Problemas com Webhooks

#### Webhook não está sendo chamado

**Diagnóstico**:
1. Verificar se o webhook está ativo:
```javascript
// GET /api/webhooks
const webhooks = await fetch('/api/webhooks', {
  headers: defaultHeaders
}).then(res => res.json());

const webhook = webhooks.find(w => w.url === 'sua-url');
console.log('Webhook ativo:', webhook?.ativo);
```

2. Verificar logs de webhook:
```javascript
// GET /api/webhooks/[id]/logs
const logs = await fetch(`/api/webhooks/${webhookId}/logs`, {
  headers: defaultHeaders
}).then(res => res.json());

console.log('Últimas tentativas:', logs);
```

**Soluções**:
1. Verificar se a URL está acessível:
```bash
# Testar webhook manualmente
curl -X POST https://sua-url.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

2. Implementar endpoint de teste:
```javascript
// No seu servidor
app.post('/webhook/test', (req, res) => {
  console.log('Webhook recebido:', req.body);
  res.status(200).json({ received: true });
});
```

3. Verificar certificado SSL:
```bash
# Verificar SSL
curl -I https://sua-url.com/webhook
```

#### Webhook recebendo dados duplicados

**Problema**: Mesmo evento sendo processado múltiplas vezes

**Soluções**:
1. Implementar idempotência:
```javascript
const processedEvents = new Set();

app.post('/webhook', (req, res) => {
  const eventId = req.body.id;
  
  if (processedEvents.has(eventId)) {
    console.log('Evento já processado:', eventId);
    return res.status(200).json({ status: 'already_processed' });
  }
  
  // Processar evento
  processEvent(req.body);
  processedEvents.add(eventId);
  
  res.status(200).json({ status: 'processed' });
});
```

2. Usar banco de dados para controle:
```javascript
app.post('/webhook', async (req, res) => {
  const eventId = req.body.id;
  
  const existing = await db.webhookEvent.findUnique({
    where: { eventId }
  });
  
  if (existing) {
    return res.status(200).json({ status: 'already_processed' });
  }
  
  await db.webhookEvent.create({
    data: { eventId, processedAt: new Date() }
  });
  
  // Processar evento
  await processEvent(req.body);
  
  res.status(200).json({ status: 'processed' });
});
```

### 6. Problemas com E-mail

#### Sincronização de e-mail falhando

**Diagnóstico**:
1. Verificar configuração de e-mail:
```javascript
// GET /api/email-config
const configs = await fetch('/api/email-config', {
  headers: defaultHeaders
}).then(res => res.json());

console.log('Configurações:', configs);
```

2. Testar conexão:
```javascript
// POST /api/email-config/test
const teste = await fetch('/api/email-config/test', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify({ configId: 'config-id' })
}).then(res => res.json());

console.log('Teste de conexão:', teste);
```

**Soluções**:
1. Verificar credenciais:
```javascript
// Atualizar senha se necessário
await fetch(`/api/email-config/${configId}`, {
  method: 'PUT',
  headers: defaultHeaders,
  body: JSON.stringify({
    senha: 'nova-senha',
    servidor: 'imap.gmail.com',
    porta: 993,
    ssl: true
  })
});
```

2. Verificar configurações do servidor:
```javascript
// Configurações comuns
const servidores = {
  gmail: { servidor: 'imap.gmail.com', porta: 993, ssl: true },
  outlook: { servidor: 'outlook.office365.com', porta: 993, ssl: true },
  yahoo: { servidor: 'imap.mail.yahoo.com', porta: 993, ssl: true }
};
```

### 7. Performance

#### Requisições lentas

**Diagnóstico**:
1. Medir tempo de resposta:
```javascript
async function measureApiPerformance(url, options) {
  const start = performance.now();
  
  try {
    const response = await fetch(url, options);
    const end = performance.now();
    
    console.log(`${url}: ${(end - start).toFixed(2)}ms`);
    return response;
  } catch (error) {
    const end = performance.now();
    console.error(`${url} failed after ${(end - start).toFixed(2)}ms:`, error);
    throw error;
  }
}
```

2. Verificar tamanho da resposta:
```javascript
const response = await fetch('/api/clientes');
const contentLength = response.headers.get('content-length');
console.log('Tamanho da resposta:', contentLength, 'bytes');
```

**Soluções**:
1. Usar paginação:
```javascript
// ❌ Buscar todos os registros
const allClients = await fetch('/api/clientes');

// ✅ Usar paginação
const clients = await fetch('/api/clientes?limit=50&offset=0');
```

2. Implementar cache:
```javascript
const cache = new Map();

async function getCachedClients() {
  if (cache.has('clients')) {
    return cache.get('clients');
  }
  
  const clients = await fetch('/api/clientes').then(res => res.json());
  cache.set('clients', clients);
  
  // Limpar cache após 5 minutos
  setTimeout(() => cache.delete('clients'), 5 * 60 * 1000);
  
  return clients;
}
```

3. Usar campos específicos:
```javascript
// Se a API suportar, buscar apenas campos necessários
const clients = await fetch('/api/clientes?fields=id,nome,email');
```

### 8. Debugging

#### Habilitar logs detalhados

**Frontend**:
```javascript
// Interceptar todas as requisições
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch:', args[0], args[1]);
  
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Response:', response.status, response.statusText);
      return response;
    })
    .catch(error => {
      console.error('Fetch error:', error);
      throw error;
    });
};
```

**Backend** (verificar logs do PM2):
```bash
# Ver logs em tempo real
pm2 logs garapasystem

# Ver logs específicos
pm2 logs garapasystem --lines 100

# Ver logs de erro
pm2 logs garapasystem --err
```

#### Usar ferramentas de desenvolvimento

**Postman/Insomnia**:
```json
{
  "name": "GarapaSystem API",
  "requests": [
    {
      "name": "Listar Clientes",
      "method": "GET",
      "url": "{{baseUrl}}/api/clientes",
      "headers": {
        "Authorization": "Bearer {{apiKey}}"
      }
    }
  ],
  "variables": {
    "baseUrl": "https://seu-dominio.com",
    "apiKey": "sua-api-key"
  }
}
```

**cURL para testes rápidos**:
```bash
# Teste básico
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://seu-dominio.com/api/clientes

# Teste com dados
curl -X POST \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"nome":"Teste","email":"teste@exemplo.com"}' \
     https://seu-dominio.com/api/clientes

# Teste com verbose para debug
curl -v -H "Authorization: Bearer YOUR_API_KEY" \
     https://seu-dominio.com/api/clientes
```

## Checklist de Troubleshooting

### Antes de Reportar um Bug

- [ ] Verificar se a API Key está válida e não expirou
- [ ] Confirmar que as permissões necessárias estão configuradas
- [ ] Testar com cURL ou Postman para isolar o problema
- [ ] Verificar logs do navegador (Console, Network)
- [ ] Confirmar que a URL base está correta
- [ ] Verificar se não há problemas de conectividade
- [ ] Testar com dados mínimos para reproduzir o erro
- [ ] Verificar se o problema persiste em diferentes ambientes

### Informações para Incluir no Reporte

1. **Endpoint**: URL completa da requisição
2. **Método HTTP**: GET, POST, PUT, DELETE
3. **Headers**: Incluindo Authorization
4. **Payload**: Dados enviados (sem informações sensíveis)
5. **Resposta**: Status code e corpo da resposta
6. **Logs**: Logs relevantes do frontend e backend
7. **Ambiente**: Desenvolvimento, staging, produção
8. **Timestamp**: Quando o erro ocorreu
9. **Frequência**: Se o erro é consistente ou intermitente
10. **Passos para reproduzir**: Sequência exata de ações

---

*Guia atualizado em: Janeiro 2024*
*Versão da API: 0.2.37.13*
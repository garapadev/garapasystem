# Referência Rápida - API GarapaSystem

## Informações Básicas

- **Base URL**: `https://seu-dominio.com/api`
- **Versão**: 0.2.37.13
- **Formato**: JSON
- **Autenticação**: Bearer Token (API Key ou JWT)

## Headers Obrigatórios

```http
Authorization: Bearer YOUR_API_KEY_OR_JWT
Content-Type: application/json
```

## Endpoints Principais

### Autenticação
```http
POST /api/auth/signin                 # Login (NextAuth)
GET  /api/auth/signout               # Logout
```

### Usuários
```http
GET    /api/usuarios                 # Listar usuários
POST   /api/usuarios                 # Criar usuário
GET    /api/usuarios/[id]            # Obter usuário
PUT    /api/usuarios/[id]            # Atualizar usuário
DELETE /api/usuarios/[id]            # Deletar usuário
```

### Clientes
```http
GET    /api/clientes                 # Listar clientes
POST   /api/clientes                 # Criar cliente
GET    /api/clientes/[id]            # Obter cliente
PUT    /api/clientes/[id]            # Atualizar cliente
DELETE /api/clientes/[id]            # Deletar cliente
```

### Colaboradores
```http
GET    /api/colaboradores            # Listar colaboradores
POST   /api/colaboradores            # Criar colaborador
GET    /api/colaboradores/[id]       # Obter colaborador
PUT    /api/colaboradores/[id]       # Atualizar colaborador
DELETE /api/colaboradores/[id]       # Deletar colaborador
GET    /api/colaboradores/me         # Dados do usuário atual
```

### Tarefas
```http
GET    /api/tasks                    # Listar tarefas
POST   /api/tasks                    # Criar tarefa
GET    /api/tasks/[id]               # Obter tarefa
PUT    /api/tasks/[id]               # Atualizar tarefa
DELETE /api/tasks/[id]               # Deletar tarefa
GET    /api/tasks/dashboard          # Dashboard de tarefas
GET    /api/tasks/calendar           # Calendário de tarefas
```

### Ordens de Serviço
```http
GET    /api/ordens-servico          # Listar ordens
POST   /api/ordens-servico          # Criar ordem
GET    /api/ordens-servico/[id]     # Obter ordem
PUT    /api/ordens-servico/[id]     # Atualizar ordem
DELETE /api/ordens-servico/[id]     # Deletar ordem
```

### Orçamentos
```http
GET    /api/orcamentos              # Listar orçamentos
POST   /api/orcamentos              # Criar orçamento
GET    /api/orcamentos/[id]         # Obter orçamento
PUT    /api/orcamentos/[id]         # Atualizar orçamento
DELETE /api/orcamentos/[id]         # Deletar orçamento
```

### E-mails
```http
GET    /api/emails                  # Listar e-mails
GET    /api/emails/[id]             # Obter e-mail
POST   /api/emails/send             # Enviar e-mail
POST   /api/email-sync              # Sincronizar e-mails
```

### WhatsApp
```http
GET    /api/whatsapp/status         # Status da conexão
POST   /api/whatsapp/connect        # Conectar WhatsApp
POST   /api/whatsapp/disconnect     # Desconectar WhatsApp
```

### Administração
```http
GET    /api/api-keys                # Listar API Keys
POST   /api/api-keys                # Criar API Key
DELETE /api/api-keys/[id]           # Deletar API Key
GET    /api/webhooks                # Listar webhooks
POST   /api/webhooks                # Criar webhook
GET    /api/logs                    # Logs do sistema
```

### Sistema
```http
GET    /api/health                  # Status do sistema
GET    /api/system/version          # Versão do sistema
```

## Códigos de Status

| Código | Significado |
|--------|-------------|
| 200 | OK - Sucesso |
| 201 | Created - Recurso criado |
| 204 | No Content - Sucesso sem conteúdo |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito de dados |
| 422 | Unprocessable Entity - Dados não processáveis |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro interno |

## Permissões

### Formato
```
{recurso}.{acao}
```

### Principais Permissões
- `admin` - Acesso total
- `usuarios.read` - Ler usuários
- `usuarios.write` - Criar/editar usuários
- `usuarios.delete` - Deletar usuários
- `clientes.read` - Ler clientes
- `clientes.write` - Criar/editar clientes
- `clientes.delete` - Deletar clientes
- `tasks.read` - Ler tarefas
- `tasks.write` - Criar/editar tarefas
- `tasks.delete` - Deletar tarefas

## Rate Limiting

- **Limite Padrão**: 100 requisições/minuto
- **Headers de Resposta**:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Timestamp do reset

## Paginação

### Parâmetros de Query
```http
GET /api/clientes?limit=50&offset=0&orderBy=nome&order=asc
```

- `limit` - Número de itens por página (padrão: 50, máximo: 100)
- `offset` - Número de itens a pular (padrão: 0)
- `orderBy` - Campo para ordenação
- `order` - Direção da ordenação (`asc` ou `desc`)

### Resposta
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 50,
    "totalPages": 3
  }
}
```

## Filtros Comuns

### Clientes
```http
GET /api/clientes?nome=João&ativo=true&cidade=São Paulo
```

### Tarefas
```http
GET /api/tasks?status=pendente&prioridade=alta&responsavel=clb123
```

### Ordens de Serviço
```http
GET /api/ordens-servico?status=aberta&cliente=cli456&dataInicio=2024-01-01
```

## Exemplos de Payloads

### Criar Cliente
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "telefone": "(11) 99999-9999",
  "documento": "123.456.789-00",
  "enderecos": [{
    "logradouro": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "principal": true
  }]
}
```

### Criar Tarefa
```json
{
  "titulo": "Revisar proposta",
  "descricao": "Revisar proposta comercial para cliente X",
  "status": "pendente",
  "prioridade": "alta",
  "dataVencimento": "2024-01-20T18:00:00Z",
  "responsavelId": "clb123",
  "clienteId": "cli456"
}
```

### Criar Ordem de Serviço
```json
{
  "clienteId": "cli456",
  "responsavelId": "clb123",
  "titulo": "Manutenção preventiva",
  "descricao": "Manutenção preventiva em equipamentos",
  "prioridade": "media",
  "dataAgendamento": "2024-01-25T14:00:00Z",
  "itens": [{
    "descricao": "Limpeza de equipamentos",
    "quantidade": 1,
    "valorUnitario": 150.00
  }]
}
```

### Criar API Key
```json
{
  "nome": "Integração Sistema X",
  "permissoes": ["clientes.read", "clientes.write"],
  "expiresAt": "2024-12-31T23:59:59Z"
}
```

## Tratamento de Erros

### Estrutura de Erro
```json
{
  "error": "Validation Error",
  "message": "Os dados fornecidos são inválidos",
  "details": {
    "email": ["Email é obrigatório"],
    "senha": ["Senha deve ter pelo menos 8 caracteres"]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/usuarios"
}
```

### Exemplo de Tratamento (JavaScript)
```javascript
try {
  const response = await fetch('/api/clientes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clienteData)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Erro da API:', error.message);
    
    if (error.details) {
      Object.entries(error.details).forEach(([field, messages]) => {
        console.error(`${field}: ${messages.join(', ')}`);
      });
    }
    return;
  }

  const cliente = await response.json();
  console.log('Cliente criado:', cliente);
} catch (error) {
  console.error('Erro de rede:', error);
}
```

## Webhooks

### Criar Webhook
```json
{
  "nome": "Notificação de Tarefas",
  "url": "https://seu-sistema.com/webhook/tarefas",
  "eventos": ["task.created", "task.updated", "task.completed"],
  "ativo": true,
  "headers": {
    "X-Webhook-Secret": "seu-secret-aqui"
  }
}
```

### Payload do Webhook
```json
{
  "id": "wh_123456789",
  "event": "task.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "resourceType": "task",
    "resourceId": "tsk123",
    "action": "created",
    "after": {
      "id": "tsk123",
      "titulo": "Nova tarefa",
      "status": "pendente"
    }
  },
  "metadata": {
    "apiVersion": "0.2.37.13",
    "source": "garapasystem",
    "userId": "usr123"
  }
}
```

## Dicas de Performance

### 1. Use Paginação
```javascript
// ❌ Não faça isso
const allClients = await fetch('/api/clientes');

// ✅ Faça isso
const clients = await fetch('/api/clientes?limit=50&offset=0');
```

### 2. Implemente Cache
```javascript
const cache = new Map();

async function getClient(id) {
  if (cache.has(id)) {
    return cache.get(id);
  }
  
  const client = await fetch(`/api/clientes/${id}`);
  cache.set(id, client);
  return client;
}
```

### 3. Use Retry com Backoff
```javascript
async function retryRequest(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

## Ferramentas Úteis

### cURL
```bash
# Criar cliente
curl -X POST https://seu-dominio.com/api/clientes \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","email":"joao@exemplo.com"}'
```

### Postman Collection
Importe a collection do Postman disponível em: `/docs/postman-collection.json`

### SDK JavaScript (Exemplo)
```javascript
class GarapaSystemAPI {
  constructor(apiKey, baseUrl = 'https://seu-dominio.com/api') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  // Métodos específicos
  async getClients(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/clientes?${query}`);
  }

  async createClient(data) {
    return this.request('/clientes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Uso
const api = new GarapaSystemAPI('your-api-key');
const clients = await api.getClients({ limit: 10 });
```

---

*Referência atualizada em: Janeiro 2024*
*Versão da API: 0.2.37.13*
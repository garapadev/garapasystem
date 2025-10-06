# Documentação da API - GarapaSystem

## Índice

1. [Visão Geral](#visão-geral)
2. [Autenticação](#autenticação)
3. [Rotas da API](#rotas-da-api)
4. [Módulos e Permissões](#módulos-e-permissões)
5. [Rate Limiting](#rate-limiting)
6. [Códigos de Status](#códigos-de-status)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Segurança](#segurança)
9. [Versionamento](#versionamento)
10. [Boas Práticas](#boas-práticas)

---

## Visão Geral

O GarapaSystem é uma API REST construída com Next.js 14 que oferece funcionalidades completas para gestão empresarial, incluindo:

- **Versão Atual**: 0.2.37.13
- **Base URL**: `https://seu-dominio.com/api`
- **Formato de Dados**: JSON
- **Protocolo**: HTTPS (recomendado)

### Principais Funcionalidades

- Gestão de clientes e colaboradores
- Sistema de tarefas e ordens de serviço
- Integração com WhatsApp
- Sistema de e-mails
- Gestão de orçamentos
- Sistema de permissões granular
- Webhooks e integrações

---

## Autenticação

O sistema suporta dois métodos de autenticação:

### 1. Autenticação por Sessão (NextAuth.js)

Utiliza JWT (JSON Web Tokens) para autenticação de usuários via interface web.

#### Configuração

```javascript
// Configuração do NextAuth
providers: [
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    }
  })
]
```

#### Fluxo de Autenticação

1. **Login**: `POST /api/auth/signin`
2. **Validação**: Verificação de credenciais no banco de dados
3. **Token JWT**: Geração de token com dados do usuário
4. **Sessão**: Manutenção da sessão via cookies

#### Exemplo de Login

```bash
curl -X POST https://seu-dominio.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### 2. Autenticação por API Key

Para integrações e acesso programático à API.

#### Geração de API Key

```bash
curl -X POST https://seu-dominio.com/api/api-keys \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Integração Sistema X",
    "permissoes": ["clientes.read", "clientes.write"],
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

#### Uso da API Key

```bash
curl -X GET https://seu-dominio.com/api/clientes \
  -H "Authorization: Bearer API_KEY_AQUI"
```

#### Características das API Keys

- **Hash SHA-256**: Armazenamento seguro no banco
- **Permissões Granulares**: Controle específico por recurso
- **Expiração**: Configurável ou sem expiração
- **Rate Limiting**: Controle de requisições por chave

---

## Rotas da API

### Estrutura de Endpoints

Todos os endpoints seguem o padrão REST:

- `GET /api/recurso` - Listar recursos
- `POST /api/recurso` - Criar recurso
- `GET /api/recurso/[id]` - Obter recurso específico
- `PUT /api/recurso/[id]` - Atualizar recurso
- `DELETE /api/recurso/[id]` - Deletar recurso

### Principais Grupos de Endpoints

#### 1. Autenticação e Usuários

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/auth/[...nextauth]` | POST | Autenticação NextAuth | Público |
| `/api/usuarios` | GET | Listar usuários | `usuarios.read` |
| `/api/usuarios` | POST | Criar usuário | `usuarios.write` |
| `/api/usuarios/[id]` | GET | Obter usuário | `usuarios.read` |
| `/api/usuarios/[id]` | PUT | Atualizar usuário | `usuarios.write` |
| `/api/usuarios/[id]` | DELETE | Deletar usuário | `usuarios.delete` |

#### 2. Clientes

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/clientes` | GET | Listar clientes | `clientes.read` |
| `/api/clientes` | POST | Criar cliente | `clientes.write` |
| `/api/clientes/[id]` | GET | Obter cliente | `clientes.read` |
| `/api/clientes/[id]` | PUT | Atualizar cliente | `clientes.write` |
| `/api/clientes/[id]` | DELETE | Deletar cliente | `clientes.delete` |

#### 3. Colaboradores

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/colaboradores` | GET | Listar colaboradores | `colaboradores.read` |
| `/api/colaboradores` | POST | Criar colaborador | `colaboradores.write` |
| `/api/colaboradores/[id]` | GET | Obter colaborador | `colaboradores.read` |
| `/api/colaboradores/[id]` | PUT | Atualizar colaborador | `colaboradores.write` |
| `/api/colaboradores/[id]` | DELETE | Deletar colaborador | `colaboradores.delete` |
| `/api/colaboradores/me` | GET | Dados do usuário atual | `colaboradores.read` |

#### 4. Tarefas

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/tasks` | GET | Listar tarefas | `tasks.read` |
| `/api/tasks` | POST | Criar tarefa | `tasks.write` |
| `/api/tasks/[id]` | GET | Obter tarefa | `tasks.read` |
| `/api/tasks/[id]` | PUT | Atualizar tarefa | `tasks.write` |
| `/api/tasks/[id]` | DELETE | Deletar tarefa | `tasks.delete` |
| `/api/tasks/dashboard` | GET | Dashboard de tarefas | `tasks.read` |
| `/api/tasks/calendar` | GET | Calendário de tarefas | `tasks.read` |

#### 5. Ordens de Serviço

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/ordens-servico` | GET | Listar ordens | `ordens.read` |
| `/api/ordens-servico` | POST | Criar ordem | `ordens.write` |
| `/api/ordens-servico/[id]` | GET | Obter ordem | `ordens.read` |
| `/api/ordens-servico/[id]` | PUT | Atualizar ordem | `ordens.write` |
| `/api/ordens-servico/[id]` | DELETE | Deletar ordem | `ordens.delete` |

#### 6. Orçamentos

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/orcamentos` | GET | Listar orçamentos | `orcamentos.read` |
| `/api/orcamentos` | POST | Criar orçamento | `orcamentos.write` |
| `/api/orcamentos/[id]` | GET | Obter orçamento | `orcamentos.read` |
| `/api/orcamentos/[id]` | PUT | Atualizar orçamento | `orcamentos.write` |
| `/api/orcamentos/[id]` | DELETE | Deletar orçamento | `orcamentos.delete` |

#### 7. E-mails

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/emails` | GET | Listar e-mails | `emails.read` |
| `/api/emails/[id]` | GET | Obter e-mail | `emails.read` |
| `/api/emails/send` | POST | Enviar e-mail | `emails.write` |
| `/api/email-sync` | POST | Sincronizar e-mails | `emails.sync` |

#### 8. WhatsApp

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/whatsapp/status` | GET | Status da conexão | `whatsapp.read` |
| `/api/whatsapp/connect` | POST | Conectar WhatsApp | `whatsapp.write` |
| `/api/whatsapp/disconnect` | POST | Desconectar WhatsApp | `whatsapp.write` |

#### 9. Administração

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/api-keys` | GET | Listar API Keys | `admin` |
| `/api/api-keys` | POST | Criar API Key | `admin` |
| `/api/api-keys/[id]` | DELETE | Deletar API Key | `admin` |
| `/api/webhooks` | GET | Listar webhooks | `admin` |
| `/api/webhooks` | POST | Criar webhook | `admin` |
| `/api/logs` | GET | Logs do sistema | `logs.read` |

#### 10. Sistema

| Endpoint | Método | Descrição | Permissões |
|----------|--------|-----------|------------|
| `/api/health` | GET | Status do sistema | Público |
| `/api/system/version` | GET | Versão do sistema | Público |

---

## Módulos e Permissões

### Sistema de Permissões

O sistema utiliza permissões granulares baseadas em recursos e ações:

#### Formato das Permissões

```
{recurso}.{acao}
```

Exemplos:
- `clientes.read` - Ler clientes
- `clientes.write` - Criar/editar clientes
- `clientes.delete` - Deletar clientes
- `admin` - Acesso total ao sistema

#### Principais Módulos

##### 1. Gestão de Clientes
- **Permissões**: `clientes.read`, `clientes.write`, `clientes.delete`
- **Funcionalidades**: CRUD completo de clientes, endereços, contatos

##### 2. Gestão de Colaboradores
- **Permissões**: `colaboradores.read`, `colaboradores.write`, `colaboradores.delete`
- **Funcionalidades**: CRUD de colaboradores, perfis, grupos hierárquicos

##### 3. Sistema de Tarefas
- **Permissões**: `tasks.read`, `tasks.write`, `tasks.delete`
- **Funcionalidades**: Gestão de tarefas, recorrência, automação

##### 4. Ordens de Serviço
- **Permissões**: `ordens.read`, `ordens.write`, `ordens.delete`
- **Funcionalidades**: Gestão completa de ordens de serviço

##### 5. Sistema de E-mails
- **Permissões**: `emails.read`, `emails.write`, `emails.sync`
- **Funcionalidades**: Gestão de e-mails, sincronização, pastas

##### 6. Administração
- **Permissões**: `admin`
- **Funcionalidades**: Gestão de API Keys, webhooks, logs, configurações

### Hierarquia de Permissões

```
admin (acesso total)
├── usuarios.* (gestão de usuários)
├── colaboradores.* (gestão de colaboradores)
├── clientes.* (gestão de clientes)
├── tasks.* (gestão de tarefas)
├── ordens.* (ordens de serviço)
├── orcamentos.* (orçamentos)
├── emails.* (sistema de e-mails)
└── logs.read (visualização de logs)
```

---

## Rate Limiting

### Configuração Padrão

- **Janela de Tempo**: 60 segundos (1 minuto)
- **Limite Padrão**: 100 requisições por minuto
- **Identificação**: Por API Key ou IP

### Limites por Tipo de Autenticação

#### API Keys
- **Padrão**: 100 req/min
- **Premium**: 1000 req/min
- **Enterprise**: 5000 req/min

#### Sessão de Usuário
- **Padrão**: 200 req/min

### Headers de Rate Limiting

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Resposta de Limite Excedido

```json
{
  "error": "Rate limit exceeded",
  "message": "Muitas requisições. Tente novamente em 60 segundos.",
  "retryAfter": 60
}
```

---

## Códigos de Status

### Códigos de Sucesso

| Código | Descrição | Uso |
|--------|-----------|-----|
| 200 | OK | Requisição bem-sucedida |
| 201 | Created | Recurso criado com sucesso |
| 204 | No Content | Operação bem-sucedida sem conteúdo |

### Códigos de Erro do Cliente

| Código | Descrição | Uso |
|--------|-----------|-----|
| 400 | Bad Request | Dados inválidos na requisição |
| 401 | Unauthorized | Autenticação necessária |
| 403 | Forbidden | Sem permissão para o recurso |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito de dados (ex: email duplicado) |
| 422 | Unprocessable Entity | Dados válidos mas não processáveis |
| 429 | Too Many Requests | Rate limit excedido |

### Códigos de Erro do Servidor

| Código | Descrição | Uso |
|--------|-----------|-----|
| 500 | Internal Server Error | Erro interno do servidor |
| 502 | Bad Gateway | Erro de gateway |
| 503 | Service Unavailable | Serviço temporariamente indisponível |

### Formato de Resposta de Erro

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

---

## Exemplos Práticos

### 1. Criar um Cliente

```bash
curl -X POST https://seu-dominio.com/api/clientes \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Resposta:**
```json
{
  "id": "clm1234567890",
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "telefone": "(11) 99999-9999",
  "documento": "123.456.789-00",
  "ativo": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "enderecos": [{
    "id": "end1234567890",
    "logradouro": "Rua das Flores, 123",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234-567",
    "principal": true
  }]
}
```

### 2. Listar Tarefas com Filtros

```bash
curl -X GET "https://seu-dominio.com/api/tasks?status=pendente&responsavel=clb123&limit=10&offset=0" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "tsk1234567890",
      "titulo": "Revisar proposta comercial",
      "descricao": "Revisar e ajustar proposta para cliente X",
      "status": "pendente",
      "prioridade": "alta",
      "dataVencimento": "2024-01-20T18:00:00Z",
      "responsavel": {
        "id": "clb123",
        "nome": "Maria Santos"
      },
      "cliente": {
        "id": "cli456",
        "nome": "Empresa ABC"
      }
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### 3. Criar uma Ordem de Serviço

```bash
curl -X POST https://seu-dominio.com/api/ordens-servico \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "clienteId": "cli456",
    "responsavelId": "clb123",
    "titulo": "Manutenção preventiva",
    "descricao": "Manutenção preventiva em equipamentos",
    "prioridade": "media",
    "dataAgendamento": "2024-01-25T14:00:00Z",
    "itens": [
      {
        "descricao": "Limpeza de equipamentos",
        "quantidade": 1,
        "valorUnitario": 150.00
      }
    ]
  }'
```

### 4. Webhook de Notificação

```bash
curl -X POST https://seu-dominio.com/api/webhooks \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Notificação de Tarefas",
    "url": "https://seu-sistema.com/webhook/tarefas",
    "eventos": ["task.created", "task.updated", "task.completed"],
    "ativo": true,
    "headers": {
      "X-Webhook-Secret": "seu-secret-aqui"
    }
  }'
```

---

## Segurança

### Práticas de Segurança Implementadas

#### 1. Autenticação e Autorização
- **JWT Tokens**: Tokens seguros com expiração
- **API Keys**: Hash SHA-256 para armazenamento
- **Permissões Granulares**: Controle específico por recurso

#### 2. Proteção de Dados
- **HTTPS Obrigatório**: Todas as comunicações criptografadas
- **Validação de Entrada**: Sanitização de todos os dados
- **SQL Injection**: Proteção via Prisma ORM

#### 3. Rate Limiting
- **Controle de Requisições**: Prevenção de ataques DDoS
- **Identificação por IP/API Key**: Controle granular

#### 4. Logs e Auditoria
- **Log de Ações**: Registro de todas as operações
- **Auditoria de Acesso**: Controle de tentativas de acesso

### Configurações de Segurança

#### Headers de Segurança
```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

#### Validação de API Key
```javascript
// Exemplo de validação
const isValidApiKey = (key) => {
  return /^[a-zA-Z0-9]{32,}$/.test(key);
};
```

---

## Versionamento

### Estratégia de Versionamento

- **Versão Atual**: 0.2.37.13
- **Formato**: Semantic Versioning (MAJOR.MINOR.PATCH.BUILD)
- **Compatibilidade**: Backward compatibility mantida em minor versions

### Ciclo de Vida das Versões

#### Versões Suportadas
- **v0.2.x**: Versão atual (suporte completo)
- **v0.1.x**: Versão legada (suporte limitado até 2024-06-30)

#### Deprecação de Endpoints

Endpoints depreciados são marcados com headers específicos:

```http
X-API-Deprecated: true
X-API-Sunset: 2024-06-30T00:00:00Z
X-API-Replacement: /api/v2/novo-endpoint
```

### Changelog

#### v0.2.37.13 (Atual)
- ✅ Correção de bugs em rotas de parâmetros
- ✅ Melhorias no sistema de rate limiting
- ✅ Novos endpoints para gestão de e-mails

#### v0.2.36.x
- ✅ Implementação de webhooks
- ✅ Sistema de permissões granulares
- ✅ Integração com WhatsApp

---

## Boas Práticas

### Para Desenvolvedores

#### 1. Autenticação
```javascript
// Sempre inclua o header de autorização
const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};
```

#### 2. Tratamento de Erros
```javascript
try {
  const response = await fetch('/api/clientes', { headers });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Erro da API:', error.message);
    return;
  }
  
  const data = await response.json();
  // Processar dados...
} catch (error) {
  console.error('Erro de rede:', error);
}
```

#### 3. Paginação
```javascript
// Sempre use paginação para listas grandes
const params = new URLSearchParams({
  limit: '50',
  offset: '0',
  orderBy: 'createdAt',
  order: 'desc'
});

const url = `/api/clientes?${params}`;
```

#### 4. Rate Limiting
```javascript
// Implemente retry com backoff exponencial
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Backoff exponencial
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

### Para Administradores

#### 1. Gestão de API Keys
- **Rotação Regular**: Renove API Keys periodicamente
- **Permissões Mínimas**: Conceda apenas permissões necessárias
- **Monitoramento**: Acompanhe uso e tentativas de acesso

#### 2. Monitoramento
- **Logs**: Configure retenção adequada de logs
- **Alertas**: Configure alertas para erros e rate limiting
- **Performance**: Monitore tempos de resposta

#### 3. Backup e Recuperação
- **Backup Regular**: Configure backups automáticos
- **Teste de Recuperação**: Teste procedimentos regularmente
- **Documentação**: Mantenha procedimentos documentados

---

## Suporte e Contato

### Recursos de Suporte

- **Documentação**: Esta documentação completa
- **Logs**: Sistema de logs detalhado em `/api/logs`
- **Health Check**: Endpoint `/api/health` para monitoramento

### Informações de Contato

- **Suporte Técnico**: suporte@garapasystem.com
- **Documentação Online**: https://docs.garapasystem.com
- **Status da API**: https://status.garapasystem.com

---

*Documentação atualizada em: Janeiro 2024*
*Versão da API: 0.2.37.13*
# Módulo Clientes - API GarapaSystem

## Visão Geral

O módulo de Clientes é responsável pelo gerenciamento completo de clientes e prospects do sistema, incluindo informações pessoais, endereços, status de relacionamento e integração com outros módulos como oportunidades e tarefas.

**Versão da API:** 0.2.37.13  
**Base URL:** `/api/clientes`  
**Autenticação:** Sessão ou API Key  
**Permissões:** `clients:read`, `clients:write`, `clients:delete`

---

## Características do Módulo

### Funcionalidades Principais
- ✅ Listagem paginada de clientes
- ✅ Criação de novos clientes
- ✅ Busca e filtros avançados
- ✅ Atualização de dados do cliente
- ✅ Exclusão de clientes
- ✅ Gerenciamento de endereços múltiplos
- ✅ Controle de status (Lead, Cliente, Inativo)
- ✅ Associação com grupos hierárquicos
- ✅ Validação de dados e documentos

### Tipos de Cliente
- **PESSOA_FISICA**: Pessoa física
- **PESSOA_JURIDICA**: Pessoa jurídica

### Status do Cliente
- **LEAD**: Prospect em prospecção
- **CLIENTE**: Cliente ativo
- **INATIVO**: Cliente inativo

### Relacionamentos
- **Grupo Hierárquico**: Cliente pode pertencer a um grupo
- **Endereços**: Cliente pode ter múltiplos endereços
- **Oportunidades**: Cliente pode ter várias oportunidades
- **Tarefas**: Cliente pode ter tarefas associadas
- **Ordens de Serviço**: Cliente pode ter ordens de serviço

---

## Endpoints

### 1. Listar Clientes
```http
GET /api/clientes
```

**Parâmetros de Query:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | integer | Não | Página atual (padrão: 1) |
| `limit` | integer | Não | Itens por página (padrão: 10) |
| `search` | string | Não | Busca por nome ou email |
| `status` | string | Não | Filtrar por status (LEAD, CLIENTE, INATIVO) |
| `grupoId` | string | Não | Filtrar por grupo hierárquico |

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "telefone": "(11) 99999-9999",
      "documento": "123.456.789-00",
      "tipo": "PESSOA_FISICA",
      "status": "CLIENTE",
      "observacoes": "Cliente VIP",
      "valorPotencial": 50000.00,
      "grupoHierarquicoId": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "grupoHierarquico": {
        "id": "uuid",
        "nome": "Clientes Premium"
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

### 2. Criar Cliente
```http
POST /api/clientes
```

**Body da Requisição:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@exemplo.com",
  "telefone": "(11) 88888-8888",
  "documento": "987.654.321-00",
  "tipo": "PESSOA_FISICA",
  "status": "LEAD",
  "observacoes": "Interessada em consultoria",
  "valorPotencial": 25000.00,
  "grupoHierarquicoId": "uuid",
  "cep": "01234-567",
  "logradouro": "Rua das Flores",
  "numero": "123",
  "bairro": "Centro",
  "complemento": "Apto 45",
  "cidade": "São Paulo",
  "estado": "SP",
  "pais": "Brasil",
  "informacoesAdicionais": "Próximo ao metrô"
}
```

**Validações:**
- ✅ Nome é obrigatório
- ✅ Email deve ser único (se fornecido)
- ✅ Documento deve ser válido (se fornecido)
- ✅ Tipo deve ser PESSOA_FISICA ou PESSOA_JURIDICA
- ✅ Status deve ser LEAD, CLIENTE ou INATIVO

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "nome": "Maria Santos",
  "email": "maria@exemplo.com",
  "telefone": "(11) 88888-8888",
  "documento": "987.654.321-00",
  "tipo": "PESSOA_FISICA",
  "status": "LEAD",
  "observacoes": "Interessada em consultoria",
  "valorPotencial": 25000.00,
  "grupoHierarquicoId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "grupoHierarquico": {
    "id": "uuid",
    "nome": "Prospects"
  },
  "enderecos": [
    {
      "id": "uuid",
      "cep": "01234-567",
      "logradouro": "Rua das Flores",
      "numero": "123",
      "bairro": "Centro",
      "complemento": "Apto 45",
      "cidade": "São Paulo",
      "estado": "SP",
      "pais": "Brasil",
      "tipo": "RESIDENCIAL",
      "principal": true,
      "ativo": true
    }
  ]
}
```

### 3. Buscar Cliente por ID
```http
GET /api/clientes/{id}
```

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | UUID do cliente |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "telefone": "(11) 99999-9999",
  "documento": "123.456.789-00",
  "tipo": "PESSOA_FISICA",
  "status": "CLIENTE",
  "observacoes": "Cliente VIP",
  "valorPotencial": 50000.00,
  "grupoHierarquicoId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "grupoHierarquico": {
    "id": "uuid",
    "nome": "Clientes Premium",
    "descricao": "Clientes com alto valor"
  },
  "enderecos": [
    {
      "id": "uuid",
      "cep": "01234-567",
      "logradouro": "Rua Principal",
      "numero": "456",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "tipo": "COMERCIAL",
      "principal": true,
      "ativo": true
    }
  ]
}
```

### 4. Atualizar Cliente
```http
PUT /api/clientes/{id}
```

**Body da Requisição:**
```json
{
  "nome": "João Silva Santos",
  "email": "joao.santos@exemplo.com",
  "telefone": "(11) 99999-8888",
  "status": "CLIENTE",
  "valorPotencial": 75000.00,
  "observacoes": "Cliente VIP - Renovação contrato",
  "enderecos": [
    {
      "cep": "01234-567",
      "logradouro": "Rua Principal",
      "numero": "456",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "tipo": "COMERCIAL",
      "principal": true,
      "ativo": true
    }
  ]
}
```

**Validações:**
- ✅ Email deve ser único (se alterado)
- ✅ Pelo menos um endereço deve ser principal
- ✅ Dados obrigatórios devem ser mantidos

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "nome": "João Silva Santos",
  "email": "joao.santos@exemplo.com",
  "telefone": "(11) 99999-8888",
  "status": "CLIENTE",
  "valorPotencial": 75000.00,
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 5. Excluir Cliente
```http
DELETE /api/clientes/{id}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Cliente excluído com sucesso"
}
```

---

## Estrutura de Endereços

### Tipos de Endereço
- **RESIDENCIAL**: Endereço residencial
- **COMERCIAL**: Endereço comercial
- **CORRESPONDENCIA**: Endereço para correspondência
- **ENTREGA**: Endereço para entrega

### Campos do Endereço
```json
{
  "id": "uuid",
  "cep": "01234-567",
  "logradouro": "Rua das Flores",
  "numero": "123",
  "bairro": "Centro",
  "complemento": "Apto 45",
  "cidade": "São Paulo",
  "estado": "SP",
  "pais": "Brasil",
  "tipo": "RESIDENCIAL",
  "informacoesAdicionais": "Próximo ao metrô",
  "principal": true,
  "ativo": true,
  "clienteId": "uuid"
}
```

---

## Códigos de Status

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| 200 | OK | Operação realizada com sucesso |
| 201 | Created | Cliente criado com sucesso |
| 400 | Bad Request | Dados inválidos ou obrigatórios ausentes |
| 401 | Unauthorized | Token de autenticação inválido |
| 403 | Forbidden | Sem permissão para a operação |
| 404 | Not Found | Cliente não encontrado |
| 409 | Conflict | Email já cadastrado |
| 422 | Unprocessable Entity | Dados não processáveis |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Exemplos de Uso

### Exemplo 1: Criar Cliente Pessoa Física
```javascript
const novoCliente = {
  nome: "Ana Costa",
  email: "ana@exemplo.com",
  telefone: "(11) 77777-7777",
  documento: "111.222.333-44",
  tipo: "PESSOA_FISICA",
  status: "LEAD",
  valorPotencial: 15000.00,
  cep: "01234-567",
  logradouro: "Av. Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "SP"
};

const response = await fetch('/api/clientes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sua-api-key'
  },
  body: JSON.stringify(novoCliente)
});

const cliente = await response.json();
console.log('Cliente criado:', cliente);
```

### Exemplo 2: Buscar Clientes por Status
```javascript
const params = new URLSearchParams({
  page: '1',
  limit: '50',
  status: 'CLIENTE',
  search: 'silva'
});

const response = await fetch(`/api/clientes?${params}`, {
  headers: {
    'Authorization': 'Bearer sua-api-key'
  }
});

const { data, meta } = await response.json();
console.log(`Encontrados ${meta.total} clientes ativos`);
```

### Exemplo 3: Atualizar Status para Cliente
```javascript
const atualizacao = {
  status: "CLIENTE",
  valorPotencial: 50000.00,
  observacoes: "Convertido de lead para cliente"
};

const response = await fetch('/api/clientes/uuid-do-cliente', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sua-api-key'
  },
  body: JSON.stringify(atualizacao)
});

if (response.ok) {
  console.log('Cliente atualizado com sucesso');
}
```

### Exemplo 4: Cliente com Múltiplos Endereços
```javascript
const clienteCompleto = {
  nome: "Empresa XYZ Ltda",
  email: "contato@empresaxyz.com",
  documento: "12.345.678/0001-90",
  tipo: "PESSOA_JURIDICA",
  status: "CLIENTE",
  enderecos: [
    {
      cep: "01234-567",
      logradouro: "Rua Comercial",
      numero: "100",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
      tipo: "COMERCIAL",
      principal: true
    },
    {
      cep: "09876-543",
      logradouro: "Av. Industrial",
      numero: "500",
      bairro: "Industrial",
      cidade: "São Paulo",
      estado: "SP",
      tipo: "ENTREGA",
      principal: false
    }
  ]
};
```

---

## Integrações e Relacionamentos

### Com Módulo de Oportunidades
```javascript
// Cliente com oportunidades
const clienteComOportunidades = await fetch('/api/clientes/uuid?include=oportunidades');
```

### Com Módulo de Tarefas
```javascript
// Tarefas relacionadas ao cliente
const tarefasCliente = await fetch('/api/tasks?clienteId=uuid-do-cliente');
```

### Com Grupos Hierárquicos
```javascript
// Clientes por grupo
const clientesGrupo = await fetch('/api/clientes?grupoId=uuid-do-grupo');
```

---

## Validações e Regras de Negócio

### Validações de Documento
- **CPF**: Validação de formato e dígitos verificadores
- **CNPJ**: Validação de formato e dígitos verificadores

### Regras de Endereço
- ✅ Pelo menos um endereço deve ser principal
- ✅ Apenas um endereço pode ser principal por vez
- ✅ CEP deve seguir formato brasileiro

### Regras de Status
- **LEAD → CLIENTE**: Conversão permitida
- **CLIENTE → INATIVO**: Inativação permitida
- **INATIVO → CLIENTE**: Reativação permitida

---

## Webhooks

### Eventos Disponíveis
- `cliente.criado`: Quando um novo cliente é criado
- `cliente.atualizado`: Quando um cliente é atualizado
- `cliente.excluido`: Quando um cliente é excluído
- `cliente.status_alterado`: Quando o status do cliente muda

### Payload do Webhook
```json
{
  "evento": "cliente.criado",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "dados": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "status": "LEAD",
    "valorPotencial": 25000.00
  }
}
```

---

## Troubleshooting

### Problemas Comuns

**1. Erro 409 - Email já cadastrado**
```json
{
  "error": "Email já cadastrado"
}
```
**Solução:** Verificar se o email já existe no sistema

**2. Erro 400 - Documento inválido**
```json
{
  "error": "Documento inválido"
}
```
**Solução:** Verificar formato do CPF/CNPJ

**3. Erro 400 - Endereço principal obrigatório**
```json
{
  "error": "Pelo menos um endereço deve ser principal"
}
```
**Solução:** Marcar um endereço como principal

### Debugging
```javascript
// Verificar se cliente existe
const cliente = await fetch('/api/clientes/uuid');
if (!cliente.ok) {
  console.log('Cliente não encontrado');
}

// Validar documento
const validacao = await fetch('/api/clientes/validar-documento', {
  method: 'POST',
  body: JSON.stringify({ documento: '123.456.789-00' })
});
```

---

## Performance e Otimização

### Índices Recomendados
- `email` (único)
- `documento` (único)
- `status`
- `grupoHierarquicoId`
- `createdAt`

### Paginação Eficiente
```javascript
// Use limit adequado para performance
const params = new URLSearchParams({
  page: '1',
  limit: '25', // Recomendado: 10-50
  search: 'termo'
});
```

---

## Changelog

### v0.2.37.13
- ✅ Implementação completa do CRUD
- ✅ Suporte a múltiplos endereços
- ✅ Validação de documentos
- ✅ Integração com grupos hierárquicos
- ✅ Sistema de webhooks
- ✅ Filtros avançados

---

## Suporte

Para dúvidas ou problemas com o módulo de Clientes:

1. **Documentação:** Consulte este documento
2. **Logs:** Verifique `/api/logs/system`
3. **Webhooks:** Monitore `/api/webhooks`
4. **Suporte:** Contate a equipe de desenvolvimento

---

*Documentação gerada automaticamente - GarapaSystem v0.2.37.13*
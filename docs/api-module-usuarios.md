# Módulo Usuários - API GarapaSystem

## Visão Geral

O módulo de Usuários é responsável pelo gerenciamento de contas de usuário do sistema, incluindo criação, autenticação, atualização e controle de acesso. Este módulo trabalha em conjunto com o módulo de Colaboradores para fornecer uma estrutura completa de gestão de pessoas no sistema.

**Versão da API:** 0.2.37.13  
**Base URL:** `/api/usuarios`  
**Autenticação:** Sessão ou API Key  
**Permissões:** `users:read`, `users:write`, `users:delete`

---

## Características do Módulo

### Funcionalidades Principais
- ✅ Listagem paginada de usuários
- ✅ Criação de novos usuários
- ✅ Busca e filtros avançados
- ✅ Atualização de dados do usuário
- ✅ Exclusão de usuários
- ✅ Associação com colaboradores
- ✅ Controle de status (ativo/inativo)
- ✅ Criptografia de senhas (bcrypt)
- ✅ Validação de dados

### Relacionamentos
- **Colaborador**: Um usuário pode estar associado a um colaborador (1:1)
- **Perfil**: Através do colaborador, herda permissões do perfil
- **Grupo Hierárquico**: Através do colaborador, pertence a um grupo

---

## Endpoints

### 1. Listar Usuários
```http
GET /api/usuarios
```

**Parâmetros de Query:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | integer | Não | Página atual (padrão: 1) |
| `limit` | integer | Não | Itens por página (padrão: 10) |
| `search` | string | Não | Busca por nome ou email |
| `ativo` | boolean | Não | Filtrar por status ativo |

**Resposta de Sucesso (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "nome": "Nome do Usuário",
      "ativo": true,
      "colaboradorId": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "colaborador": {
        "id": "uuid",
        "nome": "Nome do Colaborador",
        "email": "colaborador@exemplo.com",
        "cargo": "Desenvolvedor"
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### 2. Criar Usuário
```http
POST /api/usuarios
```

**Body da Requisição:**
```json
{
  "email": "novo@exemplo.com",
  "senha": "senhaSegura123",
  "nome": "Novo Usuário",
  "ativo": true,
  "colaboradorId": "uuid-opcional"
}
```

**Validações:**
- ✅ Email é obrigatório e deve ser único
- ✅ Senha é obrigatória (mínimo 6 caracteres)
- ✅ Nome é obrigatório
- ✅ ColaboradorId deve existir (se fornecido)
- ✅ Colaborador não pode ter usuário duplicado

**Resposta de Sucesso (201):**
```json
{
  "id": "uuid",
  "email": "novo@exemplo.com",
  "nome": "Novo Usuário",
  "ativo": true,
  "colaboradorId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "colaborador": {
    "id": "uuid",
    "nome": "Nome do Colaborador",
    "email": "colaborador@exemplo.com",
    "cargo": "Desenvolvedor"
  }
}
```

### 3. Buscar Usuário por ID
```http
GET /api/usuarios/{id}
```

**Parâmetros de URL:**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | UUID do usuário |

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "email": "usuario@exemplo.com",
  "nome": "Nome do Usuário",
  "ativo": true,
  "colaboradorId": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "colaborador": {
    "id": "uuid",
    "nome": "Nome do Colaborador",
    "email": "colaborador@exemplo.com",
    "cargo": "Desenvolvedor",
    "perfil": {
      "id": "uuid",
      "nome": "Administrador",
      "descricao": "Acesso total ao sistema"
    },
    "grupoHierarquico": {
      "id": "uuid",
      "nome": "TI",
      "descricao": "Departamento de Tecnologia"
    }
  }
}
```

### 4. Atualizar Usuário
```http
PUT /api/usuarios/{id}
```

**Body da Requisição:**
```json
{
  "email": "email@atualizado.com",
  "nome": "Nome Atualizado",
  "ativo": false,
  "senha": "novaSenha123",
  "colaboradorId": "novo-uuid"
}
```

**Validações:**
- ✅ Email e nome são obrigatórios
- ✅ Email deve ser único (exceto o atual)
- ✅ Senha é opcional (se fornecida, será criptografada)
- ✅ ColaboradorId deve existir (se fornecido)

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "email": "email@atualizado.com",
  "nome": "Nome Atualizado",
  "ativo": false,
  "colaboradorId": "novo-uuid",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 5. Excluir Usuário
```http
DELETE /api/usuarios/{id}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Usuário excluído com sucesso"
}
```

---

## Códigos de Status

| Código | Descrição | Quando Ocorre |
|--------|-----------|---------------|
| 200 | OK | Operação realizada com sucesso |
| 201 | Created | Usuário criado com sucesso |
| 400 | Bad Request | Dados inválidos ou obrigatórios ausentes |
| 401 | Unauthorized | Token de autenticação inválido |
| 403 | Forbidden | Sem permissão para a operação |
| 404 | Not Found | Usuário não encontrado |
| 409 | Conflict | Email já cadastrado |
| 422 | Unprocessable Entity | Dados não processáveis |
| 500 | Internal Server Error | Erro interno do servidor |

---

## Exemplos de Uso

### Exemplo 1: Criar Usuário Completo
```javascript
const novoUsuario = {
  email: "joao@empresa.com",
  senha: "senhaSegura123",
  nome: "João Silva",
  ativo: true,
  colaboradorId: "123e4567-e89b-12d3-a456-426614174000"
};

const response = await fetch('/api/usuarios', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sua-api-key'
  },
  body: JSON.stringify(novoUsuario)
});

const usuario = await response.json();
console.log('Usuário criado:', usuario);
```

### Exemplo 2: Buscar Usuários com Filtros
```javascript
const params = new URLSearchParams({
  page: '1',
  limit: '20',
  search: 'joão',
  ativo: 'true'
});

const response = await fetch(`/api/usuarios?${params}`, {
  headers: {
    'Authorization': 'Bearer sua-api-key'
  }
});

const { data, meta } = await response.json();
console.log(`Encontrados ${meta.total} usuários`);
```

### Exemplo 3: Atualizar Status do Usuário
```javascript
const atualizacao = {
  email: "joao@empresa.com",
  nome: "João Silva",
  ativo: false
};

const response = await fetch('/api/usuarios/uuid-do-usuario', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sua-api-key'
  },
  body: JSON.stringify(atualizacao)
});

if (response.ok) {
  console.log('Usuário desativado com sucesso');
}
```

---

## Segurança

### Criptografia de Senhas
- **Algoritmo:** bcrypt com salt rounds = 10
- **Armazenamento:** Apenas hash é armazenado no banco
- **Validação:** Comparação segura durante autenticação

### Validações de Segurança
- ✅ Email único no sistema
- ✅ Senha obrigatória na criação
- ✅ Validação de formato de email
- ✅ Sanitização de dados de entrada
- ✅ Prevenção contra SQL Injection

### Controle de Acesso
- **Leitura:** Requer permissão `users:read`
- **Criação:** Requer permissão `users:write`
- **Atualização:** Requer permissão `users:write`
- **Exclusão:** Requer permissão `users:delete`

---

## Relacionamentos e Integrações

### Com Módulo Colaboradores
```javascript
// Usuário com colaborador associado
{
  "id": "user-uuid",
  "email": "usuario@empresa.com",
  "colaborador": {
    "id": "colaborador-uuid",
    "nome": "Nome do Colaborador",
    "cargo": "Desenvolvedor",
    "perfil": {
      "nome": "Desenvolvedor",
      "permissoes": ["tasks:read", "tasks:write"]
    }
  }
}
```

### Com Sistema de Autenticação
- **NextAuth:** Integração para sessões web
- **API Keys:** Autenticação para integrações
- **JWT:** Tokens para aplicações móveis

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

**2. Erro 400 - Colaborador já possui usuário**
```json
{
  "error": "Colaborador já possui um usuário associado"
}
```
**Solução:** Um colaborador só pode ter um usuário associado

**3. Erro 404 - Colaborador não encontrado**
```json
{
  "error": "Colaborador não encontrado"
}
```
**Solução:** Verificar se o colaboradorId existe

### Debugging
```javascript
// Verificar se usuário existe
const usuario = await fetch('/api/usuarios/uuid');
if (!usuario.ok) {
  console.log('Usuário não encontrado');
}

// Verificar permissões
const auth = await fetch('/api/auth/me');
const { permissions } = await auth.json();
console.log('Permissões:', permissions);
```

---

## Changelog

### v0.2.37.13
- ✅ Implementação completa do CRUD
- ✅ Integração com colaboradores
- ✅ Criptografia bcrypt
- ✅ Validações de segurança
- ✅ Filtros e paginação

---

## Suporte

Para dúvidas ou problemas com o módulo de Usuários:

1. **Documentação:** Consulte este documento
2. **Logs:** Verifique `/api/logs/system`
3. **Debug:** Use `/api/debug/auth-status`
4. **Suporte:** Contate a equipe de desenvolvimento

---

*Documentação gerada automaticamente - GarapaSystem v0.2.37.13*
# API GarapaSystem - Módulo Colaboradores

## Visão Geral

O módulo de Colaboradores é responsável pelo gerenciamento completo dos funcionários da empresa no sistema GarapaSystem. Este módulo oferece funcionalidades para criar, listar, atualizar e excluir colaboradores, além de gerenciar suas associações com usuários do sistema, perfis de acesso e grupos hierárquicos.

### Características Principais

- **CRUD Completo**: Criação, leitura, atualização e exclusão de colaboradores
- **Listagem Paginada**: Busca com paginação, filtros e ordenação
- **Busca Avançada**: Pesquisa por nome, email ou cargo
- **Filtros Múltiplos**: Por status ativo, grupo hierárquico e perfil
- **Associação com Usuários**: Criação automática de usuários de acesso
- **Integração Wuzapi**: Criação automática de usuários e instâncias WhatsApp
- **Controle de Status**: Ativação/desativação de colaboradores
- **Validação de Dados**: Verificação de unicidade de email e documento
- **Sincronização**: Sincronização automática de dados entre colaborador e usuário
- **Segurança**: Criptografia de senhas e validações de integridade

## Relacionamentos

### Entidades Relacionadas

- **Perfil**: Define o nível de acesso e permissões do colaborador
- **Grupo Hierárquico**: Organização hierárquica da empresa
- **Usuário**: Conta de acesso ao sistema (opcional)
- **Tarefas**: Tarefas atribuídas ao colaborador
- **Ordens de Serviço**: Ordens de serviço responsáveis
- **Wuzapi**: Integração com sistema de WhatsApp

## Endpoints

### 1. Listar Colaboradores

**GET** `/api/colaboradores`

Lista todos os colaboradores com paginação e filtros.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | number | Não | Página atual (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 10) |
| `search` | string | Não | Busca por nome, email ou cargo |
| `ativo` | boolean | Não | Filtrar por status ativo |
| `grupoId` | string | Não | Filtrar por grupo hierárquico |
| `perfilId` | string | Não | Filtrar por perfil |

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/colaboradores?page=1&limit=10&search=joão&ativo=true', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer seu_token_aqui'
  }
});

const data = await response.json();
```

#### Exemplo de Resposta

```json
{
  "data": [
    {
      "id": "clm123abc",
      "nome": "João Silva",
      "email": "joao.silva@empresa.com",
      "telefone": "(11) 99999-9999",
      "documento": "123.456.789-00",
      "cargo": "Desenvolvedor",
      "dataAdmissao": "2024-01-15T00:00:00.000Z",
      "ativo": true,
      "perfilId": "prf123",
      "grupoHierarquicoId": "grp123",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z",
      "perfil": {
        "id": "prf123",
        "nome": "Desenvolvedor"
      },
      "grupoHierarquico": {
        "id": "grp123",
        "nome": "TI"
      },
      "usuarios": [
        {
          "id": "usr123",
          "email": "joao.silva@empresa.com",
          "ativo": true
        }
      ]
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### 2. Criar Colaborador

**POST** `/api/colaboradores`

Cria um novo colaborador no sistema.

#### Corpo da Requisição

```json
{
  "nome": "Maria Santos",
  "email": "maria.santos@empresa.com",
  "telefone": "(11) 88888-8888",
  "documento": "987.654.321-00",
  "cargo": "Analista",
  "dataAdmissao": "2024-02-01",
  "ativo": true,
  "perfilId": "prf456",
  "grupoHierarquicoId": "grp456",
  "criarUsuario": true,
  "senhaAcesso": "senha123"
}
```

#### Validações

- **nome**: Obrigatório
- **email**: Obrigatório e único
- **documento**: Único (se fornecido)
- **senhaAcesso**: Obrigatório se `criarUsuario` for true
- **perfilId**: Deve existir no sistema
- **grupoHierarquicoId**: Deve existir no sistema

#### Exemplo de Requisição

```javascript
const novoColaborador = {
  nome: "Maria Santos",
  email: "maria.santos@empresa.com",
  telefone: "(11) 88888-8888",
  documento: "987.654.321-00",
  cargo: "Analista",
  dataAdmissao: "2024-02-01",
  ativo: true,
  perfilId: "prf456",
  grupoHierarquicoId: "grp456",
  criarUsuario: true,
  senhaAcesso: "senha123"
};

const response = await fetch('/api/colaboradores', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer seu_token_aqui'
  },
  body: JSON.stringify(novoColaborador)
});

const colaborador = await response.json();
```

#### Exemplo de Resposta

```json
{
  "id": "clm456def",
  "nome": "Maria Santos",
  "email": "maria.santos@empresa.com",
  "telefone": "(11) 88888-8888",
  "documento": "987.654.321-00",
  "cargo": "Analista",
  "dataAdmissao": "2024-02-01T00:00:00.000Z",
  "ativo": true,
  "perfilId": "prf456",
  "grupoHierarquicoId": "grp456",
  "createdAt": "2024-02-01T10:00:00.000Z",
  "updatedAt": "2024-02-01T10:00:00.000Z",
  "perfil": {
    "id": "prf456",
    "nome": "Analista",
    "descricao": "Perfil de analista"
  },
  "grupoHierarquico": {
    "id": "grp456",
    "nome": "Comercial",
    "descricao": "Departamento comercial"
  },
  "usuarios": [
    {
      "id": "usr456",
      "email": "maria.santos@empresa.com",
      "ativo": true
    }
  ]
}
```

### 3. Buscar Colaborador por ID

**GET** `/api/colaboradores/{id}`

Busca um colaborador específico pelo ID.

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | ID único do colaborador |

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/colaboradores/clm123abc', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer seu_token_aqui'
  }
});

const colaborador = await response.json();
```

### 4. Atualizar Colaborador

**PUT** `/api/colaboradores/{id}`

Atualiza os dados de um colaborador existente.

#### Corpo da Requisição

```json
{
  "nome": "João Silva Santos",
  "email": "joao.santos@empresa.com",
  "telefone": "(11) 99999-8888",
  "documento": "123.456.789-00",
  "cargo": "Desenvolvedor Sênior",
  "dataAdmissao": "2024-01-15",
  "ativo": true,
  "perfilId": "prf789",
  "grupoHierarquicoId": "grp789",
  "alterarSenha": true,
  "novaSenha": "novaSenha123",
  "confirmarSenha": "novaSenha123",
  "criarUsuario": false,
  "senhaNovoUsuario": null
}
```

#### Funcionalidades Especiais

- **Sincronização de Usuário**: Atualiza automaticamente dados do usuário associado
- **Alteração de Senha**: Permite alterar senha do usuário associado
- **Criação de Usuário**: Cria usuário se não existir e for solicitado
- **Validação de Email**: Verifica unicidade apenas se email for alterado

#### Exemplo de Requisição

```javascript
const dadosAtualizacao = {
  nome: "João Silva Santos",
  email: "joao.santos@empresa.com",
  cargo: "Desenvolvedor Sênior",
  alterarSenha: true,
  novaSenha: "novaSenha123",
  confirmarSenha: "novaSenha123"
};

const response = await fetch('/api/colaboradores/clm123abc', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer seu_token_aqui'
  },
  body: JSON.stringify(dadosAtualizacao)
});

const colaboradorAtualizado = await response.json();
```

### 5. Excluir Colaborador

**DELETE** `/api/colaboradores/{id}`

Exclui um colaborador do sistema.

#### Restrições

- Não é possível excluir colaboradores com usuários associados
- Verificação de integridade referencial

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/colaboradores/clm123abc', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer seu_token_aqui'
  }
});

const resultado = await response.json();
```

#### Exemplo de Resposta

```json
{
  "message": "Colaborador excluído com sucesso"
}
```

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso na busca/atualização |
| `201` | Colaborador criado com sucesso |
| `400` | Dados inválidos ou restrições violadas |
| `404` | Colaborador não encontrado |
| `500` | Erro interno do servidor |

## Exemplos de Uso

### Buscar Colaboradores Ativos de um Grupo

```javascript
const colaboradoresAtivos = await fetch('/api/colaboradores?ativo=true&grupoId=grp123&limit=20')
  .then(res => res.json());

console.log(`Encontrados ${colaboradoresAtivos.meta.total} colaboradores ativos`);
```

### Criar Colaborador com Usuário

```javascript
const novoColaborador = {
  nome: "Ana Costa",
  email: "ana.costa@empresa.com",
  cargo: "Gerente",
  perfilId: "prf_gerente",
  criarUsuario: true,
  senhaAcesso: "senhaSegura123"
};

const resultado = await fetch('/api/colaboradores', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(novoColaborador)
});

if (resultado.ok) {
  const colaborador = await resultado.json();
  console.log('Colaborador criado:', colaborador.id);
  
  if (colaborador.wuzapiWarning) {
    console.warn('Aviso Wuzapi:', colaborador.wuzapiWarning);
  }
}
```

### Atualizar Senha de Colaborador

```javascript
const atualizarSenha = {
  nome: "João Silva",
  email: "joao.silva@empresa.com",
  alterarSenha: true,
  novaSenha: "novaSenhaSegura456",
  confirmarSenha: "novaSenhaSegura456"
};

await fetch('/api/colaboradores/clm123abc', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(atualizarSenha)
});
```

## Integrações

### Integração com Wuzapi

O módulo possui integração automática com o sistema Wuzapi para WhatsApp:

- **Criação Automática**: Ao criar um colaborador, automaticamente cria usuário e instância Wuzapi
- **Tratamento de Erros**: Falhas na integração não impedem a criação do colaborador
- **Warnings**: Retorna avisos em caso de problemas na integração

### Sincronização com Usuários

- **Criação Opcional**: Colaboradores podem ter usuários de acesso associados
- **Sincronização Automática**: Alterações no email/nome do colaborador são sincronizadas com o usuário
- **Gerenciamento de Senhas**: Permite alterar senhas dos usuários associados

## Validações e Regras de Negócio

### Validações de Entrada

1. **Nome**: Obrigatório, não pode ser vazio
2. **Email**: Obrigatório, formato válido, único no sistema
3. **Documento**: Único no sistema (se fornecido)
4. **Senha**: Mínimo 6 caracteres (quando aplicável)
5. **Perfil**: Deve existir no sistema
6. **Grupo Hierárquico**: Deve existir no sistema

### Regras de Negócio

1. **Unicidade de Email**: Cada email pode estar associado a apenas um colaborador
2. **Unicidade de Documento**: Cada documento pode estar associado a apenas um colaborador
3. **Usuário Único**: Cada colaborador pode ter no máximo um usuário associado
4. **Exclusão Restrita**: Colaboradores com usuários associados não podem ser excluídos
5. **Status Padrão**: Novos colaboradores são criados como ativos por padrão

## Segurança

### Criptografia

- **Senhas**: Todas as senhas são criptografadas usando bcrypt com salt 10
- **Tokens**: Integração segura com sistema de autenticação

### Controle de Acesso

- **Autenticação**: Todos os endpoints requerem autenticação
- **Autorização**: Verificação de permissões baseada em perfis
- **Validação**: Validação rigorosa de todos os dados de entrada

## Troubleshooting

### Problemas Comuns

#### 1. Erro "Email já cadastrado"

**Causa**: Tentativa de criar/atualizar colaborador com email já existente.

**Solução**:
```javascript
// Verificar se email já existe antes de criar
const emailExists = await fetch(`/api/colaboradores?search=${email}&limit=1`);
const result = await emailExists.json();

if (result.data.length > 0) {
  console.log('Email já existe para colaborador:', result.data[0].nome);
}
```

#### 2. Erro "Documento já cadastrado"

**Causa**: Tentativa de usar documento já associado a outro colaborador.

**Solução**: Verificar unicidade do documento antes da criação/atualização.

#### 3. Falha na Integração Wuzapi

**Causa**: Problemas na comunicação com o serviço Wuzapi.

**Solução**: 
- Verificar configurações do Wuzapi
- Colaborador é criado mesmo com falha na integração
- Verificar warnings na resposta

#### 4. Erro ao Excluir Colaborador

**Causa**: Colaborador possui usuários associados.

**Solução**:
```javascript
// Primeiro excluir usuários associados
await fetch(`/api/usuarios/${usuarioId}`, { method: 'DELETE' });

// Depois excluir colaborador
await fetch(`/api/colaboradores/${colaboradorId}`, { method: 'DELETE' });
```

### Debugging

#### Logs Importantes

```javascript
// Verificar logs de criação
console.log('Criando colaborador:', dadosColaborador);

// Verificar warnings de integração
if (response.wuzapiWarning) {
  console.warn('Wuzapi Warning:', response.wuzapiWarning);
}

// Verificar sincronização de usuário
console.log('Usuários associados:', colaborador.usuarios);
```

#### Checklist de Validação

- [ ] Email é único no sistema
- [ ] Documento é único (se fornecido)
- [ ] Perfil existe no sistema
- [ ] Grupo hierárquico existe no sistema
- [ ] Senha atende critérios mínimos
- [ ] Dados obrigatórios estão presentes

## Performance e Otimização

### Índices Recomendados

```sql
-- Índices para otimização de consultas
CREATE INDEX idx_colaborador_email ON colaborador(email);
CREATE INDEX idx_colaborador_documento ON colaborador(documento);
CREATE INDEX idx_colaborador_ativo ON colaborador(ativo);
CREATE INDEX idx_colaborador_grupo ON colaborador(grupoHierarquicoId);
CREATE INDEX idx_colaborador_perfil ON colaborador(perfilId);
```

### Paginação

- Use sempre paginação para listas grandes
- Limite padrão: 10 itens por página
- Máximo recomendado: 100 itens por página

## Webhooks

### Eventos Disponíveis

- `colaborador.created`: Colaborador criado
- `colaborador.updated`: Colaborador atualizado
- `colaborador.deleted`: Colaborador excluído
- `colaborador.user_created`: Usuário associado criado

### Payload do Webhook

```json
{
  "event": "colaborador.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "id": "clm123abc",
    "nome": "João Silva",
    "email": "joao.silva@empresa.com",
    "ativo": true,
    "hasUser": true
  }
}
```

## Changelog

### v2.1.0 (2024-01-15)
- Adicionada integração com Wuzapi
- Melhorada sincronização com usuários
- Adicionadas validações de documento

### v2.0.0 (2024-01-01)
- Reestruturação completa da API
- Adicionado suporte a grupos hierárquicos
- Melhorada performance das consultas

### v1.5.0 (2023-12-01)
- Adicionada funcionalidade de perfis
- Implementado controle de status
- Melhoradas validações de entrada

## Suporte

Para dúvidas ou problemas com o módulo de Colaboradores:

- **Documentação**: `/docs/api-module-colaboradores.md`
- **Exemplos**: `/docs/api-examples.md`
- **Troubleshooting**: `/docs/api-troubleshooting.md`
- **Contato**: suporte@garapasystem.com

---

**Última atualização**: 15 de Janeiro de 2024  
**Versão da API**: 2.1.0
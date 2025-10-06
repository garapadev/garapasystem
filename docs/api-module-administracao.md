# Módulo de Administração - API Documentation

## Visão Geral

O módulo de Administração é responsável pelo gerenciamento completo do sistema, incluindo usuários, permissões, configurações, grupos hierárquicos, logs e chaves de API. Este módulo fornece as funcionalidades essenciais para administração e controle de acesso do sistema.

## Características Principais

### 1. Gerenciamento de Usuários
- CRUD completo de usuários
- Associação com colaboradores
- Controle de status (ativo/inativo)
- Criptografia de senhas com bcrypt
- Busca e paginação

### 2. Sistema de Permissões e Perfis
- Controle de acesso baseado em recursos e ações
- Perfis com múltiplas permissões
- Recursos únicos do sistema
- Hierarquia de permissões

### 3. Configurações do Sistema
- Configurações chave-valor
- Upsert automático (criar ou atualizar)
- Configurações específicas por módulo
- Configurações da empresa

### 4. Grupos Hierárquicos
- Estrutura organizacional hierárquica
- Grupos pai e filhos
- Associação com clientes e colaboradores
- Controle de níveis

### 5. Sistema de Logs
- Logs do sistema por módulo
- Integração com PM2
- Logs em tempo real
- Diferentes tipos de log (combined, error, out)

### 6. Gerenciamento de API Keys
- Chaves de API para autenticação
- Controle de expiração
- Permissões específicas por chave
- Estatísticas de uso

### 7. Dashboard Administrativo
- Estatísticas gerais do sistema
- Métricas de usuários e entidades
- Atividades do sistema

## Relacionamentos entre Entidades

```
Usuario ↔ Colaborador (1:1)
Usuario → Perfil (N:1) [via Colaborador]
Perfil ↔ Permissao (N:N)
Colaborador → GrupoHierarquico (N:1)
GrupoHierarquico → GrupoHierarquico (N:1) [hierarquia]
Cliente → GrupoHierarquico (N:1)
```

## Endpoints da API

### Usuários

#### `GET /api/usuarios`
Lista usuários com filtros e paginação.

**Parâmetros de Query:**
- `page` (number): Página atual (padrão: 1)
- `limit` (number): Itens por página (padrão: 10)
- `search` (string): Busca por email ou nome
- `ativo` (boolean): Filtrar por status ativo

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "usuario@exemplo.com",
      "nome": "Nome do Usuário",
      "ativo": true,
      "colaborador": {
        "id": "uuid",
        "nome": "Nome",
        "email": "email@exemplo.com",
        "cargo": "Cargo"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

#### `POST /api/usuarios`
Cria um novo usuário.

**Body:**
```json
{
  "email": "usuario@exemplo.com",
  "senha": "senha123",
  "nome": "Nome do Usuário",
  "ativo": true,
  "colaboradorId": "uuid-opcional"
}
```

#### `GET /api/usuarios/[id]`
Obtém um usuário específico com detalhes completos.

#### `PUT /api/usuarios/[id]`
Atualiza um usuário existente.

#### `DELETE /api/usuarios/[id]`
Remove um usuário do sistema.

### Perfis

#### `GET /api/perfis`
Lista perfis com suas permissões.

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "nome": "Administrador",
      "descricao": "Acesso total ao sistema",
      "permissoes": [
        {
          "permissao": {
            "id": "uuid",
            "nome": "Gerenciar Usuários",
            "recurso": "usuarios",
            "acao": "manage"
          }
        }
      ],
      "colaboradores": []
    }
  ]
}
```

#### `POST /api/perfis`
Cria um novo perfil.

**Body:**
```json
{
  "nome": "Nome do Perfil",
  "descricao": "Descrição do perfil",
  "permissoesIds": ["uuid1", "uuid2"]
}
```

### Permissões

#### `GET /api/permissoes`
Lista permissões com filtros.

**Parâmetros de Query:**
- `recurso` (string): Filtrar por recurso
- `acao` (string): Filtrar por ação
- `search` (string): Busca por nome ou descrição

#### `POST /api/permissoes`
Cria uma nova permissão.

**Body:**
```json
{
  "nome": "Gerenciar Clientes",
  "descricao": "Permite gerenciar clientes",
  "recurso": "clientes",
  "acao": "manage"
}
```

#### `GET /api/permissoes/recursos`
Lista todos os recursos únicos disponíveis no sistema.

### Configurações

#### `GET /api/configuracoes`
Lista todas as configurações ou uma específica.

**Parâmetros de Query:**
- `chave` (string): Chave específica da configuração

#### `POST /api/configuracoes`
Cria uma nova configuração.

#### `PUT /api/configuracoes`
Atualiza ou cria uma configuração (upsert).

**Body:**
```json
{
  "chave": "whatsapp_api_type",
  "valor": "wuzapi",
  "descricao": "Tipo de API do WhatsApp"
}
```

### Grupos Hierárquicos

#### `GET /api/grupos-hierarquicos`
Lista grupos hierárquicos com estrutura pai-filho.

**Parâmetros de Query:**
- `parentId` (string): Filtrar por grupo pai ("null" para raiz)

#### `POST /api/grupos-hierarquicos`
Cria um novo grupo hierárquico.

**Body:**
```json
{
  "nome": "Departamento TI",
  "descricao": "Departamento de Tecnologia",
  "ativo": true,
  "parentId": "uuid-opcional"
}
```

### Logs do Sistema

#### `GET /api/logs/system`
Obtém logs do sistema por módulo.

**Parâmetros de Query:**
- `module` (string): Módulo específico ou "all"
- `type` (string): Tipo de log (combined, error, out)
- `lines` (number): Número de linhas (máx: 1000)
- `realtime` (boolean): Logs em tempo real

### API Keys

#### `GET /api/api-keys`
Lista todas as chaves de API.

#### `POST /api/api-keys`
Cria uma nova chave de API.

**Body:**
```json
{
  "nome": "Integração Externa",
  "descricao": "Chave para sistema externo",
  "permissoes": {},
  "expiresAt": "2024-12-31T23:59:59Z",
  "limiteTaxa": 1000
}
```

#### `PUT /api/api-keys/[id]/toggle`
Ativa/desativa uma chave de API.

#### `POST /api/api-keys/[id]/regenerate`
Regenera uma chave de API.

### Dashboard

#### `GET /api/dashboard/stats`
Obtém estatísticas gerais do sistema.

**Resposta:**
```json
{
  "totalClientes": 150,
  "totalColaboradores": 25,
  "totalGruposHierarquicos": 8,
  "totalPermissoes": 45,
  "totalUsuarios": 20
}
```

#### `GET /api/dashboard/activities`
Lista atividades recentes do sistema.

## Códigos de Status HTTP

- **200 OK**: Operação realizada com sucesso
- **201 Created**: Recurso criado com sucesso
- **400 Bad Request**: Dados inválidos ou obrigatórios ausentes
- **401 Unauthorized**: Autenticação necessária
- **403 Forbidden**: Permissão insuficiente
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito (ex: email já existe)
- **500 Internal Server Error**: Erro interno do servidor

## Validações e Regras de Negócio

### Usuários
- Email deve ser único no sistema
- Senha é criptografada com bcrypt (salt rounds: 10)
- Colaborador pode ter apenas um usuário associado
- Nome e email são obrigatórios

### Perfis
- Nome deve ser único
- Pode ter múltiplas permissões associadas
- Permissões devem existir no sistema

### Permissões
- Combinação recurso + ação deve ser única
- Nome deve ser único
- Recurso e ação são obrigatórios

### Grupos Hierárquicos
- Nome deve ser único no mesmo nível hierárquico
- Pode ter grupo pai (hierarquia)
- Suporta múltiplos níveis de hierarquia

### Configurações
- Chave deve ser única
- Suporte a upsert (criar ou atualizar)
- Valor é obrigatório

### API Keys
- Nome deve ser único
- Chave é gerada automaticamente
- Pode ter data de expiração
- Suporte a permissões específicas

## Segurança

### Autenticação
- Sessões NextAuth para interface web
- API Keys para integrações externas
- Middleware de validação de autenticação

### Autorização
- Sistema baseado em recursos e ações
- Verificação de permissões por endpoint
- Controle de acesso granular

### Criptografia
- Senhas criptografadas com bcrypt
- API Keys com tokens seguros
- Headers de segurança

### Auditoria
- Logs de sistema detalhados
- Rastreamento de atividades
- Monitoramento em tempo real

## Performance e Otimização

### Consultas de Banco
- Índices em campos de busca frequente
- Paginação em todas as listagens
- Includes otimizados para relacionamentos

### Cache
- Cache de configurações frequentes
- Cache de permissões por usuário
- Invalidação automática

### Monitoramento
- Logs estruturados por módulo
- Métricas de performance
- Alertas de sistema

## Integração com Outros Módulos

### Módulo de Clientes
- Associação com grupos hierárquicos
- Controle de acesso por colaborador

### Módulo de Colaboradores
- Usuários associados a colaboradores
- Perfis e permissões por colaborador

### Módulo de WhatsApp
- Configurações de API
- Tokens por colaborador

### Módulo de Email
- Configurações de sincronização
- Permissões de webmail

## Exemplos de Uso

### Criar Usuário Administrador
```bash
curl -X POST /api/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "senha": "senhaSegura123",
    "nome": "Administrador",
    "ativo": true
  }'
```

### Configurar API do WhatsApp
```bash
curl -X PUT /api/configuracoes \
  -H "Content-Type: application/json" \
  -d '{
    "chave": "whatsapp_api_type",
    "valor": "waha",
    "descricao": "Tipo de API do WhatsApp"
  }'
```

### Criar Perfil com Permissões
```bash
curl -X POST /api/perfis \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Gerente",
    "descricao": "Acesso de gerência",
    "permissoesIds": ["perm1", "perm2", "perm3"]
  }'
```

### Obter Logs do Sistema
```bash
curl "/api/logs/system?module=garapasystem&lines=50&type=error"
```

## Troubleshooting

### Problemas Comuns

#### Erro de Permissão
- Verificar se usuário tem perfil associado
- Validar permissões do perfil
- Confirmar recurso e ação corretos

#### Configuração Não Encontrada
- Verificar se chave existe no banco
- Confirmar sintaxe da chave
- Validar valor da configuração

#### Logs Não Aparecem
- Verificar se PM2 está rodando
- Confirmar caminhos dos arquivos de log
- Validar permissões de leitura

#### API Key Inválida
- Verificar se chave não expirou
- Confirmar se está ativa
- Validar formato da chave

### Comandos de Diagnóstico

```bash
# Verificar status dos serviços
pm2 status

# Verificar logs em tempo real
pm2 logs garapasystem

# Reiniciar serviços
pm2 restart all

# Verificar configurações
curl /api/configuracoes
```

## Relatórios e Métricas

### Métricas Disponíveis
- Total de usuários ativos/inativos
- Distribuição por grupos hierárquicos
- Uso de API Keys
- Atividades por período
- Logs de erro por módulo

### Relatórios Automáticos
- Relatório diário de atividades
- Alertas de segurança
- Métricas de performance
- Status dos serviços

## Changelog

### Versão 1.0.0
- Sistema básico de usuários e permissões
- Configurações do sistema
- Logs básicos

### Versão 1.1.0
- Grupos hierárquicos
- API Keys
- Dashboard administrativo

### Versão 1.2.0
- Logs em tempo real
- Métricas avançadas
- Auditoria completa

## Suporte

### Documentação Adicional
- [Guia de Instalação](./installation.md)
- [Configuração de Ambiente](./environment.md)
- [Backup e Restore](./backup.md)

### Contato
- Email: suporte@empresa.com
- Documentação: /api/docs
- Status: /api/health

---

*Documentação gerada automaticamente - Última atualização: 2024*
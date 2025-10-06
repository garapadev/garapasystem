# API GarapaSystem - Módulo Tarefas

## Visão Geral

O módulo de Tarefas é o núcleo do sistema de gestão de atividades do GarapaSystem. Este módulo oferece funcionalidades completas para criação, acompanhamento e gerenciamento de tarefas, incluindo sistema de comentários, anexos, logs de auditoria, recorrência e integração com outros módulos do sistema.

### Características Principais

- **CRUD Completo**: Criação, leitura, atualização e exclusão de tarefas
- **Sistema de Status**: Controle de estados (Pendente, Em Andamento, Concluída, Cancelada)
- **Prioridades**: Classificação por prioridade (Baixa, Média, Alta, Urgente)
- **Comentários**: Sistema de comentários com histórico
- **Anexos**: Upload e gerenciamento de arquivos
- **Logs de Auditoria**: Rastreamento completo de alterações
- **Recorrência**: Tarefas recorrentes com múltiplos padrões
- **Filtros Avançados**: Busca por múltiplos critérios
- **Integração**: Conexão com clientes, oportunidades, e-mails e helpdesk
- **Notificações**: Sistema de alertas e lembretes
- **Relatórios**: Métricas e análises de produtividade

## Status de Tarefas

| Status | Descrição |
|--------|-----------|
| `PENDENTE` | Tarefa criada, aguardando início |
| `EM_ANDAMENTO` | Tarefa em execução |
| `CONCLUIDA` | Tarefa finalizada com sucesso |
| `CANCELADA` | Tarefa cancelada |
| `PAUSADA` | Tarefa temporariamente pausada |

## Prioridades

| Prioridade | Descrição |
|------------|-----------|
| `BAIXA` | Prioridade baixa |
| `MEDIA` | Prioridade média (padrão) |
| `ALTA` | Prioridade alta |
| `URGENTE` | Prioridade urgente |

## Relacionamentos

### Entidades Relacionadas

- **Responsável**: Colaborador responsável pela execução
- **Criador**: Colaborador que criou a tarefa
- **Cliente**: Cliente relacionado à tarefa (opcional)
- **Oportunidade**: Oportunidade de negócio relacionada (opcional)
- **E-mail**: E-mail que originou a tarefa (opcional)
- **Helpdesk Ticket**: Ticket de suporte relacionado (opcional)
- **Comentários**: Comentários e atualizações da tarefa
- **Anexos**: Arquivos anexados à tarefa
- **Logs**: Histórico de alterações
- **Recorrência**: Configuração de repetição (opcional)

## Endpoints

### 1. Listar Tarefas

**GET** `/api/tasks`

Lista todas as tarefas com paginação e filtros avançados.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | number | Não | Página atual (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 10) |
| `search` | string | Não | Busca por título ou descrição |
| `status` | string | Não | Filtrar por status |
| `prioridade` | string | Não | Filtrar por prioridade |
| `responsavelId` | string | Não | Filtrar por responsável |
| `clienteId` | string | Não | Filtrar por cliente |
| `oportunidadeId` | string | Não | Filtrar por oportunidade |
| `emailId` | string | Não | Filtrar por e-mail |
| `helpdeskTicketId` | string | Não | Filtrar por ticket |
| `atrasadas` | boolean | Não | Filtrar tarefas atrasadas |

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/tasks?page=1&limit=20&status=PENDENTE&prioridade=ALTA&atrasadas=true', {
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
      "id": "tsk123abc",
      "titulo": "Implementar nova funcionalidade",
      "descricao": "Desenvolver módulo de relatórios avançados",
      "prioridade": "ALTA",
      "status": "EM_ANDAMENTO",
      "dataVencimento": "2024-01-20T23:59:59.000Z",
      "dataConclusao": null,
      "observacoes": "Aguardando aprovação do design",
      "isRecorrente": false,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-16T14:30:00.000Z",
      "responsavel": {
        "id": "clb123",
        "nome": "João Silva",
        "email": "joao.silva@empresa.com"
      },
      "criadoPor": {
        "id": "clb456",
        "nome": "Maria Santos",
        "email": "maria.santos@empresa.com"
      },
      "cliente": {
        "id": "cli789",
        "nome": "Empresa XYZ",
        "email": "contato@empresaxyz.com"
      },
      "oportunidade": {
        "id": "opp123",
        "titulo": "Projeto Sistema ERP",
        "valor": 50000.00
      },
      "_count": {
        "comentarios": 3,
        "anexos": 2
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 2. Criar Tarefa

**POST** `/api/tasks`

Cria uma nova tarefa no sistema.

#### Corpo da Requisição

```json
{
  "titulo": "Nova tarefa importante",
  "descricao": "Descrição detalhada da tarefa",
  "prioridade": "ALTA",
  "status": "PENDENTE",
  "dataVencimento": "2024-01-25T23:59:59.000Z",
  "responsavelId": "clb123abc",
  "clienteId": "cli456def",
  "oportunidadeId": "opp789ghi",
  "emailId": null,
  "helpdeskTicketId": null,
  "observacoes": "Observações adicionais",
  "recorrencia": {
    "tipo": "SEMANAL",
    "intervalo": 1,
    "diasSemana": [1, 3, 5],
    "dataFim": "2024-12-31T23:59:59.000Z"
  }
}
```

#### Validações

- **titulo**: Obrigatório
- **responsavelId**: Obrigatório e deve existir
- **dataVencimento**: Obrigatória
- **clienteId**: Deve existir (se fornecido)
- **oportunidadeId**: Deve existir (se fornecida)
- **prioridade**: Valores válidos: BAIXA, MEDIA, ALTA, URGENTE
- **status**: Valores válidos: PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA, PAUSADA

#### Exemplo de Requisição

```javascript
const novaTarefa = {
  titulo: "Revisar documentação da API",
  descricao: "Atualizar documentação com novos endpoints",
  prioridade: "MEDIA",
  dataVencimento: "2024-01-30T17:00:00.000Z",
  responsavelId: "clb123abc",
  clienteId: "cli456def"
};

const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer seu_token_aqui'
  },
  body: JSON.stringify(novaTarefa)
});

const tarefa = await response.json();
```

#### Exemplo de Resposta

```json
{
  "id": "tsk789xyz",
  "titulo": "Revisar documentação da API",
  "descricao": "Atualizar documentação com novos endpoints",
  "prioridade": "MEDIA",
  "status": "PENDENTE",
  "dataVencimento": "2024-01-30T17:00:00.000Z",
  "dataConclusao": null,
  "observacoes": null,
  "isRecorrente": false,
  "createdAt": "2024-01-16T10:00:00.000Z",
  "updatedAt": "2024-01-16T10:00:00.000Z",
  "responsavel": {
    "id": "clb123abc",
    "nome": "João Silva",
    "email": "joao.silva@empresa.com"
  },
  "criadoPor": {
    "id": "clb456def",
    "nome": "Maria Santos",
    "email": "maria.santos@empresa.com"
  },
  "cliente": {
    "id": "cli456def",
    "nome": "Cliente ABC",
    "email": "contato@clienteabc.com"
  }
}
```

### 3. Buscar Tarefa por ID

**GET** `/api/tasks/{id}`

Busca uma tarefa específica com todos os detalhes, incluindo comentários, anexos e logs.

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | ID único da tarefa |

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/tasks/tsk123abc', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer seu_token_aqui'
  }
});

const tarefa = await response.json();
```

#### Exemplo de Resposta

```json
{
  "id": "tsk123abc",
  "titulo": "Implementar nova funcionalidade",
  "descricao": "Desenvolver módulo de relatórios avançados",
  "prioridade": "ALTA",
  "status": "EM_ANDAMENTO",
  "dataVencimento": "2024-01-20T23:59:59.000Z",
  "dataConclusao": null,
  "observacoes": "Aguardando aprovação do design",
  "isRecorrente": false,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-16T14:30:00.000Z",
  "responsavel": {
    "id": "clb123",
    "nome": "João Silva",
    "email": "joao.silva@empresa.com"
  },
  "criadoPor": {
    "id": "clb456",
    "nome": "Maria Santos",
    "email": "maria.santos@empresa.com"
  },
  "cliente": {
    "id": "cli789",
    "nome": "Empresa XYZ",
    "email": "contato@empresaxyz.com"
  },
  "comentarios": [
    {
      "id": "cmt123",
      "conteudo": "Iniciando desenvolvimento",
      "createdAt": "2024-01-16T09:00:00.000Z",
      "autor": {
        "id": "clb123",
        "nome": "João Silva",
        "email": "joao.silva@empresa.com"
      }
    }
  ],
  "anexos": [
    {
      "id": "anx123",
      "nomeArquivo": "especificacao.pdf",
      "tamanho": 1024000,
      "tipo": "application/pdf",
      "url": "/uploads/tasks/tsk123abc/especificacao.pdf",
      "createdAt": "2024-01-15T11:00:00.000Z",
      "uploadPor": {
        "id": "clb456",
        "nome": "Maria Santos",
        "email": "maria.santos@empresa.com"
      }
    }
  ],
  "logs": [
    {
      "id": "log123",
      "tipo": "CRIACAO",
      "descricao": "Tarefa criada: Implementar nova funcionalidade",
      "valorAnterior": null,
      "valorNovo": "{\"titulo\":\"Implementar nova funcionalidade\"}",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "autor": {
        "id": "clb456",
        "nome": "Maria Santos",
        "email": "maria.santos@empresa.com"
      }
    }
  ]
}
```

### 4. Atualizar Tarefa

**PUT** `/api/tasks/{id}`

Atualiza os dados de uma tarefa existente.

#### Corpo da Requisição

```json
{
  "titulo": "Implementar nova funcionalidade - Atualizado",
  "descricao": "Desenvolver módulo de relatórios avançados com dashboard",
  "prioridade": "URGENTE",
  "status": "CONCLUIDA",
  "dataVencimento": "2024-01-22T23:59:59.000Z",
  "responsavelId": "clb789xyz",
  "observacoes": "Concluído com sucesso"
}
```

#### Funcionalidades Especiais

- **Log Automático**: Todas as alterações são registradas automaticamente
- **Data de Conclusão**: Definida automaticamente quando status = CONCLUIDA
- **Validação de Campos**: Verifica existência de responsável, cliente, etc.
- **Rastreamento de Mudanças**: Identifica e registra apenas campos alterados

#### Exemplo de Requisição

```javascript
const atualizacao = {
  status: "CONCLUIDA",
  observacoes: "Tarefa finalizada com sucesso"
};

const response = await fetch('/api/tasks/tsk123abc', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer seu_token_aqui'
  },
  body: JSON.stringify(atualizacao)
});

const tarefaAtualizada = await response.json();
```

### 5. Excluir Tarefa

**DELETE** `/api/tasks/{id}`

Exclui uma tarefa do sistema.

#### Restrições

- Verifica se a tarefa existe
- Remove comentários, anexos e logs associados
- Operação irreversível

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/tasks/tsk123abc', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer seu_token_aqui'
  }
});

const resultado = await response.json();
```

## Sistema de Recorrência

### Tipos de Recorrência

| Tipo | Descrição |
|------|-----------|
| `DIARIA` | Repetição diária |
| `SEMANAL` | Repetição semanal |
| `MENSAL` | Repetição mensal |
| `ANUAL` | Repetição anual |

### Configuração de Recorrência

```json
{
  "recorrencia": {
    "tipo": "SEMANAL",
    "intervalo": 2,
    "diasSemana": [1, 3, 5],
    "diaMes": null,
    "dataFim": "2024-12-31T23:59:59.000Z"
  }
}
```

#### Parâmetros

- **tipo**: Tipo de recorrência (obrigatório)
- **intervalo**: Intervalo entre repetições (padrão: 1)
- **diasSemana**: Dias da semana (0=domingo, 1=segunda, etc.) - para tipo SEMANAL
- **diaMes**: Dia do mês (1-31) - para tipo MENSAL
- **dataFim**: Data limite para repetições (opcional)

## Comentários

### Adicionar Comentário

**POST** `/api/tasks/{id}/comentarios`

```json
{
  "conteudo": "Progresso da tarefa: 50% concluído"
}
```

### Listar Comentários

**GET** `/api/tasks/{id}/comentarios`

## Anexos

### Upload de Anexo

**POST** `/api/tasks/{id}/anexos`

```javascript
const formData = new FormData();
formData.append('arquivo', file);
formData.append('descricao', 'Especificação técnica');

const response = await fetch('/api/tasks/tsk123abc/anexos', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer seu_token_aqui'
  },
  body: formData
});
```

### Listar Anexos

**GET** `/api/tasks/{id}/anexos`

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso na busca/atualização |
| `201` | Tarefa criada com sucesso |
| `400` | Dados inválidos ou restrições violadas |
| `401` | Não autorizado |
| `403` | Sem permissão |
| `404` | Tarefa não encontrada |
| `500` | Erro interno do servidor |

## Exemplos de Uso

### Buscar Tarefas Atrasadas

```javascript
const tarefasAtrasadas = await fetch('/api/tasks?atrasadas=true&status=PENDENTE,EM_ANDAMENTO')
  .then(res => res.json());

console.log(`${tarefasAtrasadas.meta.total} tarefas atrasadas encontradas`);
```

### Criar Tarefa Recorrente

```javascript
const tarefaRecorrente = {
  titulo: "Backup semanal do sistema",
  descricao: "Realizar backup completo dos dados",
  prioridade: "MEDIA",
  dataVencimento: "2024-01-22T02:00:00.000Z",
  responsavelId: "clb123abc",
  recorrencia: {
    tipo: "SEMANAL",
    intervalo: 1,
    diasSemana: [1], // Segunda-feira
    dataFim: "2024-12-31T23:59:59.000Z"
  }
};

const response = await fetch('/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(tarefaRecorrente)
});
```

### Atualizar Status em Lote

```javascript
const tarefaIds = ['tsk123', 'tsk456', 'tsk789'];

for (const id of tarefaIds) {
  await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'CONCLUIDA' })
  });
}
```

### Buscar Tarefas por Cliente

```javascript
const tarefasCliente = await fetch('/api/tasks?clienteId=cli123abc&limit=50')
  .then(res => res.json());

const tarefasPendentes = tarefasCliente.data.filter(t => t.status === 'PENDENTE');
console.log(`Cliente possui ${tarefasPendentes.length} tarefas pendentes`);
```

## Integrações

### Integração com E-mails

- Tarefas podem ser criadas automaticamente a partir de e-mails
- Vinculação bidirecional entre tarefas e e-mails
- Rastreamento de origem da tarefa

### Integração com Helpdesk

- Criação automática de tarefas a partir de tickets
- Sincronização de status entre tarefa e ticket
- Histórico unificado de atendimento

### Integração com Oportunidades

- Tarefas vinculadas a oportunidades de negócio
- Acompanhamento do pipeline de vendas
- Métricas de conversão

## Validações e Regras de Negócio

### Validações de Entrada

1. **Título**: Obrigatório, máximo 255 caracteres
2. **Responsável**: Deve ser um colaborador ativo
3. **Data de Vencimento**: Não pode ser no passado (para novas tarefas)
4. **Prioridade**: Valores válidos definidos no enum
5. **Status**: Transições válidas entre estados
6. **Cliente/Oportunidade**: Devem existir no sistema

### Regras de Negócio

1. **Data de Conclusão**: Definida automaticamente ao marcar como concluída
2. **Tarefas Atrasadas**: Identificadas automaticamente pelo sistema
3. **Recorrência**: Novas instâncias criadas automaticamente
4. **Logs de Auditoria**: Todas as alterações são registradas
5. **Permissões**: Baseadas no perfil do usuário

## Segurança

### Controle de Acesso

- **Autenticação**: Todos os endpoints requerem token válido
- **Autorização**: Verificação de permissões por endpoint
- **Isolamento**: Usuários só veem tarefas permitidas
- **Auditoria**: Log completo de todas as ações

### Validação de Dados

- **Sanitização**: Limpeza de dados de entrada
- **Validação**: Verificação de tipos e formatos
- **Integridade**: Verificação de relacionamentos
- **Consistência**: Validação de regras de negócio

## Performance e Otimização

### Índices Recomendados

```sql
-- Índices para otimização de consultas
CREATE INDEX idx_task_responsavel ON task(responsavelId);
CREATE INDEX idx_task_cliente ON task(clienteId);
CREATE INDEX idx_task_status ON task(status);
CREATE INDEX idx_task_prioridade ON task(prioridade);
CREATE INDEX idx_task_vencimento ON task(dataVencimento);
CREATE INDEX idx_task_criacao ON task(createdAt);
CREATE INDEX idx_task_atrasadas ON task(dataVencimento, status);
```

### Paginação

- Use sempre paginação para listas grandes
- Limite padrão: 10 itens por página
- Máximo recomendado: 100 itens por página

### Cache

- Cache de contadores e estatísticas
- Cache de filtros frequentes
- Invalidação automática em atualizações

## Webhooks

### Eventos Disponíveis

- `task.created`: Tarefa criada
- `task.updated`: Tarefa atualizada
- `task.deleted`: Tarefa excluída
- `task.completed`: Tarefa concluída
- `task.overdue`: Tarefa atrasada
- `task.comment_added`: Comentário adicionado
- `task.attachment_added`: Anexo adicionado

### Payload do Webhook

```json
{
  "event": "task.completed",
  "timestamp": "2024-01-16T15:30:00.000Z",
  "data": {
    "id": "tsk123abc",
    "titulo": "Implementar nova funcionalidade",
    "status": "CONCLUIDA",
    "responsavel": {
      "id": "clb123",
      "nome": "João Silva"
    },
    "cliente": {
      "id": "cli789",
      "nome": "Empresa XYZ"
    }
  }
}
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro "Responsável não encontrado"

**Causa**: ID do responsável inválido ou colaborador inativo.

**Solução**:
```javascript
// Verificar se colaborador existe e está ativo
const colaborador = await fetch(`/api/colaboradores/${responsavelId}`);
if (!colaborador.ok) {
  console.error('Colaborador não encontrado ou inativo');
}
```

#### 2. Tarefas não aparecem na listagem

**Causa**: Filtros muito restritivos ou problemas de permissão.

**Solução**:
- Verificar filtros aplicados
- Confirmar permissões do usuário
- Testar sem filtros

#### 3. Erro ao criar tarefa recorrente

**Causa**: Configuração inválida de recorrência.

**Solução**:
```javascript
// Validar configuração de recorrência
const recorrencia = {
  tipo: "SEMANAL", // Obrigatório
  intervalo: 1,    // Mínimo 1
  diasSemana: [1, 3, 5] // Para tipo SEMANAL
};
```

#### 4. Anexos não são salvos

**Causa**: Problemas de upload ou permissões de arquivo.

**Solução**:
- Verificar tamanho do arquivo (limite: 10MB)
- Confirmar tipos de arquivo permitidos
- Verificar permissões de diretório

### Debugging

#### Logs Importantes

```javascript
// Verificar criação de tarefa
console.log('Criando tarefa:', dadosTarefa);

// Verificar logs de alteração
console.log('Campos alterados:', changedFields);

// Verificar recorrência
if (tarefa.isRecorrente) {
  console.log('Configuração de recorrência:', tarefa.recorrencia);
}
```

#### Checklist de Validação

- [ ] Responsável existe e está ativo
- [ ] Data de vencimento é válida
- [ ] Cliente/Oportunidade existem (se fornecidos)
- [ ] Prioridade e status são válidos
- [ ] Configuração de recorrência está correta
- [ ] Usuário tem permissões necessárias

## Relatórios e Métricas

### Métricas Disponíveis

- **Produtividade**: Tarefas concluídas por período
- **Performance**: Tempo médio de conclusão
- **Atrasos**: Percentual de tarefas atrasadas
- **Distribuição**: Tarefas por responsável/cliente
- **Tendências**: Evolução ao longo do tempo

### Endpoints de Relatórios

```javascript
// Relatório de produtividade
const produtividade = await fetch('/api/tasks/reports/productivity?periodo=30');

// Tarefas atrasadas por responsável
const atrasadas = await fetch('/api/tasks/reports/overdue-by-user');

// Distribuição por prioridade
const prioridades = await fetch('/api/tasks/reports/priority-distribution');
```

## Changelog

### v3.2.0 (2024-01-16)
- Adicionado sistema de recorrência avançado
- Melhorado sistema de logs de auditoria
- Implementados filtros de tarefas atrasadas

### v3.1.0 (2024-01-01)
- Adicionada integração com helpdesk
- Implementado sistema de anexos
- Melhorada performance das consultas

### v3.0.0 (2023-12-01)
- Reestruturação completa da API
- Adicionado sistema de comentários
- Implementado controle de permissões

## Suporte

Para dúvidas ou problemas com o módulo de Tarefas:

- **Documentação**: `/docs/api-module-tarefas.md`
- **Exemplos**: `/docs/api-examples.md`
- **Troubleshooting**: `/docs/api-troubleshooting.md`
- **Contato**: suporte@garapasystem.com

---

**Última atualização**: 16 de Janeiro de 2024  
**Versão da API**: 3.2.0
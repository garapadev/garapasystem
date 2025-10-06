# API GarapaSystem - Módulo Ordens de Serviço

## Visão Geral

O módulo de Ordens de Serviço é um sistema completo para gerenciamento de serviços prestados aos clientes. Este módulo oferece funcionalidades avançadas para criação, acompanhamento e controle de ordens de serviço, incluindo sistema de itens, comentários, anexos, histórico de alterações, checklists e laudos técnicos.

### Características Principais

- **CRUD Completo**: Criação, leitura, atualização e exclusão de ordens de serviço
- **Numeração Automática**: Geração sequencial de números únicos (formato: OS202401XXXX)
- **Sistema de Status**: Controle de estados do ciclo de vida da OS
- **Prioridades**: Classificação por urgência e importância
- **Itens de Serviço**: Detalhamento de serviços e produtos
- **Comentários**: Sistema de comunicação interna e com cliente
- **Anexos**: Upload e gerenciamento de arquivos
- **Histórico**: Rastreamento completo de alterações
- **Checklists**: Templates de verificação personalizáveis
- **Laudos Técnicos**: Relatórios técnicos especializados
- **Integração**: Conexão com clientes, oportunidades e colaboradores
- **Aprovação**: Fluxo de aprovação de ordens de serviço
- **Relatórios**: Métricas e análises de performance

## Status de Ordens de Serviço

| Status | Descrição |
|--------|-----------|
| `RASCUNHO` | OS criada, ainda em elaboração |
| `PENDENTE` | OS aguardando aprovação ou início |
| `APROVADA` | OS aprovada pelo cliente |
| `EM_ANDAMENTO` | OS em execução |
| `PAUSADA` | OS temporariamente pausada |
| `CONCLUIDA` | OS finalizada com sucesso |
| `CANCELADA` | OS cancelada |
| `REJEITADA` | OS rejeitada pelo cliente |

## Prioridades

| Prioridade | Descrição |
|------------|-----------|
| `BAIXA` | Prioridade baixa |
| `MEDIA` | Prioridade média (padrão) |
| `ALTA` | Prioridade alta |
| `URGENTE` | Prioridade urgente |
| `CRITICA` | Prioridade crítica |

## Relacionamentos

### Entidades Relacionadas

- **Cliente**: Cliente para quem o serviço será prestado
- **Responsável**: Colaborador responsável pela execução
- **Criador**: Colaborador que criou a OS
- **Oportunidade**: Oportunidade de negócio relacionada (opcional)
- **Itens**: Detalhamento de serviços e produtos
- **Comentários**: Comunicação e atualizações
- **Anexos**: Arquivos relacionados à OS
- **Histórico**: Log de todas as alterações
- **Checklists**: Listas de verificação
- **Laudos**: Relatórios técnicos especializados

## Endpoints

### 1. Listar Ordens de Serviço

**GET** `/api/ordens-servico`

Lista todas as ordens de serviço com paginação e filtros avançados.

#### Parâmetros de Query

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `page` | number | Não | Página atual (padrão: 1) |
| `limit` | number | Não | Itens por página (padrão: 10) |
| `search` | string | Não | Busca por título, descrição ou cliente |
| `status` | string | Não | Filtrar por status |
| `prioridade` | string | Não | Filtrar por prioridade |
| `clienteId` | string | Não | Filtrar por cliente |
| `responsavelId` | string | Não | Filtrar por responsável |
| `dataInicio` | string | Não | Filtrar por data de início (ISO) |
| `dataFim` | string | Não | Filtrar por data de fim (ISO) |

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/ordens-servico?page=1&limit=20&status=EM_ANDAMENTO&prioridade=ALTA', {
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
      "id": "os123abc",
      "numero": "OS202401001",
      "titulo": "Manutenção preventiva do sistema",
      "descricao": "Realizar manutenção completa dos equipamentos",
      "localExecucao": "Sede da empresa cliente",
      "dataInicio": "2024-01-20T08:00:00.000Z",
      "dataFim": "2024-01-20T17:00:00.000Z",
      "valorOrcamento": 2500.00,
      "valorFinal": 2350.00,
      "status": "EM_ANDAMENTO",
      "prioridade": "ALTA",
      "observacoes": "Cliente solicitou urgência",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-16T14:30:00.000Z",
      "cliente": {
        "id": "cli789",
        "nome": "Empresa XYZ",
        "email": "contato@empresaxyz.com",
        "telefone": "(11) 99999-9999"
      },
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
      "oportunidade": {
        "id": "opp123",
        "titulo": "Contrato de Manutenção Anual"
      },
      "itens": [
        {
          "id": "item123",
          "descricao": "Manutenção preventiva",
          "quantidade": 1,
          "valorUnitario": 2000.00,
          "valorTotal": 2000.00
        }
      ],
      "_count": {
        "comentarios": 5,
        "anexos": 3,
        "historico": 8
      }
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

### 2. Criar Ordem de Serviço

**POST** `/api/ordens-servico`

Cria uma nova ordem de serviço no sistema.

#### Corpo da Requisição

```json
{
  "titulo": "Instalação de novo sistema",
  "descricao": "Instalação completa do sistema de gestão",
  "localExecucao": "Escritório do cliente",
  "dataInicio": "2024-01-25T08:00:00.000Z",
  "dataFim": "2024-01-25T18:00:00.000Z",
  "valorOrcamento": 5000.00,
  "status": "PENDENTE",
  "prioridade": "ALTA",
  "observacoes": "Cliente disponível apenas pela manhã",
  "clienteId": "cli123abc",
  "responsavelId": "clb456def",
  "criadoPorId": "clb789ghi",
  "oportunidadeId": "opp123jkl",
  "itens": [
    {
      "descricao": "Instalação do sistema",
      "quantidade": 1,
      "valorUnitario": 3000.00,
      "observacoes": "Inclui configuração inicial"
    },
    {
      "descricao": "Treinamento da equipe",
      "quantidade": 4,
      "valorUnitario": 500.00,
      "observacoes": "4 horas de treinamento"
    }
  ]
}
```

#### Validações

- **titulo**: Obrigatório
- **descricao**: Obrigatória
- **clienteId**: Obrigatório e deve existir
- **criadoPorId**: Obrigatório e deve existir
- **responsavelId**: Deve existir (se fornecido)
- **oportunidadeId**: Deve existir (se fornecida)
- **status**: Valores válidos definidos no enum
- **prioridade**: Valores válidos definidos no enum

#### Funcionalidades Especiais

- **Numeração Automática**: Gera número sequencial único (OS202401XXXX)
- **Cálculo Automático**: Valor final calculado com base nos itens
- **Histórico Inicial**: Cria entrada de histórico de criação
- **Validação de Relacionamentos**: Verifica existência de entidades relacionadas

#### Exemplo de Requisição

```javascript
const novaOS = {
  titulo: "Manutenção corretiva urgente",
  descricao: "Correção de falha no sistema principal",
  clienteId: "cli123abc",
  criadoPorId: "clb456def",
  responsavelId: "clb789ghi",
  prioridade: "URGENTE",
  itens: [
    {
      descricao: "Diagnóstico e correção",
      quantidade: 1,
      valorUnitario: 1500.00
    }
  ]
};

const response = await fetch('/api/ordens-servico', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer seu_token_aqui'
  },
  body: JSON.stringify(novaOS)
});

const os = await response.json();
```

#### Exemplo de Resposta

```json
{
  "id": "os456def",
  "numero": "OS202401002",
  "titulo": "Manutenção corretiva urgente",
  "descricao": "Correção de falha no sistema principal",
  "localExecucao": null,
  "dataInicio": null,
  "dataFim": null,
  "valorOrcamento": null,
  "valorFinal": 1500.00,
  "status": "RASCUNHO",
  "prioridade": "URGENTE",
  "observacoes": null,
  "createdAt": "2024-01-16T10:00:00.000Z",
  "updatedAt": "2024-01-16T10:00:00.000Z",
  "cliente": {
    "id": "cli123abc",
    "nome": "Cliente ABC",
    "email": "contato@clienteabc.com",
    "telefone": "(11) 88888-8888"
  },
  "responsavel": {
    "id": "clb789ghi",
    "nome": "Pedro Costa",
    "email": "pedro.costa@empresa.com"
  },
  "criadoPor": {
    "id": "clb456def",
    "nome": "Ana Lima",
    "email": "ana.lima@empresa.com"
  },
  "itens": [
    {
      "id": "item456",
      "descricao": "Diagnóstico e correção",
      "quantidade": 1,
      "valorUnitario": 1500.00,
      "valorTotal": 1500.00,
      "observacoes": null
    }
  ],
  "historico": [
    {
      "id": "hist123",
      "acao": "criada",
      "descricao": "Ordem de serviço criada",
      "createdAt": "2024-01-16T10:00:00.000Z",
      "colaborador": {
        "id": "clb456def",
        "nome": "Ana Lima",
        "email": "ana.lima@empresa.com"
      }
    }
  ]
}
```

### 3. Buscar Ordem de Serviço por ID

**GET** `/api/ordens-servico/{id}`

Busca uma ordem de serviço específica com todos os detalhes, incluindo itens, comentários, anexos, histórico e checklists.

#### Parâmetros de Rota

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `id` | string | ID único da ordem de serviço |

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/ordens-servico/os123abc', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer seu_token_aqui'
  }
});

const os = await response.json();
```

#### Exemplo de Resposta

```json
{
  "id": "os123abc",
  "numero": "OS202401001",
  "titulo": "Manutenção preventiva do sistema",
  "descricao": "Realizar manutenção completa dos equipamentos",
  "localExecucao": "Sede da empresa cliente",
  "dataInicio": "2024-01-20T08:00:00.000Z",
  "dataFim": "2024-01-20T17:00:00.000Z",
  "valorOrcamento": 2500.00,
  "valorFinal": 2350.00,
  "status": "EM_ANDAMENTO",
  "prioridade": "ALTA",
  "observacoes": "Cliente solicitou urgência",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-16T14:30:00.000Z",
  "cliente": {
    "id": "cli789",
    "nome": "Empresa XYZ",
    "email": "contato@empresaxyz.com",
    "telefone": "(11) 99999-9999",
    "documento": "12.345.678/0001-90"
  },
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
  "oportunidade": {
    "id": "opp123",
    "titulo": "Contrato de Manutenção Anual"
  },
  "itens": [
    {
      "id": "item123",
      "descricao": "Manutenção preventiva",
      "quantidade": 1,
      "valorUnitario": 2000.00,
      "valorTotal": 2000.00,
      "observacoes": "Inclui limpeza completa",
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "checklists": [
    {
      "id": "check123",
      "template": {
        "id": "tpl123",
        "nome": "Checklist Manutenção Preventiva"
      },
      "itens": [
        {
          "id": "checkitem123",
          "descricao": "Verificar conexões",
          "concluido": true,
          "ordem": 1
        }
      ]
    }
  ],
  "comentarios": [
    {
      "id": "cmt123",
      "comentario": "Iniciando manutenção conforme programado",
      "visibilidadeCliente": false,
      "createdAt": "2024-01-16T08:00:00.000Z",
      "colaborador": {
        "id": "clb123",
        "nome": "João Silva",
        "email": "joao.silva@empresa.com"
      }
    }
  ],
  "anexos": [
    {
      "id": "anx123",
      "nomeArquivo": "relatorio_manutencao.pdf",
      "caminhoArquivo": "/uploads/os/os123abc/relatorio_manutencao.pdf",
      "tamanhoBytes": 1024000,
      "tipoMime": "application/pdf",
      "descricao": "Relatório de manutenção",
      "createdAt": "2024-01-16T12:00:00.000Z",
      "colaborador": {
        "id": "clb123",
        "nome": "João Silva",
        "email": "joao.silva@empresa.com"
      }
    }
  ],
  "historico": [
    {
      "id": "hist123",
      "acao": "status alterado",
      "descricao": "Status alterado de PENDENTE para EM_ANDAMENTO",
      "valorAnterior": "PENDENTE",
      "valorNovo": "EM_ANDAMENTO",
      "createdAt": "2024-01-16T08:00:00.000Z",
      "colaborador": {
        "id": "clb123",
        "nome": "João Silva",
        "email": "joao.silva@empresa.com"
      }
    }
  ]
}
```

### 4. Atualizar Ordem de Serviço

**PUT** `/api/ordens-servico/{id}`

Atualiza os dados de uma ordem de serviço existente.

#### Corpo da Requisição

```json
{
  "titulo": "Manutenção preventiva do sistema - Atualizada",
  "descricao": "Realizar manutenção completa dos equipamentos com upgrade",
  "localExecucao": "Sede da empresa cliente - Sala de servidores",
  "dataInicio": "2024-01-20T07:00:00.000Z",
  "dataFim": "2024-01-20T19:00:00.000Z",
  "valorOrcamento": 3000.00,
  "prioridade": "URGENTE",
  "observacoesInternas": "Cliente solicitou extensão do horário",
  "responsavelId": "clb789xyz",
  "atualizadoPorId": "clb456def",
  "itens": [
    {
      "descricao": "Manutenção preventiva completa",
      "quantidade": 1,
      "valorUnitario": 2500.00,
      "observacoes": "Inclui upgrade de componentes"
    },
    {
      "descricao": "Teste de performance",
      "quantidade": 1,
      "valorUnitario": 500.00,
      "observacoes": "Validação pós-manutenção"
    }
  ]
}
```

#### Funcionalidades Especiais

- **Log Automático**: Todas as alterações são registradas no histórico
- **Recálculo de Valores**: Valor final recalculado automaticamente com base nos itens
- **Validação de Campos**: Verifica existência de responsável e outras entidades
- **Rastreamento de Mudanças**: Identifica e registra apenas campos alterados
- **Gestão de Itens**: Substitui completamente os itens existentes

#### Exemplo de Requisição

```javascript
const atualizacao = {
  status: "CONCLUIDA",
  observacoesInternas: "Manutenção finalizada com sucesso",
  atualizadoPorId: "clb123abc"
};

const response = await fetch('/api/ordens-servico/os123abc', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer seu_token_aqui'
  },
  body: JSON.stringify(atualizacao)
});

const osAtualizada = await response.json();
```

### 5. Excluir Ordem de Serviço

**DELETE** `/api/ordens-servico/{id}`

Exclui uma ordem de serviço do sistema.

#### Restrições

- Apenas ordens de serviço com status `RASCUNHO` podem ser excluídas
- Remove automaticamente todos os relacionamentos (itens, comentários, anexos, histórico)
- Operação irreversível

#### Exemplo de Requisição

```javascript
const response = await fetch('/api/ordens-servico/os123abc', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer seu_token_aqui'
  }
});

const resultado = await response.json();
```

## Sistema de Comentários

### Listar Comentários

**GET** `/api/ordens-servico/{id}/comentarios`

#### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página atual (padrão: 1) |
| `limit` | number | Itens por página (padrão: 20) |

### Adicionar Comentário

**POST** `/api/ordens-servico/{id}/comentarios`

```json
{
  "comentario": "Manutenção iniciada conforme programado",
  "colaboradorId": "clb123abc",
  "visibilidadeCliente": false
}
```

#### Funcionalidades

- **Visibilidade**: Controle de visibilidade para o cliente
- **Histórico**: Comentários ordenados por data de criação
- **Notificações**: Alertas automáticos para responsáveis
- **Auditoria**: Rastreamento completo de autoria

## Sistema de Anexos

### Listar Anexos

**GET** `/api/ordens-servico/{id}/anexos`

#### Parâmetros de Query

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página atual (padrão: 1) |
| `limit` | number | Itens por página (padrão: 20) |

### Adicionar Anexo

**POST** `/api/ordens-servico/{id}/anexos`

```json
{
  "nomeArquivo": "relatorio_tecnico.pdf",
  "caminhoArquivo": "/uploads/os/os123abc/relatorio_tecnico.pdf",
  "tamanhoBytes": 2048000,
  "tipoMime": "application/pdf",
  "descricao": "Relatório técnico da manutenção",
  "colaboradorId": "clb123abc"
}
```

#### Funcionalidades

- **Upload Seguro**: Validação de tipos de arquivo
- **Organização**: Estrutura de pastas por OS
- **Metadados**: Informações completas do arquivo
- **Controle de Acesso**: Permissões baseadas em perfil

## Sistema de Ações

### Executar Ação

**POST** `/api/ordens-servico/{id}/acoes`

```json
{
  "acao": "APROVAR",
  "colaboradorId": "clb123abc",
  "observacoes": "Aprovado para execução"
}
```

#### Ações Disponíveis

- `APROVAR`: Aprovar ordem de serviço
- `REJEITAR`: Rejeitar ordem de serviço
- `INICIAR`: Iniciar execução
- `PAUSAR`: Pausar execução
- `RETOMAR`: Retomar execução
- `CONCLUIR`: Finalizar ordem de serviço
- `CANCELAR`: Cancelar ordem de serviço

## Sistema de Aprovação

### Enviar para Aprovação

**POST** `/api/ordens-servico/{id}/enviar-aprovacao`

```json
{
  "colaboradorId": "clb123abc",
  "observacoes": "OS pronta para aprovação do cliente",
  "emailCliente": true,
  "prazoAprovacao": "2024-01-25T23:59:59.000Z"
}
```

#### Funcionalidades

- **Notificação Automática**: E-mail para o cliente
- **Link de Aprovação**: URL única para aprovação
- **Prazo**: Controle de tempo limite
- **Histórico**: Rastreamento do processo

## Sistema de Laudos

### Criar Laudo

**POST** `/api/ordens-servico/{id}/laudo`

```json
{
  "tipo": "TECNICO",
  "titulo": "Laudo Técnico de Manutenção",
  "descricao": "Relatório detalhado da manutenção realizada",
  "colaboradorId": "clb123abc",
  "dados": {
    "equipamentos": ["Servidor Principal", "Switch de Rede"],
    "procedimentos": ["Limpeza", "Atualização", "Teste"],
    "observacoes": "Todos os equipamentos funcionando perfeitamente"
  }
}
```

### Concluir Laudo

**POST** `/api/ordens-servico/{id}/laudo/{laudoId}/concluir`

### Gerar Orçamento a partir do Laudo

**POST** `/api/ordens-servico/{id}/laudo/{laudoId}/gerar-orcamento`

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| `200` | Sucesso na busca/atualização |
| `201` | Ordem de serviço criada com sucesso |
| `400` | Dados inválidos ou restrições violadas |
| `401` | Não autorizado |
| `403` | Sem permissão |
| `404` | Ordem de serviço não encontrada |
| `500` | Erro interno do servidor |

## Exemplos de Uso

### Buscar OS por Cliente

```javascript
const osCliente = await fetch('/api/ordens-servico?clienteId=cli123abc&status=EM_ANDAMENTO')
  .then(res => res.json());

console.log(`Cliente possui ${osCliente.meta.total} OS em andamento`);
```

### Criar OS Completa

```javascript
const osCompleta = {
  titulo: "Implementação de Sistema ERP",
  descricao: "Instalação e configuração completa do sistema ERP",
  clienteId: "cli123abc",
  criadoPorId: "clb456def",
  responsavelId: "clb789ghi",
  prioridade: "ALTA",
  valorOrcamento: 15000.00,
  dataInicio: "2024-02-01T08:00:00.000Z",
  dataFim: "2024-02-15T18:00:00.000Z",
  itens: [
    {
      descricao: "Licenças do sistema",
      quantidade: 10,
      valorUnitario: 500.00,
      observacoes: "Licenças anuais"
    },
    {
      descricao: "Instalação e configuração",
      quantidade: 1,
      valorUnitario: 8000.00,
      observacoes: "Inclui migração de dados"
    },
    {
      descricao: "Treinamento da equipe",
      quantidade: 20,
      valorUnitario: 100.00,
      observacoes: "2 horas por pessoa"
    }
  ]
};

const response = await fetch('/api/ordens-servico', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(osCompleta)
});
```

### Adicionar Comentário com Visibilidade

```javascript
const comentario = {
  comentario: "Sistema instalado com sucesso. Aguardando testes do cliente.",
  colaboradorId: "clb123abc",
  visibilidadeCliente: true
};

await fetch(`/api/ordens-servico/os123abc/comentarios`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(comentario)
});
```

### Fluxo de Aprovação

```javascript
// 1. Enviar para aprovação
await fetch(`/api/ordens-servico/os123abc/enviar-aprovacao`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    colaboradorId: "clb123abc",
    emailCliente: true,
    prazoAprovacao: "2024-01-30T23:59:59.000Z"
  })
});

// 2. Executar ação de aprovação
await fetch(`/api/ordens-servico/os123abc/acoes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    acao: "APROVAR",
    colaboradorId: "clb456def",
    observacoes: "Aprovado pelo cliente via e-mail"
  })
});
```

## Integrações

### Integração com Clientes

- Vinculação obrigatória com cliente
- Acesso a dados completos do cliente
- Histórico de OS por cliente
- Comunicação direta via comentários

### Integração com Oportunidades

- Conexão com pipeline de vendas
- Rastreamento de conversão
- Métricas de fechamento
- Histórico de negociação

### Integração com Colaboradores

- Sistema de responsabilidades
- Controle de permissões
- Histórico de atividades
- Métricas de produtividade

## Validações e Regras de Negócio

### Validações de Entrada

1. **Título**: Obrigatório, máximo 255 caracteres
2. **Descrição**: Obrigatória, máximo 2000 caracteres
3. **Cliente**: Obrigatório e deve existir no sistema
4. **Criador**: Obrigatório e deve ser colaborador ativo
5. **Responsável**: Deve ser colaborador ativo (se fornecido)
6. **Datas**: Data fim deve ser posterior à data início
7. **Valores**: Devem ser números positivos
8. **Status**: Transições válidas entre estados
9. **Prioridade**: Valores válidos definidos no enum

### Regras de Negócio

1. **Numeração**: Gerada automaticamente no formato OS{ANO}{MES}{SEQUENCIAL}
2. **Exclusão**: Apenas OS em rascunho podem ser excluídas
3. **Valor Final**: Calculado automaticamente com base nos itens
4. **Histórico**: Todas as alterações são registradas automaticamente
5. **Status**: Fluxo controlado de transições de estado
6. **Aprovação**: Processo formal com notificações
7. **Comentários**: Controle de visibilidade para cliente

## Segurança

### Controle de Acesso

- **Autenticação**: Todos os endpoints requerem token válido
- **Autorização**: Verificação de permissões por endpoint
- **Isolamento**: Usuários só veem OS permitidas
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
CREATE INDEX idx_os_cliente ON ordemServico(clienteId);
CREATE INDEX idx_os_responsavel ON ordemServico(responsavelId);
CREATE INDEX idx_os_status ON ordemServico(status);
CREATE INDEX idx_os_prioridade ON ordemServico(prioridade);
CREATE INDEX idx_os_numero ON ordemServico(numero);
CREATE INDEX idx_os_data_inicio ON ordemServico(dataInicio);
CREATE INDEX idx_os_data_fim ON ordemServico(dataFim);
CREATE INDEX idx_os_criacao ON ordemServico(createdAt);
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

- `os.created`: Ordem de serviço criada
- `os.updated`: Ordem de serviço atualizada
- `os.deleted`: Ordem de serviço excluída
- `os.approved`: Ordem de serviço aprovada
- `os.rejected`: Ordem de serviço rejeitada
- `os.started`: Ordem de serviço iniciada
- `os.completed`: Ordem de serviço concluída
- `os.cancelled`: Ordem de serviço cancelada
- `os.comment_added`: Comentário adicionado
- `os.attachment_added`: Anexo adicionado

### Payload do Webhook

```json
{
  "event": "os.completed",
  "timestamp": "2024-01-16T15:30:00.000Z",
  "data": {
    "id": "os123abc",
    "numero": "OS202401001",
    "titulo": "Manutenção preventiva do sistema",
    "status": "CONCLUIDA",
    "valorFinal": 2350.00,
    "cliente": {
      "id": "cli789",
      "nome": "Empresa XYZ"
    },
    "responsavel": {
      "id": "clb123",
      "nome": "João Silva"
    }
  }
}
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro "Cliente não encontrado"

**Causa**: ID do cliente inválido ou cliente inativo.

**Solução**:
```javascript
// Verificar se cliente existe
const cliente = await fetch(`/api/clientes/${clienteId}`);
if (!cliente.ok) {
  console.error('Cliente não encontrado');
}
```

#### 2. Erro "Apenas rascunhos podem ser deletados"

**Causa**: Tentativa de deletar OS com status diferente de RASCUNHO.

**Solução**:
- Verificar status da OS antes de tentar deletar
- Alterar status para CANCELADA se necessário

#### 3. Numeração duplicada

**Causa**: Problema na geração sequencial de números.

**Solução**:
- Verificar integridade da base de dados
- Recriar índices se necessário

#### 4. Anexos não são salvos

**Causa**: Problemas de upload ou permissões.

**Solução**:
- Verificar tamanho do arquivo (limite: 50MB)
- Confirmar tipos de arquivo permitidos
- Verificar permissões de diretório

### Debugging

#### Logs Importantes

```javascript
// Verificar criação de OS
console.log('Criando OS:', dadosOS);

// Verificar cálculo de valores
console.log('Valor final calculado:', valorFinal);

// Verificar histórico
console.log('Entradas de histórico:', historicoEntries);
```

#### Checklist de Validação

- [ ] Cliente existe e está ativo
- [ ] Responsável existe e está ativo
- [ ] Dados obrigatórios fornecidos
- [ ] Valores numéricos são válidos
- [ ] Datas estão no formato correto
- [ ] Status e prioridade são válidos
- [ ] Usuário tem permissões necessárias

## Relatórios e Métricas

### Métricas Disponíveis

- **Produtividade**: OS concluídas por período
- **Performance**: Tempo médio de execução
- **Faturamento**: Valor total por período
- **Distribuição**: OS por responsável/cliente
- **Status**: Distribuição por status
- **Prioridades**: Análise de urgência

### Endpoints de Relatórios

```javascript
// Relatório de produtividade
const produtividade = await fetch('/api/ordens-servico/reports/productivity?periodo=30');

// OS por status
const porStatus = await fetch('/api/ordens-servico/reports/status-distribution');

// Faturamento por período
const faturamento = await fetch('/api/ordens-servico/reports/revenue?inicio=2024-01-01&fim=2024-01-31');
```

## Changelog

### v3.2.0 (2024-01-16)
- Adicionado sistema de laudos técnicos
- Implementado fluxo de aprovação avançado
- Melhorado sistema de checklists

### v3.1.0 (2024-01-01)
- Adicionada integração com oportunidades
- Implementado sistema de ações
- Melhorada performance das consultas

### v3.0.0 (2023-12-01)
- Reestruturação completa da API
- Adicionado sistema de comentários e anexos
- Implementado controle de permissões

## Suporte

Para dúvidas ou problemas com o módulo de Ordens de Serviço:

- **Documentação**: `/docs/api-module-ordens-servico.md`
- **Exemplos**: `/docs/api-examples.md`
- **Troubleshooting**: `/docs/api-troubleshooting.md`
- **Contato**: suporte@garapasystem.com

---

**Última atualização**: 16 de Janeiro de 2024  
**Versão da API**: 3.2.0
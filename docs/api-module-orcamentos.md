# Módulo de Orçamentos - API GarapaSystem

## Visão Geral

O módulo de Orçamentos é responsável por gerenciar todo o ciclo de vida dos orçamentos no sistema GarapaSystem, desde a criação manual ou automática até a aprovação pelo cliente. Este módulo oferece funcionalidades completas para criação, edição, aprovação e controle de orçamentos vinculados a ordens de serviço.

## Características Principais

### 1. **CRUD Completo**
- Criação, leitura, atualização e exclusão de orçamentos
- Validação de dados e regras de negócio
- Controle de permissões por perfil de usuário

### 2. **Numeração Automática**
- Sistema de numeração sequencial: `ORCYYYYMMNNNN`
- Formato: ORC + Ano (4 dígitos) + Mês (2 dígitos) + Número sequencial (4 dígitos)
- Exemplo: `ORC202412001` (primeiro orçamento de dezembro de 2024)

### 3. **Status de Orçamentos**
- `RASCUNHO`: Orçamento em elaboração
- `ENVIADO`: Orçamento enviado para o cliente
- `EM_ANALISE`: Cliente está analisando o orçamento
- `APROVADO`: Orçamento aprovado pelo cliente
- `REJEITADO`: Orçamento rejeitado pelo cliente
- `VENCIDO`: Orçamento com data de validade expirada

### 4. **Geração Automática**
- Geração a partir de laudos técnicos
- Geração a partir de ordens de serviço
- Aplicação de margem de lucro configurável
- Modo preview para visualização antes da criação

### 5. **Sistema de Aprovação**
- Interface pública para aprovação pelo cliente
- Controle de status e datas de aprovação
- Comentários do cliente na aprovação/rejeição
- Atualização automática da ordem de serviço

### 6. **Itens do Orçamento**
- Suporte a materiais e serviços
- Cálculo automático de valores totais
- Controle de quantidade e valores unitários
- Observações por item

### 7. **Histórico de Ações**
- Registro completo de todas as alterações
- Rastreabilidade de quem fez cada ação
- Timestamps de todas as operações

### 8. **Integração com Outros Módulos**
- Vinculação com Ordens de Serviço
- Integração com Laudos Técnicos
- Conexão com dados de Clientes
- Relacionamento com Colaboradores

## Relacionamentos

### Cliente
- **Tipo**: Many-to-One
- **Descrição**: Cada orçamento pertence a um cliente específico
- **Campos**: `clienteId`

### Ordem de Serviço
- **Tipo**: Many-to-One
- **Descrição**: Orçamento vinculado a uma ordem de serviço
- **Campos**: `ordemServicoId`

### Laudo Técnico
- **Tipo**: Many-to-One (Opcional)
- **Descrição**: Orçamento pode ser baseado em um laudo técnico
- **Campos**: `laudoTecnicoId`

### Criador
- **Tipo**: Many-to-One
- **Descrição**: Colaborador que criou o orçamento
- **Campos**: `criadoPorId`

### Itens
- **Tipo**: One-to-Many
- **Descrição**: Itens que compõem o orçamento
- **Campos**: Lista de itens com descrição, quantidade, valores

### Histórico
- **Tipo**: One-to-Many
- **Descrição**: Registro de todas as ações realizadas no orçamento
- **Campos**: Ação, descrição, colaborador, timestamp

## Endpoints da API

### 1. Listar Orçamentos
```http
GET /api/orcamentos
```

**Parâmetros de Query:**
- `page` (number): Página para paginação (padrão: 1)
- `limit` (number): Itens por página (padrão: 10, máximo: 100)
- `search` (string): Busca por número, título, descrição, título da OS ou nome do cliente
- `status` (string): Filtrar por status específico
- `clienteId` (string): Filtrar por cliente
- `ordemServicoId` (string): Filtrar por ordem de serviço
- `laudoTecnicoId` (string): Filtrar por laudo técnico
- `dataInicio` (string): Data inicial para filtro (formato: YYYY-MM-DD)
- `dataFim` (string): Data final para filtro (formato: YYYY-MM-DD)
- `geradoAutomaticamente` (boolean): Filtrar orçamentos gerados automaticamente

**Resposta de Sucesso (200):**
```json
{
  "orcamentos": [
    {
      "id": "uuid",
      "numero": "ORC202412001",
      "titulo": "Orçamento para Manutenção de Equipamento",
      "descricao": "Descrição detalhada do orçamento",
      "valorTotal": 1500.00,
      "valorDesconto": 0.00,
      "percentualDesconto": 0,
      "dataValidade": "2024-12-31T23:59:59.000Z",
      "observacoes": "Observações gerais",
      "status": "ENVIADO",
      "aprovadoCliente": null,
      "dataAprovacao": null,
      "comentariosCliente": null,
      "geradoAutomaticamente": false,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "updatedAt": "2024-12-01T10:00:00.000Z",
      "ordemServico": {
        "id": "uuid",
        "numero": "OS202412001",
        "titulo": "Manutenção de Equipamento",
        "cliente": {
          "id": "uuid",
          "nome": "Cliente Exemplo",
          "email": "cliente@exemplo.com"
        }
      },
      "laudoTecnico": {
        "id": "uuid",
        "numero": "LT202412001",
        "titulo": "Laudo Técnico"
      },
      "criadoPor": {
        "id": "uuid",
        "nome": "Técnico Responsável",
        "email": "tecnico@garapa.com"
      },
      "itens": [
        {
          "id": "uuid",
          "tipo": "MATERIAL",
          "descricao": "Peça de reposição",
          "quantidade": 2,
          "valorUnitario": 500.00,
          "valorTotal": 1000.00,
          "observacoes": "Peça original"
        }
      ],
      "_count": {
        "anexos": 2,
        "historico": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### 2. Criar Orçamento
```http
POST /api/orcamentos
```

**Corpo da Requisição:**
```json
{
  "titulo": "Orçamento para Manutenção",
  "descricao": "Descrição detalhada do orçamento",
  "ordemServicoId": "uuid",
  "laudoTecnicoId": "uuid", // opcional
  "valorTotal": 1500.00,
  "valorDesconto": 100.00, // opcional
  "percentualDesconto": 5, // opcional
  "dataValidade": "2024-12-31",
  "observacoes": "Observações gerais",
  "criadoPorId": "uuid",
  "itens": [
    {
      "tipo": "MATERIAL",
      "descricao": "Peça de reposição",
      "quantidade": 2,
      "valorUnitario": 500.00,
      "observacoes": "Peça original"
    },
    {
      "tipo": "SERVICO",
      "descricao": "Mão de obra especializada",
      "quantidade": 4,
      "valorUnitario": 125.00,
      "observacoes": "4 horas de trabalho"
    }
  ]
}
```

**Validações:**
- `titulo`: Obrigatório, mínimo 1 caractere
- `ordemServicoId`: Obrigatório, deve ser um UUID válido
- `valorTotal`: Obrigatório, deve ser maior que zero
- `criadoPorId`: Obrigatório, deve ser um UUID válido
- `itens`: Opcional, mas se fornecido deve ter pelo menos 1 item
- Ordem de serviço deve existir
- Colaborador criador deve existir
- Laudo técnico deve existir (se fornecido)

**Resposta de Sucesso (201):**
```json
{
  "message": "Orçamento criado com sucesso",
  "orcamento": {
    "id": "uuid",
    "numero": "ORC202412001",
    // ... dados completos do orçamento criado
  }
}
```

### 3. Buscar Orçamento por ID
```http
GET /api/orcamentos/{id}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "numero": "ORC202412001",
  "titulo": "Orçamento para Manutenção",
  // ... dados completos do orçamento
  "ordemServico": {
    "id": "uuid",
    "numero": "OS202412001",
    "titulo": "Manutenção de Equipamento",
    "cliente": {
      "id": "uuid",
      "nome": "Cliente Exemplo",
      "email": "cliente@exemplo.com"
    }
  },
  "laudoTecnico": {
    "id": "uuid",
    "numero": "LT202412001",
    "titulo": "Laudo Técnico"
  },
  "criadoPor": {
    "id": "uuid",
    "nome": "Técnico Responsável",
    "email": "tecnico@garapa.com"
  },
  "itens": [
    // ... lista de itens
  ],
  "anexos": [
    {
      "id": "uuid",
      "nomeArquivo": "orcamento.pdf",
      "caminhoArquivo": "/uploads/orcamentos/orcamento.pdf",
      "colaborador": {
        "nome": "Técnico Responsável",
        "email": "tecnico@garapa.com"
      },
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ],
  "historico": [
    {
      "id": "uuid",
      "acao": "criado",
      "descricao": "Orçamento criado",
      "colaborador": {
        "nome": "Técnico Responsável",
        "email": "tecnico@garapa.com"
      },
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  ]
}
```

### 4. Atualizar Orçamento
```http
PUT /api/orcamentos/{id}
```

**Corpo da Requisição:**
```json
{
  "titulo": "Título atualizado",
  "descricao": "Descrição atualizada",
  "valorTotal": 1600.00,
  "valorDesconto": 50.00,
  "percentualDesconto": 3,
  "dataValidade": "2024-12-31",
  "observacoes": "Observações atualizadas",
  "ordemServicoId": "uuid",
  "laudoTecnicoId": "uuid"
}
```

**Validações:**
- Orçamento deve existir
- `titulo`: Obrigatório se fornecido
- `valorTotal`: Deve ser maior que zero se fornecido
- Ordem de serviço deve existir (se fornecida)
- Laudo técnico deve existir (se fornecido)

**Resposta de Sucesso (200):**
```json
{
  "message": "Orçamento atualizado com sucesso",
  "orcamento": {
    // ... dados completos do orçamento atualizado
  }
}
```

### 5. Excluir Orçamento
```http
DELETE /api/orcamentos/{id}
```

**Validações:**
- Orçamento deve existir
- Orçamento não pode ter status 'APROVADO'

**Resposta de Sucesso (200):**
```json
{
  "message": "Orçamento excluído com sucesso"
}
```

## Sistema de Aprovação

### 1. Processar Aprovação/Rejeição
```http
POST /api/orcamentos/aprovacao/{id}
```

**Corpo da Requisição:**
```json
{
  "aprovado": true,
  "comentarios": "Orçamento aprovado. Pode prosseguir com o serviço."
}
```

**Validações:**
- Orçamento deve existir
- Status deve ser 'ENVIADO' ou 'EM_ANALISE'
- Orçamento não pode estar vencido
- `aprovado`: Obrigatório (boolean)
- `comentarios`: Opcional

**Resposta de Sucesso (200):**
```json
{
  "message": "Orçamento aprovado com sucesso",
  "orcamento": {
    "id": "uuid",
    "status": "APROVADO",
    "aprovadoCliente": true,
    "dataAprovacao": "2024-12-01T15:30:00.000Z",
    "comentariosCliente": "Orçamento aprovado. Pode prosseguir com o serviço.",
    // ... outros dados do orçamento
  }
}
```

### 2. Visualização Pública do Orçamento
```http
GET /api/orcamentos/aprovacao/{id}
```

**Resposta de Sucesso (200):**
```json
{
  "id": "uuid",
  "numero": "ORC202412001",
  "titulo": "Orçamento para Manutenção",
  "descricao": "Descrição do orçamento",
  "valorTotal": 1500.00,
  "valorDesconto": 0.00,
  "percentualDesconto": 0,
  "dataValidade": "2024-12-31T23:59:59.000Z",
  "observacoes": "Observações",
  "status": "ENVIADO",
  "aprovadoCliente": null,
  "dataAprovacao": null,
  "comentariosCliente": null,
  "createdAt": "2024-12-01T10:00:00.000Z",
  "ordemServico": {
    "id": "uuid",
    "numero": "OS202412001",
    "titulo": "Manutenção de Equipamento",
    "cliente": {
      "id": "uuid",
      "nome": "Cliente Exemplo",
      "email": "cliente@exemplo.com",
      "telefone": "(11) 99999-9999"
    }
  },
  "laudoTecnico": {
    "id": "uuid",
    "numero": "LT202412001",
    "titulo": "Laudo Técnico",
    "problemaRelatado": "Problema identificado",
    "diagnostico": "Diagnóstico técnico",
    "solucaoRecomendada": "Solução recomendada"
  },
  "itens": [
    {
      "id": "uuid",
      "tipo": "MATERIAL",
      "descricao": "Peça de reposição",
      "quantidade": 2,
      "valorUnitario": 500.00,
      "valorTotal": 1000.00,
      "observacoes": "Peça original"
    }
  ]
}
```

## Sistema de Geração Automática

### 1. Gerar Orçamento Automaticamente
```http
POST /api/orcamentos/gerar-automatico
```

**Corpo da Requisição (a partir de Ordem de Serviço):**
```json
{
  "ordemServicoId": "uuid",
  "titulo": "Título personalizado", // opcional
  "descricao": "Descrição personalizada", // opcional
  "observacoes": "Observações", // opcional
  "dataValidade": "2024-12-31", // opcional
  "margemLucro": 25, // opcional, padrão: 20%
  "preview": false // opcional, padrão: false
}
```

**Corpo da Requisição (a partir de Laudo Técnico):**
```json
{
  "laudoTecnicoId": "uuid",
  "forcarRecriacao": false // opcional, padrão: false
}
```

**Modo Preview:**
```json
{
  "ordemServicoId": "uuid",
  "margemLucro": 30,
  "preview": true
}
```

**Resposta Preview (200):**
```json
{
  "itens": [
    {
      "tipo": "MATERIAL",
      "descricao": "Peça de reposição",
      "quantidade": 2,
      "valorUnitario": 650.00, // com margem aplicada
      "valorTotal": 1300.00,
      "observacoes": "Peça original"
    }
  ],
  "valorTotal": 1950.00,
  "margemAplicada": 30,
  "ordemServico": {
    "numero": "OS202412001",
    "titulo": "Manutenção de Equipamento",
    "status": "EM_ANDAMENTO"
  }
}
```

**Resposta de Sucesso (201):**
```json
{
  "message": "Orçamento gerado automaticamente com sucesso",
  "orcamento": {
    "id": "uuid",
    "numero": "ORC202412001",
    "geradoAutomaticamente": true,
    // ... dados completos do orçamento criado
  }
}
```

**Validações:**
- Deve fornecer `ordemServicoId` ou `laudoTecnicoId`
- Ordem de serviço deve existir (se fornecida)
- Laudo técnico deve existir (se fornecido)
- Laudo deve estar configurado para gerar orçamento (`gerarOrcamento: true`)
- `margemLucro`: Entre 0 e 100 (se fornecida)
- Para laudo: não pode existir orçamento automático anterior (exceto se `forcarRecriacao: true`)

## Códigos de Status HTTP

- **200 OK**: Operação realizada com sucesso
- **201 Created**: Orçamento criado com sucesso
- **400 Bad Request**: Dados inválidos ou regra de negócio violada
- **401 Unauthorized**: Usuário não autenticado
- **403 Forbidden**: Usuário sem permissão para a operação
- **404 Not Found**: Orçamento não encontrado
- **409 Conflict**: Conflito (ex: orçamento automático já existe)
- **500 Internal Server Error**: Erro interno do servidor

## Exemplos de Uso

### JavaScript/TypeScript

```javascript
// Listar orçamentos com filtros
const response = await fetch('/api/orcamentos?status=ENVIADO&clienteId=uuid&page=1&limit=20');
const data = await response.json();

// Criar novo orçamento
const novoOrcamento = {
  titulo: "Orçamento para Manutenção Preventiva",
  descricao: "Manutenção preventiva completa do equipamento",
  ordemServicoId: "uuid-da-ordem-servico",
  valorTotal: 2500.00,
  dataValidade: "2024-12-31",
  criadoPorId: "uuid-do-colaborador",
  itens: [
    {
      tipo: "MATERIAL",
      descricao: "Kit de manutenção",
      quantidade: 1,
      valorUnitario: 1500.00,
      observacoes: "Kit completo"
    },
    {
      tipo: "SERVICO",
      descricao: "Mão de obra especializada",
      quantidade: 8,
      valorUnitario: 125.00,
      observacoes: "8 horas de trabalho"
    }
  ]
};

const createResponse = await fetch('/api/orcamentos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(novoOrcamento)
});

// Gerar orçamento automaticamente
const orcamentoAutomatico = {
  ordemServicoId: "uuid-da-ordem-servico",
  margemLucro: 25,
  titulo: "Orçamento Automático",
  dataValidade: "2024-12-31"
};

const autoResponse = await fetch('/api/orcamentos/gerar-automatico', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orcamentoAutomatico)
});

// Aprovar orçamento
const aprovacao = {
  aprovado: true,
  comentarios: "Orçamento aprovado. Pode iniciar os trabalhos."
};

const approveResponse = await fetch('/api/orcamentos/aprovacao/uuid-do-orcamento', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(aprovacao)
});
```

## Integrações

### 1. **Clientes**
- Vinculação automática através da ordem de serviço
- Dados do cliente incluídos nas respostas
- Validação de existência do cliente

### 2. **Ordens de Serviço**
- Relacionamento obrigatório
- Atualização automática do status da OS na aprovação
- Inclusão do valor do orçamento na OS

### 3. **Laudos Técnicos**
- Geração automática baseada em laudos
- Transferência de itens e valores
- Validação de configuração do laudo

### 4. **Colaboradores**
- Controle de criação e modificação
- Histórico de ações por colaborador
- Validação de permissões

## Validações e Regras de Negócio

### 1. **Criação de Orçamentos**
- Título obrigatório
- Valor total deve ser maior que zero
- Ordem de serviço deve existir
- Colaborador criador deve existir
- Laudo técnico deve existir (se fornecido)

### 2. **Atualização de Orçamentos**
- Orçamento deve existir
- Validações de campos obrigatórios
- Verificação de relacionamentos

### 3. **Exclusão de Orçamentos**
- Não é possível excluir orçamentos aprovados
- Exclusão em cascata de itens e histórico

### 4. **Aprovação de Orçamentos**
- Status deve ser 'ENVIADO' ou 'EM_ANALISE'
- Orçamento não pode estar vencido
- Atualização automática da ordem de serviço

### 5. **Geração Automática**
- Laudo deve estar configurado para gerar orçamento
- Não pode existir orçamento automático anterior (exceto se forçar recriação)
- Margem de lucro deve estar entre 0 e 100%

## Segurança

### 1. **Controle de Acesso**
- Autenticação obrigatória para todas as operações
- Verificação de permissões por perfil de usuário
- Validação de propriedade dos recursos

### 2. **Validação de Dados**
- Sanitização de entradas
- Validação de tipos e formatos
- Prevenção de SQL injection

### 3. **Interface Pública**
- Endpoint de aprovação sem autenticação
- Dados sensíveis filtrados na visualização pública
- Validação de status para visualização

## Performance e Otimização

### 1. **Índices de Banco de Dados**
- Índice em `numero` para busca rápida
- Índice em `clienteId` para filtros
- Índice em `ordemServicoId` para relacionamentos
- Índice em `status` para filtros de status

### 2. **Paginação**
- Limite máximo de 100 itens por página
- Contagem total otimizada
- Ordenação por data de criação

### 3. **Includes Otimizados**
- Seleção específica de campos relacionados
- Evitar N+1 queries
- Uso de `select` para campos específicos

## Webhooks

### 1. **Eventos Disponíveis**
- `orcamento.criado`: Orçamento criado
- `orcamento.atualizado`: Orçamento atualizado
- `orcamento.aprovado`: Orçamento aprovado pelo cliente
- `orcamento.rejeitado`: Orçamento rejeitado pelo cliente
- `orcamento.vencido`: Orçamento venceu
- `orcamento.excluido`: Orçamento excluído

### 2. **Payload do Webhook**
```json
{
  "evento": "orcamento.aprovado",
  "timestamp": "2024-12-01T15:30:00.000Z",
  "dados": {
    "orcamento": {
      "id": "uuid",
      "numero": "ORC202412001",
      "status": "APROVADO",
      "valorTotal": 1500.00,
      "cliente": {
        "id": "uuid",
        "nome": "Cliente Exemplo",
        "email": "cliente@exemplo.com"
      },
      "ordemServico": {
        "id": "uuid",
        "numero": "OS202412001"
      }
    }
  }
}
```

## Troubleshooting

### 1. **Problemas Comuns**

**Erro: "Orçamento não encontrado"**
- Verificar se o ID está correto
- Confirmar se o orçamento não foi excluído

**Erro: "Ordem de serviço não encontrada"**
- Verificar se a ordem de serviço existe
- Confirmar se o ID está correto

**Erro: "Orçamento não pode ser excluído"**
- Verificar se o status não é 'APROVADO'
- Orçamentos aprovados não podem ser excluídos

**Erro: "Laudo técnico não configurado para gerar orçamento"**
- Verificar se `gerarOrcamento` está como `true` no laudo
- Atualizar configuração do laudo se necessário

### 2. **Debugging**
- Verificar logs do servidor para erros detalhados
- Confirmar permissões do usuário
- Validar formato dos dados enviados
- Verificar relacionamentos entre entidades

## Relatórios e Métricas

### 1. **Métricas Disponíveis**
- Total de orçamentos por período
- Taxa de aprovação de orçamentos
- Valor médio dos orçamentos
- Tempo médio para aprovação
- Orçamentos por status
- Orçamentos por colaborador

### 2. **Relatórios**
- Relatório de orçamentos por cliente
- Relatório de performance de aprovação
- Relatório de valores por período
- Relatório de orçamentos vencidos

## Changelog

### Versão 1.0.0
- Implementação inicial do módulo de orçamentos
- CRUD completo de orçamentos
- Sistema de aprovação por cliente
- Geração automática a partir de laudos técnicos
- Numeração automática sequencial
- Histórico de ações
- Integração com ordens de serviço

### Versão 1.1.0
- Adicionada geração automática a partir de ordens de serviço
- Implementado modo preview para geração automática
- Melhorias na interface de aprovação pública
- Otimizações de performance

## Suporte

Para suporte técnico ou dúvidas sobre a implementação:
- **Email**: suporte@garapa.com
- **Documentação**: `/docs/api-module-orcamentos.md`
- **Logs**: Verificar logs do servidor em `/var/log/garapa-system/`
# Arquitetura do Módulo de Estoque com Centro de Custo

## 1. Visão Geral

### 1.1 Objetivo
Desenvolver um sistema completo de controle de estoque integrado com centro de custo, permitindo rastreabilidade, controle de movimentações e gestão financeira por departamento/projeto.

### 1.2 Características Principais
- Controle de estoque em tempo real
- Gestão por centro de custo
- Rastreabilidade completa de movimentações
- Integração com módulos de Compras e Tombamento
- Alertas automáticos de estoque mínimo
- Relatórios gerenciais e operacionais

## 2. Modelos de Dados (Prisma Schema)

### 2.1 Produto
```typescript
model Produto {
  id                String   @id @default(cuid())
  codigo            String   @unique
  codigoBarras      String?  @unique
  nome              String
  descricao         String?
  unidadeMedida     String
  categoria         CategoriaProduto @relation(fields: [categoriaId], references: [id])
  categoriaId       String
  tipo              TipoProduto
  status            StatusProduto
  estoqueMinimo     Int      @default(0)
  estoqueMaximo     Int?
  localizacaoPadrao String?
  observacoes       String?
  empresaId         String
  
  // Relacionamentos
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  movimentacoes     MovimentacaoEstoque[]
  saldos            SaldoEstoque[]
  fornecedores      ProdutoFornecedor[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([empresaId, codigo])
  @@index([empresaId, categoriaId])
}

enum TipoProduto {
  CONSUMIVEL
  MATERIA_PRIMA
  PRODUTO_ACABADO
  EMBALAGEM
  FERRAMENTA
  EPI
  MEDICAMENTO
  LIMPEZA
}

enum StatusProduto {
  ATIVO
  INATIVO
  DESCONTINUADO
}
```

### 2.2 Categoria de Produto
```typescript
model CategoriaProduto {
  id                String   @id @default(cuid())
  codigo            String   @unique
  nome              String
  descricao         String?
  categoriaPai      String?
  nivel             Int      @default(1)
  contaContabil     String?
  centroCustoPadrao String?
  empresaId         String
  
  // Relacionamentos
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  produtos          Produto[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([empresaId, codigo])
}
```

### 2.3 Movimentação de Estoque
```typescript
model MovimentacaoEstoque {
  id                String   @id @default(cuid())
  numero            String   @unique
  tipo              TipoMovimentacao
  produto           Produto  @relation(fields: [produtoId], references: [id])
  produtoId         String
  quantidade        Int
  valorUnitario     Decimal?
  valorTotal        Decimal?
  centroCusto       CentroCusto @relation(fields: [centroCustoId], references: [id])
  centroCustoId     String
  localizacao       String?
  lote              String?
  dataValidade      DateTime?
  dataMovimentacao  DateTime @default(now())
  documentoReferencia String?
  observacoes       String?
  usuario           Usuario  @relation(fields: [usuarioId], references: [id])
  usuarioId         String
  empresaId         String
  
  // Relacionamentos específicos por tipo
  pedidoCompraId    String?  // Para ENTRADA_COMPRA
  solicitacaoId     String?  // Para SAIDA_SOLICITACAO
  transferenciaId   String?  // Para TRANSFERENCIA
  inventarioId      String?  // Para AJUSTE_INVENTARIO
  
  // Relacionamentos
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  pedidoCompra      PedidoCompra? @relation(fields: [pedidoCompraId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([empresaId, produtoId])
  @@index([empresaId, centroCustoId])
  @@index([empresaId, dataMovimentacao])
}

enum TipoMovimentacao {
  ENTRADA_COMPRA
  ENTRADA_DEVOLUCAO
  ENTRADA_TRANSFERENCIA
  ENTRADA_AJUSTE
  SAIDA_CONSUMO
  SAIDA_TRANSFERENCIA
  SAIDA_PERDA
  SAIDA_AJUSTE
  SAIDA_TOMBAMENTO
}
```

### 2.4 Saldo de Estoque
```typescript
model SaldoEstoque {
  id                String   @id @default(cuid())
  produto           Produto  @relation(fields: [produtoId], references: [id])
  produtoId         String
  centroCusto       CentroCusto @relation(fields: [centroCustoId], references: [id])
  centroCustoId     String
  localizacao       String?
  lote              String?
  quantidade        Int      @default(0)
  valorUnitario     Decimal?
  valorTotal        Decimal?
  dataUltimaMovimentacao DateTime?
  empresaId         String
  
  // Relacionamentos
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([produtoId, centroCustoId, localizacao, lote])
  @@index([empresaId, produtoId])
  @@index([empresaId, centroCustoId])
}
```

### 2.5 Solicitação de Estoque
```typescript
model SolicitacaoEstoque {
  id                String   @id @default(cuid())
  numero            String   @unique
  tipo              TipoSolicitacao
  status            StatusSolicitacao
  centroCusto       CentroCusto @relation(fields: [centroCustoId], references: [id])
  centroCustoId     String
  solicitante       Usuario  @relation(fields: [solicitanteId], references: [id])
  solicitanteId     String
  aprovador         Usuario? @relation(fields: [aprovadorId], references: [id])
  aprovadorId       String?
  dataAprovacao     DateTime?
  dataNecessidade   DateTime
  observacoes       String?
  empresaId         String
  
  // Relacionamentos
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  itens             ItemSolicitacao[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([empresaId, status])
  @@index([empresaId, centroCustoId])
}

enum TipoSolicitacao {
  CONSUMO
  TRANSFERENCIA
  MANUTENCAO
  PROJETO
}

enum StatusSolicitacao {
  PENDENTE
  APROVADA
  REJEITADA
  ATENDIDA
  CANCELADA
}
```

### 2.6 Item de Solicitação
```typescript
model ItemSolicitacao {
  id                String   @id @default(cuid())
  solicitacao       SolicitacaoEstoque @relation(fields: [solicitacaoId], references: [id])
  solicitacaoId     String
  produto           Produto  @relation(fields: [produtoId], references: [id])
  produtoId         String
  quantidadeSolicitada Int
  quantidadeAtendida Int    @default(0)
  observacoes       String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([solicitacaoId, produtoId])
}
```

### 2.7 Inventário Físico
```typescript
model InventarioFisico {
  id                String   @id @default(cuid())
  numero            String   @unique
  descricao         String
  tipo              TipoInventario
  status            StatusInventario
  dataInicio        DateTime
  dataFim           DateTime?
  responsavel       Usuario  @relation(fields: [responsavelId], references: [id])
  responsavelId     String
  centroCusto       CentroCusto? @relation(fields: [centroCustoId], references: [id])
  centroCustoId     String?
  observacoes       String?
  empresaId         String
  
  // Relacionamentos
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  itens             ItemInventario[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([empresaId, status])
}

enum TipoInventario {
  GERAL
  POR_CATEGORIA
  POR_CENTRO_CUSTO
  POR_LOCALIZACAO
}

enum StatusInventario {
  PLANEJADO
  EM_ANDAMENTO
  CONCLUIDO
  CANCELADO
}
```

### 2.8 Item de Inventário
```typescript
model ItemInventario {
  id                String   @id @default(cuid())
  inventario        InventarioFisico @relation(fields: [inventarioId], references: [id])
  inventarioId      String
  produto           Produto  @relation(fields: [produtoId], references: [id])
  produtoId         String
  localizacao       String?
  lote              String?
  quantidadeSistema Int
  quantidadeFisica  Int?
  diferenca         Int?
  valorUnitario     Decimal?
  observacoes       String?
  contado           Boolean  @default(false)
  dataContagem      DateTime?
  contador          Usuario? @relation(fields: [contadorId], references: [id])
  contadorId        String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([inventarioId, produtoId])
}
```

### 2.9 Localização
```typescript
model Localizacao {
  id                String   @id @default(cuid())
  codigo            String   @unique
  nome              String
  descricao         String?
  tipo              TipoLocalizacao
  localizacaoPai    String?
  nivel             Int      @default(1)
  capacidade        Int?
  empresaId         String
  
  // Relacionamentos
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([empresaId, codigo])
}

enum TipoLocalizacao {
  DEPOSITO
  PRATELEIRA
  GAVETA
  SALA
  ARMARIO
  GELADEIRA
}
```

### 2.10 Produto Fornecedor
```typescript
model ProdutoFornecedor {
  id                String   @id @default(cuid())
  produto           Produto  @relation(fields: [produtoId], references: [id])
  produtoId         String
  fornecedor        Fornecedor @relation(fields: [fornecedorId], references: [id])
  fornecedorId      String
  codigoFornecedor  String?
  valorUnitario     Decimal?
  prazoEntrega      Int?     // em dias
  quantidadeMinima  Int?
  principal         Boolean  @default(false)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([produtoId, fornecedorId])
}
```

## 3. Estrutura de Arquivos

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── estoque/
│   │       ├── page.tsx                    # Dashboard principal
│   │       ├── produtos/
│   │       │   ├── page.tsx               # Lista de produtos
│   │       │   ├── novo/page.tsx          # Cadastro de produto
│   │       │   └── [id]/
│   │       │       ├── page.tsx           # Detalhes do produto
│   │       │       └── editar/page.tsx    # Edição do produto
│   │       ├── movimentacoes/
│   │       │   ├── page.tsx               # Lista de movimentações
│   │       │   ├── entrada/page.tsx       # Entrada manual
│   │       │   ├── saida/page.tsx         # Saída manual
│   │       │   └── transferencia/page.tsx # Transferência
│   │       ├── solicitacoes/
│   │       │   ├── page.tsx               # Lista de solicitações
│   │       │   ├── nova/page.tsx          # Nova solicitação
│   │       │   └── [id]/page.tsx          # Detalhes da solicitação
│   │       ├── inventario/
│   │       │   ├── page.tsx               # Lista de inventários
│   │       │   ├── novo/page.tsx          # Novo inventário
│   │       │   └── [id]/
│   │       │       ├── page.tsx           # Detalhes do inventário
│   │       │       └── contagem/page.tsx  # Tela de contagem
│   │       ├── relatorios/
│   │       │   ├── page.tsx               # Lista de relatórios
│   │       │   ├── saldos/page.tsx        # Relatório de saldos
│   │       │   ├── movimentacoes/page.tsx # Relatório de movimentações
│   │       │   └── centro-custo/page.tsx  # Relatório por centro de custo
│   │       └── configuracoes/
│   │           ├── page.tsx               # Configurações gerais
│   │           ├── categorias/page.tsx    # Gestão de categorias
│   │           └── localizacoes/page.tsx  # Gestão de localizações
│   └── api/
│       └── estoque/
│           ├── produtos/
│           │   ├── route.ts               # CRUD produtos
│           │   └── [id]/route.ts          # Produto específico
│           ├── movimentacoes/
│           │   ├── route.ts               # CRUD movimentações
│           │   ├── entrada/route.ts       # Entrada de estoque
│           │   ├── saida/route.ts         # Saída de estoque
│           │   └── transferencia/route.ts # Transferência
│           ├── saldos/
│           │   ├── route.ts               # Consulta de saldos
│           │   └── por-centro-custo/route.ts # Saldos por centro
│           ├── solicitacoes/
│           │   ├── route.ts               # CRUD solicitações
│           │   ├── aprovar/route.ts       # Aprovação
│           │   └── atender/route.ts       # Atendimento
│           ├── inventario/
│           │   ├── route.ts               # CRUD inventários
│           │   ├── iniciar/route.ts       # Iniciar inventário
│           │   └── finalizar/route.ts     # Finalizar inventário
│           └── relatorios/
│               ├── saldos/route.ts        # Relatório de saldos
│               ├── movimentacoes/route.ts # Relatório de movimentações
│               └── centro-custo/route.ts  # Relatório por centro
├── components/
│   └── estoque/
│       ├── produto-form.tsx               # Formulário de produto
│       ├── movimentacao-form.tsx          # Formulário de movimentação
│       ├── solicitacao-form.tsx           # Formulário de solicitação
│       ├── inventario-form.tsx            # Formulário de inventário
│       ├── saldo-card.tsx                 # Card de saldo
│       ├── movimentacao-table.tsx         # Tabela de movimentações
│       ├── produto-selector.tsx           # Seletor de produtos
│       ├── centro-custo-selector.tsx      # Seletor de centro de custo
│       └── alerta-estoque-minimo.tsx      # Alerta de estoque mínimo
├── lib/
│   └── estoque/
│       ├── services/
│       │   ├── produto-service.ts         # Serviços de produto
│       │   ├── movimentacao-service.ts    # Serviços de movimentação
│       │   ├── saldo-service.ts           # Serviços de saldo
│       │   ├── solicitacao-service.ts     # Serviços de solicitação
│       │   └── inventario-service.ts      # Serviços de inventário
│       ├── hooks/
│       │   ├── use-produtos.ts            # Hook para produtos
│       │   ├── use-movimentacoes.ts       # Hook para movimentações
│       │   ├── use-saldos.ts              # Hook para saldos
│       │   ├── use-solicitacoes.ts        # Hook para solicitações
│       │   └── use-inventario.ts          # Hook para inventário
│       ├── utils/
│       │   ├── estoque-calculations.ts    # Cálculos de estoque
│       │   ├── validators.ts              # Validações
│       │   └── formatters.ts              # Formatadores
│       └── types/
│           ├── produto.ts                 # Tipos de produto
│           ├── movimentacao.ts            # Tipos de movimentação
│           ├── saldo.ts                   # Tipos de saldo
│           ├── solicitacao.ts             # Tipos de solicitação
│           └── inventario.ts              # Tipos de inventário
└── prisma/
    └── migrations/
        └── [timestamp]_create_estoque_tables.sql
```

## 4. Hooks Customizados

### 4.1 useProdutos
```typescript
export function useProdutos() {
  const { data: produtos, isLoading, error, mutate } = useSWR(
    '/api/estoque/produtos',
    fetcher
  )

  const criarProduto = async (produto: CriarProdutoData) => {
    const response = await fetch('/api/estoque/produtos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produto)
    })
    
    if (!response.ok) throw new Error('Erro ao criar produto')
    
    mutate()
    return response.json()
  }

  const atualizarProduto = async (id: string, produto: AtualizarProdutoData) => {
    const response = await fetch(`/api/estoque/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(produto)
    })
    
    if (!response.ok) throw new Error('Erro ao atualizar produto')
    
    mutate()
    return response.json()
  }

  return {
    produtos,
    isLoading,
    error,
    criarProduto,
    atualizarProduto,
    recarregar: mutate
  }
}
```

### 4.2 useMovimentacoes
```typescript
export function useMovimentacoes(filtros?: FiltrosMovimentacao) {
  const queryString = filtros ? `?${new URLSearchParams(filtros).toString()}` : ''
  
  const { data: movimentacoes, isLoading, error, mutate } = useSWR(
    `/api/estoque/movimentacoes${queryString}`,
    fetcher
  )

  const criarMovimentacao = async (movimentacao: CriarMovimentacaoData) => {
    const response = await fetch('/api/estoque/movimentacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movimentacao)
    })
    
    if (!response.ok) throw new Error('Erro ao criar movimentação')
    
    mutate()
    return response.json()
  }

  const criarEntrada = async (entrada: CriarEntradaData) => {
    const response = await fetch('/api/estoque/movimentacoes/entrada', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entrada)
    })
    
    if (!response.ok) throw new Error('Erro ao criar entrada')
    
    mutate()
    return response.json()
  }

  const criarSaida = async (saida: CriarSaidaData) => {
    const response = await fetch('/api/estoque/movimentacoes/saida', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saida)
    })
    
    if (!response.ok) throw new Error('Erro ao criar saída')
    
    mutate()
    return response.json()
  }

  return {
    movimentacoes,
    isLoading,
    error,
    criarMovimentacao,
    criarEntrada,
    criarSaida,
    recarregar: mutate
  }
}
```

### 4.3 useSaldos
```typescript
export function useSaldos(filtros?: FiltrosSaldo) {
  const queryString = filtros ? `?${new URLSearchParams(filtros).toString()}` : ''
  
  const { data: saldos, isLoading, error, mutate } = useSWR(
    `/api/estoque/saldos${queryString}`,
    fetcher
  )

  const obterSaldoPorCentroCusto = async (centroCustoId: string) => {
    const response = await fetch(`/api/estoque/saldos/por-centro-custo?centroCustoId=${centroCustoId}`)
    
    if (!response.ok) throw new Error('Erro ao obter saldo por centro de custo')
    
    return response.json()
  }

  const verificarEstoqueMinimo = async () => {
    const response = await fetch('/api/estoque/saldos/estoque-minimo')
    
    if (!response.ok) throw new Error('Erro ao verificar estoque mínimo')
    
    return response.json()
  }

  return {
    saldos,
    isLoading,
    error,
    obterSaldoPorCentroCusto,
    verificarEstoqueMinimo,
    recarregar: mutate
  }
}
```

## 5. Serviços de Negócio

### 5.1 EstoqueService
```typescript
export class EstoqueService {
  static async calcularSaldo(produtoId: string, centroCustoId?: string): Promise<SaldoEstoque> {
    // Implementação do cálculo de saldo
  }

  static async verificarDisponibilidade(
    produtoId: string, 
    quantidade: number, 
    centroCustoId?: string
  ): Promise<boolean> {
    // Verificação de disponibilidade
  }

  static async processarMovimentacao(movimentacao: CriarMovimentacaoData): Promise<MovimentacaoEstoque> {
    // Processamento de movimentação com atualização de saldo
  }

  static async transferirEntreCentrosCusto(
    produtoId: string,
    quantidade: number,
    centroCustoOrigemId: string,
    centroCustoDestinoId: string,
    usuarioId: string
  ): Promise<MovimentacaoEstoque[]> {
    // Transferência entre centros de custo
  }

  static async alertarEstoqueMinimo(): Promise<AlertaEstoque[]> {
    // Verificação e alerta de estoque mínimo
  }
}
```

### 5.2 SolicitacaoService
```typescript
export class SolicitacaoService {
  static async criarSolicitacao(solicitacao: CriarSolicitacaoData): Promise<SolicitacaoEstoque> {
    // Criação de solicitação com validações
  }

  static async aprovarSolicitacao(
    solicitacaoId: string, 
    aprovadorId: string
  ): Promise<SolicitacaoEstoque> {
    // Aprovação de solicitação
  }

  static async atenderSolicitacao(
    solicitacaoId: string,
    itensAtendimento: ItemAtendimento[]
  ): Promise<SolicitacaoEstoque> {
    // Atendimento de solicitação com movimentação de estoque
  }

  static async rejeitarSolicitacao(
    solicitacaoId: string,
    aprovadorId: string,
    motivo: string
  ): Promise<SolicitacaoEstoque> {
    // Rejeição de solicitação
  }
}
```

## 6. Integrações

### 6.1 Integração com Compras
```typescript
// Webhook para recebimento de compras
export async function processarRecebimentoCompra(data: RecebimentoCompraData) {
  const { pedidoId, itens } = data
  
  for (const item of itens) {
    if (item.tipoDestino === 'ESTOQUE') {
      await EstoqueService.processarMovimentacao({
        tipo: 'ENTRADA_COMPRA',
        produtoId: item.produtoId,
        quantidade: item.quantidadeRecebida,
        valorUnitario: item.valorUnitario,
        centroCustoId: item.centroCustoId,
        pedidoCompraId: pedidoId,
        documentoReferencia: data.notaFiscal
      })
    }
  }
}
```

### 6.2 Integração com Tombamento
```typescript
// Transferência de item do estoque para tombamento
export async function transferirParaTombamento(data: TransferenciaData) {
  const { movimentacaoEstoqueId, centroCustoDestinoId, localizacaoId } = data
  
  // Criar saída no estoque
  await EstoqueService.processarMovimentacao({
    tipo: 'SAIDA_TOMBAMENTO',
    // ... outros dados
  })
  
  // Criar ativo no tombamento
  await TombamentoService.criarAtivo({
    // ... dados do ativo
  })
}
```

## 7. Relatórios e Dashboards

### 7.1 Dashboard Principal
- Resumo de saldos por categoria
- Alertas de estoque mínimo
- Movimentações recentes
- Gráficos de consumo por centro de custo
- Indicadores de performance

### 7.2 Relatórios Disponíveis
- Relatório de saldos por produto/categoria/centro de custo
- Relatório de movimentações por período
- Relatório de consumo por centro de custo
- Relatório de inventário físico
- Relatório de itens com estoque mínimo
- Relatório de valor do estoque

## 8. Permissões e Segurança

### 8.1 Perfis de Acesso
- **Administrador de Estoque**: Acesso total
- **Gestor de Estoque**: Gestão operacional
- **Operador de Estoque**: Movimentações básicas
- **Solicitante**: Apenas solicitações
- **Consulta**: Apenas visualização

### 8.2 Controle por Centro de Custo
- Usuários podem ter acesso limitado a centros de custo específicos
- Validação de permissão em todas as operações
- Auditoria de todas as ações

## 9. Considerações de Performance

### 9.1 Otimizações
- Índices adequados nas tabelas principais
- Cache de saldos calculados
- Processamento assíncrono para operações pesadas
- Paginação em listagens grandes

### 9.2 Monitoramento
- Logs de performance das operações
- Alertas de lentidão
- Métricas de uso do sistema

## 10. Testes

### 10.1 Testes Unitários
- Serviços de negócio
- Cálculos de saldo
- Validações de dados

### 10.2 Testes de Integração
- Fluxos completos de movimentação
- Integração com outros módulos
- APIs de relatórios

### 10.3 Testes de Performance
- Carga de movimentações
- Consultas de saldo
- Relatórios complexos
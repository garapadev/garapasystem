# Módulo de Estoque

## 1. Visão Geral

### 1.1 Descrição
O **Módulo de Estoque** é responsável pelo controle completo de inventário da empresa, incluindo gestão de produtos, movimentações, saldos, localizações e centro de custos. O módulo integra-se diretamente com os módulos de Compras e Tombamento para garantir um fluxo completo desde a aquisição até a destinação final dos itens.

### 1.2 Características Principais
- **Controle de Saldos:** Gestão em tempo real de quantidades disponíveis
- **Movimentações:** Registro completo de entradas, saídas e transferências
- **Centro de Custo:** Segregação de estoque por centro de custo
- **Localizações:** Controle físico de onde os itens estão armazenados
- **Inventário Físico:** Ferramentas para contagem e ajustes de estoque
- **Solicitações:** Sistema de requisições internas de materiais
- **Integração:** Conexão automática com Compras e Tombamento
- **Relatórios:** Analytics completos de movimentação e custos

### 1.3 Status de Implementação
- **Status:** 📋 Planejado
- **Prioridade:** Alta
- **Categoria:** Módulo de Negócio
- **Dependências:** Compras, Tombamento, Centro de Custo

---

## 2. Objetivos e Propósito

### 2.1 Objetivos Principais
- **Controle Preciso:** Manter controle exato de quantidades e valores em estoque
- **Rastreabilidade:** Garantir rastreabilidade completa de todos os itens
- **Otimização:** Otimizar níveis de estoque e reduzir custos
- **Integração:** Integrar fluxos de compra, estoque e tombamento
- **Transparência:** Fornecer visibilidade total sobre movimentações
- **Compliance:** Atender requisitos fiscais e de auditoria

### 2.2 Problemas Resolvidos
- Falta de controle sobre quantidades em estoque
- Dificuldade em localizar itens fisicamente
- Ausência de segregação por centro de custo
- Processos manuais de requisição de materiais
- Falta de integração entre compras e estoque
- Dificuldade em realizar inventários físicos
- Ausência de relatórios gerenciais de estoque

### 2.3 Benefícios Esperados
- Redução de perdas e desperdícios
- Melhoria na gestão de custos
- Agilidade em processos de requisição
- Maior controle e transparência
- Facilidade em auditorias
- Otimização de espaço físico
- Integração com outros módulos

---

## 3. Requisitos Funcionais e Não Funcionais

### 3.1 Requisitos Funcionais

#### 3.1.1 Gestão de Produtos
- **RF001:** Cadastro completo de produtos com categorias
- **RF002:** Controle de unidades de medida e conversões
- **RF003:** Gestão de códigos de barras e identificação
- **RF004:** Vinculação com fornecedores preferenciais
- **RF005:** Controle de validade e lotes

#### 3.1.2 Movimentações de Estoque
- **RF006:** Registro de entradas por compras
- **RF007:** Registro de saídas por solicitações
- **RF008:** Transferências entre localizações
- **RF009:** Ajustes de inventário
- **RF010:** Devoluções e cancelamentos

#### 3.1.3 Controle de Saldos
- **RF011:** Saldo em tempo real por produto
- **RF012:** Saldo por centro de custo
- **RF013:** Saldo por localização física
- **RF014:** Histórico de movimentações
- **RF015:** Reservas de produtos

#### 3.1.4 Solicitações de Material
- **RF016:** Criação de solicitações internas
- **RF017:** Workflow de aprovação
- **RF018:** Atendimento de solicitações
- **RF019:** Controle de pendências
- **RF020:** Histórico de solicitações

#### 3.1.5 Inventário Físico
- **RF021:** Criação de inventários por período
- **RF022:** Contagem por localização
- **RF023:** Comparação com saldo sistema
- **RF024:** Ajustes automáticos
- **RF025:** Relatórios de divergências

### 3.2 Requisitos Não Funcionais

#### 3.2.1 Performance
- **RNF001:** Consultas de saldo em <500ms
- **RNF002:** Suporte a 10.000+ produtos simultâneos
- **RNF003:** Processamento de 1.000+ movimentações/dia
- **RNF004:** Backup automático diário

#### 3.2.2 Segurança
- **RNF005:** Controle de acesso por perfil
- **RNF006:** Auditoria de todas as operações
- **RNF007:** Criptografia de dados sensíveis
- **RNF008:** Isolamento por empresa (multi-tenant)

#### 3.2.3 Usabilidade
- **RNF009:** Interface intuitiva e responsiva
- **RNF010:** Suporte a dispositivos móveis
- **RNF011:** Leitura de códigos de barras
- **RNF012:** Exportação de relatórios

#### 3.2.4 Integração
- **RNF013:** APIs REST para integração
- **RNF014:** Webhooks para eventos
- **RNF015:** Sincronização em tempo real
- **RNF016:** Compatibilidade com ERP externo

---

## 4. Funcionalidades Planejadas

### 4.1 Gestão de Produtos

#### 4.1.1 Cadastro de Produtos
- Informações básicas (nome, descrição, categoria)
- Códigos de identificação (SKU, código de barras)
- Unidades de medida e conversões
- Especificações técnicas
- Fornecedores preferenciais
- Parâmetros de estoque (mínimo, máximo, ponto de reposição)

#### 4.1.2 Categorização
- Hierarquia de categorias
- Classificação ABC
- Tipo de produto (consumo, permanente, revenda)
- Criticidade e importância
- Sazonalidade

### 4.2 Movimentações

#### 4.2.1 Tipos de Movimentação
- **Entrada:** Compras, devoluções, ajustes positivos
- **Saída:** Solicitações, transferências, ajustes negativos
- **Transferência:** Entre localizações ou centros de custo
- **Reserva:** Bloqueio temporário de quantidades

#### 4.2.2 Controles
- Validação de saldos disponíveis
- Rastreabilidade completa
- Documentação obrigatória
- Aprovações quando necessário
- Integração automática com outros módulos

### 4.3 Localizações

#### 4.3.1 Estrutura Física
- Almoxarifados
- Setores/Departamentos
- Prateleiras/Posições
- Endereçamento hierárquico
- Capacidade e limitações

#### 4.3.2 Controles de Localização
- Produtos por localização
- Movimentações entre locais
- Otimização de espaço
- Mapeamento visual
- Controle de acesso físico

### 4.4 Solicitações de Material

#### 4.4.1 Processo de Solicitação
- Criação por usuário solicitante
- Seleção de produtos do catálogo
- Justificativa e centro de custo
- Workflow de aprovação
- Atendimento pelo almoxarifado

#### 4.4.2 Controles
- Validação de saldo disponível
- Aprovação por hierarquia
- Priorização de solicitações
- Controle de prazos
- Histórico completo

### 4.5 Inventário Físico

#### 4.5.1 Planejamento
- Definição de períodos
- Seleção de produtos/localizações
- Equipes de contagem
- Cronograma de execução
- Bloqueio de movimentações

#### 4.5.2 Execução
- Contagem física
- Registro no sistema
- Comparação automática
- Identificação de divergências
- Ajustes necessários

### 4.6 Centro de Custo

#### 4.6.1 Segregação
- Estoque por centro de custo
- Movimentações específicas
- Relatórios segmentados
- Controle de orçamento
- Responsabilidades definidas

#### 4.6.2 Controles
- Transferências entre centros
- Aprovações específicas
- Rateio de custos
- Análise de consumo
- Otimização de recursos

---

## 5. Arquitetura Técnica Planejada

### 5.1 Estrutura de Arquivos
```
/app/src/modules/estoque/
├── components/
│   ├── produtos/
│   │   ├── ProdutoForm.tsx
│   │   ├── ProdutoList.tsx
│   │   ├── ProdutoCard.tsx
│   │   └── ProdutoSearch.tsx
│   ├── movimentacoes/
│   │   ├── MovimentacaoForm.tsx
│   │   ├── MovimentacaoList.tsx
│   │   ├── EntradaForm.tsx
│   │   └── SaidaForm.tsx
│   ├── saldos/
│   │   ├── SaldoCard.tsx
│   │   ├── SaldoList.tsx
│   │   └── SaldoChart.tsx
│   ├── solicitacoes/
│   │   ├── SolicitacaoForm.tsx
│   │   ├── SolicitacaoList.tsx
│   │   ├── SolicitacaoCard.tsx
│   │   └── AprovacaoForm.tsx
│   ├── inventario/
│   │   ├── InventarioForm.tsx
│   │   ├── InventarioList.tsx
│   │   ├── ContagemForm.tsx
│   │   └── DivergenciaList.tsx
│   └── localizacoes/
│       ├── LocalizacaoForm.tsx
│       ├── LocalizacaoTree.tsx
│       └── LocalizacaoMap.tsx
├── pages/
│   ├── produtos/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── novo.tsx
│   ├── movimentacoes/
│   │   ├── index.tsx
│   │   ├── entrada.tsx
│   │   └── saida.tsx
│   ├── saldos/
│   │   └── index.tsx
│   ├── solicitacoes/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── nova.tsx
│   ├── inventario/
│   │   ├── index.tsx
│   │   ├── [id].tsx
│   │   └── novo.tsx
│   └── relatorios/
│       └── index.tsx
├── api/
│   ├── produtos/
│   ├── movimentacoes/
│   ├── saldos/
│   ├── solicitacoes/
│   ├── inventario/
│   └── relatorios/
├── hooks/
│   ├── useProdutos.ts
│   ├── useMovimentacoes.ts
│   ├── useSaldos.ts
│   ├── useSolicitacoes.ts
│   └── useInventario.ts
├── services/
│   ├── EstoqueService.ts
│   ├── SolicitacaoService.ts
│   ├── InventarioService.ts
│   └── RelatorioService.ts
├── types/
│   ├── produto.ts
│   ├── movimentacao.ts
│   ├── solicitacao.ts
│   └── inventario.ts
└── utils/
    ├── calculations.ts
    ├── validations.ts
    └── formatters.ts
```

### 5.2 Modelos de Dados (Prisma)

#### 5.2.1 Produto
```prisma
model Produto {
  id              String    @id @default(cuid())
  
  // Informações Básicas
  nome            String
  descricao       String?
  sku             String    @unique
  codigoBarras    String?   @unique
  
  // Categoria
  categoriaId     String
  categoria       CategoriaProduto @relation(fields: [categoriaId], references: [id])
  
  // Unidades
  unidadeMedida   String    // UN, KG, L, M, etc.
  unidadeCompra   String?   // Unidade de compra se diferente
  fatorConversao  Decimal?  // Fator de conversão
  
  // Especificações
  marca           String?
  modelo          String?
  especificacoes  Json?     // Especificações técnicas
  
  // Controle de Estoque
  estoqueMinimo   Decimal?
  estoqueMaximo   Decimal?
  pontoReposicao  Decimal?
  
  // Classificação
  tipoItem        TipoItem  @default(CONSUMO)
  classificacaoABC ClassificacaoABC @default(C)
  criticidade     Criticidade @default(BAIXA)
  
  // Validade
  controleLote    Boolean   @default(false)
  controleValidade Boolean  @default(false)
  diasValidade    Int?
  
  // Status
  ativo           Boolean   @default(true)
  
  // Relacionamentos
  movimentacoes   MovimentacaoEstoque[]
  saldos          SaldoEstoque[]
  solicitacoes    ItemSolicitacao[]
  inventarios     ItemInventario[]
  fornecedores    ProdutoFornecedor[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("produtos")
}

model CategoriaProduto {
  id              String    @id @default(cuid())
  
  // Informações
  nome            String
  descricao       String?
  codigo          String?
  
  // Hierarquia
  parentId        String?
  parent          CategoriaProduto? @relation("CategoriaHierarquia", fields: [parentId], references: [id])
  subcategorias   CategoriaProduto[] @relation("CategoriaHierarquia")
  
  // Configurações
  controlaEstoque Boolean   @default(true)
  permiteNegativo Boolean   @default(false)
  
  // Status
  ativa           Boolean   @default(true)
  
  // Relacionamentos
  produtos        Produto[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([empresaId, codigo])
  @@map("categorias_produto")
}
```

#### 5.2.2 Movimentações
```prisma
model MovimentacaoEstoque {
  id              String    @id @default(cuid())
  
  // Produto
  produtoId       String
  produto         Produto   @relation(fields: [produtoId], references: [id])
  
  // Tipo de Movimentação
  tipo            TipoMovimentacao
  operacao        OperacaoEstoque
  
  // Quantidades
  quantidade      Decimal
  quantidadeAnterior Decimal
  quantidadePosterior Decimal
  
  // Valores
  valorUnitario   Decimal?
  valorTotal      Decimal?
  
  // Localização
  localizacaoId   String?
  localizacao     Localizacao? @relation(fields: [localizacaoId], references: [id])
  
  // Centro de Custo
  centroCustoId   String?
  centroCusto     CentroCusto? @relation(fields: [centroCustoId], references: [id])
  
  // Lote e Validade
  lote            String?
  dataValidade    DateTime?
  
  // Documentação
  numeroDocumento String?
  tipoDocumento   TipoDocumento?
  observacoes     String?
  
  // Origem da Movimentação
  pedidoCompraId  String?    // Se veio de compra
  solicitacaoId   String?    // Se foi solicitação
  inventarioId    String?    // Se foi ajuste de inventário
  
  // Responsável
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  
  @@map("movimentacoes_estoque")
}

model SaldoEstoque {
  id              String    @id @default(cuid())
  
  // Produto
  produtoId       String
  produto         Produto   @relation(fields: [produtoId], references: [id])
  
  // Localização
  localizacaoId   String?
  localizacao     Localizacao? @relation(fields: [localizacaoId], references: [id])
  
  // Centro de Custo
  centroCustoId   String?
  centroCusto     CentroCusto? @relation(fields: [centroCustoId], references: [id])
  
  // Lote
  lote            String?
  dataValidade    DateTime?
  
  // Quantidades
  quantidade      Decimal   @default(0)
  quantidadeReservada Decimal @default(0)
  quantidadeDisponivel Decimal @default(0)
  
  // Valores
  valorUnitario   Decimal?
  valorTotal      Decimal?
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  updatedAt       DateTime  @updatedAt
  
  @@unique([empresaId, produtoId, localizacaoId, centroCustoId, lote])
  @@map("saldos_estoque")
}
```

#### 5.2.3 Solicitações
```prisma
model SolicitacaoEstoque {
  id              String    @id @default(cuid())
  
  // Identificação
  numero          String    @unique
  
  // Solicitante
  solicitanteId   String
  solicitante     Usuario   @relation("SolicitacaoSolicitante", fields: [solicitanteId], references: [id])
  
  // Centro de Custo
  centroCustoId   String
  centroCusto     CentroCusto @relation(fields: [centroCustoId], references: [id])
  
  // Localização Destino
  localizacaoId   String?
  localizacao     Localizacao? @relation(fields: [localizacaoId], references: [id])
  
  // Informações
  descricao       String?
  justificativa   String
  prioridade      PrioridadeSolicitacao @default(NORMAL)
  
  // Datas
  dataLimite      DateTime?
  dataAtendimento DateTime?
  
  // Status
  status          StatusSolicitacao @default(PENDENTE)
  
  // Aprovação
  aprovadorId     String?
  aprovador       Usuario?  @relation("SolicitacaoAprovador", fields: [aprovadorId], references: [id])
  dataAprovacao   DateTime?
  comentariosAprovacao String?
  
  // Atendimento
  atendentId      String?
  atendente       Usuario?  @relation("SolicitacaoAtendente", fields: [atendentId], references: [id])
  
  // Itens
  itens           ItemSolicitacao[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("solicitacoes_estoque")
}

model ItemSolicitacao {
  id              String    @id @default(cuid())
  
  // Solicitação
  solicitacaoId   String
  solicitacao     SolicitacaoEstoque @relation(fields: [solicitacaoId], references: [id], onDelete: Cascade)
  
  // Produto
  produtoId       String
  produto         Produto   @relation(fields: [produtoId], references: [id])
  
  // Quantidades
  quantidadeSolicitada Decimal
  quantidadeAtendida   Decimal @default(0)
  quantidadePendente   Decimal
  
  // Lote específico
  loteEspecifico  String?
  
  // Observações
  observacoes     String?
  
  // Status
  status          StatusItemSolicitacao @default(PENDENTE)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("itens_solicitacao")
}
```

#### 5.2.4 Inventário
```prisma
model InventarioFisico {
  id              String    @id @default(cuid())
  
  // Identificação
  numero          String    @unique
  descricao       String
  
  // Período
  dataInicio      DateTime
  dataFim         DateTime?
  
  // Escopo
  localizacaoId   String?
  localizacao     Localizacao? @relation(fields: [localizacaoId], references: [id])
  categoriaId     String?
  categoria       CategoriaProduto? @relation(fields: [categoriaId], references: [id])
  
  // Responsável
  responsavelId   String
  responsavel     Usuario   @relation(fields: [responsavelId], references: [id])
  
  // Status
  status          StatusInventario @default(PLANEJADO)
  
  // Configurações
  bloquearMovimentacoes Boolean @default(true)
  ajustarAutomaticamente Boolean @default(false)
  
  // Resultados
  totalItens      Int       @default(0)
  totalDivergencias Int     @default(0)
  valorDivergencias Decimal @default(0)
  
  // Itens
  itens           ItemInventario[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("inventarios_fisicos")
}

model ItemInventario {
  id              String    @id @default(cuid())
  
  // Inventário
  inventarioId    String
  inventario      InventarioFisico @relation(fields: [inventarioId], references: [id], onDelete: Cascade)
  
  // Produto
  produtoId       String
  produto         Produto   @relation(fields: [produtoId], references: [id])
  
  // Localização
  localizacaoId   String?
  localizacao     Localizacao? @relation(fields: [localizacaoId], references: [id])
  
  // Lote
  lote            String?
  dataValidade    DateTime?
  
  // Quantidades
  quantidadeSistema   Decimal
  quantidadeContada   Decimal?
  quantidadeDivergencia Decimal @default(0)
  
  // Valores
  valorUnitario   Decimal?
  valorDivergencia Decimal @default(0)
  
  // Contagem
  contadorId      String?
  contador        Usuario?  @relation(fields: [contadorId], references: [id])
  dataContagem    DateTime?
  
  // Status
  status          StatusItemInventario @default(PENDENTE)
  observacoes     String?
  
  // Ajuste
  ajustado        Boolean   @default(false)
  movimentacaoId  String?   // ID da movimentação de ajuste
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("itens_inventario")
}
```

#### 5.2.5 Localização
```prisma
model Localizacao {
  id              String    @id @default(cuid())
  
  // Identificação
  codigo          String
  nome            String
  descricao       String?
  
  // Hierarquia
  parentId        String?
  parent          Localizacao? @relation("LocalizacaoHierarquia", fields: [parentId], references: [id])
  sublocalizacoes Localizacao[] @relation("LocalizacaoHierarquia")
  
  // Tipo
  tipo            TipoLocalizacao
  
  // Capacidade
  capacidadeMaxima Decimal?
  unidadeCapacidade String?
  
  // Endereço Físico
  endereco        String?
  andar           String?
  sala            String?
  prateleira      String?
  posicao         String?
  
  // Configurações
  controlaCapacidade Boolean @default(false)
  permiteNegativo Boolean    @default(false)
  ativa           Boolean    @default(true)
  
  // Responsável
  responsavelId   String?
  responsavel     Usuario?  @relation(fields: [responsavelId], references: [id])
  
  // Relacionamentos
  saldos          SaldoEstoque[]
  movimentacoes   MovimentacaoEstoque[]
  solicitacoes    SolicitacaoEstoque[]
  inventarios     InventarioFisico[]
  itensInventario ItemInventario[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([empresaId, codigo])
  @@map("localizacoes")
}
```

#### 5.2.6 Produto-Fornecedor
```prisma
model ProdutoFornecedor {
  id              String    @id @default(cuid())
  
  // Produto
  produtoId       String
  produto         Produto   @relation(fields: [produtoId], references: [id], onDelete: Cascade)
  
  // Fornecedor (referência ao módulo de Compras)
  fornecedorId    String
  
  // Informações do Fornecedor
  codigoFornecedor String?  // Código do produto no fornecedor
  descricaoFornecedor String?
  
  // Preços
  precoUnitario   Decimal?
  moeda           String    @default("BRL")
  dataUltimaCompra DateTime?
  
  // Prazos
  prazoEntrega    Int?      // Em dias
  quantidadeMinima Decimal?
  
  // Preferência
  preferencial    Boolean   @default(false)
  ativo           Boolean   @default(true)
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([produtoId, fornecedorId])
  @@map("produtos_fornecedores")
}
```

### 5.3 Enums
```prisma
enum TipoItem {
  CONSUMO      // Material de consumo
  PERMANENTE   // Bem permanente (vai para tombamento)
  REVENDA      // Para revenda
  MATERIA_PRIMA // Matéria-prima
  EMBALAGEM    // Material de embalagem
}

enum ClassificacaoABC {
  A  // Alto valor/importância
  B  // Médio valor/importância
  C  // Baixo valor/importância
}

enum Criticidade {
  BAIXA
  MEDIA
  ALTA
  CRITICA
}

enum TipoMovimentacao {
  ENTRADA
  SAIDA
  TRANSFERENCIA
  AJUSTE
  RESERVA
  LIBERACAO_RESERVA
}

enum OperacaoEstoque {
  COMPRA
  DEVOLUCAO_COMPRA
  SOLICITACAO
  DEVOLUCAO_SOLICITACAO
  TRANSFERENCIA_ENTRADA
  TRANSFERENCIA_SAIDA
  AJUSTE_POSITIVO
  AJUSTE_NEGATIVO
  INVENTARIO
  RESERVA
  LIBERACAO_RESERVA
  PERDA
  QUEBRA
}

enum TipoDocumento {
  NOTA_FISCAL
  REQUISICAO
  TRANSFERENCIA
  AJUSTE
  INVENTARIO
  OUTROS
}

enum StatusSolicitacao {
  PENDENTE
  APROVADA
  REJEITADA
  ATENDIDA_PARCIAL
  ATENDIDA_TOTAL
  CANCELADA
}

enum StatusItemSolicitacao {
  PENDENTE
  ATENDIDO_PARCIAL
  ATENDIDO_TOTAL
  CANCELADO
}

enum PrioridadeSolicitacao {
  BAIXA
  NORMAL
  ALTA
  URGENTE
}

enum StatusInventario {
  PLANEJADO
  EM_ANDAMENTO
  FINALIZADO
  CANCELADO
}

enum StatusItemInventario {
  PENDENTE
  CONTADO
  DIVERGENTE
  AJUSTADO
}

enum TipoLocalizacao {
  ALMOXARIFADO
  DEPOSITO
  SETOR
  PRATELEIRA
  POSICAO
}
```

### 5.4 Hooks Customizados Planejados

#### 5.4.1 useProdutos
```typescript
export const useProdutos = () => {
  // Listagem e busca de produtos
  // CRUD completo
  // Filtros e ordenação
  // Validações
}
```

#### 5.4.2 useMovimentacoes
```typescript
export const useMovimentacoes = () => {
  // Registro de movimentações
  // Histórico de movimentações
  // Validações de saldo
  // Integração com outros módulos
}
```

#### 5.4.3 useSaldos
```typescript
export const useSaldos = () => {
  // Consulta de saldos em tempo real
  // Saldos por localização/centro de custo
  // Reservas e disponibilidade
  // Alertas de estoque mínimo
}
```

#### 5.4.4 useSolicitacoes
```typescript
export const useSolicitacoes = () => {
  // Criação e gestão de solicitações
  // Workflow de aprovação
  // Atendimento de solicitações
  // Controle de pendências
}
```

#### 5.4.5 useInventario
```typescript
export const useInventario = () => {
  // Criação de inventários
  // Processo de contagem
  // Análise de divergências
  // Ajustes automáticos
}
```

### 5.5 Serviços de Negócio

#### 5.5.1 EstoqueService
```typescript
class EstoqueService {
  // Gestão de saldos
  // Validações de movimentação
  // Cálculos de disponibilidade
  // Integração com outros módulos
}
```

#### 5.5.2 SolicitacaoService
```typescript
class SolicitacaoService {
  // Workflow de solicitações
  // Validações de aprovação
  // Atendimento automático
  // Notificações
}
```

#### 5.5.3 InventarioService
```typescript
class InventarioService {
  // Planejamento de inventários
  // Processo de contagem
  // Análise de divergências
  // Ajustes automáticos
}
```

---

## 6. APIs e Endpoints Planejados

### 6.1 Endpoints Principais

#### 6.1.1 Produtos
```typescript
// Produtos
GET    /api/estoque/produtos              # Listar produtos
POST   /api/estoque/produtos              # Criar produto
GET    /api/estoque/produtos/[id]         # Buscar produto
PUT    /api/estoque/produtos/[id]         # Atualizar produto
DELETE /api/estoque/produtos/[id]         # Deletar produto
GET    /api/estoque/produtos/search       # Buscar produtos
GET    /api/estoque/produtos/[id]/saldo   # Saldo do produto
GET    /api/estoque/produtos/[id]/historico # Histórico de movimentações

// Categorias
GET    /api/estoque/categorias            # Listar categorias
POST   /api/estoque/categorias            # Criar categoria
GET    /api/estoque/categorias/[id]       # Buscar categoria
PUT    /api/estoque/categorias/[id]       # Atualizar categoria
DELETE /api/estoque/categorias/[id]       # Deletar categoria
```

#### 6.1.2 Movimentações
```typescript
// Movimentações
GET    /api/estoque/movimentacoes         # Listar movimentações
POST   /api/estoque/movimentacoes         # Criar movimentação
GET    /api/estoque/movimentacoes/[id]    # Buscar movimentação
PUT    /api/estoque/movimentacoes/[id]    # Atualizar movimentação
DELETE /api/estoque/movimentacoes/[id]    # Deletar movimentação

// Entradas
POST   /api/estoque/entradas              # Registrar entrada
POST   /api/estoque/entradas/compra       # Entrada por compra
POST   /api/estoque/entradas/ajuste       # Ajuste positivo

// Saídas
POST   /api/estoque/saidas                # Registrar saída
POST   /api/estoque/saidas/solicitacao    # Saída por solicitação
POST   /api/estoque/saidas/ajuste         # Ajuste negativo

// Transferências
POST   /api/estoque/transferencias        # Transferir entre localizações
```

#### 6.1.3 Saldos
```typescript
// Saldos
GET    /api/estoque/saldos                # Listar saldos
GET    /api/estoque/saldos/produto/[id]   # Saldo por produto
GET    /api/estoque/saldos/localizacao/[id] # Saldo por localização
GET    /api/estoque/saldos/centro-custo/[id] # Saldo por centro de custo
GET    /api/estoque/saldos/resumo         # Resumo de saldos
GET    /api/estoque/saldos/alertas        # Alertas de estoque mínimo

// Reservas
POST   /api/estoque/reservas              # Criar reserva
DELETE /api/estoque/reservas/[id]         # Liberar reserva
GET    /api/estoque/reservas              # Listar reservas
```

#### 6.1.4 Solicitações
```typescript
// Solicitações
GET    /api/estoque/solicitacoes          # Listar solicitações
POST   /api/estoque/solicitacoes          # Criar solicitação
GET    /api/estoque/solicitacoes/[id]     # Buscar solicitação
PUT    /api/estoque/solicitacoes/[id]     # Atualizar solicitação
DELETE /api/estoque/solicitacoes/[id]     # Deletar solicitação

// Aprovações
POST   /api/estoque/solicitacoes/[id]/aprovar # Aprovar solicitação
POST   /api/estoque/solicitacoes/[id]/rejeitar # Rejeitar solicitação
GET    /api/estoque/solicitacoes/pendentes # Solicitações pendentes

// Atendimento
POST   /api/estoque/solicitacoes/[id]/atender # Atender solicitação
POST   /api/estoque/solicitacoes/[id]/atender-item # Atender item específico
```

#### 6.1.5 Inventário
```typescript
// Inventários
GET    /api/estoque/inventarios           # Listar inventários
POST   /api/estoque/inventarios           # Criar inventário
GET    /api/estoque/inventarios/[id]      # Buscar inventário
PUT    /api/estoque/inventarios/[id]      # Atualizar inventário
DELETE /api/estoque/inventarios/[id]      # Deletar inventário

// Contagem
POST   /api/estoque/inventarios/[id]/iniciar # Iniciar contagem
POST   /api/estoque/inventarios/[id]/contar  # Registrar contagem
POST   /api/estoque/inventarios/[id]/finalizar # Finalizar inventário
GET    /api/estoque/inventarios/[id]/divergencias # Listar divergências
POST   /api/estoque/inventarios/[id]/ajustar # Ajustar divergências
```

#### 6.1.6 Localizações
```typescript
// Localizações
GET    /api/estoque/localizacoes          # Listar localizações
POST   /api/estoque/localizacoes          # Criar localização
GET    /api/estoque/localizacoes/[id]     # Buscar localização
PUT    /api/estoque/localizacoes/[id]     # Atualizar localização
DELETE /api/estoque/localizacoes/[id]     # Deletar localização
GET    /api/estoque/localizacoes/tree     # Árvore de localizações
GET    /api/estoque/localizacoes/[id]/saldos # Saldos por localização
```

#### 6.1.7 Relatórios
```typescript
// Relatórios
GET    /api/estoque/relatorios/posicao    # Posição de estoque
GET    /api/estoque/relatorios/movimentacao # Relatório de movimentação
GET    /api/estoque/relatorios/abc        # Análise ABC
GET    /api/estoque/relatorios/giro       # Giro de estoque
GET    /api/estoque/relatorios/validade   # Produtos próximos ao vencimento
GET    /api/estoque/relatorios/minimo     # Produtos abaixo do mínimo
```

### 6.2 Webhooks de Integração
```typescript
// Webhooks para outros módulos
POST   /api/estoque/webhook/entrada-compra    # Entrada por compra
POST   /api/estoque/webhook/saida-tombamento  # Saída para tombamento
POST   /api/estoque/webhook/ajuste-inventario # Ajuste de inventário
```

---

## 7. Componentes de Interface Planejados

### 7.1 Componentes de Produtos
- **ProdutoForm:** Formulário de cadastro/edição
- **ProdutoList:** Lista de produtos com filtros
- **ProdutoCard:** Card com informações resumidas
- **ProdutoSearch:** Busca avançada de produtos
- **ProdutoSaldo:** Visualização de saldo atual

### 7.2 Componentes de Movimentações
- **MovimentacaoForm:** Formulário de movimentação
- **MovimentacaoList:** Histórico de movimentações
- **EntradaForm:** Formulário específico para entradas
- **SaidaForm:** Formulário específico para saídas
- **TransferenciaForm:** Formulário de transferência

### 7.3 Componentes de Solicitações
- **SolicitacaoForm:** Formulário de nova solicitação
- **SolicitacaoList:** Lista de solicitações
- **SolicitacaoCard:** Card com status da solicitação
- **AprovacaoForm:** Formulário de aprovação
- **AtendimentoForm:** Formulário de atendimento

### 7.4 Componentes de Inventário
- **InventarioForm:** Formulário de novo inventário
- **InventarioList:** Lista de inventários
- **ContagemForm:** Formulário de contagem
- **DivergenciaList:** Lista de divergências
- **AjusteForm:** Formulário de ajustes

### 7.5 Componentes de Relatórios
- **RelatorioSaldos:** Relatório de posição de estoque
- **RelatorioMovimentacao:** Relatório de movimentações
- **RelatorioABC:** Análise ABC de produtos
- **RelatorioGiro:** Relatório de giro de estoque
- **DashboardEstoque:** Dashboard principal

---

## 8. Permissões e Segurança

### 8.1 Perfis de Acesso

#### 8.1.1 Almoxarife
- **Produtos:** Visualizar, criar, editar
- **Movimentações:** Todas as operações
- **Saldos:** Visualizar todos
- **Solicitações:** Atender e gerenciar
- **Inventário:** Executar contagens
- **Localizações:** Visualizar e editar

#### 8.1.2 Solicitante
- **Produtos:** Visualizar catálogo
- **Saldos:** Visualizar disponibilidade
- **Solicitações:** Criar e acompanhar próprias
- **Relatórios:** Básicos do seu centro de custo

#### 8.1.3 Aprovador
- **Solicitações:** Aprovar/rejeitar
- **Relatórios:** Do seu centro de custo
- **Saldos:** Visualizar do seu centro

#### 8.1.4 Gestor de Estoque
- **Produtos:** Gestão completa
- **Categorias:** Gestão completa
- **Movimentações:** Todas as operações
- **Inventário:** Planejar e executar
- **Relatórios:** Todos os relatórios
- **Configurações:** Parâmetros do módulo

#### 8.1.5 Administrador
- **Acesso total:** Todas as funcionalidades
- **Configurações:** Sistema completo
- **Usuários:** Gestão de permissões
- **Auditoria:** Logs e trilhas

### 8.2 Controles de Segurança

#### 8.2.1 Controle de Acesso
- Autenticação obrigatória
- Autorização baseada em perfis
- Isolamento por empresa (multi-tenant)
- Controle por centro de custo
- Sessões com timeout

#### 8.2.2 Auditoria
- Log de todas as movimentações
- Trilha de aprovações
- Histórico de alterações
- Identificação do usuário responsável
- Timestamp de todas as operações

#### 8.2.3 Validações
- Validação de saldos disponíveis
- Controle de permissões por operação
- Validação de dados obrigatórios
- Verificação de integridade
- Prevenção de operações inválidas

#### 8.2.4 Backup e Recuperação
- Backup automático diário
- Retenção de dados por 7 anos
- Recuperação point-in-time
- Redundância de dados críticos
- Plano de continuidade

---

## 9. Integrações Planejadas

### 9.1 Módulos Internos

#### 9.1.1 Integração com Compras
- **Entrada Automática:** Recebimento de mercadorias gera entrada no estoque
- **Classificação:** Produtos são classificados automaticamente (estoque vs ativo)
- **Centro de Custo:** Vinculação automática ao centro de custo da compra
- **Fornecedores:** Sincronização de dados de fornecedores
- **Preços:** Atualização automática de preços de compra

**Fluxo de Integração:**
1. Pedido de compra aprovado → Reserva no estoque (se produto existente)
2. Recebimento de mercadoria → Entrada automática no estoque
3. Nota fiscal → Atualização de valores e dados fiscais
4. Classificação automática → Estoque ou Tombamento

#### 9.1.2 Integração com Tombamento
- **Transferência Automática:** Produtos com valor > R$ 1.000 vão para tombamento
- **Dados Compartilhados:** Informações básicas do produto
- **Localização:** Transferência de localização física
- **Responsabilidade:** Definição de responsável pelo ativo
- **Garantia:** Transferência de informações de garantia

**Fluxo de Integração:**
1. Entrada no estoque → Análise de valor
2. Valor > limite → Criação automática de ativo
3. Transferência de dados → Módulo de tombamento
4. Baixa no estoque → Entrada no tombamento

#### 9.1.3 Integração com Centro de Custo
- **Segregação:** Estoque separado por centro de custo
- **Orçamento:** Controle de orçamento por centro
- **Aprovações:** Workflow baseado na hierarquia do centro
- **Relatórios:** Relatórios específicos por centro
- **Transferências:** Movimentação entre centros

#### 9.1.4 Outras Integrações Internas
- **Financeiro:** Valorização de estoque e custos
- **Contabilidade:** Lançamentos contábeis automáticos
- **Relatórios:** Dados para dashboards e analytics
- **Notificações:** Alertas de estoque mínimo e solicitações
- **Usuários:** Controle de acesso e responsabilidades

### 9.2 Sistemas Externos

#### 9.2.1 ERP Externo
- **Sincronização:** Produtos e movimentações
- **Importação:** Dados de produtos existentes
- **Exportação:** Movimentações para contabilização
- **Reconciliação:** Validação de saldos

#### 9.2.2 Código de Barras
- **Leitura:** Identificação rápida de produtos
- **Etiquetas:** Geração de etiquetas com código
- **Inventário:** Contagem com leitores
- **Movimentação:** Registro rápido com código

#### 9.2.3 Dispositivos Móveis
- **App Mobile:** Aplicativo para almoxarifado
- **Inventário:** Contagem com dispositivos móveis
- **Solicitações:** Criação via mobile
- **Consultas:** Saldos e localizações

### 9.3 APIs de Terceiros
- **Correios:** Rastreamento de entregas
- **Transportadoras:** Status de entregas
- **Fornecedores:** Catálogos e preços
- **NFe:** Recepção de notas fiscais
- **Bancos:** Conciliação de pagamentos

---

## 10. Cronograma de Implementação

### 10.1 Fase 1 - Fundação (6 semanas)

#### Semana 1-2: Estrutura Base
- ✅ **Modelos de dados:** Criação dos modelos Prisma
- ✅ **Migrations:** Estrutura do banco de dados
- ✅ **APIs básicas:** Endpoints CRUD principais
- ✅ **Autenticação:** Integração com sistema de usuários

#### Semana 3-4: Produtos e Categorias
- 📋 **Cadastro de produtos:** Formulários e validações
- 📋 **Gestão de categorias:** Hierarquia e organização
- 📋 **Busca e filtros:** Sistema de busca avançada
- 📋 **Validações:** Regras de negócio básicas

#### Semana 5-6: Localizações e Estrutura
- 📋 **Gestão de localizações:** Hierarquia física
- 📋 **Endereçamento:** Sistema de endereços
- 📋 **Capacidades:** Controle de capacidade
- 📋 **Interface:** Componentes de localização

### 10.2 Fase 2 - Movimentações (4 semanas)

#### Semana 7-8: Sistema de Movimentações
- 📋 **Entradas:** Registro de entradas manuais
- 📋 **Saídas:** Registro de saídas manuais
- 📋 **Transferências:** Movimentação entre locais
- 📋 **Validações:** Controle de saldos

#### Semana 9-10: Saldos e Controles
- 📋 **Cálculo de saldos:** Sistema em tempo real
- 📋 **Reservas:** Sistema de reservas
- 📋 **Alertas:** Estoque mínimo e máximo
- 📋 **Relatórios básicos:** Posição de estoque

### 10.3 Fase 3 - Solicitações (4 semanas)

#### Semana 11-12: Sistema de Solicitações
- 📋 **Criação:** Formulários de solicitação
- 📋 **Workflow:** Sistema de aprovações
- 📋 **Atendimento:** Interface para almoxarifado
- 📋 **Notificações:** Alertas automáticos

#### Semana 13-14: Controles Avançados
- 📋 **Priorização:** Sistema de prioridades
- 📋 **Prazos:** Controle de prazos
- 📋 **Histórico:** Rastreamento completo
- 📋 **Relatórios:** Análise de solicitações

### 10.4 Fase 4 - Inventário (4 semanas)

#### Semana 15-16: Sistema de Inventário
- 📋 **Planejamento:** Criação de inventários
- 📋 **Contagem:** Interface de contagem
- 📋 **Divergências:** Análise de diferenças
- 📋 **Ajustes:** Sistema de ajustes

#### Semana 17-18: Controles e Relatórios
- 📋 **Bloqueios:** Controle de movimentações
- 📋 **Relatórios:** Análise de inventários
- 📋 **Auditoria:** Trilha de ajustes
- 📋 **Mobile:** Interface móvel para contagem

### 10.5 Fase 5 - Integrações (4 semanas)

#### Semana 19-20: Integração com Compras
- 📋 **Webhooks:** Recebimento de compras
- 📋 **Classificação:** Estoque vs Tombamento
- 📋 **Sincronização:** Dados de produtos
- 📋 **Testes:** Validação de integração

#### Semana 21-22: Integração com Tombamento
- 📋 **Transferência:** Produtos para ativos
- 📋 **Dados:** Sincronização de informações
- 📋 **Workflow:** Processo automatizado
- 📋 **Validações:** Regras de transferência

### 10.6 Fase 6 - Finalização (2 semanas)

#### Semana 23-24: Testes e Ajustes
- 📋 **Testes integrados:** Cenários completos
- 📋 **Performance:** Otimizações
- 📋 **Documentação:** Manual do usuário
- 📋 **Treinamento:** Capacitação da equipe

### 10.7 Melhorias Futuras
- 📋 **Q2 2025:** App mobile completo
- 📋 **Q3 2025:** IA para previsão de demanda
- 📋 **Q4 2025:** Integração com IoT
- 📋 **2026:** Automação avançada

---

## 11. Testes e Validação

### 11.1 Estratégia de Testes

#### 11.1.1 Testes Unitários
- **Componentes:** Todos os componentes React
- **Hooks:** Hooks customizados
- **Serviços:** Lógica de negócio
- **Utilitários:** Funções auxiliares
- **Cobertura:** Mínimo 90%

#### 11.1.2 Testes de Integração
- **APIs:** Endpoints e validações
- **Banco de dados:** Operações CRUD
- **Integrações:** Módulos externos
- **Workflows:** Fluxos completos

#### 11.1.3 Testes E2E
- **Cenários completos:** Fluxos de usuário
- **Integrações:** Entre módulos
- **Performance:** Carga e stress
- **Compatibilidade:** Browsers e dispositivos

### 11.2 Cenários de Teste

#### 11.2.1 Gestão de Produtos
- ✅ Cadastro de produto completo
- ✅ Edição de informações
- ✅ Busca e filtros
- ✅ Categorização
- ✅ Validações de dados

#### 11.2.2 Movimentações
- ✅ Entrada de produtos
- ✅ Saída de produtos
- ✅ Transferências
- ✅ Validação de saldos
- ✅ Controle de lotes

#### 11.2.3 Solicitações
- ✅ Criação de solicitação
- ✅ Workflow de aprovação
- ✅ Atendimento
- ✅ Controle de prazos
- ✅ Notificações

#### 11.2.4 Inventário
- ✅ Criação de inventário
- ✅ Processo de contagem
- ✅ Análise de divergências
- ✅ Ajustes automáticos
- ✅ Relatórios

#### 11.2.5 Integrações
- ✅ Integração com Compras
- ✅ Integração com Tombamento
- ✅ Centro de Custo
- ✅ Webhooks
- ✅ Sincronização

### 11.3 Critérios de Aceitação

#### 11.3.1 Funcionalidades Básicas
- ✅ Cadastro de produtos funcionando
- ✅ Movimentações registradas corretamente
- ✅ Saldos calculados em tempo real
- ✅ Solicitações com workflow completo
- ✅ Inventário físico executável

#### 11.3.2 Integrações
- ✅ Entrada automática por compras
- ✅ Transferência para tombamento
- ✅ Segregação por centro de custo
- ✅ Webhooks funcionando
- ✅ Sincronização de dados

#### 11.3.3 Performance
- ✅ Consultas de saldo < 500ms
- ✅ Listagens < 1s
- ✅ Relatórios < 5s
- ✅ Suporte a 10.000+ produtos
- ✅ Backup automático funcionando

#### 11.3.4 Segurança
- ✅ Controle de acesso por perfil
- ✅ Auditoria completa
- ✅ Isolamento por empresa
- ✅ Validações de segurança
- ✅ Criptografia de dados

### 11.4 Métricas de Qualidade
- **Cobertura de testes:** >90%
- **Performance:** <2s resposta média
- **Disponibilidade:** 99.9%
- **Precisão de saldos:** 99.9%
- **Satisfação do usuário:** >4.5/5

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe de Desenvolvimento
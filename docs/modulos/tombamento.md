# Módulo: Tombamento

**Status:** 📋 Planejado  
**Categoria:** Asset Management  
**Versão:** 1.0 (Planejada)  
**Responsável:** Equipe Asset Management  

---

## 1. Visão Geral

O módulo Tombamento será responsável pela gestão completa do patrimônio da empresa, incluindo controle de ativos fixos, inventário, depreciação, manutenção e movimentação de bens. Oferecerá rastreabilidade total dos ativos desde a aquisição até o descarte, garantindo conformidade contábil e fiscal.

### Propósito
- Controlar patrimônio da empresa
- Rastrear ativos e localização
- Calcular depreciação automática
- Gerenciar manutenções
- Garantir compliance fiscal

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Controle:** Gestão completa de ativos
- **Rastreabilidade:** Localização e histórico
- **Compliance:** Conformidade fiscal/contábil
- **Otimização:** Uso eficiente de recursos
- **Segurança:** Proteção do patrimônio

### Requisitos Funcionais
- Cadastro de ativos
- Etiquetas e códigos de barras
- Controle de localização
- Cálculo de depreciação
- Gestão de manutenções
- Movimentação de ativos
- Inventário físico
- Relatórios fiscais
- Integração contábil
- Alertas e notificações

### Requisitos Não-Funcionais
- Performance: Resposta < 2s
- Escalabilidade: 100.000+ ativos
- Disponibilidade: 99.9% uptime
- Precisão: 99.9% dos cálculos
- Usabilidade: Interface intuitiva

---

## 3. Funcionalidades Planejadas

### 3.1 Gestão de Ativos
- **Cadastro:** Dados completos do ativo
- **Categorização:** Por tipo e classe
- **Documentação:** Notas fiscais e garantias
- **Fotos:** Registro visual
- **Especificações:** Detalhes técnicos

### 3.2 Controle de Localização
- **Localização Atual:** Onde está o ativo
- **Histórico:** Movimentações anteriores
- **Responsável:** Quem está usando
- **Setor:** Departamento atual
- **Endereço:** Localização física detalhada

### 3.3 Depreciação
- **Métodos:** Linear, acelerada, unidades
- **Cálculo Automático:** Mensal/anual
- **Vida Útil:** Configurável por categoria
- **Valor Residual:** Valor final estimado
- **Relatórios:** Demonstrativos contábeis

### 3.4 Manutenção
- **Preventiva:** Agendamentos automáticos
- **Corretiva:** Registro de problemas
- **Histórico:** Todas as manutenções
- **Custos:** Controle de gastos
- **Fornecedores:** Prestadores de serviço

### 3.5 Inventário
- **Físico:** Contagem periódica
- **Conciliação:** Físico vs. sistema
- **Divergências:** Gestão de diferenças
- **Relatórios:** Resultados do inventário
- **Ajustes:** Correções necessárias

---

## 4. Arquitetura Técnica Planejada

### 4.1 Estrutura de Arquivos
```
src/app/assets/
├── page.tsx                     # Dashboard de ativos
├── register/
│   ├── page.tsx                # Lista de ativos
│   ├── new/page.tsx            # Novo ativo
│   ├── [id]/page.tsx           # Detalhes do ativo
│   ├── [id]/edit/page.tsx      # Editar ativo
│   ├── [id]/history/page.tsx   # Histórico do ativo
│   ├── [id]/maintenance/page.tsx # Manutenções
│   ├── [id]/depreciation/page.tsx # Depreciação
│   ├── categories/page.tsx     # Categorias
│   └── bulk-import/page.tsx    # Importação em lote
├── location/
│   ├── page.tsx                # Controle de localização
│   ├── map/page.tsx            # Mapa de ativos
│   ├── movements/page.tsx      # Movimentações
│   ├── transfer/page.tsx       # Transferir ativo
│   ├── sectors/page.tsx        # Setores/departamentos
│   └── responsible/page.tsx    # Responsáveis
├── depreciation/
│   ├── page.tsx                # Dashboard de depreciação
│   ├── calculation/page.tsx    # Cálculos
│   ├── methods/page.tsx        # Métodos de depreciação
│   ├── reports/page.tsx        # Relatórios contábeis
│   ├── adjustments/page.tsx    # Ajustes
│   └── simulation/page.tsx     # Simulações
├── maintenance/
│   ├── page.tsx                # Dashboard de manutenção
│   ├── schedule/page.tsx       # Agendamentos
│   ├── preventive/page.tsx     # Manutenção preventiva
│   ├── corrective/page.tsx     # Manutenção corretiva
│   ├── orders/page.tsx         # Ordens de serviço
│   ├── suppliers/page.tsx      # Fornecedores
│   └── costs/page.tsx          # Custos de manutenção
├── inventory/
│   ├── page.tsx                # Dashboard de inventário
│   ├── physical/page.tsx       # Inventário físico
│   ├── counting/page.tsx       # Contagem
│   ├── reconciliation/page.tsx # Conciliação
│   ├── discrepancies/page.tsx  # Divergências
│   ├── adjustments/page.tsx    # Ajustes
│   └── reports/page.tsx        # Relatórios
├── labels/
│   ├── page.tsx                # Gestão de etiquetas
│   ├── generate/page.tsx       # Gerar etiquetas
│   ├── print/page.tsx          # Imprimir etiquetas
│   ├── barcode/page.tsx        # Códigos de barras
│   └── qrcode/page.tsx         # QR Codes
├── reports/
│   ├── page.tsx                # Dashboard de relatórios
│   ├── assets/page.tsx         # Relatório de ativos
│   ├── depreciation/page.tsx   # Relatório de depreciação
│   ├── maintenance/page.tsx    # Relatório de manutenção
│   ├── movements/page.tsx      # Relatório de movimentações
│   ├── inventory/page.tsx      # Relatório de inventário
│   ├── fiscal/page.tsx         # Relatórios fiscais
│   └── analytics/page.tsx      # Analytics avançado
├── mobile/
│   ├── page.tsx                # App mobile
│   ├── scanner/page.tsx        # Scanner de códigos
│   ├── inventory/page.tsx      # Inventário mobile
│   ├── movements/page.tsx      # Movimentações mobile
│   └── maintenance/page.tsx    # Manutenção mobile
├── components/
│   ├── AssetCard.tsx           # Card de ativo
│   ├── AssetForm.tsx           # Formulário de ativo
│   ├── LocationMap.tsx         # Mapa de localização
│   ├── DepreciationChart.tsx   # Gráfico de depreciação
│   ├── MaintenanceSchedule.tsx # Agenda de manutenção
│   ├── InventoryCounter.tsx    # Contador de inventário
│   ├── BarcodeScanner.tsx      # Scanner de código
│   ├── LabelGenerator.tsx      # Gerador de etiquetas
│   ├── AssetHistory.tsx        # Histórico do ativo
│   └── ComplianceIndicator.tsx # Indicador de compliance
├── hooks/
│   ├── useAssets.tsx           # Hook principal
│   ├── useLocation.tsx         # Hook de localização
│   ├── useDepreciation.tsx     # Hook de depreciação
│   ├── useMaintenance.tsx      # Hook de manutenção
│   ├── useInventory.tsx        # Hook de inventário
│   └── useLabels.tsx           # Hook de etiquetas
├── lib/
│   ├── asset-manager.ts        # Gerenciador de ativos
│   ├── depreciation-engine.ts  # Engine de depreciação
│   ├── location-tracker.ts     # Rastreador de localização
│   ├── maintenance-scheduler.ts # Agendador de manutenção
│   ├── inventory-manager.ts    # Gerenciador de inventário
│   ├── label-generator.ts      # Gerador de etiquetas
│   └── compliance-checker.ts   # Verificador de compliance
└── types/
    └── assets.ts               # Tipos TypeScript
```

### 4.2 Modelos de Dados Planejados (Prisma)
```typescript
model Ativo {
  id              String    @id @default(cuid())
  
  // Identificação
  codigo          String    @unique
  numeroTombamento String   @unique
  codigoBarras    String?   @unique
  qrCode          String?   @unique
  
  // Dados Básicos
  nome            String
  descricao       String?
  marca           String?
  modelo          String?
  numeroSerie     String?
  
  // Categoria
  categoriaId     String
  categoria       CategoriaAtivo @relation(fields: [categoriaId], references: [id])
  subcategoria    String?
  
  // Aquisição
  dataAquisicao   DateTime
  valorAquisicao  Decimal
  fornecedorId    String?
  fornecedor      Fornecedor? @relation(fields: [fornecedorId], references: [id])
  numeroNF        String?
  dataNotaFiscal  DateTime?
  
  // Localização
  localizacaoAtual String?
  setorId         String?
  setor           Setor?    @relation(fields: [setorId], references: [id])
  responsavelId   String?
  responsavel     Usuario?  @relation(fields: [responsavelId], references: [id])
  
  // Depreciação
  metodoDepreciacao MetodoDepreciacao @default(LINEAR)
  vidaUtilAnos    Int
  valorResidual   Decimal   @default(0)
  taxaDepreciacao Decimal?
  valorDepreciado Decimal   @default(0)
  valorLiquido    Decimal
  
  // Status
  status          StatusAtivo @default(ATIVO)
  condicao        CondicaoAtivo @default(BOM)
  
  // Garantia
  dataInicioGarantia DateTime?
  dataFimGarantia    DateTime?
  fornecedorGarantia String?
  
  // Documentos
  anexos          Json?     // URLs dos documentos
  observacoes     String?
  
  // Relacionamentos
  movimentacoes   MovimentacaoAtivo[]
  manutencoes     ManutencaoAtivo[]
  depreciacoes    DepreciacaoAtivo[]
  inventarios     InventarioItem[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("ativos")
}

model CategoriaAtivo {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  codigo          String    @unique
  nome            String
  descricao       String?
  
  // Hierarquia
  categoriaPaiId  String?
  categoriaPai    CategoriaAtivo? @relation("CategoriaHierarquia", fields: [categoriaPaiId], references: [id])
  subcategorias   CategoriaAtivo[] @relation("CategoriaHierarquia")
  
  // Configurações de Depreciação
  vidaUtilPadrao  Int?      // Anos
  metodoDepreciacaoPadrao MetodoDepreciacao @default(LINEAR)
  taxaDepreciacaoPadrao   Decimal?
  
  // Configurações de Manutenção
  intervaloPreventivoMeses Int? // Meses
  isManutencaoObrigatoria Boolean @default(false)
  
  // Status
  isAtiva         Boolean   @default(true)
  
  // Relacionamentos
  ativos          Ativo[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("categorias_ativo")
}

model Setor {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  codigo          String    @unique
  nome            String
  descricao       String?
  
  // Localização
  endereco        String?
  andar           String?
  sala            String?
  
  // Hierarquia
  setorPaiId      String?
  setorPai        Setor?    @relation("SetorHierarquia", fields: [setorPaiId], references: [id])
  subsetores      Setor[]   @relation("SetorHierarquia")
  
  // Responsável
  responsavelId   String?
  responsavel     Usuario?  @relation(fields: [responsavelId], references: [id])
  
  // Centro de Custo
  centroCusto     String?
  
  // Status
  isAtivo         Boolean   @default(true)
  
  // Relacionamentos
  ativos          Ativo[]
  movimentacoes   MovimentacaoAtivo[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("setores")
}

model MovimentacaoAtivo {
  id              String    @id @default(cuid())
  
  // Ativo
  ativoId         String
  ativo           Ativo     @relation(fields: [ativoId], references: [id], onDelete: Cascade)
  
  // Tipo de Movimentação
  tipo            TipoMovimentacao
  motivo          String?
  
  // Origem
  setorOrigemId   String?
  setorOrigem     Setor?    @relation(fields: [setorOrigemId], references: [id])
  responsavelOrigemId String?
  responsavelOrigem   Usuario? @relation("MovimentacaoOrigem", fields: [responsavelOrigemId], references: [id])
  localizacaoOrigem   String?
  
  // Destino
  setorDestinoId  String?
  setorDestino    Setor?    @relation(fields: [setorDestinoId], references: [id])
  responsavelDestinoId String?
  responsavelDestino   Usuario? @relation("MovimentacaoDestino", fields: [responsavelDestinoId], references: [id])
  localizacaoDestino   String?
  
  // Data e Responsável
  dataMovimentacao DateTime @default(now())
  executadoPorId  String
  executadoPor    Usuario   @relation("MovimentacaoExecutor", fields: [executadoPorId], references: [id])
  
  // Observações
  observacoes     String?
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  
  @@map("movimentacoes_ativo")
}

model ManutencaoAtivo {
  id              String    @id @default(cuid())
  
  // Ativo
  ativoId         String
  ativo           Ativo     @relation(fields: [ativoId], references: [id], onDelete: Cascade)
  
  // Tipo
  tipo            TipoManutencao
  prioridade      PrioridadeManutencao @default(NORMAL)
  
  // Agendamento
  dataAgendada    DateTime
  dataInicio      DateTime?
  dataFim         DateTime?
  duracaoHoras    Decimal?
  
  // Descrição
  titulo          String
  descricao       String?
  problema        String?
  solucao         String?
  
  // Responsáveis
  responsavelId   String?
  responsavel     Usuario?  @relation(fields: [responsavelId], references: [id])
  fornecedorId    String?
  fornecedor      Fornecedor? @relation(fields: [fornecedorId], references: [id])
  
  // Custos
  custoMaoObra    Decimal   @default(0)
  custoPecas      Decimal   @default(0)
  custoTotal      Decimal   @default(0)
  
  // Status
  status          StatusManutencao @default(AGENDADA)
  
  // Próxima Manutenção
  proximaManutencao DateTime?
  
  // Relacionamentos
  pecas           PecaManutencao[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("manutencoes_ativo")
}

model PecaManutencao {
  id              String    @id @default(cuid())
  
  // Manutenção
  manutencaoId    String
  manutencao      ManutencaoAtivo @relation(fields: [manutencaoId], references: [id], onDelete: Cascade)
  
  // Peça
  codigo          String?
  nome            String
  descricao       String?
  
  // Quantidade
  quantidade      Decimal
  unidade         String
  
  // Valores
  valorUnitario   Decimal
  valorTotal      Decimal
  
  // Fornecedor
  fornecedorId    String?
  fornecedor      Fornecedor? @relation(fields: [fornecedorId], references: [id])
  
  createdAt       DateTime  @default(now())
  
  @@map("pecas_manutencao")
}

model DepreciacaoAtivo {
  id              String    @id @default(cuid())
  
  // Ativo
  ativoId         String
  ativo           Ativo     @relation(fields: [ativoId], references: [id], onDelete: Cascade)
  
  // Período
  ano             Int
  mes             Int
  
  // Valores
  valorInicial    Decimal   // Valor no início do período
  valorDepreciacao Decimal  // Depreciação do período
  valorAcumulado  Decimal   // Depreciação acumulada
  valorLiquido    Decimal   // Valor líquido final
  
  // Método
  metodo          MetodoDepreciacao
  taxaUtilizada   Decimal
  
  // Status
  isCalculado     Boolean   @default(false)
  dataCalculo     DateTime?
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  
  @@unique([ativoId, ano, mes])
  @@map("depreciacoes_ativo")
}

model InventarioFisico {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  numero          String    @unique
  titulo          String
  descricao       String?
  
  // Período
  dataInicio      DateTime
  dataFim         DateTime?
  
  // Escopo
  setores         String[]  // IDs dos setores
  categorias      String[]  // IDs das categorias
  
  // Status
  status          StatusInventario @default(PLANEJADO)
  
  // Responsáveis
  coordenadorId   String
  coordenador     Usuario   @relation(fields: [coordenadorId], references: [id])
  contadores      String[]  // IDs dos contadores
  
  // Resultados
  totalAtivos     Int       @default(0)
  ativosContados  Int       @default(0)
  ativosEncontrados Int     @default(0)
  ativosNaoEncontrados Int  @default(0)
  ativosNovos     Int       @default(0)
  
  // Relacionamentos
  itens           InventarioItem[]
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("inventarios_fisicos")
}

model InventarioItem {
  id              String    @id @default(cuid())
  
  // Inventário
  inventarioId    String
  inventario      InventarioFisico @relation(fields: [inventarioId], references: [id], onDelete: Cascade)
  
  // Ativo
  ativoId         String?
  ativo           Ativo?    @relation(fields: [ativoId], references: [id])
  
  // Dados da Contagem
  codigoEncontrado String?  // Código lido/digitado
  localizacaoEncontrada String?
  condicaoEncontrada CondicaoAtivo?
  
  // Status
  status          StatusItemInventario
  observacoes     String?
  
  // Responsável pela Contagem
  contadorId      String?
  contador        Usuario?  @relation(fields: [contadorId], references: [id])
  dataContagem    DateTime?
  
  // Divergências
  isDivergencia   Boolean   @default(false)
  tipoDivergencia TipoDivergencia?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("inventarios_itens")
}

model EtiquetaAtivo {
  id              String    @id @default(cuid())
  
  // Ativo
  ativoId         String
  ativo           Ativo     @relation(fields: [ativoId], references: [id], onDelete: Cascade)
  
  // Tipo de Etiqueta
  tipo            TipoEtiqueta
  formato         FormatoEtiqueta
  
  // Dados da Etiqueta
  codigo          String
  qrCode          String?
  codigoBarras    String?
  
  // Layout
  template        String?   // Template usado
  tamanho         String?   // Tamanho da etiqueta
  
  // Status
  status          StatusEtiqueta @default(GERADA)
  dataGeracao     DateTime  @default(now())
  dataImpressao   DateTime?
  dataAplicacao   DateTime?
  
  // Responsável
  geradoPorId     String
  geradoPor       Usuario   @relation(fields: [geradoPorId], references: [id])
  
  // Metadados
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  
  @@map("etiquetas_ativo")
}

model ConfiguracaoTombamento {
  id              String    @id @default(cuid())
  
  // Numeração
  formatoTombamento String  @default("TB{YYYY}{MM}{####}")
  proximoNumero   Int       @default(1)
  
  // Depreciação
  calculoAutomatico Boolean @default(true)
  diaCalculoMensal Int      @default(1)
  
  // Inventário
  frequenciaInventarioMeses Int @default(12)
  toleranciaInventario      Decimal @default(0.01) // 1%
  
  // Manutenção
  alertaManutencaoDias      Int @default(30)
  alertaGarantiaDias        Int @default(60)
  
  // Etiquetas
  templateEtiquetaPadrao    String?
  impressoraEtiquetas       String?
  
  // Relacionamentos
  empresaId       String    @unique
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("configuracoes_tombamento")
}

enum StatusAtivo {
  ATIVO
  INATIVO
  MANUTENCAO
  BAIXADO
  VENDIDO
  PERDIDO
  ROUBADO
  SUCATEADO
}

enum CondicaoAtivo {
  NOVO
  BOM
  REGULAR
  RUIM
  PESSIMO
  DANIFICADO
}

enum MetodoDepreciacao {
  LINEAR
  ACELERADA
  UNIDADES_PRODUCAO
  SOMA_DIGITOS
}

enum TipoMovimentacao {
  TRANSFERENCIA
  EMPRESTIMO
  DEVOLUCAO
  MANUTENCAO
  BAIXA
  LOCALIZACAO
}

enum TipoManutencao {
  PREVENTIVA
  CORRETIVA
  PREDITIVA
  EMERGENCIAL
}

enum PrioridadeManutencao {
  BAIXA
  NORMAL
  ALTA
  URGENTE
  CRITICA
}

enum StatusManutencao {
  AGENDADA
  EM_ANDAMENTO
  CONCLUIDA
  CANCELADA
  ADIADA
}

enum StatusInventario {
  PLANEJADO
  EM_ANDAMENTO
  CONCLUIDO
  CANCELADO
}

enum StatusItemInventario {
  PENDENTE
  ENCONTRADO
  NAO_ENCONTRADO
  DIVERGENCIA
  NOVO_ATIVO
}

enum TipoDivergencia {
  LOCALIZACAO
  CONDICAO
  RESPONSAVEL
  DADOS_CADASTRAIS
  NAO_ENCONTRADO
  ATIVO_NOVO
}

enum TipoEtiqueta {
  TOMBAMENTO
  CODIGO_BARRAS
  QR_CODE
  RFID
}

enum FormatoEtiqueta {
  PEQUENA
  MEDIA
  GRANDE
  PERSONALIZADA
}

enum StatusEtiqueta {
  GERADA
  IMPRESSA
  APLICADA
  DANIFICADA
  SUBSTITUIDA
}
```

### 4.3 Hooks Customizados Planejados
- **useAssets:** Hook principal de ativos
- **useLocation:** Controle de localização
- **useDepreciation:** Cálculos de depreciação
- **useMaintenance:** Gestão de manutenções
- **useInventory:** Inventário físico

---

## 5. APIs e Endpoints Planejados

### 5.1 Endpoints Principais
```typescript
// Ativos
GET    /api/assets                       # Listar ativos
POST   /api/assets                       # Criar ativo
GET    /api/assets/[id]                  # Buscar ativo
PUT    /api/assets/[id]                  # Atualizar ativo
DELETE /api/assets/[id]                  # Deletar ativo
POST   /api/assets/[id]/transfer         # Transferir ativo
GET    /api/assets/[id]/history          # Histórico do ativo
POST   /api/assets/[id]/maintenance      # Agendar manutenção

// Categorias
GET    /api/assets/categories            # Listar categorias
POST   /api/assets/categories            # Criar categoria
GET    /api/assets/categories/[id]       # Buscar categoria
PUT    /api/assets/categories/[id]       # Atualizar categoria
DELETE /api/assets/categories/[id]       # Deletar categoria

// Localização
GET    /api/assets/locations             # Listar localizações
POST   /api/assets/locations/transfer    # Transferir ativo
GET    /api/assets/locations/map         # Mapa de ativos
GET    /api/assets/sectors               # Listar setores
POST   /api/assets/sectors               # Criar setor

// Depreciação
GET    /api/assets/depreciation          # Listar depreciações
POST   /api/assets/depreciation/calculate # Calcular depreciação
GET    /api/assets/depreciation/[id]     # Buscar depreciação
GET    /api/assets/depreciation/reports  # Relatórios contábeis

// Manutenção
GET    /api/assets/maintenance           # Listar manutenções
POST   /api/assets/maintenance           # Criar manutenção
GET    /api/assets/maintenance/[id]      # Buscar manutenção
PUT    /api/assets/maintenance/[id]      # Atualizar manutenção
POST   /api/assets/maintenance/[id]/complete # Concluir manutenção
GET    /api/assets/maintenance/schedule  # Agenda de manutenções

// Inventário
GET    /api/assets/inventory             # Listar inventários
POST   /api/assets/inventory             # Criar inventário
GET    /api/assets/inventory/[id]        # Buscar inventário
PUT    /api/assets/inventory/[id]        # Atualizar inventário
POST   /api/assets/inventory/[id]/count  # Contar item
GET    /api/assets/inventory/[id]/discrepancies # Divergências

// Etiquetas
GET    /api/assets/labels                # Listar etiquetas
POST   /api/assets/labels/generate       # Gerar etiquetas
POST   /api/assets/labels/print          # Imprimir etiquetas
GET    /api/assets/labels/barcode/[code] # Buscar por código

// Relatórios
GET    /api/assets/reports/assets        # Relatório de ativos
GET    /api/assets/reports/depreciation  # Relatório de depreciação
GET    /api/assets/reports/maintenance   # Relatório de manutenção
GET    /api/assets/reports/movements     # Relatório de movimentações
GET    /api/assets/reports/inventory     # Relatório de inventário
GET    /api/assets/reports/fiscal        # Relatórios fiscais
```

---

## 6. Componentes de Interface Planejados

### 6.1 Páginas Principais
- **Dashboard:** Visão geral dos ativos
- **Registro:** Gestão de ativos
- **Localização:** Controle de localização
- **Manutenção:** Gestão de manutenções
- **Inventário:** Inventário físico

### 6.2 Componentes Reutilizáveis
- **AssetCard:** Card de ativo
- **LocationMap:** Mapa de localização
- **DepreciationChart:** Gráfico de depreciação
- **MaintenanceSchedule:** Agenda de manutenção
- **BarcodeScanner:** Scanner de código

### 6.3 Estados de Interface
- Active: Ativo em uso
- Maintenance: Em manutenção
- Inactive: Inativo
- Disposed: Baixado
- Lost: Perdido/roubado

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const ASSETS_PERMISSIONS = [
  'assets.read',                # Ver ativos
  'assets.write',               # Criar/editar ativos
  'assets.delete',              # Deletar ativos
  'assets.transfer',            # Transferir ativos
  'assets.maintenance',         # Agendar manutenções
  'depreciation.read',          # Ver depreciações
  'depreciation.calculate',     # Calcular depreciações
  'inventory.read',             # Ver inventários
  'inventory.write',            # Criar/editar inventários
  'inventory.count',            # Contar itens
  'labels.generate',            # Gerar etiquetas
  'labels.print',               # Imprimir etiquetas
  'assets.admin'                # Administração completa
];
```

### 7.2 Níveis de Acesso
- **Usuário:** Ver ativos básicos
- **Operador:** Movimentar ativos
- **Contador:** Realizar inventários
- **Gestor:** Gestão completa
- **Admin:** Administração total

### 7.3 Segurança Implementada
- Auditoria completa
- Controle de movimentações
- Validação de transferências
- Backup de dados
- Isolamento por empresa

---

## 8. Integrações Planejadas

### 8.1 Módulos Internos
- **Compras:** Novos ativos
- **Financeiro:** Depreciação contábil
- **Manutenção:** Ordens de serviço
- **Relatórios:** Analytics e dashboards
- **Usuários:** Responsáveis por ativos

### 8.2 Sistemas Externos
- **ERP:** Integração contábil
- **Contabilidade:** Lançamentos automáticos
- **Fornecedores:** Dados de garantia
- **Seguradoras:** Cobertura de ativos
- **Auditoria:** Relatórios fiscais

### 8.3 Tecnologias
- **RFID:** Rastreamento automático
- **IoT:** Sensores de monitoramento
- **GPS:** Localização de ativos móveis
- **Blockchain:** Histórico imutável
- **IA:** Previsão de manutenções

---

## 9. Cronograma de Implementação

### 9.1 Fase 1 - Fundação (4 semanas)
- 📋 **Semana 1:** Arquitetura e modelos de dados
- 📋 **Semana 2:** Cadastro de ativos e categorias
- 📋 **Semana 3:** Sistema de localização
- 📋 **Semana 4:** Controle de movimentações

### 9.2 Fase 2 - Depreciação (3 semanas)
- 📋 **Semana 5:** Engine de depreciação
- 📋 **Semana 6:** Métodos de cálculo
- 📋 **Semana 7:** Relatórios contábeis

### 9.3 Fase 3 - Manutenção (4 semanas)
- 📋 **Semana 8:** Sistema de manutenções
- 📋 **Semana 9:** Agendamentos automáticos
- 📋 **Semana 10:** Controle de custos
- 📋 **Semana 11:** Integração com fornecedores

### 9.4 Fase 4 - Inventário (3 semanas)
- 📋 **Semana 12:** Inventário físico
- 📋 **Semana 13:** Conciliação automática
- 📋 **Semana 14:** Gestão de divergências

### 9.5 Fase 5 - Etiquetas e Mobile (3 semanas)
- 📋 **Semana 15:** Sistema de etiquetas
- 📋 **Semana 16:** App mobile
- 📋 **Semana 17:** Scanner de códigos

### 9.6 Fase 6 - Relatórios e Integrações (2 semanas)
- 📋 **Semana 18:** Relatórios fiscais
- 📋 **Semana 19:** Integrações e testes

### 9.7 Melhorias Futuras
- 📋 **Q3 2025:** RFID e IoT
- 📋 **Q4 2025:** IA para manutenção preditiva
- 📋 **Q1 2026:** Blockchain para auditoria

---

## 10. Testes e Validação

### 10.1 Estratégia de Testes
- **Unitários:** Componentes e hooks
- **Integração:** Fluxos de tombamento
- **E2E:** Cenários completos
- **Mobile:** Testes em dispositivos

### 10.2 Critérios de Aceitação
- ✅ Cadastro de ativos funcionando
- ✅ Depreciação automática
- ✅ Controle de localização
- ✅ Manutenções agendadas
- ✅ Inventário físico
- ✅ Etiquetas geradas
- ✅ App mobile operacional
- ✅ Relatórios precisos

### 10.3 Métricas de Qualidade
- Cobertura de testes: >90%
- Precisão de cálculos: 99.9%
- Performance: <2s resposta
- Disponibilidade: 99.9%

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Asset Management
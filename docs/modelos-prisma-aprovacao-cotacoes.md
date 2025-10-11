# Modelos Prisma Atualizados - Sistema de Aprovação de Cotações

## 1. Novos Modelos

### 1.1 AprovacaoCotacao

```prisma
model AprovacaoCotacao {
  id              String    @id @default(cuid())
  
  // Cotação
  cotacaoId       String
  cotacao         Cotacao   @relation(fields: [cotacaoId], references: [id], onDelete: Cascade)
  
  // Proposta Específica (opcional - para aprovação de proposta específica)
  propostaId      String?
  proposta        PropostaFornecedor? @relation(fields: [propostaId], references: [id])
  
  // Aprovador
  aprovadorId     String
  aprovador       Usuario   @relation(fields: [aprovadorId], references: [id])
  
  // Nível de Aprovação
  nivel           Int       // Ordem de aprovação (1, 2, 3...)
  isObrigatorio   Boolean   @default(true)
  
  // Status
  status          StatusAprovacaoCotacao @default(PENDENTE)
  dataAprovacao   DateTime?
  dataRejeicao    DateTime?
  dataDelegacao   DateTime?
  
  // Delegação
  delegadoPara    String?   // ID do usuário para quem foi delegado
  delegadoUsuario Usuario?  @relation("DelegacaoAprovacao", fields: [delegadoPara], references: [id])
  motivoDelegacao String?
  
  // Justificativas
  comentarios     String?
  motivoAprovacao String?   // Por que esta cotação foi escolhida
  motivoRejeicao  String?
  
  // Critérios de Avaliação
  criteriosAvaliacao Json?   // Pontuação por critério
  pontuacaoTotal  Decimal?
  
  // Análises Detalhadas
  analiseCusto    String?   // Análise de custo-benefício
  analiseQualidade String?  // Análise de qualidade
  analisePrazo    String?   // Análise de prazo
  analiseRisco    String?   // Análise de riscos
  
  // Comparativo com outras propostas
  comparativoPrecos Json?   // Comparação de preços
  vantagens       String?   // Vantagens da proposta escolhida
  desvantagens    String?   // Desvantagens identificadas
  
  // Metadados de Auditoria
  ip              String?
  userAgent       String?
  localizacao     String?
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  // Histórico
  historicoAlteracoes Json? // Log de alterações
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("aprovacoes_cotacao")
  @@index([cotacaoId, status])
  @@index([aprovadorId, status])
  @@index([empresaId, createdAt])
}
```

### 1.2 LogAprovacao

```prisma
model LogAprovacao {
  id              String    @id @default(cuid())
  
  // Referências
  solicitacaoId   String?
  solicitacao     SolicitacaoCompra? @relation(fields: [solicitacaoId], references: [id])
  
  cotacaoId       String?
  cotacao         Cotacao?  @relation(fields: [cotacaoId], references: [id])
  
  aprovacaoId     String?   // ID da aprovação (cotação ou solicitação)
  
  // Tipo de Aprovação
  tipoAprovacao   TipoAprovacao // COTACAO ou SOLICITACAO
  etapa           EtapaAprovacao // PRIMEIRA ou SEGUNDA
  
  // Ação
  acao            AcaoAprovacao // APROVADO, REJEITADO, DELEGADO, etc.
  
  // Usuário
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  
  // Dados da Ação
  justificativa   String?
  comentarios     String?
  
  // Estado Anterior e Posterior
  estadoAnterior  Json?
  estadoPosterior Json?
  
  // Metadados
  timestamp       DateTime  @default(now())
  ip              String?
  userAgent       String?
  sessaoId        String?
  
  // Empresa
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  @@map("logs_aprovacao")
  @@index([solicitacaoId, timestamp])
  @@index([cotacaoId, timestamp])
  @@index([usuarioId, timestamp])
  @@index([empresaId, timestamp])
}
```

### 1.3 ConfiguracaoAprovacao

```prisma
model ConfiguracaoAprovacao {
  id              String    @id @default(cuid())
  
  // Tipo de Configuração
  tipo            TipoConfiguracaoAprovacao // COTACAO ou SOLICITACAO
  
  // Critérios de Valor
  valorMinimo     Decimal   @default(0)
  valorMaximo     Decimal?
  
  // Níveis Requeridos
  niveisRequeridos Int      @default(1)
  
  // Aprovadores por Nível
  nivel1AprovadorRole String? // Role necessária para nível 1
  nivel2AprovadorRole String? // Role necessária para nível 2
  nivel3AprovadorRole String? // Role necessária para nível 3
  nivel4AprovadorRole String? // Role necessária para nível 4
  
  // Configurações de Tempo
  tempoLimiteHoras Int?     // Tempo limite para aprovação
  lembreteHoras   Int?      // Quando enviar lembrete
  
  // Aprovação Automática
  aprovacaoAutomatica Boolean @default(false)
  criteriosAutomaticos Json? // Critérios para aprovação automática
  
  // Configurações de Delegação
  permiteDelegacao Boolean  @default(true)
  delegacaoAutomatica Boolean @default(false) // Delegar automaticamente se não responder
  
  // Configurações de Notificação
  notificarEmail  Boolean   @default(true)
  notificarSistema Boolean  @default(true)
  notificarWhatsApp Boolean @default(false)
  
  // Empresa
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  // Status
  ativo           Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("configuracoes_aprovacao")
  @@unique([empresaId, tipo, valorMinimo, valorMaximo])
}
```

## 2. Modelos Atualizados

### 2.1 Cotacao (Atualizado)

```prisma
model Cotacao {
  id              String    @id @default(cuid())
  
  // ... campos existentes ...
  numero          String    @unique
  titulo          String
  descricao       String?
  
  // Solicitação
  solicitacaoId   String
  solicitacao     SolicitacaoCompra @relation(fields: [solicitacaoId], references: [id])
  
  // Dados da Cotação
  dataAbertura    DateTime  @default(now())
  dataFechamento  DateTime?
  prazoResposta   DateTime
  
  // Status Original
  status          StatusCotacao @default(RASCUNHO)
  
  // NOVOS CAMPOS PARA APROVAÇÃO
  statusAprovacao StatusAprovacaoCotacao @default(PENDENTE)
  dataAprovacao   DateTime?
  dataRejeicao    DateTime?
  
  // Aprovador Responsável
  aprovadorId     String?
  aprovador       Usuario?  @relation("AprovadorCotacao", fields: [aprovadorId], references: [id])
  
  // Proposta Vencedora
  propostaVencedoraId String?
  propostaVencedora PropostaFornecedor? @relation("PropostaVencedora", fields: [propostaVencedoraId], references: [id])
  
  // Justificativas
  justificativaAprovacao String?
  justificativaRejeicao String?
  
  // Critérios de Avaliação Utilizados
  criteriosUtilizados Json?
  
  // Análise Comparativa
  analiseComparativa String?
  economiaGerada     Decimal? // Economia em relação à proposta mais cara
  
  // Configurações
  exigeAprovacao  Boolean   @default(true)
  aprovacaoAutomatica Boolean @default(false)
  
  // Relacionamentos Novos
  aprovacoes      AprovacaoCotacao[]
  logs            LogAprovacao[]
  
  // ... campos existentes ...
  itens           CotacaoItem[]
  propostas       PropostaFornecedor[]
  
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("cotacoes")
  @@index([statusAprovacao, empresaId])
  @@index([aprovadorId, statusAprovacao])
}
```

### 2.2 SolicitacaoCompra (Atualizado)

```prisma
model SolicitacaoCompra {
  id              String    @id @default(cuid())
  
  // ... campos existentes ...
  numero          String    @unique
  titulo          String
  descricao       String?
  
  // Status Original
  status          StatusSolicitacao @default(RASCUNHO)
  
  // NOVOS CAMPOS PARA CONTROLE DE FLUXO
  temCotacaoAprovada Boolean @default(false)
  cotacaoAprovadaId  String?
  cotacaoAprovada    Cotacao? @relation("CotacaoAprovada", fields: [cotacaoAprovadaId], references: [id])
  
  // Controle de Etapas
  etapaAtual      EtapaAprovacao @default(PRIMEIRA)
  proximaEtapa    EtapaAprovacao?
  
  // Aprovação Final
  statusAprovacaoFinal StatusAprovacao @default(PENDENTE)
  dataAprovacaoFinal   DateTime?
  aprovadorFinalId     String?
  aprovadorFinal       Usuario? @relation("AprovadorFinal", fields: [aprovadorFinalId], references: [id])
  
  // Justificativas Finais
  justificativaAprovacaoFinal String?
  justificativaRejeicaoFinal  String?
  
  // Histórico de Mudanças de Status
  historicoStatus Json?
  
  // Configurações de Aprovação
  exigeAprovacaoFinal Boolean @default(true)
  valorLimiteAprovacao Decimal?
  
  // Relacionamentos Novos
  logs            LogAprovacao[]
  
  // ... campos existentes ...
  itens           ItemSolicitacao[]
  cotacoes        Cotacao[]
  aprovacoes      AprovacaoCompra[]
  pedidos         PedidoCompra[]
  
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("solicitacoes_compra")
  @@index([temCotacaoAprovada, statusAprovacaoFinal])
  @@index([etapaAtual, empresaId])
  @@index([aprovadorFinalId, statusAprovacaoFinal])
}
```

### 2.3 PropostaFornecedor (Atualizado)

```prisma
model PropostaFornecedor {
  id              String    @id @default(cuid())
  
  // ... campos existentes ...
  cotacaoId       String
  cotacao         Cotacao   @relation(fields: [cotacaoId], references: [id], onDelete: Cascade)
  
  fornecedorId    String
  fornecedor      Fornecedor @relation(fields: [fornecedorId], references: [id])
  
  // Status Original
  status          StatusProposta @default(ENVIADA)
  
  // NOVOS CAMPOS PARA APROVAÇÃO
  isVencedora     Boolean   @default(false)
  motivoEscolha   String?
  motivoRejeicao  String?
  
  // Avaliação Detalhada
  pontuacao       Decimal?  // Pontuação calculada
  pontuacaoPreco  Decimal?  // Pontuação específica de preço
  pontuacaoPrazo  Decimal?  // Pontuação específica de prazo
  pontuacaoQualidade Decimal? // Pontuação específica de qualidade
  pontuacaoPagamento Decimal? // Pontuação específica de pagamento
  
  // Análise Comparativa
  posicaoRanking  Int?      // Posição no ranking (1º, 2º, 3º...)
  diferencaPreco  Decimal?  // Diferença percentual para o menor preço
  vantagens       String?   // Vantagens desta proposta
  desvantagens    String?   // Desvantagens desta proposta
  
  // Relacionamentos Novos
  aprovacoesCotacao AprovacaoCotacao[]
  cotacaoVencedora  Cotacao[] @relation("PropostaVencedora")
  
  // ... campos existentes ...
  itens           PropostaItem[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("propostas_fornecedor")
  @@index([isVencedora, cotacaoId])
  @@index([pontuacao])
}
```

### 2.4 Usuario (Atualizado)

```prisma
model Usuario {
  id              String    @id @default(cuid())
  
  // ... campos existentes ...
  nome            String
  email           String    @unique
  
  // NOVOS CAMPOS PARA APROVAÇÃO
  nivelAprovacao  Int?      // Nível máximo que pode aprovar
  valorLimiteAprovacao Decimal? // Valor máximo que pode aprovar
  
  // Configurações de Aprovação
  receberNotificacoesCotacao Boolean @default(true)
  receberNotificacoesSolicitacao Boolean @default(true)
  aprovacaoAutomaticaAte Decimal? // Valor até o qual aprova automaticamente
  
  // Delegação
  delegadoParaId  String?   // Para quem delega quando ausente
  delegadoPara    Usuario?  @relation("DelegacaoUsuario", fields: [delegadoParaId], references: [id])
  delegacoes      Usuario[] @relation("DelegacaoUsuario")
  
  // Ausências
  ausenciaInicio  DateTime?
  ausenciaFim     DateTime?
  motivoAusencia  String?
  
  // Relacionamentos Novos
  aprovacoesCotacao AprovacaoCotacao[]
  delegacoesRecebidas AprovacaoCotacao[] @relation("DelegacaoAprovacao")
  cotacoesAprovadas Cotacao[] @relation("AprovadorCotacao")
  solicitacoesAprovadas SolicitacaoCompra[] @relation("AprovadorFinal")
  logs            LogAprovacao[]
  
  // ... campos existentes ...
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("usuarios")
  @@index([nivelAprovacao, empresaId])
  @@index([valorLimiteAprovacao])
}
```

## 3. Novos Enums

### 3.1 StatusAprovacaoCotacao

```prisma
enum StatusAprovacaoCotacao {
  PENDENTE          // Aguardando aprovação
  EM_ANALISE        // Em análise pelo aprovador
  APROVADA          // Cotação aprovada
  REJEITADA         // Cotação rejeitada
  DELEGADA          // Aprovação delegada para outro usuário
  CANCELADA         // Processo cancelado
  EXPIRADA          // Prazo de aprovação expirado
}
```

### 3.2 TipoAprovacao

```prisma
enum TipoAprovacao {
  COTACAO           // Aprovação de cotação (primeira etapa)
  SOLICITACAO       // Aprovação de solicitação (segunda etapa)
}
```

### 3.3 EtapaAprovacao

```prisma
enum EtapaAprovacao {
  PRIMEIRA          // Primeira etapa - aprovação de cotação
  SEGUNDA           // Segunda etapa - aprovação final da solicitação
}
```

### 3.4 AcaoAprovacao

```prisma
enum AcaoAprovacao {
  APROVADO          // Aprovação concedida
  REJEITADO         // Aprovação negada
  DELEGADO          // Aprovação delegada
  CANCELADO         // Processo cancelado
  EXPIRADO          // Prazo expirado
  REVISADO          // Solicitação revisada
  REABERTO          // Processo reaberto
}
```

### 3.5 TipoConfiguracaoAprovacao

```prisma
enum TipoConfiguracaoAprovacao {
  COTACAO           // Configuração para aprovação de cotações
  SOLICITACAO       // Configuração para aprovação de solicitações
  GERAL             // Configuração geral do sistema
}
```

## 4. Índices e Performance

### 4.1 Índices Principais

```prisma
// Índices para consultas frequentes
@@index([statusAprovacao, empresaId])
@@index([aprovadorId, status])
@@index([cotacaoId, status])
@@index([dataAprovacao])
@@index([nivel, isObrigatorio])

// Índices compostos para relatórios
@@index([empresaId, createdAt, status])
@@index([aprovadorId, createdAt, status])
@@index([cotacaoId, nivel, status])
```

### 4.2 Constraints e Validações

```prisma
// Constraints únicas
@@unique([empresaId, tipo, valorMinimo, valorMaximo])
@@unique([cotacaoId, nivel, aprovadorId])

// Validações de integridade
// - Apenas uma proposta pode ser vencedora por cotação
// - Aprovador deve ter nível adequado para o valor
// - Data de aprovação não pode ser anterior à criação
```

## 5. Migrations Necessárias

### 5.1 Criação de Novos Modelos

```sql
-- Criar tabela de aprovações de cotação
CREATE TABLE "aprovacoes_cotacao" (
  "id" TEXT NOT NULL,
  "cotacaoId" TEXT NOT NULL,
  "propostaId" TEXT,
  "aprovadorId" TEXT NOT NULL,
  "nivel" INTEGER NOT NULL,
  "isObrigatorio" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'PENDENTE',
  -- ... outros campos
  PRIMARY KEY ("id")
);

-- Criar tabela de logs de aprovação
CREATE TABLE "logs_aprovacao" (
  "id" TEXT NOT NULL,
  "tipoAprovacao" TEXT NOT NULL,
  "etapa" TEXT NOT NULL,
  "acao" TEXT NOT NULL,
  -- ... outros campos
  PRIMARY KEY ("id")
);
```

### 5.2 Atualização de Modelos Existentes

```sql
-- Adicionar campos de aprovação à tabela cotacoes
ALTER TABLE "cotacoes" 
ADD COLUMN "statusAprovacao" TEXT DEFAULT 'PENDENTE',
ADD COLUMN "dataAprovacao" TIMESTAMP,
ADD COLUMN "aprovadorId" TEXT,
ADD COLUMN "propostaVencedoraId" TEXT;

-- Adicionar campos de controle à tabela solicitacoes_compra
ALTER TABLE "solicitacoes_compra"
ADD COLUMN "temCotacaoAprovada" BOOLEAN DEFAULT false,
ADD COLUMN "cotacaoAprovadaId" TEXT,
ADD COLUMN "etapaAtual" TEXT DEFAULT 'PRIMEIRA';
```

## 6. Considerações de Performance

### 6.1 Otimizações

1. **Índices Estratégicos**: Criados para consultas frequentes
2. **Paginação**: Implementar paginação em listas de aprovação
3. **Cache**: Cache de configurações de aprovação
4. **Lazy Loading**: Carregar relacionamentos sob demanda

### 6.2 Monitoramento

1. **Queries Lentas**: Monitorar queries de aprovação
2. **Uso de Índices**: Verificar uso efetivo dos índices
3. **Volume de Dados**: Monitorar crescimento das tabelas de log
4. **Concorrência**: Monitorar locks em aprovações simultâneas
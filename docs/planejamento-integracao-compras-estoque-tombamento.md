# Planejamento de Integração: Compras, Estoque e Tombamento

## 1. Visão Geral da Integração

### 1.1 Objetivo
Criar um fluxo integrado e automatizado entre os módulos de Compras, Estoque e Tombamento, utilizando centro de custo como elemento unificador para controle financeiro e organizacional.

### 1.2 Fluxo Principal
```
Solicitação de Compra → Cotação → Pedido → Recebimento → Classificação
                                                            ↓
                                                    [Consumível] → Estoque
                                                    [Permanente] → Tombamento
```

### 1.3 Benefícios Esperados
- Rastreabilidade completa do ciclo de vida dos itens
- Controle de custos por centro de custo
- Redução de retrabalho e erros manuais
- Visibilidade em tempo real do status dos processos
- Compliance com normas contábeis e fiscais

## 2. Arquitetura da Integração

### 2.1 Centro de Custo - Elemento Unificador

#### Estrutura do Centro de Custo
```typescript
model CentroCusto {
  id                String   @id @default(cuid())
  codigo            String   @unique
  nome              String
  descricao         String?
  tipo              TipoCentroCusto
  status            StatusCentroCusto
  centroPai         String?
  nivel             Int      @default(1)
  orcamentoAnual    Decimal?
  responsavelId     String?
  empresaId         String
  
  // Relacionamentos
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  responsavel       Usuario? @relation(fields: [responsavelId], references: [id])
  
  // Relacionamentos com outros módulos
  solicitacoes      SolicitacaoCompra[]
  movimentacoes     MovimentacaoEstoque[]
  ativos            Ativo[]
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TipoCentroCusto {
  DEPARTAMENTO
  PROJETO
  FILIAL
  ATIVIDADE
}

enum StatusCentroCusto {
  ATIVO
  INATIVO
  SUSPENSO
}
```

### 2.2 Fluxo de Dados Entre Módulos

#### 2.2.1 Compras → Estoque
```typescript
// Quando um item é recebido na compra
interface RecebimentoItem {
  pedidoItemId: string
  quantidadeRecebida: number
  valorUnitario: Decimal
  centroCustoId: string
  tipoItem: 'CONSUMIVEL' | 'PERMANENTE'
  localizacao?: string
}

// Automaticamente cria movimentação no estoque para itens consumíveis
interface MovimentacaoEstoque {
  tipo: 'ENTRADA_COMPRA'
  produtoId: string
  quantidade: number
  valorUnitario: Decimal
  centroCustoId: string
  pedidoCompraId: string
  documentoFiscal: string
}
```

#### 2.2.2 Compras → Tombamento
```typescript
// Para itens permanentes, cria automaticamente no tombamento
interface CriacaoAtivo {
  pedidoItemId: string
  categoriaId: string
  nome: string
  descricao: string
  valorAquisicao: Decimal
  centroCustoId: string
  localizacaoId: string
  fornecedorId: string
  notaFiscal: string
}
```

#### 2.2.3 Estoque → Tombamento
```typescript
// Transferência de itens do estoque para tombamento
interface TransferenciaEstoqueTombamento {
  movimentacaoEstoqueId: string
  motivoTransferencia: string
  centroCustoDestinoId: string
  responsavelId: string
  observacoes?: string
}
```

## 3. Regras de Negócio da Integração

### 3.1 Classificação Automática de Itens

#### Critérios para Classificação
1. **Valor**: Itens acima de R$ 1.000,00 → Tombamento
2. **Durabilidade**: Vida útil > 1 ano → Tombamento
3. **Categoria**: Equipamentos, móveis, veículos → Tombamento
4. **Consumo**: Materiais de escritório, limpeza → Estoque

#### Configuração por Empresa
```typescript
model ConfiguracaoClassificacao {
  id                    String   @id @default(cuid())
  empresaId            String
  valorMinimoTombamento Decimal  @default(1000.00)
  categoriasAutomaticas CategoriaClassificacao[]
  
  empresa              Empresa  @relation(fields: [empresaId], references: [id])
}

model CategoriaClassificacao {
  id           String @id @default(cuid())
  categoriaId  String
  destino      'ESTOQUE' | 'TOMBAMENTO'
  configId     String
  
  categoria    CategoriaProduto @relation(fields: [categoriaId], references: [id])
  config       ConfiguracaoClassificacao @relation(fields: [configId], references: [id])
}
```

### 3.2 Controle de Centro de Custo

#### Validações
- Todo item deve ter um centro de custo válido e ativo
- Centro de custo deve ter orçamento disponível (se configurado)
- Usuário deve ter permissão para o centro de custo
- Transferências entre centros de custo requerem aprovação

#### Relatórios por Centro de Custo
- Gastos por período
- Itens em estoque por centro
- Ativos por centro
- Análise orçamentária

## 4. APIs de Integração

### 4.1 Endpoints Principais

#### Recebimento de Compras
```typescript
POST /api/compras/recebimento
{
  pedidoId: string
  itens: {
    itemId: string
    quantidadeRecebida: number
    valorUnitario: number
    centroCustoId: string
    observacoes?: string
  }[]
  documentoFiscal: {
    numero: string
    serie: string
    dataEmissao: Date
    valorTotal: number
  }
}
```

#### Classificação de Itens
```typescript
POST /api/integracao/classificar-item
{
  pedidoItemId: string
  tipoDestino: 'ESTOQUE' | 'TOMBAMENTO'
  centroCustoId: string
  localizacaoId?: string
  observacoes?: string
}
```

#### Transferência Estoque → Tombamento
```typescript
POST /api/integracao/transferir-estoque-tombamento
{
  movimentacaoId: string
  centroCustoDestinoId: string
  localizacaoId: string
  responsavelId: string
  motivoTransferencia: string
}
```

### 4.2 Webhooks de Integração

#### Eventos Disparados
```typescript
// Quando um pedido é recebido
webhook: 'compras.pedido.recebido'
payload: {
  pedidoId: string
  itens: RecebimentoItem[]
  centroCustoId: string
}

// Quando um item entra no estoque
webhook: 'estoque.entrada.criada'
payload: {
  movimentacaoId: string
  produtoId: string
  quantidade: number
  centroCustoId: string
}

// Quando um ativo é criado
webhook: 'tombamento.ativo.criado'
payload: {
  ativoId: string
  centroCustoId: string
  valorAquisicao: number
}
```

## 5. Interface do Usuário

### 5.1 Dashboard Integrado
- Visão unificada dos processos em andamento
- Métricas por centro de custo
- Alertas de itens pendentes de classificação
- Gráficos de distribuição de gastos

### 5.2 Fluxo de Aprovação
- Workflow visual do processo
- Notificações automáticas
- Histórico de aprovações
- Comentários e anexos

### 5.3 Relatórios Integrados
- Relatório de gastos por centro de custo
- Análise de eficiência do processo
- Relatório de itens em trânsito
- Dashboard executivo

## 6. Cronograma de Implementação

### Fase 1 - Fundação (4 semanas)
- [ ] Implementar modelo de Centro de Custo
- [ ] Criar APIs básicas de integração
- [ ] Desenvolver regras de classificação automática
- [ ] Testes unitários e de integração

### Fase 2 - Integração Compras-Estoque (3 semanas)
- [ ] Implementar fluxo Compras → Estoque
- [ ] Desenvolver interface de recebimento
- [ ] Criar relatórios básicos
- [ ] Testes de fluxo completo

### Fase 3 - Integração Compras-Tombamento (3 semanas)
- [ ] Implementar fluxo Compras → Tombamento
- [ ] Desenvolver classificação automática
- [ ] Criar interface de gestão de ativos
- [ ] Testes de integração

### Fase 4 - Integração Estoque-Tombamento (2 semanas)
- [ ] Implementar transferências Estoque → Tombamento
- [ ] Desenvolver workflow de aprovação
- [ ] Criar relatórios avançados
- [ ] Testes finais

### Fase 5 - Dashboard e Relatórios (2 semanas)
- [ ] Desenvolver dashboard integrado
- [ ] Implementar relatórios por centro de custo
- [ ] Criar alertas e notificações
- [ ] Documentação e treinamento

## 7. Considerações Técnicas

### 7.1 Performance
- Indexação adequada nas tabelas de relacionamento
- Cache de consultas frequentes
- Processamento assíncrono para operações pesadas
- Paginação em listagens grandes

### 7.2 Segurança
- Validação de permissões por centro de custo
- Auditoria de todas as operações
- Criptografia de dados sensíveis
- Logs detalhados de integração

### 7.3 Escalabilidade
- Arquitetura baseada em eventos
- Microserviços para cada módulo
- Queue para processamento assíncrono
- Monitoramento de performance

## 8. Riscos e Mitigações

### 8.1 Riscos Identificados
- **Complexidade de integração**: Mitigar com testes extensivos
- **Performance**: Implementar cache e otimizações
- **Dados inconsistentes**: Validações rigorosas e rollback
- **Resistência dos usuários**: Treinamento e suporte

### 8.2 Plano de Contingência
- Rollback automático em caso de falhas
- Modo manual para operações críticas
- Backup de dados antes de migrações
- Suporte 24/7 durante implementação

## 9. Métricas de Sucesso

### 9.1 KPIs Técnicos
- Tempo de resposta das APIs < 500ms
- Disponibilidade > 99.9%
- Taxa de erro < 0.1%
- Cobertura de testes > 90%

### 9.2 KPIs de Negócio
- Redução de 80% no tempo de processamento
- Diminuição de 90% dos erros manuais
- Aumento de 50% na visibilidade dos custos
- ROI positivo em 6 meses

## 10. Próximos Passos

1. **Aprovação do planejamento** pela equipe técnica e de negócios
2. **Definição da equipe** de desenvolvimento
3. **Setup do ambiente** de desenvolvimento
4. **Início da Fase 1** - Implementação do Centro de Custo
5. **Reuniões semanais** de acompanhamento do progresso
# Módulo Financeiro — Especificação e Plano de Implementação (v0.4.38.24)

Status: Planejamento Aprovado
Versão alvo: 0.4.38.24
Categoria: core

---

## 1. Objetivos e Escopo

- Implementar um módulo Financeiro completo e padronizado, com integrações nativas aos módulos Compras, Estoque/Tombamento, CRM (Clientes/Orçamentos/OS) e Relatórios.
- Submódulos:
  - Contas a Pagar
  - Contas a Receber
  - Lançamentos (gerais/diários)
  - Fluxo de Caixa
  - Contas Bancárias/Caixa
  - Plano de Contas
  - Categorias Financeiras
  - Centro de Custo (reuso do cadastro existente)
  - Orçamento (opcional na primeira iteração)
  - Relatórios

---

## 2. Dependências e Integrações

- Compras → Contas a Pagar: geração automática de títulos a pagar a partir de `pedidos_compra` (condições de pagamento e fornecedor).
- CRM/OS/Orçamentos → Contas a Receber: criação de títulos a receber ao concluir/aceitar orçamentos, finalizar OSs ou faturar serviços/produtos.
- Estoque/Tombamento → Lançamentos: custo, imobilização e ajustes geram lançamentos internos, categorizados e vinculados a centro de custo.
- Clientes/Fornecedores: vínculo de títulos e lançamentos (FKs para `clientes` e `fornecedores`).
- Centro de Custo: referência obrigatória em lançamentos e opcional em títulos (planejamento/orçamento por centro).

---

## 3. Banco de Dados (Prisma/SQL) — Modelos

### 3.1. Enums

- `status_conta`: `aberta`, `parcial`, `paga`, `cancelada`, `estornada`.
- `tipo_lancamento`: `entrada`, `saida`, `transferencia`, `ajuste`.
- `meio_pagamento`: `dinheiro`, `pix`, `boleto`, `cartao_credito`, `cartao_debito`, `transferencia`.

### 3.2. Tabelas

- `contas_bancarias`
  - `id` (pk)
  - `nome` (string)
  - `banco` (string?)
  - `agencia` (string?)
  - `conta` (string?)
  - `saldo_inicial` (decimal)
  - `ativo` (boolean)
  - timestamps

- `plano_contas`
  - `id` (pk)
  - `codigo` (string único)
  - `descricao` (string)
  - `tipo` (`receita` | `despesa` | `patrimonial`)
  - `parentId` (fk auto-referente, opcional)
  - `ativo` (boolean)
  - timestamps

- `categorias_financeiras`
  - `id` (pk)
  - `nome` (string único)
  - `tipo` (`receita` | `despesa` | `transferencia` | `ajuste`)
  - `ativo` (boolean)
  - timestamps

- `lancamentos_financeiros`
  - `id` (pk)
  - `data` (date)
  - `descricao` (string)
  - `valor` (decimal)
  - `tipo` (`tipo_lancamento`)
  - `contaBancariaId` (fk → `contas_bancarias`)
  - `categoriaId` (fk → `categorias_financeiras`)
  - `planoContaId` (fk → `plano_contas`)
  - `centroCustoId` (fk → `centros_custo`)
  - `clienteId` (fk → `clientes`, opcional)
  - `fornecedorId` (fk → `fornecedores`, opcional)
  - `referenciaOrigem` (string: módulo/origem/id)
  - timestamps
  - índices: `data`, `tipo`, `contaBancariaId`, `centroCustoId`

- `contas_pagar`
  - `id` (pk)
  - `fornecedorId` (fk → `fornecedores`)
  - `descricao` (string)
  - `valor_total` (decimal)
  - `status` (`status_conta`)
  - `categoriaId` (fk → `categorias_financeiras`)
  - `planoContaId` (fk → `plano_contas`)
  - `centroCustoId` (fk → `centros_custo`)
  - `data_emissao` (date)
  - `observacoes` (text?)
  - timestamps

- `parcelas_pagar`
  - `id` (pk)
  - `contaPagarId` (fk → `contas_pagar`)
  - `numero` (int)
  - `valor` (decimal)
  - `vencimento` (date)
  - `pagaEm` (datetime?)
  - `meioPagamento` (`meio_pagamento`, opcional)
  - `contaBancariaId` (fk, opcional)
  - `status` (`aberta` | `paga` | `cancelada` | `estornada`)
  - índices: `vencimento`, `status`

- `contas_receber`
  - `id` (pk)
  - `clienteId` (fk → `clientes`)
  - `descricao` (string)
  - `valor_total` (decimal)
  - `status` (`status_conta`)
  - `categoriaId` (fk → `categorias_financeiras`)
  - `planoContaId` (fk → `plano_contas`)
  - `centroCustoId` (fk → `centros_custo`)
  - `data_emissao` (date)
  - `observacoes` (text?)
  - timestamps

- `parcelas_receber`
  - `id` (pk)
  - `contaReceberId` (fk → `contas_receber`)
  - `numero` (int)
  - `valor` (decimal)
  - `vencimento` (date)
  - `recebidaEm` (datetime?)
  - `meioPagamento` (`meio_pagamento`, opcional)
  - `contaBancariaId` (fk, opcional)
  - `status` (`aberta` | `recebida` | `cancelada` | `estornada`)
  - índices: `vencimento`, `status`

- `fluxo_caixa_snapshots`
  - `id` (pk)
  - `referencia` (string: AAAA-MM)
  - `contaBancariaId` (fk)
  - `saldoInicial` (decimal)
  - `saldoFinal` (decimal)
  - `entradas` (decimal)
  - `saidas` (decimal)
  - `geradoEm` (datetime)
  - índices: `referencia`, `contaBancariaId`

- `orcamentos_financeiros` (opcional)
  - `id` (pk)
  - `referencia` (string: AAAA)
  - `centroCustoId` (fk)
  - `descricao` (string)
  - `ativo` (boolean)
  - timestamps

- `orcamentos_itens` (opcional)
  - `id` (pk)
  - `orcamentoId` (fk → `orcamentos_financeiros`)
  - `planoContaId` (fk)
  - `categoriaId` (fk)
  - `valorPlanejado` (decimal)
  - `valorRealizado` (decimal, default 0)
  - `mesReferencia` (int: 1-12)

### 3.3. Registro do Módulo (seed)

- Inserir em `modulos_sistema` com:
  - `nome`: `financeiro`
  - `titulo`: `Financeiro`
  - `descricao`: `Gestão financeira integrada: pagar, receber, lançamentos, fluxo de caixa.`
  - `ativo`: true | `core`: true
  - `icone`: `Wallet`
  - `ordem`: próximo disponível
  - `rota`: `/financeiro`
  - `categoria`: `core`
  - `permissao`: `financeiro.view`

---

## 4. APIs REST (Next.js App Router)

Base: `/api/financeiro/*`

- `contas-bancarias`: GET/POST; `/:id` GET/PUT/DELETE
- `plano-contas`: GET/POST; `/:id` GET/PUT/DELETE
- `categorias`: GET/POST; `/:id` GET/PUT/DELETE
- `lancamentos`: GET/POST; `/:id` GET/PUT/DELETE
  - Ações: `/lancamentos/:id/estornar` (POST)
- `contas-pagar`: GET/POST; `/:id` GET/PUT/DELETE
  - Ações: `/contas-pagar/:id/pagar` (POST), `/:id/cancelar` (POST), `/:id/estornar` (POST)
- `contas-receber`: GET/POST; `/:id` GET/PUT/DELETE
  - Ações: `/contas-receber/:id/receber` (POST), `/:id/cancelar` (POST), `/:id/estornar` (POST)
- `fluxo-caixa`: GET (filtros por período, conta bancária)
- `orcamentos`: GET/POST; `/:id` GET/PUT/DELETE (opcional)
- `relatorios`: GET (mapa de endpoints de relatório)

Filtros padrão (query): `page`, `pageSize`, `dataInicial`, `dataFinal`, `status`, `centroCustoId`, `categoriaId`, `contaBancariaId`.

Validações: zod por endpoint; erros padronizados; autenticação middleware; verificação de módulo ativo e permissões.

---

## 5. Hooks (Frontend)

Padrão: React Query (ou SWR existente), estados `isLoading`, `error`, `data`, mutações com invalidação.

- `useFinanceiro()`
- `useContasBancarias()`
- `usePlanoContas()`
- `useCategoriasFinanceiras()`
- `useLancamentosFinanceiros()`
- `useContasPagar()`
- `useContasReceber()`
- `useFluxoCaixa()`
- `useOrcamentosFinanceiros()` (opcional)

---

## 6. Permissões

- Base: `financeiro.view`, `financeiro.admin`
- Recursos:
  - `contas_pagar.view|create|edit|delete|pagar|cancelar|estornar`
  - `contas_receber.view|create|edit|delete|receber|cancelar|estornar`
  - `lancamentos.view|create|edit|delete|estornar`
  - `plano_contas.view|create|edit|delete`
  - `categorias.view|create|edit|delete`
  - `contas_bancarias.view|create|edit|delete`
  - `orcamentos.view|create|edit|delete` (opcional)
  - `relatorios.view`

Seeds de permissões com associação a perfis padrão.

---

## 7. UI/Frontend

Rotas/páginas:

- `/financeiro`: dashboard financeiro (cards: saldo por conta, próximos vencimentos, entradas/saídas do período)
- `/financeiro/contas-bancarias`: lista + formulário + ações
- `/financeiro/plano-de-contas`: lista hierárquica + CRUD
- `/financeiro/categorias`: lista + CRUD
- `/financeiro/lancamentos`: lista + filtros + criação/edição
- `/financeiro/contas-a-pagar`: lista + filtros + criação + pagar/cancelar/estornar
- `/financeiro/contas-a-receber`: lista + filtros + criação + receber/cancelar/estornar
- `/financeiro/fluxo-de-caixa`: visão por período/conta com somatórios
- `/financeiro/orcamentos`: opcional
- `/financeiro/relatorios`: seleção e geração de relatórios

Componentes padrão conforme normativa: List, Form, Card, Dialog, DeleteDialog, filtros.

---

## 8. Migrações e Seeds

Ordem sugerida de migrações:
1. Enums e tabelas base: `contas_bancarias`, `plano_contas`, `categorias_financeiras`.
2. Lançamentos: `lancamentos_financeiros` (FKs principais).
3. Títulos: `contas_pagar` + `parcelas_pagar`; `contas_receber` + `parcelas_receber`.
4. `fluxo_caixa_snapshots`.
5. (Opcional) `orcamentos_financeiros` + `orcamentos_itens`.

Seeds:
- Registro do módulo em `modulos_sistema` (core).
- Permissões conforme seção 6.
- Plano de contas básico (receita, despesa, patrimonial).
- Categorias padrão (ex.: vendas, serviços, insumos, impostos, salários).
- Contas bancárias exemplo.

---

## 9. Qualidade, Validação e Logs

- Validações com `zod` nas APIs.
- Transações ao pagar/receber/estornar para garantir consistência.
- Logs de auditoria em operações críticas.
- Testes unitários e de integração ≥80% cobertura.

---

## 10. Relatórios

- Padrões:
  - Contas a pagar por período e status.
  - Contas a receber por período e status.
  - Fluxo de caixa consolidado por conta (mensal/diário).
  - Lançamentos por centro de custo/categoria.
  - Comparativo orçamento vs realizado (se habilitado).

---

## 11. Rollout e Segurança

- Migrações idempotentes; plano de rollback seguro.
- Toggle de módulo: core não desativável.
- Pós-deploy: verificação de páginas e APIs críticas; geração inicial de snapshots do mês.

---

## 12. Riscos e Mitigações

- Duplicidade de lançamentos: validação por origem.
- Concorrência em pagar/receber: transações e locks lógicos.
- Desalinhamento de categorias/plano de contas: validação e relacionamento obrigatório.

---

## 13. Backlog Inicial (v0.4.38.24)

- Backend
  - CRUD: contas-bancárias, plano-contas, categorias.
  - CRUD: lançamentos; ações de estorno.
  - CRUD: contas a pagar/receber; ações pagar/receber/cancelar/estornar.
  - Fluxo de caixa (consulta e snapshot).
- Frontend
  - Páginas e componentes conforme seção 7.
  - Hooks conforme seção 5.
  - Integrações: Compras → Pagar; OS/Orçamentos → Receber.

---

## 14. Conformidade com a NORMATIVA

- Registro obrigatório em `modulos_sistema`.
- APIs padronizadas (GET/POST/PUT/DELETE + ações).
- Permissões por recurso e ação.
- Estrutura de componentes e páginas padronizada.
- Documentação contínua e testes automatizados.
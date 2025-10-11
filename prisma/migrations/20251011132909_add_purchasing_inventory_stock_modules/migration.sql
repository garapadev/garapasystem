-- CreateEnum
CREATE TYPE "public"."status_solicitacao_compra" AS ENUM ('RASCUNHO', 'PENDENTE_APROVACAO', 'APROVADA', 'REJEITADA', 'EM_COTACAO', 'COTACAO_APROVADA', 'PEDIDO_ENVIADO', 'ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."status_cotacao" AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADA_NIVEL1', 'APROVADA_NIVEL2', 'APROVADA_FINAL', 'REJEITADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."tipo_movimentacao_estoque" AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'AJUSTE', 'INVENTARIO');

-- CreateEnum
CREATE TYPE "public"."status_item_tombamento" AS ENUM ('ATIVO', 'INATIVO', 'MANUTENCAO', 'BAIXADO', 'PERDIDO', 'DANIFICADO');

-- CreateTable
CREATE TABLE "public"."centros_custo" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "centros_custo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."fornecedores" (
    "id" TEXT NOT NULL,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "cnpj" TEXT,
    "cpf" TEXT,
    "inscricaoEstadual" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "celular" TEXT,
    "website" TEXT,
    "cep" TEXT,
    "logradouro" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "pais" TEXT DEFAULT 'Brasil',
    "banco" TEXT,
    "agencia" TEXT,
    "conta" TEXT,
    "tipoConta" TEXT,
    "pix" TEXT,
    "qualificado" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categorias_produto" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."produtos" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "unidadeMedida" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "estoqueMinimo" DECIMAL(65,30) DEFAULT 0,
    "estoqueMaximo" DECIMAL(65,30),
    "pontoReposicao" DECIMAL(65,30) DEFAULT 0,
    "precoUnitario" DECIMAL(65,30) DEFAULT 0,
    "precoMedio" DECIMAL(65,30) DEFAULT 0,
    "ultimoPreco" DECIMAL(65,30) DEFAULT 0,
    "controlEstoque" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."solicitacoes_compra" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "descricao" TEXT,
    "justificativa" TEXT,
    "status" "public"."status_solicitacao_compra" NOT NULL DEFAULT 'RASCUNHO',
    "prioridade" TEXT DEFAULT 'NORMAL',
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataNecessidade" TIMESTAMP(3),
    "dataAprovacao" TIMESTAMP(3),
    "centroCustoId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "aprovadorId" TEXT,
    "valorTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_solicitacao_compra" (
    "id" TEXT NOT NULL,
    "quantidade" DECIMAL(65,30) NOT NULL,
    "valorUnitario" DECIMAL(65,30) DEFAULT 0,
    "valorTotal" DECIMAL(65,30) DEFAULT 0,
    "observacoes" TEXT,
    "solicitacaoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_solicitacao_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cotacoes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" "public"."status_cotacao" NOT NULL DEFAULT 'PENDENTE',
    "dataCotacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataValidade" TIMESTAMP(3),
    "dataAprovacao" TIMESTAMP(3),
    "solicitacaoId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "aprovadorNivel1Id" TEXT,
    "aprovadorNivel2Id" TEXT,
    "aprovadorFinalId" TEXT,
    "valorTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(65,30) DEFAULT 0,
    "valorFinal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "prazoEntrega" TEXT,
    "condicoesPagamento" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_cotacao" (
    "id" TEXT NOT NULL,
    "quantidade" DECIMAL(65,30) NOT NULL,
    "valorUnitario" DECIMAL(65,30) NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL,
    "observacoes" TEXT,
    "cotacaoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "itemSolicitacaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_cotacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."pedidos_compra" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataEntregaPrevista" TIMESTAMP(3),
    "dataEntregaReal" TIMESTAMP(3),
    "cotacaoId" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(65,30) DEFAULT 0,
    "valorFinal" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "prazoEntrega" TEXT,
    "condicoesPagamento" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_pedido_compra" (
    "id" TEXT NOT NULL,
    "quantidade" DECIMAL(65,30) NOT NULL,
    "valorUnitario" DECIMAL(65,30) NOT NULL,
    "valorTotal" DECIMAL(65,30) NOT NULL,
    "quantidadeRecebida" DECIMAL(65,30) DEFAULT 0,
    "observacoes" TEXT,
    "pedidoId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_pedido_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."estoque_produtos" (
    "id" TEXT NOT NULL,
    "quantidade" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantidadeReservada" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "quantidadeDisponivel" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "valorUnitario" DECIMAL(65,30) DEFAULT 0,
    "valorTotal" DECIMAL(65,30) DEFAULT 0,
    "localizacao" TEXT,
    "lote" TEXT,
    "dataValidade" TIMESTAMP(3),
    "produtoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "tipo" "public"."tipo_movimentacao_estoque" NOT NULL,
    "quantidade" DECIMAL(65,30) NOT NULL,
    "valorUnitario" DECIMAL(65,30) DEFAULT 0,
    "valorTotal" DECIMAL(65,30) DEFAULT 0,
    "localizacaoOrigem" TEXT,
    "localizacaoDestino" TEXT,
    "lote" TEXT,
    "documentoTipo" TEXT,
    "documentoId" TEXT,
    "documentoNumero" TEXT,
    "centroCustoId" TEXT,
    "produtoId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_tombamento" (
    "id" TEXT NOT NULL,
    "numeroTombamento" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "public"."status_item_tombamento" NOT NULL DEFAULT 'ATIVO',
    "marca" TEXT,
    "modelo" TEXT,
    "numeroSerie" TEXT,
    "anoFabricacao" INTEGER,
    "valorAquisicao" DECIMAL(65,30) DEFAULT 0,
    "valorAtual" DECIMAL(65,30) DEFAULT 0,
    "dataAquisicao" TIMESTAMP(3),
    "localizacao" TEXT,
    "responsavel" TEXT,
    "centroCustoId" TEXT,
    "produtoId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_tombamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movimentacoes_tombamento" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "localizacaoOrigem" TEXT,
    "localizacaoDestino" TEXT,
    "responsavelOrigem" TEXT,
    "responsavelDestino" TEXT,
    "itemTombamentoId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movimentacoes_tombamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "centros_custo_codigo_key" ON "public"."centros_custo"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cnpj_key" ON "public"."fornecedores"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "fornecedores_cpf_key" ON "public"."fornecedores"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigo_key" ON "public"."produtos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_compra_numero_key" ON "public"."solicitacoes_compra"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "cotacoes_numero_key" ON "public"."cotacoes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_compra_numero_key" ON "public"."pedidos_compra"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "estoque_produtos_produtoId_localizacao_lote_key" ON "public"."estoque_produtos"("produtoId", "localizacao", "lote");

-- CreateIndex
CREATE UNIQUE INDEX "itens_tombamento_numeroTombamento_key" ON "public"."itens_tombamento"("numeroTombamento");

-- AddForeignKey
ALTER TABLE "public"."centros_custo" ADD CONSTRAINT "centros_custo_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."categorias_produto" ADD CONSTRAINT "categorias_produto_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."categorias_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."produtos" ADD CONSTRAINT "produtos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "public"."categorias_produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."solicitacoes_compra" ADD CONSTRAINT "solicitacoes_compra_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "public"."centros_custo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."solicitacoes_compra" ADD CONSTRAINT "solicitacoes_compra_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."solicitacoes_compra" ADD CONSTRAINT "solicitacoes_compra_aprovadorId_fkey" FOREIGN KEY ("aprovadorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_solicitacao_compra" ADD CONSTRAINT "itens_solicitacao_compra_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "public"."solicitacoes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_solicitacao_compra" ADD CONSTRAINT "itens_solicitacao_compra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cotacoes" ADD CONSTRAINT "cotacoes_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "public"."solicitacoes_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cotacoes" ADD CONSTRAINT "cotacoes_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cotacoes" ADD CONSTRAINT "cotacoes_aprovadorNivel1Id_fkey" FOREIGN KEY ("aprovadorNivel1Id") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cotacoes" ADD CONSTRAINT "cotacoes_aprovadorNivel2Id_fkey" FOREIGN KEY ("aprovadorNivel2Id") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cotacoes" ADD CONSTRAINT "cotacoes_aprovadorFinalId_fkey" FOREIGN KEY ("aprovadorFinalId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_cotacao" ADD CONSTRAINT "itens_cotacao_cotacaoId_fkey" FOREIGN KEY ("cotacaoId") REFERENCES "public"."cotacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_cotacao" ADD CONSTRAINT "itens_cotacao_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_cotacao" ADD CONSTRAINT "itens_cotacao_itemSolicitacaoId_fkey" FOREIGN KEY ("itemSolicitacaoId") REFERENCES "public"."itens_solicitacao_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedidos_compra" ADD CONSTRAINT "pedidos_compra_cotacaoId_fkey" FOREIGN KEY ("cotacaoId") REFERENCES "public"."cotacoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedidos_compra" ADD CONSTRAINT "pedidos_compra_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "public"."fornecedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "public"."pedidos_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_pedido_compra" ADD CONSTRAINT "itens_pedido_compra_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."estoque_produtos" ADD CONSTRAINT "estoque_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "public"."centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_tombamento" ADD CONSTRAINT "itens_tombamento_centroCustoId_fkey" FOREIGN KEY ("centroCustoId") REFERENCES "public"."centros_custo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_tombamento" ADD CONSTRAINT "itens_tombamento_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "public"."produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentacoes_tombamento" ADD CONSTRAINT "movimentacoes_tombamento_itemTombamentoId_fkey" FOREIGN KEY ("itemTombamentoId") REFERENCES "public"."itens_tombamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimentacoes_tombamento" ADD CONSTRAINT "movimentacoes_tombamento_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

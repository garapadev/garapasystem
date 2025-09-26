-- CreateEnum
CREATE TYPE "public"."status_orcamento" AS ENUM ('RASCUNHO', 'ENVIADO', 'APROVADO', 'REJEITADO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."tipo_item_orcamento" AS ENUM ('MATERIAL', 'SERVICO', 'MAO_DE_OBRA');

-- AlterEnum
ALTER TYPE "public"."status_laudo" ADD VALUE 'CONCLUIDO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."status_ordem_servico" ADD VALUE 'AGUARDANDO_APROVACAO_CLIENTE';
ALTER TYPE "public"."status_ordem_servico" ADD VALUE 'ORCAMENTO_ENVIADO';

-- CreateTable
CREATE TABLE "public"."orcamentos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "observacoes" TEXT,
    "valorSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorDesconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "percentualDesconto" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "status" "public"."status_orcamento" NOT NULL DEFAULT 'RASCUNHO',
    "aprovadoCliente" BOOLEAN,
    "dataAprovacao" TIMESTAMP(3),
    "comentariosCliente" TEXT,
    "codigoAprovacao" TEXT,
    "geradoAutomaticamente" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "laudoTecnicoId" TEXT,
    "criadoPorId" TEXT NOT NULL,

    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_orcamento" (
    "id" TEXT NOT NULL,
    "tipo" "public"."tipo_item_orcamento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unidade" TEXT,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT,
    "orcamentoId" TEXT NOT NULL,
    "itemLaudoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anexos_orcamento" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tamanho" INTEGER,
    "tipoMime" TEXT,
    "descricao" TEXT,
    "orcamentoId" TEXT NOT NULL,
    "uploadPor" TEXT,
    "colaboradorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historico_orcamento" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "orcamentoId" TEXT NOT NULL,
    "colaboradorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_orcamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_numero_key" ON "public"."orcamentos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "orcamentos_codigoAprovacao_key" ON "public"."orcamentos"("codigoAprovacao");

-- AddForeignKey
ALTER TABLE "public"."orcamentos" ADD CONSTRAINT "orcamentos_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orcamentos" ADD CONSTRAINT "orcamentos_laudoTecnicoId_fkey" FOREIGN KEY ("laudoTecnicoId") REFERENCES "public"."laudos_tecnicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orcamentos" ADD CONSTRAINT "orcamentos_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_orcamento" ADD CONSTRAINT "itens_orcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "public"."orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_orcamento" ADD CONSTRAINT "itens_orcamento_itemLaudoId_fkey" FOREIGN KEY ("itemLaudoId") REFERENCES "public"."itens_laudo_tecnico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anexos_orcamento" ADD CONSTRAINT "anexos_orcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "public"."orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anexos_orcamento" ADD CONSTRAINT "anexos_orcamento_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_orcamento" ADD CONSTRAINT "historico_orcamento_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "public"."orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_orcamento" ADD CONSTRAINT "historico_orcamento_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

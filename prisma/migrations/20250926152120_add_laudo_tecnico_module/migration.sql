-- CreateEnum
CREATE TYPE "public"."status_laudo" AS ENUM ('RASCUNHO', 'FINALIZADO', 'ENVIADO_CLIENTE', 'APROVADO_CLIENTE', 'REJEITADO_CLIENTE', 'REVISAO');

-- CreateEnum
CREATE TYPE "public"."tipo_item_laudo" AS ENUM ('MATERIAL', 'SERVICO', 'MAO_DE_OBRA');

-- CreateEnum
CREATE TYPE "public"."categoria_anexo_laudo" AS ENUM ('FOTO_PROBLEMA', 'FOTO_SOLUCAO', 'DOCUMENTO_TECNICO', 'ESQUEMA', 'OUTRO');

-- CreateTable
CREATE TABLE "public"."laudos_tecnicos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "problemaRelatado" TEXT NOT NULL,
    "analiseProblema" TEXT NOT NULL,
    "diagnostico" TEXT NOT NULL,
    "solucaoRecomendada" TEXT NOT NULL,
    "observacoesTecnicas" TEXT,
    "gerarOrcamento" BOOLEAN NOT NULL DEFAULT false,
    "valorOrcamento" DOUBLE PRECISION,
    "justificativaValor" TEXT,
    "status" "public"."status_laudo" NOT NULL DEFAULT 'RASCUNHO',
    "aprovadoCliente" BOOLEAN,
    "dataAprovacao" TIMESTAMP(3),
    "comentariosCliente" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,

    CONSTRAINT "laudos_tecnicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_laudo_tecnico" (
    "id" TEXT NOT NULL,
    "tipo" "public"."tipo_item_laudo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unidade" TEXT,
    "valorUnitario" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION,
    "necessario" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "laudoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_laudo_tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anexos_laudo_tecnico" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tamanho" INTEGER,
    "tipoMime" TEXT,
    "descricao" TEXT,
    "categoria" "public"."categoria_anexo_laudo",
    "laudoId" TEXT NOT NULL,
    "uploadPor" TEXT,
    "tecnicoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_laudo_tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historico_laudo_tecnico" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "laudoId" TEXT NOT NULL,
    "tecnicoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_laudo_tecnico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "laudos_tecnicos_numero_key" ON "public"."laudos_tecnicos"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "laudos_tecnicos_ordemServicoId_key" ON "public"."laudos_tecnicos"("ordemServicoId");

-- AddForeignKey
ALTER TABLE "public"."laudos_tecnicos" ADD CONSTRAINT "laudos_tecnicos_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."laudos_tecnicos" ADD CONSTRAINT "laudos_tecnicos_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_laudo_tecnico" ADD CONSTRAINT "itens_laudo_tecnico_laudoId_fkey" FOREIGN KEY ("laudoId") REFERENCES "public"."laudos_tecnicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anexos_laudo_tecnico" ADD CONSTRAINT "anexos_laudo_tecnico_laudoId_fkey" FOREIGN KEY ("laudoId") REFERENCES "public"."laudos_tecnicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anexos_laudo_tecnico" ADD CONSTRAINT "anexos_laudo_tecnico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_laudo_tecnico" ADD CONSTRAINT "historico_laudo_tecnico_laudoId_fkey" FOREIGN KEY ("laudoId") REFERENCES "public"."laudos_tecnicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_laudo_tecnico" ADD CONSTRAINT "historico_laudo_tecnico_tecnicoId_fkey" FOREIGN KEY ("tecnicoId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

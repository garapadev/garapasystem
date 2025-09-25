-- CreateEnum
CREATE TYPE "public"."status_aprovacao" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "public"."aprovacoes_ordem_servico" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "status" "public"."status_aprovacao" NOT NULL DEFAULT 'PENDENTE',
    "aprovadoPor" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "comentariosCliente" TEXT,
    "observacoes" TEXT,
    "dataExpiracao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ordemServicoId" TEXT NOT NULL,

    CONSTRAINT "aprovacoes_ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "aprovacoes_ordem_servico_codigo_key" ON "public"."aprovacoes_ordem_servico"("codigo");

-- AddForeignKey
ALTER TABLE "public"."aprovacoes_ordem_servico" ADD CONSTRAINT "aprovacoes_ordem_servico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

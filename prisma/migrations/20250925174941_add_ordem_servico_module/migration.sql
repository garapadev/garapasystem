-- CreateEnum
CREATE TYPE "public"."status_ordem_servico" AS ENUM ('RASCUNHO', 'AGUARDANDO_APROVACAO', 'APROVADA', 'REJEITADA', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."prioridade_os" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- AlterTable
ALTER TABLE "public"."colaboradores" ADD COLUMN     "whatsappInstanceName" TEXT,
ADD COLUMN     "whatsappToken" TEXT;

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "ordemServicoId" TEXT;

-- CreateTable
CREATE TABLE "public"."ordens_servico" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "observacoes" TEXT,
    "localExecucao" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "prazoEstimado" TIMESTAMP(3),
    "valorOrcamento" DOUBLE PRECISION,
    "valorFinal" DOUBLE PRECISION,
    "status" "public"."status_ordem_servico" NOT NULL DEFAULT 'RASCUNHO',
    "prioridade" "public"."prioridade_os" NOT NULL DEFAULT 'MEDIA',
    "codigoAprovacao" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "aprovadoPor" TEXT,
    "comentariosCliente" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "criadoPorId" TEXT NOT NULL,
    "oportunidadeId" TEXT,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_ordem_servico" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unidade" TEXT,
    "valorUnitario" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION,
    "observacoes" TEXT,
    "ordemServicoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."templates_checklist" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "templates_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_template_checklist" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_template_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."checklists_ordem_servico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordemServicoId" TEXT NOT NULL,
    "templateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklists_ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."itens_checklist_os" (
    "id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL,
    "observacoes" TEXT,
    "concluidoPor" TEXT,
    "dataConclucao" TIMESTAMP(3),
    "checklistId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itens_checklist_os_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."historico_ordem_servico" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "ordemServicoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuario" TEXT,
    "colaboradorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comentarios_ordem_servico" (
    "id" TEXT NOT NULL,
    "comentario" TEXT NOT NULL,
    "interno" BOOLEAN NOT NULL DEFAULT true,
    "ordemServicoId" TEXT NOT NULL,
    "autorId" TEXT,
    "autor" TEXT NOT NULL,
    "autorEmail" TEXT,
    "colaboradorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comentarios_ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anexos_ordem_servico" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tamanho" INTEGER,
    "tipoMime" TEXT,
    "descricao" TEXT,
    "ordemServicoId" TEXT NOT NULL,
    "uploadPor" TEXT,
    "colaboradorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anexos_ordem_servico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numero_key" ON "public"."ordens_servico"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_codigoAprovacao_key" ON "public"."ordens_servico"("codigoAprovacao");

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordens_servico" ADD CONSTRAINT "ordens_servico_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordens_servico" ADD CONSTRAINT "ordens_servico_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ordens_servico" ADD CONSTRAINT "ordens_servico_oportunidadeId_fkey" FOREIGN KEY ("oportunidadeId") REFERENCES "public"."oportunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_ordem_servico" ADD CONSTRAINT "itens_ordem_servico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_template_checklist" ADD CONSTRAINT "itens_template_checklist_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."templates_checklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checklists_ordem_servico" ADD CONSTRAINT "checklists_ordem_servico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."checklists_ordem_servico" ADD CONSTRAINT "checklists_ordem_servico_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."templates_checklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."itens_checklist_os" ADD CONSTRAINT "itens_checklist_os_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "public"."checklists_ordem_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_ordem_servico" ADD CONSTRAINT "historico_ordem_servico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."historico_ordem_servico" ADD CONSTRAINT "historico_ordem_servico_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comentarios_ordem_servico" ADD CONSTRAINT "comentarios_ordem_servico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comentarios_ordem_servico" ADD CONSTRAINT "comentarios_ordem_servico_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anexos_ordem_servico" ADD CONSTRAINT "anexos_ordem_servico_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "public"."ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anexos_ordem_servico" ADD CONSTRAINT "anexos_ordem_servico_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

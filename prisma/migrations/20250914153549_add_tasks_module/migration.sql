-- CreateEnum
CREATE TYPE "public"."TaskPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'AGUARDANDO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "public"."TaskRecurrenceType" AS ENUM ('DIARIA', 'SEMANAL', 'MENSAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "public"."TaskLogType" AS ENUM ('CRIACAO', 'STATUS_ALTERADO', 'PRIORIDADE_ALTERADA', 'RESPONSAVEL_ALTERADO', 'VENCIMENTO_ALTERADO', 'TITULO_ALTERADO', 'DESCRICAO_ALTERADA', 'COMENTARIO_ADICIONADO', 'ANEXO_ADICIONADO', 'CONCLUSAO', 'CANCELAMENTO', 'REABERTURA');

-- CreateEnum
CREATE TYPE "public"."TaskNotificationType" AS ENUM ('LEMBRETE_VENCIMENTO', 'TAREFA_ATRASADA', 'TAREFA_ATRIBUIDA', 'STATUS_ALTERADO', 'COMENTARIO_ADICIONADO', 'LEMBRETE_SEM_ATUALIZACAO', 'ALERTA_GESTOR');

-- CreateTable
CREATE TABLE "public"."tasks" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "prioridade" "public"."TaskPrioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDENTE',
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataConclusao" TIMESTAMP(3),
    "isRecorrente" BOOLEAN NOT NULL DEFAULT false,
    "tempoEstimado" INTEGER,
    "tempoGasto" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "clienteId" TEXT,
    "oportunidadeId" TEXT,
    "emailId" TEXT,
    "helpdeskTicketId" TEXT,
    "recorrenciaId" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_comments" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "isInterno" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "taskId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_attachments" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tipoConteudo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "uploadPorId" TEXT NOT NULL,

    CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_recurrences" (
    "id" TEXT NOT NULL,
    "tipo" "public"."TaskRecurrenceType" NOT NULL,
    "intervalo" INTEGER NOT NULL DEFAULT 1,
    "diasSemana" TEXT,
    "diaMes" INTEGER,
    "dataFim" TIMESTAMP(3),
    "maxOcorrencias" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "proximaExecucao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_recurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_logs" (
    "id" TEXT NOT NULL,
    "tipo" "public"."TaskLogType" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "task_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."task_notifications" (
    "id" TEXT NOT NULL,
    "tipo" "public"."TaskNotificationType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "enviado" BOOLEAN NOT NULL DEFAULT false,
    "dataEnvio" TIMESTAMP(3),
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "agendadoPara" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT NOT NULL,
    "destinatarioId" TEXT NOT NULL,

    CONSTRAINT "task_notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_oportunidadeId_fkey" FOREIGN KEY ("oportunidadeId") REFERENCES "public"."oportunidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "public"."emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_helpdeskTicketId_fkey" FOREIGN KEY ("helpdeskTicketId") REFERENCES "public"."helpdesk_tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tasks" ADD CONSTRAINT "tasks_recorrenciaId_fkey" FOREIGN KEY ("recorrenciaId") REFERENCES "public"."task_recurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_comments" ADD CONSTRAINT "task_comments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_comments" ADD CONSTRAINT "task_comments_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_attachments" ADD CONSTRAINT "task_attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_attachments" ADD CONSTRAINT "task_attachments_uploadPorId_fkey" FOREIGN KEY ("uploadPorId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_logs" ADD CONSTRAINT "task_logs_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_logs" ADD CONSTRAINT "task_logs_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_notifications" ADD CONSTRAINT "task_notifications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."task_notifications" ADD CONSTRAINT "task_notifications_destinatarioId_fkey" FOREIGN KEY ("destinatarioId") REFERENCES "public"."colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "public"."HelpdeskLogTipo" AS ENUM ('CRIACAO', 'STATUS_ALTERADO', 'PRIORIDADE_ALTERADA', 'RESPONSAVEL_ALTERADO', 'ASSUNTO_ALTERADO', 'DESCRICAO_ALTERADA', 'MENSAGEM_ADICIONADA', 'ANEXO_ADICIONADO', 'FECHAMENTO', 'REABERTURA');

-- CreateTable
CREATE TABLE "public"."helpdesk_ticket_logs" (
    "id" TEXT NOT NULL,
    "tipo" "public"."HelpdeskLogTipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "autorNome" TEXT NOT NULL,
    "autorEmail" TEXT NOT NULL,
    "autorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,

    CONSTRAINT "helpdesk_ticket_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."helpdesk_ticket_logs" ADD CONSTRAINT "helpdesk_ticket_logs_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."helpdesk_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."helpdesk_ticket_logs" ADD CONSTRAINT "helpdesk_ticket_logs_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

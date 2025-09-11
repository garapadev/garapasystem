-- CreateEnum
CREATE TYPE "public"."HelpdeskStatus" AS ENUM ('ABERTO', 'EM_ANDAMENTO', 'AGUARDANDO_CLIENTE', 'RESOLVIDO', 'FECHADO');

-- CreateEnum
CREATE TYPE "public"."HelpdeskPrioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "public"."HelpdeskTipoConteudo" AS ENUM ('TEXTO', 'HTML', 'MARKDOWN');

-- CreateTable
CREATE TABLE "public"."helpdesk_departamentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "imapHost" TEXT,
    "imapPort" INTEGER DEFAULT 993,
    "imapSecure" BOOLEAN NOT NULL DEFAULT true,
    "imapEmail" TEXT,
    "imapPassword" TEXT,
    "smtpHost" TEXT,
    "smtpPort" INTEGER DEFAULT 587,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "smtpEmail" TEXT,
    "smtpPassword" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER NOT NULL DEFAULT 300,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "grupoHierarquicoId" TEXT,

    CONSTRAINT "helpdesk_departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."helpdesk_tickets" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "assunto" TEXT NOT NULL,
    "descricao" TEXT,
    "prioridade" "public"."HelpdeskPrioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "public"."HelpdeskStatus" NOT NULL DEFAULT 'ABERTO',
    "solicitanteNome" TEXT NOT NULL,
    "solicitanteEmail" TEXT NOT NULL,
    "solicitanteTelefone" TEXT,
    "emailMessageId" TEXT,
    "emailUid" INTEGER,
    "dataAbertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" TIMESTAMP(3),
    "dataUltimaResposta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "departamentoId" TEXT NOT NULL,
    "clienteId" TEXT,
    "responsavelId" TEXT,

    CONSTRAINT "helpdesk_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."helpdesk_mensagens" (
    "id" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipoConteudo" "public"."HelpdeskTipoConteudo" NOT NULL DEFAULT 'TEXTO',
    "remetenteNome" TEXT NOT NULL,
    "remetenteEmail" TEXT NOT NULL,
    "isInterno" BOOLEAN NOT NULL DEFAULT false,
    "emailMessageId" TEXT,
    "emailUid" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,
    "autorId" TEXT,

    CONSTRAINT "helpdesk_mensagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."helpdesk_anexos" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tipoConteudo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mensagemId" TEXT NOT NULL,

    CONSTRAINT "helpdesk_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "helpdesk_tickets_numero_key" ON "public"."helpdesk_tickets"("numero");

-- AddForeignKey
ALTER TABLE "public"."helpdesk_departamentos" ADD CONSTRAINT "helpdesk_departamentos_grupoHierarquicoId_fkey" FOREIGN KEY ("grupoHierarquicoId") REFERENCES "public"."grupos_hierarquicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "public"."helpdesk_departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "public"."clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."helpdesk_tickets" ADD CONSTRAINT "helpdesk_tickets_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."helpdesk_mensagens" ADD CONSTRAINT "helpdesk_mensagens_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "public"."helpdesk_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."helpdesk_mensagens" ADD CONSTRAINT "helpdesk_mensagens_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."helpdesk_anexos" ADD CONSTRAINT "helpdesk_anexos_mensagemId_fkey" FOREIGN KEY ("mensagemId") REFERENCES "public"."helpdesk_mensagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

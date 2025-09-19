-- CreateEnum
CREATE TYPE "public"."whatsapp_message_type" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT');

-- CreateEnum
CREATE TYPE "public"."whatsapp_message_status" AS ENUM ('SENT', 'DELIVERED', 'READ', 'RECEIVED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."whatsapp_chat_type" AS ENUM ('INDIVIDUAL', 'GROUP');

-- CreateEnum
CREATE TYPE "public"."whatsapp_trigger_type" AS ENUM ('MESSAGE_RECEIVED', 'CONTACT_ADDED', 'GROUP_JOINED', 'KEYWORD_DETECTED', 'SCHEDULE');

-- CreateTable
CREATE TABLE "public"."whatsapp_connections" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "qrCode" TEXT,
    "lastSeen" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "avatar" TEXT,
    "tipo" "public"."whatsapp_chat_type" NOT NULL DEFAULT 'INDIVIDUAL',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_messages" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "connectionId" TEXT,
    "conversaId" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "messageType" "public"."whatsapp_message_type" NOT NULL DEFAULT 'TEXT',
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isFromMe" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."whatsapp_message_status" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_contacts" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "name" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "profilePic" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_groups" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "profilePic" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_connected',
    "qrCode" TEXT,
    "phoneNumber" TEXT,
    "sessionData" JSONB,
    "lastActivity" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."whatsapp_automations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trigger" "public"."whatsapp_trigger_type" NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_automations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_connections_sessionId_key" ON "public"."whatsapp_connections"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_conversations_colaboradorId_chatId_key" ON "public"."whatsapp_conversations"("colaboradorId", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_messageId_key" ON "public"."whatsapp_messages"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_connectionId_contactId_key" ON "public"."whatsapp_contacts"("connectionId", "contactId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_groups_connectionId_groupId_key" ON "public"."whatsapp_groups"("connectionId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_colaboradorId_key" ON "public"."whatsapp_sessions"("colaboradorId");

-- AddForeignKey
ALTER TABLE "public"."whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversaId_fkey" FOREIGN KEY ("conversaId") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_groups" ADD CONSTRAINT "whatsapp_groups_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "public"."whatsapp_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."whatsapp_sessions" ADD CONSTRAINT "whatsapp_sessions_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

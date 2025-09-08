-- CreateEnum
CREATE TYPE "public"."EmailSyncStatus" AS ENUM ('IDLE', 'SYNCING', 'ERROR', 'DISABLED');

-- CreateTable
CREATE TABLE "public"."email_configs" (
    "id" TEXT NOT NULL,
    "imapHost" TEXT NOT NULL,
    "imapPort" INTEGER NOT NULL DEFAULT 993,
    "imapSecure" BOOLEAN NOT NULL DEFAULT true,
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL DEFAULT 587,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "syncInterval" INTEGER NOT NULL DEFAULT 180,
    "lastSync" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "colaboradorId" TEXT NOT NULL,

    CONSTRAINT "email_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "delimiter" TEXT NOT NULL DEFAULT '/',
    "specialUse" TEXT,
    "subscribed" BOOLEAN NOT NULL DEFAULT true,
    "totalMessages" INTEGER NOT NULL DEFAULT 0,
    "unreadMessages" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailConfigId" TEXT NOT NULL,

    CONSTRAINT "email_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emails" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "uid" INTEGER NOT NULL,
    "subject" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT,
    "cc" TEXT,
    "bcc" TEXT,
    "replyTo" TEXT,
    "textContent" TEXT,
    "htmlContent" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "size" INTEGER,
    "flags" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "inReplyTo" TEXT,
    "references" TEXT,
    "threadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailConfigId" TEXT NOT NULL,
    "folderId" TEXT NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_attachments" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentId" TEXT,
    "disposition" TEXT,
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailId" TEXT NOT NULL,

    CONSTRAINT "email_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_configs_colaboradorId_key" ON "public"."email_configs"("colaboradorId");

-- CreateIndex
CREATE UNIQUE INDEX "email_folders_emailConfigId_path_key" ON "public"."email_folders"("emailConfigId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "emails_emailConfigId_messageId_key" ON "public"."emails"("emailConfigId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "emails_emailConfigId_folderId_uid_key" ON "public"."emails"("emailConfigId", "folderId", "uid");

-- AddForeignKey
ALTER TABLE "public"."email_configs" ADD CONSTRAINT "email_configs_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "public"."colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_folders" ADD CONSTRAINT "email_folders_emailConfigId_fkey" FOREIGN KEY ("emailConfigId") REFERENCES "public"."email_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emails" ADD CONSTRAINT "emails_emailConfigId_fkey" FOREIGN KEY ("emailConfigId") REFERENCES "public"."email_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emails" ADD CONSTRAINT "emails_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."email_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_attachments" ADD CONSTRAINT "email_attachments_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "public"."emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

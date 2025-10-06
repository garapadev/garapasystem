-- CreateEnum
CREATE TYPE "public"."categoria_modulo" AS ENUM ('CORE', 'COMUNICACAO', 'VENDAS', 'OPERACIONAL', 'RELATORIOS', 'INTEGRACAO');

-- CreateTable
CREATE TABLE "public"."modulos_sistema" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "core" BOOLEAN NOT NULL DEFAULT false,
    "icone" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "permissao" TEXT,
    "rota" TEXT,
    "categoria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modulos_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."modulos_sistema_logs" (
    "id" TEXT NOT NULL,
    "moduloId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "observacoes" TEXT,
    "autorId" TEXT,
    "autorNome" TEXT NOT NULL,
    "autorEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modulos_sistema_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modulos_sistema_nome_key" ON "public"."modulos_sistema"("nome");

-- AddForeignKey
ALTER TABLE "public"."modulos_sistema_logs" ADD CONSTRAINT "modulos_sistema_logs_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "public"."modulos_sistema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."modulos_sistema_logs" ADD CONSTRAINT "modulos_sistema_logs_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

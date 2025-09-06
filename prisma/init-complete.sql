-- Arquivo de inicialização completa do banco de dados
-- Baseado no schema Prisma do sistema Garapasys

-- Criar enums
CREATE TYPE "TipoCliente" AS ENUM ('PESSOA_FISICA', 'PESSOA_JURIDICA');
CREATE TYPE "StatusCliente" AS ENUM ('LEAD', 'PROSPECT', 'CLIENTE', 'INATIVO');

-- Tabela de usuários
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "colaboradorId" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- Tabela de grupos hierárquicos
CREATE TABLE "grupos_hierarquicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "grupos_hierarquicos_pkey" PRIMARY KEY ("id")
);

-- Tabela de permissões
CREATE TABLE "permissoes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "recurso" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissoes_pkey" PRIMARY KEY ("id")
);

-- Tabela de perfis
CREATE TABLE "perfis" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_pkey" PRIMARY KEY ("id")
);

-- Tabela associativa perfil-permissão
CREATE TABLE "perfil_permissao" (
    "perfilId" TEXT NOT NULL,
    "permissaoId" TEXT NOT NULL,

    CONSTRAINT "perfil_permissao_pkey" PRIMARY KEY ("perfilId","permissaoId")
);

-- Tabela de colaboradores
CREATE TABLE "colaboradores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "documento" TEXT,
    "cargo" TEXT,
    "dataAdmissao" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "perfilId" TEXT,
    "grupoHierarquicoId" TEXT,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- Tabela de clientes
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "documento" TEXT,
    "tipo" "TipoCliente" NOT NULL DEFAULT 'PESSOA_FISICA',
    "status" "StatusCliente" NOT NULL DEFAULT 'LEAD',
    "endereco" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "observacoes" TEXT,
    "valorPotencial" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "grupoHierarquicoId" TEXT,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- Tabela de etapas do pipeline
CREATE TABLE "etapas_pipeline" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL,
    "cor" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etapas_pipeline_pkey" PRIMARY KEY ("id")
);

-- Tabela de oportunidades
CREATE TABLE "oportunidades" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DOUBLE PRECISION,
    "probabilidade" INTEGER,
    "dataFechamento" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "responsavelId" TEXT,
    "etapaId" TEXT NOT NULL,

    CONSTRAINT "oportunidades_pkey" PRIMARY KEY ("id")
);

-- Tabela de histórico de oportunidades
CREATE TABLE "historico_oportunidades" (
    "id" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "valorAnterior" TEXT,
    "valorNovo" TEXT,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oportunidadeId" TEXT NOT NULL,
    "usuarioId" TEXT,

    CONSTRAINT "historico_oportunidades_pkey" PRIMARY KEY ("id")
);

-- Tabela de configurações
CREATE TABLE "configuracoes" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("id")
);

-- Tabela de chaves de API
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimoUso" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "permissoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- Tabela de configurações de webhook
CREATE TABLE "webhook_configs" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "eventos" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "headers" TEXT,
    "timeout" INTEGER NOT NULL DEFAULT 30,
    "retries" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id")
);

-- Tabela de logs de API
CREATE TABLE "api_logs" (
    "id" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "payload" TEXT,
    "response" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "apiKeyId" TEXT,

    CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);

-- Tabela de logs de webhook
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "tentativa" INTEGER NOT NULL DEFAULT 1,
    "sucesso" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "webhookConfigId" TEXT NOT NULL,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- Criar índices únicos
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "usuarios_colaboradorId_key" ON "usuarios"("colaboradorId");
CREATE UNIQUE INDEX "permissoes_nome_key" ON "permissoes"("nome");
CREATE UNIQUE INDEX "perfis_nome_key" ON "perfis"("nome");
CREATE UNIQUE INDEX "colaboradores_email_key" ON "colaboradores"("email");
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");
CREATE UNIQUE INDEX "configuracoes_chave_key" ON "configuracoes"("chave");
CREATE UNIQUE INDEX "api_keys_chave_key" ON "api_keys"("chave");

-- Adicionar foreign keys
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "grupos_hierarquicos" ADD CONSTRAINT "grupos_hierarquicos_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "grupos_hierarquicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "perfil_permissao" ADD CONSTRAINT "perfil_permissao_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "perfil_permissao" ADD CONSTRAINT "perfil_permissao_permissaoId_fkey" FOREIGN KEY ("permissaoId") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfis"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_grupoHierarquicoId_fkey" FOREIGN KEY ("grupoHierarquicoId") REFERENCES "grupos_hierarquicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_grupoHierarquicoId_fkey" FOREIGN KEY ("grupoHierarquicoId") REFERENCES "grupos_hierarquicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "colaboradores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "oportunidades" ADD CONSTRAINT "oportunidades_etapaId_fkey" FOREIGN KEY ("etapaId") REFERENCES "etapas_pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "historico_oportunidades" ADD CONSTRAINT "historico_oportunidades_oportunidadeId_fkey" FOREIGN KEY ("oportunidadeId") REFERENCES "oportunidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "historico_oportunidades" ADD CONSTRAINT "historico_oportunidades_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_webhookConfigId_fkey" FOREIGN KEY ("webhookConfigId") REFERENCES "webhook_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Inserir dados iniciais

-- Configurações do sistema
INSERT INTO "configuracoes" ("id", "chave", "valor", "descricao", "updatedAt") VALUES
('conf_001', 'sistema_nome', 'Garapasys CRM', 'Nome do sistema', CURRENT_TIMESTAMP),
('conf_002', 'projeto_titulo', 'Sistema de Gestão CRM/ERP', 'Título do projeto', CURRENT_TIMESTAMP),
('conf_003', 'empresa_nome', 'Garapasys', 'Nome da empresa', CURRENT_TIMESTAMP),
('conf_004', 'versao_sistema', '1.0.0', 'Versão atual do sistema', CURRENT_TIMESTAMP);

-- Permissões básicas
INSERT INTO "permissoes" ("id", "nome", "descricao", "recurso", "acao", "updatedAt") VALUES
-- Usuários
('perm_001', 'usuarios_criar', 'Criar usuários', 'usuarios', 'criar', CURRENT_TIMESTAMP),
('perm_002', 'usuarios_ler', 'Visualizar usuários', 'usuarios', 'ler', CURRENT_TIMESTAMP),
('perm_003', 'usuarios_editar', 'Editar usuários', 'usuarios', 'editar', CURRENT_TIMESTAMP),
('perm_004', 'usuarios_excluir', 'Excluir usuários', 'usuarios', 'excluir', CURRENT_TIMESTAMP),
-- Clientes
('perm_005', 'clientes_criar', 'Criar clientes', 'clientes', 'criar', CURRENT_TIMESTAMP),
('perm_006', 'clientes_ler', 'Visualizar clientes', 'clientes', 'ler', CURRENT_TIMESTAMP),
('perm_007', 'clientes_editar', 'Editar clientes', 'clientes', 'editar', CURRENT_TIMESTAMP),
('perm_008', 'clientes_excluir', 'Excluir clientes', 'clientes', 'excluir', CURRENT_TIMESTAMP),
-- Colaboradores
('perm_009', 'colaboradores_criar', 'Criar colaboradores', 'colaboradores', 'criar', CURRENT_TIMESTAMP),
('perm_010', 'colaboradores_ler', 'Visualizar colaboradores', 'colaboradores', 'ler', CURRENT_TIMESTAMP),
('perm_011', 'colaboradores_editar', 'Editar colaboradores', 'colaboradores', 'editar', CURRENT_TIMESTAMP),
('perm_012', 'colaboradores_excluir', 'Excluir colaboradores', 'colaboradores', 'excluir', CURRENT_TIMESTAMP),
-- Oportunidades
('perm_013', 'oportunidades_criar', 'Criar oportunidades', 'oportunidades', 'criar', CURRENT_TIMESTAMP),
('perm_014', 'oportunidades_ler', 'Visualizar oportunidades', 'oportunidades', 'ler', CURRENT_TIMESTAMP),
('perm_015', 'oportunidades_editar', 'Editar oportunidades', 'oportunidades', 'editar', CURRENT_TIMESTAMP),
('perm_016', 'oportunidades_excluir', 'Excluir oportunidades', 'oportunidades', 'excluir', CURRENT_TIMESTAMP),
-- Configurações
('perm_017', 'configuracoes_ler', 'Visualizar configurações', 'configuracoes', 'ler', CURRENT_TIMESTAMP),
('perm_018', 'configuracoes_editar', 'Editar configurações', 'configuracoes', 'editar', CURRENT_TIMESTAMP),
-- Perfis
('perm_019', 'perfis_criar', 'Criar perfis', 'perfis', 'criar', CURRENT_TIMESTAMP),
('perm_020', 'perfis_ler', 'Visualizar perfis', 'perfis', 'ler', CURRENT_TIMESTAMP),
('perm_021', 'perfis_editar', 'Editar perfis', 'perfis', 'editar', CURRENT_TIMESTAMP),
('perm_022', 'perfis_excluir', 'Excluir perfis', 'perfis', 'excluir', CURRENT_TIMESTAMP),
-- Permissões
('perm_023', 'permissoes_criar', 'Criar permissões', 'permissoes', 'criar', CURRENT_TIMESTAMP),
('perm_024', 'permissoes_ler', 'Visualizar permissões', 'permissoes', 'ler', CURRENT_TIMESTAMP),
('perm_025', 'permissoes_editar', 'Editar permissões', 'permissoes', 'editar', CURRENT_TIMESTAMP),
('perm_026', 'permissoes_excluir', 'Excluir permissões', 'permissoes', 'excluir', CURRENT_TIMESTAMP),
-- Grupos Hierárquicos
('perm_027', 'grupos_criar', 'Criar grupos hierárquicos', 'grupos', 'criar', CURRENT_TIMESTAMP),
('perm_028', 'grupos_ler', 'Visualizar grupos hierárquicos', 'grupos', 'ler', CURRENT_TIMESTAMP),
('perm_029', 'grupos_editar', 'Editar grupos hierárquicos', 'grupos', 'editar', CURRENT_TIMESTAMP),
('perm_030', 'grupos_excluir', 'Excluir grupos hierárquicos', 'grupos', 'excluir', CURRENT_TIMESTAMP),
-- Sistema (Administração)
('perm_031', 'sistema_administrar', 'Administrar sistema', 'sistema', 'administrar', CURRENT_TIMESTAMP);

-- Perfis básicos
INSERT INTO "perfis" ("id", "nome", "descricao", "updatedAt") VALUES
('perfil_001', 'Administrador', 'Acesso total ao sistema', CURRENT_TIMESTAMP),
('perfil_002', 'Gerente', 'Acesso de gerenciamento', CURRENT_TIMESTAMP),
('perfil_003', 'Vendedor', 'Acesso para vendas', CURRENT_TIMESTAMP),
('perfil_004', 'Usuário', 'Acesso básico', CURRENT_TIMESTAMP);

-- Associar todas as permissões ao perfil Administrador
INSERT INTO "perfil_permissao" ("perfilId", "permissaoId") VALUES
-- Permissões de usuários
('perfil_001', 'perm_001'),
('perfil_001', 'perm_002'),
('perfil_001', 'perm_003'),
('perfil_001', 'perm_004'),
-- Permissões de clientes
('perfil_001', 'perm_005'),
('perfil_001', 'perm_006'),
('perfil_001', 'perm_007'),
('perfil_001', 'perm_008'),
-- Permissões de colaboradores
('perfil_001', 'perm_009'),
('perfil_001', 'perm_010'),
('perfil_001', 'perm_011'),
('perfil_001', 'perm_012'),
-- Permissões de oportunidades
('perfil_001', 'perm_013'),
('perfil_001', 'perm_014'),
('perfil_001', 'perm_015'),
('perfil_001', 'perm_016'),
-- Permissões de configurações
('perfil_001', 'perm_017'),
('perfil_001', 'perm_018'),
-- Permissões de perfis
('perfil_001', 'perm_019'),
('perfil_001', 'perm_020'),
('perfil_001', 'perm_021'),
('perfil_001', 'perm_022'),
-- Permissões de permissões
('perfil_001', 'perm_023'),
('perfil_001', 'perm_024'),
('perfil_001', 'perm_025'),
('perfil_001', 'perm_026'),
-- Permissões de grupos hierárquicos
('perfil_001', 'perm_027'),
('perfil_001', 'perm_028'),
('perfil_001', 'perm_029'),
('perfil_001', 'perm_030'),
-- Permissão de administração do sistema
('perfil_001', 'perm_031');

-- Etapas do pipeline padrão
INSERT INTO "etapas_pipeline" ("id", "nome", "descricao", "ordem", "cor", "updatedAt") VALUES
('etapa_001', 'Prospecção', 'Identificação de leads', 1, '#3B82F6', CURRENT_TIMESTAMP),
('etapa_002', 'Qualificação', 'Qualificação do lead', 2, '#F59E0B', CURRENT_TIMESTAMP),
('etapa_003', 'Proposta', 'Elaboração de proposta', 3, '#8B5CF6', CURRENT_TIMESTAMP),
('etapa_004', 'Negociação', 'Negociação de termos', 4, '#EF4444', CURRENT_TIMESTAMP),
('etapa_005', 'Fechamento', 'Fechamento do negócio', 5, '#10B981', CURRENT_TIMESTAMP);

-- Colaborador administrador
INSERT INTO "colaboradores" ("id", "nome", "email", "cargo", "dataAdmissao", "perfilId", "updatedAt") VALUES
('colab_001', 'Administrador do Sistema', 'admin@admin.com', 'Administrador', CURRENT_TIMESTAMP, 'perfil_001', CURRENT_TIMESTAMP);

-- Usuário administrador
INSERT INTO "usuarios" ("id", "email", "senha", "nome", "colaboradorId", "updatedAt") VALUES
('user_001', 'admin@garapasystem.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador', 'colab_001', CURRENT_TIMESTAMP);

-- Dados de exemplo

-- Grupo hierárquico exemplo
INSERT INTO "grupos_hierarquicos" ("id", "nome", "descricao", "updatedAt") VALUES
('grupo_001', 'Vendas', 'Departamento de Vendas', CURRENT_TIMESTAMP),
('grupo_002', 'Marketing', 'Departamento de Marketing', CURRENT_TIMESTAMP);

-- Cliente exemplo
INSERT INTO "clientes" ("id", "nome", "email", "telefone", "tipo", "status", "cidade", "estado", "updatedAt") VALUES
('cliente_001', 'João Silva', 'joao@exemplo.com', '(11) 99999-9999', 'PESSOA_FISICA', 'LEAD', 'São Paulo', 'SP', CURRENT_TIMESTAMP),
('cliente_002', 'Empresa ABC Ltda', 'contato@empresaabc.com', '(11) 88888-8888', 'PESSOA_JURIDICA', 'CLIENTE', 'Rio de Janeiro', 'RJ', CURRENT_TIMESTAMP);

-- Oportunidade exemplo
INSERT INTO "oportunidades" ("id", "titulo", "descricao", "valor", "probabilidade", "clienteId", "responsavelId", "etapaId", "updatedAt") VALUES
('oport_001', 'Venda de Sistema CRM', 'Implementação de sistema CRM para cliente', 50000.00, 75, 'cliente_002', 'colab_001', 'etapa_003', CURRENT_TIMESTAMP);
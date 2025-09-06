-- Dados exportados automaticamente

-- Permissões
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb03s0000o090k117jsas', 'dashboard_ler', 'Visualizar dashboard', 'dashboard', 'ler', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb0480001o090nst2bdw5', 'clientes_criar', 'Criar clientes', 'clientes', 'criar', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04b0005o090qjlh27b8', 'permissoes_criar', 'Criar permissões', 'permissoes', 'criar', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04b0004o0909x6n1mh0', 'clientes_ler', 'Visualizar clientes', 'clientes', 'ler', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04e000co090xbwi2320', 'sistema_administrar', 'Administrar sistema', 'sistema', 'administrar', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04c0006o090dif1hitb', 'grupos_ler', 'Visualizar grupos hierárquicos', 'grupos', 'ler', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04b0003o090uktoz2dz', 'colaboradores_ler', 'Visualizar colaboradores', 'colaboradores', 'ler', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04c0008o090ua522bv9', 'usuarios_criar', 'Criar usuários', 'usuarios', 'criar', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04d0009o090revn56db', 'permissoes_ler', 'Visualizar permissões', 'permissoes', 'ler', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04d000ao0906wxm6u0u', 'grupos_criar', 'Criar grupos hierárquicos', 'grupos', 'criar', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04b0002o09051q98xt6', 'perfis_criar', 'Criar perfis', 'perfis', 'criar', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04c0007o090pnwgvwbz', 'perfis_ler', 'Visualizar perfis', 'perfis', 'ler', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04d000bo090u1sss96d', 'colaboradores_criar', 'Criar colaboradores', 'colaboradores', 'criar', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Permissao" ("id", "nome", "descricao", "recurso", "acao", "createdAt", "updatedAt") VALUES ('cmf5yb04f000do090k48cq4u7', 'usuarios_ler', 'Visualizar usuários', 'usuarios', 'ler', '2025-09-04T22:01:36.328Z', '2025-09-04T22:01:36.328Z') ON CONFLICT ("id") DO NOTHING;

-- Perfis
INSERT INTO "Perfil" ("id", "nome", "descricao", "ativo", "createdAt", "updatedAt") VALUES ('cmf5yb04n000eo090mw1acop6', 'Administrador', 'Acesso total ao sistema', true, '2025-09-04T22:01:36.359Z', '2025-09-04T22:01:36.359Z') ON CONFLICT ("id") DO NOTHING;

-- Grupos Hierárquicos
INSERT INTO "GrupoHierarquico" ("id", "nome", "descricao", "parentId", "ativo", "createdAt", "updatedAt") VALUES ('cmf5yb072000fo0904rxv5peg', 'Administração', 'Grupo administrativo principal', NULL, true, '2025-09-04T22:01:36.446Z', '2025-09-04T22:01:36.446Z') ON CONFLICT ("id") DO NOTHING;

-- Colaboradores
INSERT INTO "Colaborador" ("id", "nome", "email", "telefone", "documento", "cargo", "dataAdmissao", "dataDemissao", "ativo", "perfilId", "grupoHierarquicoId", "createdAt", "updatedAt") VALUES ('cmf5yb077000ho090apuldmmf', 'Administrador do Sistema', 'admin@sistema.com', '(11) 99999-9999', '000.000.000-00', 'Administrador', '2025-09-04T22:01:36.450Z', NULL, true, 'cmf5yb04n000eo090mw1acop6', 'cmf5yb072000fo0904rxv5peg', '2025-09-04T22:01:36.452Z', '2025-09-04T22:01:36.452Z') ON CONFLICT ("id") DO NOTHING;

-- Usuários
INSERT INTO "Usuario" ("id", "email", "senha", "ativo", "colaboradorId", "createdAt", "updatedAt") VALUES ('cmf5yb0a9000jo0908dmdlzjs', 'admin@sistema.com', '$2b$10$PajB6zIO1seCHE1BN9TyEenpP.Ii.3alMdn.h2mAvPebCjilm0Ufq', true, 'cmf5yb077000ho090apuldmmf', '2025-09-04T22:01:36.562Z', '2025-09-04T22:01:36.562Z') ON CONFLICT ("id") DO NOTHING;

-- Perfil Permissões
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb03s0000o090k117jsas', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04b0004o0909x6n1mh0', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb0480001o090nst2bdw5', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04b0003o090uktoz2dz', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04d000bo090u1sss96d', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04c0006o090dif1hitb', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04d000ao0906wxm6u0u', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04c0007o090pnwgvwbz', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04b0002o09051q98xt6', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04d0009o090revn56db', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04b0005o090qjlh27b8', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04f000do090k48cq4u7', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04c0008o090ua522bv9', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "PerfilPermissao" ("id", "perfilId", "permissaoId", "createdAt", "updatedAt") VALUES ('undefined', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb04e000co090xbwi2320', '2025-09-04T22:01:57.325Z', '2025-09-04T22:01:57.325Z') ON CONFLICT ("id") DO NOTHING;

-- Clientes
INSERT INTO "Cliente" ("id", "nome", "email", "telefone", "documento", "endereco", "ativo", "colaboradorId", "createdAt", "updatedAt") VALUES ('cmf5yb0ao000lo090ta24h97y', 'João Silva', 'cliente1@exemplo.com', '(11) 98888-8888', '123.456.789-00', 'Rua das Flores, 123', undefined, NULL, '2025-09-04T22:01:36.576Z', '2025-09-04T22:01:36.576Z') ON CONFLICT ("id") DO NOTHING;
INSERT INTO "Cliente" ("id", "nome", "email", "telefone", "documento", "endereco", "ativo", "colaboradorId", "createdAt", "updatedAt") VALUES ('cmf5yb0az000no090fstnh9s3', 'Empresa Exemplo Ltda', 'empresa@exemplo.com', '(11) 3333-3333', '12.345.678/0001-90', 'Av. Paulista, 1000', undefined, NULL, '2025-09-04T22:01:36.587Z', '2025-09-04T22:01:36.587Z') ON CONFLICT ("id") DO NOTHING;


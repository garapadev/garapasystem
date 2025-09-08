--
-- PostgreSQL database dump
--

-- Dumped from database version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)
-- Dumped by pg_dump version 12.22 (Ubuntu 12.22-0ubuntu0.20.04.4)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: api_keys; Type: TABLE DATA; Schema: public; Owner: crm_user
--

INSERT INTO public.api_keys VALUES ('cmf7d3n1k0004o0rkhmrqsm0t', 'Teste Local Correto', '9aa5d4e14da6d079746a490e332a8a2ff36d92ce2de91f03d0c655c2703a3f89', true, NULL, NULL, NULL, '2025-09-05 21:43:33.224', '2025-09-05 21:43:33.224');
INSERT INTO public.api_keys VALUES ('cmf86hgy20000o07cugu8zp3e', 'Test API Key', '6f3f81326208d72f2490a16f9943f8ba1ec95db2423e82525a3fde4764c677f7', true, NULL, NULL, '["read","write"]', '2025-09-06 11:26:07.371', '2025-09-06 11:26:07.371');
INSERT INTO public.api_keys VALUES ('cmf86ig150001o07cw0395eps', 'Admin API Key', '8e1900eccbb7d773c62c32616c23ef8044d7592a1ec2c0df25b4c9e0b0d129aa', true, NULL, NULL, '["admin"]', '2025-09-06 11:26:52.841', '2025-09-06 11:26:52.841');
INSERT INTO public.api_keys VALUES ('cmf86q7890000o04ooeokfvsp', 'Test API Key', '6abd9aecae77f004ed98b116f4bcc3a7e7db80a818a3004adc53ad814af077c1', true, NULL, NULL, '["admin"]', '2025-09-06 11:32:54.681', '2025-09-06 11:32:54.681');
INSERT INTO public.api_keys VALUES ('cmf86qxm90001o04o7cr7kfiz', 'Limited API Key', '445119dd3f35255f8e6ef6b1241e2ebbc03efde9550b981edd17efde9c5690e5', true, NULL, NULL, '["read"]', '2025-09-06 11:33:28.881', '2025-09-06 11:33:28.881');


--
-- Data for Name: api_logs; Type: TABLE DATA; Schema: public; Owner: crm_user
--



--
-- Data for Name: grupos_hierarquicos; Type: TABLE DATA; Schema: public; Owner: crm_user
--

INSERT INTO public.grupos_hierarquicos VALUES ('cmf5yb072000fo0904rxv5peg', 'Administração', 'Grupo administrativo principal', true, '2025-09-04 22:01:36.446', '2025-09-04 22:01:36.446', NULL);


--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: crm_user
--

INSERT INTO public.clientes VALUES ('cmf5yb0ao000lo090ta24h97y', 'João Silva', 'cliente1@exemplo.com', '(11) 98888-8888', '123.456.789-00', 'PESSOA_FISICA', 'CLIENTE', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', NULL, 50000, '2025-09-04 22:01:36.576', '2025-09-04 22:01:36.576', 'cmf5yb072000fo0904rxv5peg');
INSERT INTO public.clientes VALUES ('cmf5yb0az000no090fstnh9s3', 'Empresa Exemplo Ltda', 'empresa@exemplo.com', '(11) 3333-3333', '12.345.678/0001-90', 'PESSOA_JURIDICA', 'PROSPECT', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100', NULL, 200000, '2025-09-04 22:01:36.587', '2025-09-04 22:01:36.587', 'cmf5yb072000fo0904rxv5peg');


--
-- Data for Name: perfis; Type: TABLE DATA; Schema: public; Owner: crm_user
--

INSERT INTO public.perfis VALUES ('cmf5yb04n000eo090mw1acop6', 'Administrador', 'Acesso total ao sistema', true, '2025-09-04 22:01:36.359', '2025-09-04 22:01:36.359');


--
-- Data for Name: colaboradores; Type: TABLE DATA; Schema: public; Owner: crm_user
--

INSERT INTO public.colaboradores VALUES ('cmf5yb077000ho090apuldmmf', 'Administrador do Sistema', 'admin@sistema.com', '(11) 99999-9999', '000.000.000-00', 'Administrador', '2025-09-04 22:01:36.45', true, '2025-09-04 22:01:36.452', '2025-09-04 22:01:36.452', 'cmf5yb04n000eo090mw1acop6', 'cmf5yb072000fo0904rxv5peg');


--
-- Data for Name: configuracoes; Type: TABLE DATA; Schema: public; Owner: crm_user
--



--
-- Data for Name: etapas_pipeline; Type: TABLE DATA; Schema: public; Owner: crm_user
--



--
-- Data for Name: oportunidades; Type: TABLE DATA; Schema: public; Owner: crm_user
--



--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: crm_user
--

INSERT INTO public.usuarios VALUES ('cmf5yb0a9000jo0908dmdlzjs', 'admin@garapasystem.com', '$2b$10$nHG28cvD2xcMig2w5dHShOmjbiucd7sJuGbcis0MhrCPmtTZDxpsa', 'Administrador do Sistema', true, '2025-09-04 22:01:36.562', '2025-09-04 22:01:36.562', 'cmf5yb077000ho090apuldmmf');


--
-- Data for Name: historico_oportunidades; Type: TABLE DATA; Schema: public; Owner: crm_user
--



--
-- Data for Name: permissoes; Type: TABLE DATA; Schema: public; Owner: crm_user
--

INSERT INTO public.permissoes VALUES ('cmf5yb03s0000o090k117jsas', 'dashboard_ler', 'Visualizar dashboard', 'dashboard', 'ler', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb0480001o090nst2bdw5', 'clientes_criar', 'Criar clientes', 'clientes', 'criar', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04b0005o090qjlh27b8', 'permissoes_criar', 'Criar permissões', 'permissoes', 'criar', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04b0004o0909x6n1mh0', 'clientes_ler', 'Visualizar clientes', 'clientes', 'ler', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04e000co090xbwi2320', 'sistema_administrar', 'Administrar sistema', 'sistema', 'administrar', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04c0006o090dif1hitb', 'grupos_ler', 'Visualizar grupos hierárquicos', 'grupos', 'ler', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04b0003o090uktoz2dz', 'colaboradores_ler', 'Visualizar colaboradores', 'colaboradores', 'ler', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04c0008o090ua522bv9', 'usuarios_criar', 'Criar usuários', 'usuarios', 'criar', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04d0009o090revn56db', 'permissoes_ler', 'Visualizar permissões', 'permissoes', 'ler', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04d000ao0906wxm6u0u', 'grupos_criar', 'Criar grupos hierárquicos', 'grupos', 'criar', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04b0002o09051q98xt6', 'perfis_criar', 'Criar perfis', 'perfis', 'criar', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04c0007o090pnwgvwbz', 'perfis_ler', 'Visualizar perfis', 'perfis', 'ler', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04d000bo090u1sss96d', 'colaboradores_criar', 'Criar colaboradores', 'colaboradores', 'criar', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');
INSERT INTO public.permissoes VALUES ('cmf5yb04f000do090k48cq4u7', 'usuarios_ler', 'Visualizar usuários', 'usuarios', 'ler', '2025-09-04 22:01:36.328', '2025-09-04 22:01:36.328');


--
-- Data for Name: perfil_permissao; Type: TABLE DATA; Schema: public; Owner: crm_user
--

INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb03s0000o090k117jsas');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04b0004o0909x6n1mh0');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb0480001o090nst2bdw5');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04b0003o090uktoz2dz');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04d000bo090u1sss96d');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04c0006o090dif1hitb');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04d000ao0906wxm6u0u');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04c0007o090pnwgvwbz');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04b0002o09051q98xt6');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04d0009o090revn56db');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04b0005o090qjlh27b8');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04f000do090k48cq4u7');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04c0008o090ua522bv9');
INSERT INTO public.perfil_permissao VALUES ('cmf5yb04n000eo090mw1acop6', 'cmf5yb04e000co090xbwi2320');


--
-- Data for Name: webhook_configs; Type: TABLE DATA; Schema: public; Owner: crm_user
--



--
-- Data for Name: webhook_logs; Type: TABLE DATA; Schema: public; Owner: crm_user
--



--
-- PostgreSQL database dump complete
--


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
-- Data for Name: grupos_hierarquicos; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.grupos_hierarquicos DISABLE TRIGGER ALL;

INSERT INTO public.grupos_hierarquicos VALUES ('cmf5cho8s000fo0u4j8v2c703', 'Administração', 'Grupo administrativo principal', true, '2025-09-04 11:50:55.996', '2025-09-04 11:50:55.996', NULL);


ALTER TABLE public.grupos_hierarquicos ENABLE TRIGGER ALL;

--
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.clientes DISABLE TRIGGER ALL;

INSERT INTO public.clientes VALUES ('cmf5choc9000lo0u46mygz8os', 'João Silva', 'cliente1@exemplo.com', '(11) 98888-8888', '123.456.789-00', 'PESSOA_FISICA', 'CLIENTE', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', NULL, 50000, '2025-09-04 11:50:56.121', '2025-09-04 11:50:56.121', 'cmf5cho8s000fo0u4j8v2c703');
INSERT INTO public.clientes VALUES ('cmf5choch000no0u4azmrdegz', 'Empresa Exemplo Ltda', 'empresa@exemplo.com', '(11) 3333-3333', '12.345.678/0001-90', 'PESSOA_JURIDICA', 'PROSPECT', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310-100', NULL, 200000, '2025-09-04 11:50:56.129', '2025-09-04 11:50:56.129', 'cmf5cho8s000fo0u4j8v2c703');


ALTER TABLE public.clientes ENABLE TRIGGER ALL;

--
-- Data for Name: perfis; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.perfis DISABLE TRIGGER ALL;

INSERT INTO public.perfis VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'Administrador', 'Acesso total ao sistema', true, '2025-09-04 11:50:55.919', '2025-09-04 11:50:55.919');


ALTER TABLE public.perfis ENABLE TRIGGER ALL;

--
-- Data for Name: colaboradores; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.colaboradores DISABLE TRIGGER ALL;

INSERT INTO public.colaboradores VALUES ('cmf5cho8x000ho0u42iuwf8ll', 'Administrador do Sistema', 'admin@sistema.com', '(11) 99999-9999', '000.000.000-00', 'Administrador', '2025-09-04 11:50:56', true, '2025-09-04 11:50:56.001', '2025-09-04 11:50:56.001', 'cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho8s000fo0u4j8v2c703');


ALTER TABLE public.colaboradores ENABLE TRIGGER ALL;

--
-- Data for Name: permissoes; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.permissoes DISABLE TRIGGER ALL;

INSERT INTO public.permissoes VALUES ('cmf5cho5n0000o0u4v1rzklxt', 'clientes_ler', 'Visualizar clientes', 'clientes', 'ler', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho5w0001o0u47g830ny7', 'sistema_administrar', 'Administrar sistema', 'sistema', 'administrar', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho5x0002o0u4i4chegnj', 'dashboard_ler', 'Visualizar dashboard', 'dashboard', 'ler', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho5z0003o0u45zxingzz', 'clientes_criar', 'Criar clientes', 'clientes', 'criar', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho5z0004o0u4q7gq915o', 'colaboradores_criar', 'Criar colaboradores', 'colaboradores', 'criar', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho610005o0u4b9wo7i7v', 'permissoes_criar', 'Criar permissões', 'permissoes', 'criar', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho640006o0u4g1zlt2z9', 'grupos_ler', 'Visualizar grupos hierárquicos', 'grupos', 'ler', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho640007o0u4wt16sbe2', 'grupos_criar', 'Criar grupos hierárquicos', 'grupos', 'criar', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho640008o0u4yx7qcvcp', 'perfis_criar', 'Criar perfis', 'perfis', 'criar', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho68000ao0u4ebrj9zvt', 'permissoes_ler', 'Visualizar permissões', 'permissoes', 'ler', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho680009o0u4hnrlf57z', 'usuarios_ler', 'Visualizar usuários', 'usuarios', 'ler', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho6a000bo0u4wbm7a3wk', 'usuarios_criar', 'Criar usuários', 'usuarios', 'criar', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho6b000co0u47y6jbzay', 'colaboradores_ler', 'Visualizar colaboradores', 'colaboradores', 'ler', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');
INSERT INTO public.permissoes VALUES ('cmf5cho6f000do0u4zmeto6sk', 'perfis_ler', 'Visualizar perfis', 'perfis', 'ler', '2025-09-04 11:50:55.884', '2025-09-04 11:50:55.884');


ALTER TABLE public.permissoes ENABLE TRIGGER ALL;

--
-- Data for Name: perfil_permissao; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.perfil_permissao DISABLE TRIGGER ALL;

INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho5x0002o0u4i4chegnj');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho5n0000o0u4v1rzklxt');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho5z0003o0u45zxingzz');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho6b000co0u47y6jbzay');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho5z0004o0u4q7gq915o');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho640006o0u4g1zlt2z9');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho640007o0u4wt16sbe2');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho6f000do0u4zmeto6sk');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho640008o0u4yx7qcvcp');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho68000ao0u4ebrj9zvt');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho610005o0u4b9wo7i7v');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho680009o0u4hnrlf57z');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho6a000bo0u4wbm7a3wk');
INSERT INTO public.perfil_permissao VALUES ('cmf5cho6n000eo0u4ptuqmwey', 'cmf5cho5w0001o0u47g830ny7');


ALTER TABLE public.perfil_permissao ENABLE TRIGGER ALL;

--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.usuarios DISABLE TRIGGER ALL;

INSERT INTO public.usuarios VALUES ('cmf5choc1000jo0u46oilc31a', 'admin@sistema.com', '$2b$10$NHs71QBwJWpp/jYVVjJkyuDCYWxlt0zvElHK5eK5puT6RyUeGTc5m', 'Administrador do Sistema', true, '2025-09-04 11:50:56.114', '2025-09-04 11:50:56.114', 'cmf5cho8x000ho0u42iuwf8ll');


ALTER TABLE public.usuarios ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--


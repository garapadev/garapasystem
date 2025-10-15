# GarapaSystem

Versão: 0.3.38.25

Sistema integrado de gestão empresarial construído com Next.js 15, TypeScript e Prisma, cobrindo CRM, Financeiro, Compras, Estoque, Helpdesk, Webmail, Tarefas e integrações (WhatsApp/GAZAPI). Operação em produção com PM2 e suporte a workers dedicados.

## Visão Geral

- Frontend e API em `Next.js` com App Router.
- Banco de dados PostgreSQL via `Prisma`.
- Autenticação e autorização com `NextAuth.js` e permissões por recursos.
- Processos em produção gerenciados por `PM2` (app + workers).

## Módulos do Sistema

- Clientes (CRM): cadastro, edição, histórico, integrações com tarefas, orçamentos e ordens de serviço.
- Negócios: etapas e oportunidades de venda.
- Orçamentos: criação, aprovação e geração automática.
- Ordens de Serviço: emissão, aprovação e controle de execução.
- Compras: requisições, cotações, ordens de compra e recebimento.
- Estoque: controle de produtos, entradas/saídas e inventário.
- Financeiro: contas bancárias e plano de contas (base para contas a pagar/receber e fluxo financeiro).
- Tarefas: criação/recorrência, calendário, anexos, comentários e dashboard.
- Helpdesk: tickets, departamentos, notificações e worker dedicado.
- Webmail: cliente de e-mail com sincronização (worker dedicado).
- Tombamento: gestão de movimentações e ativos.
- Laudos Técnicos: emissão e controle de laudos.
- Configurações: empresa, colaboradores, usuários, perfis, permissões, chaves API, grupos hierárquicos, webhooks, WhatsApp API.
- GAZAPI (WhatsApp API): endpoints REST para integração com WhatsApp (em evolução).
- Swagger: documentação e visão geral de endpoints.

## Estrutura de Diretórios (resumo)

```
src/
  app/
    api/                 # Endpoints REST (auth, clientes, compras, financeiro, helpdesk, webmail, etc.)
    clientes/            # Páginas do CRM
    compras/             # Páginas de compras
    estoque/             # Páginas de estoque
    financeiro/          # Páginas do financeiro
    helpdesk/            # Páginas de helpdesk
    laudos-tecnicos/     # Páginas de laudos
    negocios/            # Páginas de negócios
    orcamentos/          # Páginas de orçamentos
    ordens-servico/      # Páginas de O.S.
    tasks/               # Páginas de tarefas
    tombamento/          # Páginas de tombamento
    webmail/             # Páginas de webmail
    swagger/             # Páginas/documentação Swagger
  components/            # Componentes UI/layout
  hooks/                 # Hooks (ex.: useModulos)
  lib/                   # Configurações/utilitários (auth, db, etc.)
  types/                 # Tipos TypeScript
scripts/                 # Automação, PM2 e utilitários
prisma/                  # Schema e migrações
```

## Tecnologias

- Next.js 15, React 18, TypeScript 5
- Tailwind CSS, shadcn/ui, Radix UI, Lucide React
- Prisma, PostgreSQL
- NextAuth.js
- PM2 (produção), Docker (opcional)

## Processos PM2

- garapasystem: servidor principal Next.js
  - script: `./scripts/start-with-build.sh` (pre-start garante build automático)
- helpdesk-worker: processamento consolidado de tickets e emails
- webmail-worker: sincronização de emails e tarefas de webmail

Arquivo de configuração: `ecosystem.config.js` (raiz do projeto).

## Permissões e Módulos

- Permissões por recurso e ação (`src/app/api/permissoes`).
- Ativação de módulos via `src/app/api/modulos` (ex.: `active`, `batch`).
- Middlewares e hooks garantem exibição condicional no layout (ex.: Sidebar por módulo/permissão).

## Instalação

Pré-requisitos:
- Node.js 18+
- PostgreSQL 13+

Passos:
```
npm install
cp .env.example .env
# configure variáveis (.env / .env.local)

# Banco de dados
npm run db:push
npm run db:migrate
npm run db:seed
```

## Execução

- Desenvolvimento:
```
npm run dev
```

- Produção (PM2):
```
npm run build
npm run pm2:start
npm run pm2:status
```

## Variáveis de Ambiente (essenciais)

```
DATABASE_URL="postgresql://user:pass@localhost:5432/garapasystem"
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="https://seu-dominio.com"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-app"
```

## Scripts Úteis

- `npm run pm2:start` / `pm2:restart` / `pm2:status` / `pm2:logs`
- `npm run db:push` / `db:migrate` / `db:seed`
- `scripts/list-active-modules.js` (diagnóstico de módulos ativos)

## Contribuição

1. Crie uma branch: `git checkout -b feature/minha-feature`
2. Commit: `git commit -m "feat: minha feature"`
3. Push: `git push origin feature/minha-feature`
4. Abra um Pull Request

Padrões:
- TypeScript, ESLint, Prettier, Conventional Commits

## Licença

Projeto privado e proprietário.

## Suporte

- Consulte `docs/` e logs em `logs/`
- Comandos PM2 para diagnóstico
- Issues via sistema interno
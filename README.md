# 🚀 GarapaSystem

**Versão:** 0.2.36.7

Sistema integrado de gestão empresarial desenvolvido com Next.js 15, TypeScript e Prisma, oferecendo funcionalidades completas para gerenciamento de clientes, tarefas, helpdesk, webmail e integração WhatsApp.

## Modules do Sistema

- **Gestão de Clientes (CRM)**: Cadastro, histórico de interações, pipeline de vendas, orçamentos e ordens de serviço.
- **Financeiro**: Gestão de contas a pagar e receber, fluxo de caixa, conciliação bancária e relatórios financeiros.
- **Estoque**: Controle de entradas e saídas, gestão de produtos, múltiplos depósitos e inventário.
- **Compras**: Requisições de compra, cotações, ordens de compra e recebimento de mercadorias.
- **Vendas**: Orçamentos, pedidos de venda, faturamento, emissão de notas fiscais e comissões.
- **Helpdesk**: Sistema de tickets, automação, base de conhecimento e relatórios de atendimento.
- **Tarefas**: Criação e gerenciamento de tarefas, calendário, recorrência e integração com outros módulos.
- **Webmail**: Cliente de e-mail corporativo integrado ao sistema.
- **Tombamento**: Rastreamento e gestão de ativos fixos da empresa.
- **Laudos Técnicos**: Criação e gerenciamento de laudos técnicos para serviços prestados.
- **Configurações**: Administração de usuários, perfis, permissões, e configurações gerais do sistema.

## ✨ Funcionalidades Principais

### 📋 Sistema de Tarefas
- ✅ Criação e gerenciamento de tarefas com calendário integrado
- ✅ Sistema de comentários e anexos
- ✅ Recorrência de tarefas automatizada
- ✅ Dashboard com visualizações avançadas
- ✅ Integração com sistema de permissões

### 🎫 Helpdesk Avançado
- ✅ Sistema completo de tickets com automação
- ✅ Gerenciamento de departamentos e prioridades
- ✅ Worker dedicado para processamento em background
- ✅ Logs detalhados de atividades
- ✅ Interface moderna e responsiva

### 👥 Gestão de Clientes (CRM)
- ✅ Cadastro completo com histórico de interações
- ✅ Pipeline de vendas integrado
- ✅ Integração com sistema de tarefas e helpdesk
- ✅ Endereços e informações de contato detalhadas
- ✅ Sistema de orçamentos e ordens de serviço

### 📧 Webmail Corporativo
- ✅ Interface de webmail moderna e responsiva
- ✅ Composição rica de emails com anexos
- ✅ Configuração de contas de email por usuário
- ✅ Permissões granulares de acesso
- ✅ Worker dedicado para sincronização

### 📱 GAZAPI - WhatsApp Business API
- 🚧 API REST para integração WhatsApp (em desenvolvimento)
- 🚧 Gerenciamento de sessões múltiplas
- 🚧 Envio de mensagens (texto, mídia, documentos)
- 🚧 Worker dedicado para processamento WhatsApp

### 👤 Gestão de Usuários e Permissões
- ✅ Sistema de autenticação robusto (NextAuth.js)
- ✅ Perfis e permissões granulares
- ✅ Hierarquia de colaboradores
- ✅ Controle de acesso baseado em recursos

### 🔧 Administração Avançada
- ✅ Configurações do sistema centralizadas
- ✅ Gerenciamento de usuários e permissões
- ✅ Logs detalhados do sistema
- ✅ Interface administrativa completa

## 🛠️ Stack Tecnológico

### Frontend Moderno
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática robusta
- **Tailwind CSS** - Estilização utilitária moderna
- **shadcn/ui** - Componentes baseados em Radix UI
- **React Hook Form** - Gerenciamento de formulários
- **Lucide React** - Ícones modernos
- **Zod** - Validação de schemas

### Backend Robusto
- **Node.js** - Runtime JavaScript de alta performance
- **Prisma** - ORM type-safe para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **NextAuth.js** - Autenticação e autorização
- **bcryptjs** - Hash de senhas
- **Nodemailer** - Envio de emails

### Infraestrutura
- **PM2** - Gerenciamento de processos em produção
- **Docker** - Containerização da aplicação
- **WSL Ubuntu 20 LTS** - Ambiente de desenvolvimento

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 13+
- Docker (opcional, para containerização)

### 1. Configuração Inicial

```bash
# Clone o repositório
git clone <repository-url>
cd GarapaSystem

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
nano .env  # Configure suas variáveis
```

### 2. Configuração do Banco de Dados

```bash
# Aplique o schema do banco
npm run db:push

# Execute as migrações
npm run db:migrate

# Popule dados iniciais
npm run db:seed
```

### 3. Execução

#### Desenvolvimento
```bash
npm run dev
```

#### Produção com PM2
```bash
# Build da aplicação
npm run build

# Iniciar com PM2 (modo seguro)
npm run pm2:start

# Verificar status
npm run pm2:status
```

## 🔧 Scripts Disponíveis

### Aplicação
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run lint` - Verificação de código

### PM2 (Produção)
- `npm run pm2:start` - Iniciar com PM2 (seguro)
- `npm run pm2:stop` - Parar processos
- `npm run pm2:restart` - Reiniciar processos
- `npm run pm2:logs` - Visualizar logs
- `npm run pm2:status` - Status dos processos
- `npm run pm2:clean-restart` - Reinicialização completa

### Banco de Dados
- `npm run db:push` - Aplicar schema
- `npm run db:generate` - Gerar cliente Prisma
- `npm run db:migrate` - Executar migrações
- `npm run db:seed` - Dados iniciais
- `npm run db:reset` - Reset completo

## 🏗️ Arquitetura do Sistema

### Estrutura de Diretórios
```
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── api/               # Endpoints da API REST
│   │   │   ├── auth/          # Autenticação
│   │   │   ├── gazapi/        # WhatsApp API
│   │   │   ├── helpdesk/      # Sistema de tickets
│   │   │   ├── tasks/         # Gerenciamento de tarefas
│   │   │   └── webmail/       # API de webmail
│   │   ├── clientes/          # Gestão de clientes (CRM)
│   │   ├── helpdesk/          # Interface de helpdesk
│   │   ├── tasks/             # Sistema de tarefas
│   │   ├── webmail/           # Interface de webmail
│   │   └── admin/             # Painel administrativo
│   ├── components/            # Componentes React reutilizáveis
│   │   ├── ui/               # Componentes base (Radix UI)
│   │   ├── forms/            # Formulários especializados
│   │   └── layout/           # Componentes de layout
│   ├── hooks/                # Custom hooks React
│   ├── lib/                  # Utilitários e configurações
│   │   ├── auth.ts           # Configuração NextAuth
│   │   ├── db.ts             # Cliente Prisma
│   │   └── utils.ts          # Funções utilitárias
│   └── types/                # Definições TypeScript
├── prisma/                   # Schema e migrações
├── docs/                     # Documentação técnica
├── scripts/                  # Scripts de automação
├── grafana/                  # Configurações Grafana
└── public/                   # Arquivos estáticos
```

### Processos PM2

O sistema utiliza múltiplos workers para alta performance:

1. **garapasystem** - Servidor principal Next.js
2. **helpdesk-worker** - Processamento de tickets e emails em background



## 📚 Documentação

### Documentação Técnica
- [📱 GAZAPI - WhatsApp API](docs/gazapi-documentation.md)
- [🔑 Configuração de API Keys](docs/gazapi-api-key.md)
- [📧 Design do Sistema Webmail](docs/webmail-permissions-design.md)
- [📱 Módulo WhatsApp](docs/whatsapp-module-design.md)
- [🔧 Troubleshooting PM2](docs/pm2-troubleshooting.md)
- [🔐 Implementação NextAuth](docs/nextauth-implementation-guide.md)

## 🔒 Segurança

- ✅ Autenticação robusta com NextAuth.js
- ✅ Middleware de segurança para proteção de rotas
- ✅ Validação de permissões granulares
- ✅ Hash seguro de senhas com bcryptjs
- ✅ Sanitização e validação de dados (Zod)
- ✅ Controle de acesso baseado em recursos
- ✅ Logs detalhados do sistema

## 🚀 Deploy e Produção

### Variáveis de Ambiente Essenciais
```bash
# Banco de dados
DATABASE_URL="postgresql://user:pass@localhost:5434/crm_erp"

# Autenticação
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Email (para notificações)
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### Checklist de Deploy
- [ ] Configurar variáveis de ambiente
- [ ] Executar migrações do banco
- [ ] Build da aplicação
- [ ] Configurar PM2 para produção
- [ ] Verificar logs e funcionamento

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Código
- TypeScript obrigatório
- ESLint configurado
- Prettier para formatação
- Conventional Commits
- Testes unitários recomendados

## 📄 Licença

Este projeto é privado e proprietário.

## 📞 Suporte

Para suporte técnico:
- 📖 Consulte a [documentação técnica](docs/)
- 🔍 Verifique os logs em `/logs`
- 🔧 Use os comandos PM2 para diagnóstico
- 🐛 Reporte issues via sistema interno

---

**GarapaSystem v0.2.37.13** - Sistema Integrado de Gestão Empresarial  
Desenvolvido com ❤️ usando Next.js 15, TypeScript e tecnologias modernas.
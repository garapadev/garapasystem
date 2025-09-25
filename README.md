# 🚀 GarapaSystem

**Versão:** 0.2.36.7

Sistema integrado de gestão empresarial desenvolvido com Next.js 15, TypeScript e Prisma, oferecendo funcionalidades completas para gerenciamento de clientes, tarefas, helpdesk, webmail e integração WhatsApp.

## ✨ Funcionalidades Principais

### 📋 Sistema de Tarefas
- ✅ Criação e gerenciamento de tarefas com calendário integrado
- ✅ Sistema de comentários e anexos
- ✅ Recorrência de tarefas automatizada
- ✅ Notificações em tempo real via WebSocket
- ✅ Dashboard com visualizações avançadas

### 🎫 Helpdesk Avançado
- ✅ Sistema completo de tickets com automação
- ✅ Gerenciamento de departamentos e prioridades
- ✅ Sincronização automática com email (IMAP)
- ✅ Worker dedicado para processamento em background
- ✅ Logs detalhados de atividades

### 👥 Gestão de Clientes (CRM)
- ✅ Cadastro completo com histórico de interações
- ✅ Pipeline de vendas integrado
- ✅ Integração com sistema de tarefas e helpdesk
- ✅ Endereços e informações de contato detalhadas

### 📧 Webmail Corporativo
- ✅ Interface de webmail moderna e responsiva
- ✅ Sincronização com múltiplos servidores IMAP
- ✅ Composição rica de emails com anexos
- ✅ Configuração de contas de email por usuário
- ✅ Permissões granulares e worker de sincronização

### 📱 GAZAPI - WhatsApp Business API
- ✅ API REST completa para integração WhatsApp
- ✅ Gerenciamento de sessões múltiplas
- ✅ Envio de mensagens (texto, mídia, documentos, localização)
- ✅ Sistema de webhooks para eventos em tempo real
- ✅ Verificação de números e status de entrega
- ✅ Gerenciamento de grupos e contatos

### 👤 Gestão de Usuários e Permissões
- ✅ Sistema de autenticação robusto (NextAuth.js)
- ✅ Perfis e permissões granulares
- ✅ Hierarquia de colaboradores
- ✅ Grupos hierárquicos organizacionais

### 📊 Observabilidade e Telemetria
- ✅ Stack completo de telemetria (OpenTelemetry)
- ✅ Dashboards Grafana para monitoramento
- ✅ Traces distribuídos com Jaeger
- ✅ Métricas com Prometheus
- ✅ Logs centralizados com Elasticsearch/Kibana

### 🔧 Administração Avançada
- ✅ Configurações do sistema centralizadas
- ✅ Gerenciamento de chaves de API
- ✅ Sistema de webhooks configurável
- ✅ Logs detalhados do sistema
- ✅ Documentação Swagger automática

## 🛠️ Stack Tecnológico

### Frontend Moderno
- **Next.js 15.3.5** - Framework React com App Router
- **TypeScript** - Tipagem estática robusta
- **Tailwind CSS 4** - Estilização utilitária moderna
- **Radix UI** - Componentes acessíveis e customizáveis
- **React Hook Form** - Gerenciamento de formulários
- **Socket.IO Client** - Comunicação em tempo real
- **Lucide React** - Ícones modernos

### Backend Robusto
- **Node.js** - Runtime JavaScript de alta performance
- **Prisma** - ORM type-safe para PostgreSQL
- **PostgreSQL** - Banco de dados relacional
- **NextAuth.js** - Autenticação e autorização
- **Socket.IO** - WebSockets para tempo real
- **Nodemailer** - Envio de emails
- **ImapFlow** - Sincronização IMAP avançada
- **WhatsApp Web.js** - Integração WhatsApp

### Observabilidade
- **OpenTelemetry** - Instrumentação completa
- **Jaeger** - Traces distribuídos
- **Prometheus** - Métricas e alertas
- **Grafana** - Dashboards e visualizações
- **Elasticsearch** - Armazenamento de logs
- **Kibana** - Análise de logs

### Infraestrutura
- **PM2** - Gerenciamento de processos em produção
- **Docker** - Containerização e orquestração
- **Redis** - Cache e sessões
- **Nginx** - Proxy reverso e load balancer

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- PostgreSQL 13+
- Redis 6+ (opcional, mas recomendado)
- Docker e Docker Compose (para telemetria)

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

## 📊 Stack de Telemetria

### Configuração Rápida
```bash
# Configurar variáveis de telemetria
cp .env.telemetry .env

# Validar configuração
./telemetry-stack.sh validate

# Iniciar stack completo
./telemetry-stack.sh start

# Verificar status
./telemetry-stack.sh status
```

### Interfaces de Monitoramento
- **Grafana**: http://localhost:3001 (dashboards)
- **Jaeger**: http://localhost:16686 (traces)
- **Prometheus**: http://localhost:9090 (métricas)
- **Kibana**: http://localhost:5601 (logs)

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
2. **helpdesk-worker** - Processamento de tickets em background
3. **webmail-sync-worker** - Sincronização de emails IMAP

## 📸 Capturas de Tela

### 🏠 Dashboard Principal
![Homepage](screenshots/homepage-2025-09-15T12-59-00-285Z.png)
![Dashboard](screenshots/dashboard-principal-2025-09-06T14-11-55-405Z.png)

### 📋 Sistema de Tarefas
![Tarefas](screenshots/tasks-page-2025-09-15T12-59-09-537Z.png)

### 🎫 Helpdesk
![Helpdesk](screenshots/helpdesk-page-2025-09-15T12-59-22-092Z.png)

### 👥 CRM - Gestão de Clientes
![Clientes](screenshots/clientes-page-2025-09-15T12-59-32-897Z.png)
![Pipeline](screenshots/pipeline-vendas-completo-2025-09-06T14-18-23-046Z.png)

### 📧 Webmail Corporativo
![Webmail](screenshots/webmail-page-2025-09-15T12-59-43-594Z.png)

### ⚙️ Configurações e API
![API Config](screenshots/api-config-completo-2025-09-06T14-18-41-758Z.png)

## 📚 Documentação

### Documentação Técnica
- [📱 GAZAPI - WhatsApp API](docs/gazapi-readme.md)
- [🔑 Configuração de API Keys](docs/gazapi-api-key.md)
- [📊 Stack de Telemetria](docs/telemetry.md)
- [🎫 Design do Sistema de Helpdesk](docs/webmail-permissions-design.md)
- [📧 Módulo WhatsApp](docs/whatsapp-module-design.md)
- [🔧 Troubleshooting PM2](docs/pm2-troubleshooting.md)

### API Documentation
A documentação interativa da API está disponível em `/swagger` quando o servidor estiver em execução.

## 🔒 Segurança

- ✅ Autenticação robusta com NextAuth.js
- ✅ Middleware de segurança para todas as APIs
- ✅ Validação de permissões granulares
- ✅ Rate limiting configurável
- ✅ Sanitização e validação de dados (Zod)
- ✅ Headers de segurança (CORS, CSP)
- ✅ Logs de auditoria detalhados

## 🚀 Deploy e Produção

### Variáveis de Ambiente Essenciais
```bash
# Banco de dados
DATABASE_URL="postgresql://user:pass@localhost:5432/garapasystem"

# Autenticação
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://your-domain.com"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Redis (opcional)
REDIS_URL="redis://localhost:6379"
```

### Checklist de Deploy
- [ ] Configurar variáveis de ambiente
- [ ] Executar migrações do banco
- [ ] Configurar proxy reverso (Nginx)
- [ ] Configurar SSL/TLS
- [ ] Iniciar stack de telemetria
- [ ] Verificar logs e monitoramento

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
- 📊 Monitore via Grafana (se configurado)
- 🐛 Reporte issues via sistema interno

---

**GarapaSystem v0.2.36.7** - Sistema Integrado de Gestão Empresarial  
Desenvolvido com ❤️ usando Next.js 15, TypeScript e tecnologias modernas.
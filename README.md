# 🚀 GarapaSystem

**Sistema de Gestão Empresarial Moderno**

Plataforma completa de gestão empresarial desenvolvida com Next.js 15, TypeScript e arquitetura Domain-Driven Design (DDD). Oferece funcionalidades avançadas para administração de usuários, clientes, colaboradores e processos de negócio com interface moderna e comunicação em tempo real.

![Dashboard Principal](./screenshots/dashboard-principal-2025-09-06T14-11-55-405Z.png)

## ✨ Principais Funcionalidades

### 🔐 Sistema de Autenticação e Segurança

O GarapaSystem oferece um sistema robusto de autenticação com NextAuth.js, garantindo segurança e controle de acesso granular.

**Características:**
- Autenticação segura com JWT tokens
- Sistema de sessões persistentes
- Controle de permissões por perfil de usuário
- Rate limiting para proteção contra ataques
- Middleware de segurança em todas as rotas

![Página de Login](./screenshots/login_page-2025-09-10T14-38-36-919Z.png)

### 👥 Gestão Completa de Pessoas

Gerenciamento centralizado de todos os stakeholders do seu negócio com interface intuitiva e funcionalidades avançadas.

**Funcionalidades:**
- **Usuários**: Cadastro completo com perfis e permissões personalizáveis
- **Clientes**: Base de clientes com histórico completo e múltiplos endereços
- **Colaboradores**: Controle de funcionários com informações detalhadas
- **Perfis e Permissões**: Sistema granular de controle de acesso
- **Integração ViaCEP**: Preenchimento automático de endereços

![Gestão de Clientes](./screenshots/clientes-gestao-2025-09-06T14-12-07-966Z.png)

### 🏢 Gestão Estratégica de Negócios

Ferramentas completas para gestão de vendas e acompanhamento de performance empresarial.

**Recursos:**
- **Pipeline de Vendas**: Gestão visual de oportunidades com drag & drop
- **Dashboard Interativo**: Métricas em tempo real com gráficos dinâmicos
- **Grupos Hierárquicos**: Organização estrutural da empresa
- **Relatórios Avançados**: Análises detalhadas com exportação
- **KPIs Personalizáveis**: Indicadores customizados por setor

![Pipeline de Vendas](./screenshots/pipeline-vendas-completo-2025-09-06T14-18-23-046Z.png)

### ⚙️ Integrações e Automação Avançada

Ecossistema completo de integrações para conectar o GarapaSystem com outras ferramentas.

**Capacidades:**
- **Sistema de Webhooks**: Configuração flexível de integrações em tempo real
- **API RESTful Completa**: Endpoints documentados com Swagger UI
- **Chaves API**: Geração e gerenciamento seguro de acesso
- **Logs Detalhados**: Monitoramento completo de atividades do sistema
- **Sistema de Versioning**: Controle de versões da aplicação e API
- **Rate Limiting**: Proteção contra abuso de recursos

![Configurações de API](./screenshots/api-config-completo-2025-09-06T14-18-41-758Z.png)

### 📧 Sistema de Webmail Profissional

Cliente de email completo integrado ao sistema, oferecendo uma experiência moderna e eficiente.

**Funcionalidades Principais:**
- **Interface Moderna**: Design responsivo e intuitivo
- **Suporte IMAP/SMTP**: Configuração flexível de múltiplas contas
- **Composição Rica**: Editor avançado para criação de emails
- **Sincronização em Tempo Real**: Atualização automática de pastas e mensagens
- **Gerenciamento de Pastas**: Organização completa (Inbox, Enviados, Rascunhos, Lixeira)
- **Busca Avançada**: Pesquisa rápida e eficiente com filtros
- **Configurações Flexíveis**: Suporte a SSL/TLS e autenticação segura

![Webmail - Estado Inicial](./screenshots/webmail_initial_state-2025-09-10T14-37-02-030Z.png)

![Webmail - Email Selecionado](./screenshots/email_clicked_state-2025-09-10T14-37-30-141Z.png)

### 🔄 Comunicação em Tempo Real

Sistema avançado de comunicação bidirecional para atualizações instantâneas.

**Recursos:**
- **WebSocket**: Conexões persistentes para atualizações em tempo real
- **Notificações Push**: Sistema de alertas instantâneos
- **Sincronização Automática**: Dados sempre atualizados em todos os dispositivos
- **Status de Conexão**: Indicadores visuais de conectividade

### ⚙️ Configurações e Monitoramento

Painel completo de configurações e monitoramento do sistema.

**Características:**
- **Aba Sobre**: Informações detalhadas da aplicação e verificação de atualizações
- **Configurações de Sistema**: Painel completo de configurações
- **Monitoramento em Tempo Real**: Status do sistema e performance
- **Logs de Auditoria**: Rastreamento completo de ações do usuário

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática para maior segurança
- **Tailwind CSS** - Framework CSS utilitário moderno
- **shadcn/ui** - Componentes UI acessíveis e customizáveis
- **Framer Motion** - Animações fluidas e interativas
- **React Hook Form + Zod** - Formulários com validação robusta

### Backend
- **Prisma ORM** - Gerenciamento type-safe do banco de dados
- **PostgreSQL** - Banco de dados relacional robusto
- **NextAuth.js** - Autenticação e autorização segura
- **Socket.IO** - Comunicação bidirecional em tempo real
- **Nodemailer** - Envio de emails via SMTP
- **IMAP Client** - Conexão e sincronização com servidores IMAP
- **Email Parser** - Processamento e análise de mensagens de email

### Infraestrutura
- **Docker** - Containerização para deploy consistente
- **Rate Limiting** - Proteção contra abuso de API
- **Middleware de Segurança** - Proteção de rotas e endpoints

## 🚀 Como Utilizar

### 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- **Node.js 18+** - [Download aqui](https://nodejs.org/)
- **PostgreSQL 14+** - [Download aqui](https://www.postgresql.org/download/)
- **Git** - [Download aqui](https://git-scm.com/)
- **Docker** (opcional, para ambiente containerizado) - [Download aqui](https://www.docker.com/)

### 🔧 Instalação e Configuração

#### 1. Clone o Repositório
```bash
git clone https://github.com/garapadev/garapasystem.git
cd garapasystem
```

#### 2. Instale as Dependências
```bash
npm install
# ou
yarn install
```

#### 3. Configure o Banco de Dados

**Opção A: PostgreSQL Local**
```bash
# Crie um banco de dados PostgreSQL
creatdb garapasystem
```

**Opção B: Docker (Recomendado)**
```bash
# Inicie o PostgreSQL via Docker
docker-compose up -d postgres
```

#### 4. Configure as Variáveis de Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite o arquivo .env.local com suas configurações
nano .env.local
```

**Variáveis principais a configurar:**
```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/garapasystem"

# NextAuth
NEXTAUTH_SECRET="seu-secret-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Email (para webmail)
IMAP_HOST="seu-servidor-imap"
IMAP_PORT=993
SMTP_HOST="seu-servidor-smtp"
SMTP_PORT=587
```

#### 5. Execute as Migrações do Banco
```bash
# Gere o cliente Prisma
npx prisma generate

# Execute as migrações
npx prisma migrate dev

# (Opcional) Popule com dados de exemplo
npx prisma db seed
```

#### 6. Inicie a Aplicação

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm run build
npm start
```

### 🌐 Acessando a Aplicação

1. **Aplicação Principal**: `http://localhost:3000`
2. **Prisma Studio** (Gerenciamento do BD): `http://localhost:5555`
3. **API Documentation**: `http://localhost:3000/api/docs`

### 📧 Configuração do Webmail

1. Acesse "Configurações" → "Email"
2. Configure os servidores IMAP/SMTP:
   - **Host IMAP**: servidor de entrada
   - **Porta IMAP**: 993 (SSL) ou 143 (STARTTLS)
   - **Host SMTP**: servidor de saída
   - **Porta SMTP**: 587 (STARTTLS) ou 465 (SSL)
3. Teste a conexão
4. Acesse o webmail em "Email" no menu principal

### 🔧 Comandos Úteis

```bash
# Resetar banco de dados
npx prisma migrate reset

# Visualizar banco de dados
npx prisma studio

# Executar testes
npm test

# Verificar tipos TypeScript
npm run type-check

# Executar linting
npm run lint

# Formatar código
npm run format
```

### 🐳 Execução com Docker

```bash
# Construir e executar todos os serviços
docker-compose up -d

# Executar apenas o banco de dados
docker-compose up -d postgres

# Ver logs dos containers
docker-compose logs -f

# Parar todos os serviços
docker-compose down
```

### ⚠️ Solução de Problemas

**Erro de conexão com banco:**
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no `.env.local`
- Execute `npx prisma db push` para sincronizar o schema

**Erro de autenticação:**
- Verifique se `NEXTAUTH_SECRET` está definido
- Confirme se `NEXTAUTH_URL` está correto

**Problemas com webmail:**
- Verifique as configurações IMAP/SMTP
- Confirme se as portas estão abertas
- Teste a conectividade com `telnet servidor porta`

##### 🆕 Atualizações Recentes

#### Versão 0.1.33 - Janeiro 2025
- 📧 **Sistema de Webmail Completo**: Cliente de email integrado com suporte IMAP/SMTP
- ✉️ **Composição de Emails**: Editor rico para criação e envio de mensagens
- 📁 **Gerenciamento de Pastas**: Organização automática de emails (Inbox, Enviados, Rascunhos, Lixeira)
- 🔄 **Sincronização em Tempo Real**: Atualização automática de pastas e mensagens
- 🔍 **Busca de Emails**: Sistema de pesquisa avançada integrado
- 🛠️ **Configurações de Email**: Interface para configuração de contas IMAP/SMTP
- 🎨 **Interface Moderna**: Design responsivo e intuitivo para o webmail
- 🔧 **Correções de Tipos TypeScript**: Melhorias na tipagem e estabilidade do código

#### Versão 0.1.32 - Setembro 2025
- ✨ **Nova Aba Sobre**: Informações detalhadas da aplicação, API e verificação de atualizações
- 🏠 **Múltiplos Endereços**: Clientes agora podem ter vários endereços cadastrados
- 📊 **Sistema de Versioning**: API para controle de versões e verificação de atualizações
- 🔧 **Melhorias na Interface**: Componentes otimizados e experiência do usuário aprimorada
- 🐛 **Correções de Bugs**: Diversos ajustes e melhorias de estabilidade
- 📱 **Responsividade**: Interface totalmente responsiva para dispositivos móveis
- 🔒 **Segurança**: Implementação de rate limiting e middleware de segurança

## 📖 Primeiro Acesso

**Credenciais padrão:**
- Email: `admin@garapasystem.com`
- Senha: `password`

> ⚠️ **Importante**: Altere a senha imediatamente após o primeiro login!

### 📧 Acessando o Webmail

Após fazer login no sistema, você pode acessar o webmail através do menu lateral ou diretamente em:
- **Desenvolvimento**: [http://localhost:3000/webmail](http://localhost:3000/webmail)
- **Produção**: `https://seu-dominio.com/webmail`

**Configuração de Email:**
1. Acesse o webmail
2. Clique em "Settings" (Configurações)
3. Configure suas credenciais IMAP/SMTP:
   - **Servidor IMAP**: `imap.seu-provedor.com`
   - **Porta IMAP**: `993` (SSL) ou `143` (STARTTLS)
   - **Servidor SMTP**: `smtp.seu-provedor.com`
   - **Porta SMTP**: `465` (SSL) ou `587` (STARTTLS)
   - **Email e Senha**: Suas credenciais de email

**Funcionalidades Disponíveis:**
- ✉️ Composição e envio de emails
- 📁 Gerenciamento de pastas (Inbox, Enviados, Rascunhos, Lixeira)
- 🔍 Busca avançada de mensagens
- 🔄 Sincronização automática em tempo real
- 📎 Suporte a anexos (em desenvolvimento)

## 🔌 API e Documentação

### Documentação Swagger
- **Desenvolvimento**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Produção**: `https://seu-dominio.com/api/docs`

### Principais Endpoints

| Método | Endpoint | Descrição |
|--------|----------|----------|
| `GET` | `/api/clientes` | Listar clientes |
| `POST` | `/api/clientes` | Criar cliente |
| `GET` | `/api/negocios` | Listar negócios |
| `POST` | `/api/negocios` | Criar negócio |
| `GET` | `/api/webhooks` | Listar webhooks |
| `POST` | `/api/webhooks` | Criar webhook |
| `GET` | `/api/email/folders` | Listar pastas de email |
| `POST` | `/api/email/send` | Enviar email |
| `GET` | `/api/email/messages` | Listar mensagens |
| `POST` | `/api/email/config` | Configurar conta de email |

### Exemplo de Uso da API

```javascript
// Criar um novo cliente
const cliente = {
  nome: "Empresa XYZ Ltda",
  email: "contato@empresaxyz.com",
  telefone: "+55 11 99999-9999"
};

const response = await fetch('/api/clientes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sua-api-key'
  },
  body: JSON.stringify(cliente)
});
```

## 📁 Estrutura do Projeto

```
garapasystem/
├── 📁 src/
│   ├── 📁 app/               # Páginas e rotas (App Router)
│   │   ├── 📁 api/           # Endpoints da API
│   │   ├── 📁 clientes/      # Interface de clientes
│   │   ├── 📁 colaboradores/ # Interface de colaboradores
│   │   ├── 📁 configuracoes/ # Configurações do sistema
│   │   ├── 📁 usuarios/      # Interface de usuários
│   │   └── 📁 webmail/       # Sistema de webmail
│   ├── 📁 components/        # Componentes reutilizáveis
│   ├── 📁 hooks/             # Hooks customizados
│   ├── 📁 lib/               # Utilitários e configurações
│   └── 📁 types/             # Definições de tipos
├── 📁 prisma/                # Configuração do banco de dados
├── 📁 public/                # Arquivos estáticos
├── docker-compose.yml        # Orquestração Docker
└── package.json              # Dependências e scripts
```

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção

# Banco de Dados
npm run db:generate  # Gera cliente Prisma
npm run db:migrate   # Executa migrações
npm run db:seed      # Popula banco com dados iniciais

# Docker
docker-compose up -d    # Inicia todos os serviços
docker-compose down     # Para todos os serviços
```

## 🚀 Deploy

### Deploy com Docker
```bash
# Build da imagem
docker build -t garapasystem:latest .

# Executar container
docker run -d \
  --name garapasystem \
  -p 3000:3000 \
  --env-file .env \
  garapasystem:latest
```

### Variáveis de Ambiente de Produção
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_SECRET=sua-chave-super-segura
NEXTAUTH_URL=https://seu-dominio.com
```

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

### Padrões de Commit
Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` atualização de documentação
- `style:` formatação de código
- `refactor:` refatoração
- `test:` adição de testes

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/garapadev/garapasystem/issues)
- **Discussões**: [GitHub Discussions](https://github.com/garapadev/garapasystem/discussions)
- **Email**: suporte@garapadev.com

## 📈 Status do Projeto

### ✅ Funcionalidades Implementadas
- **Arquitetura DDD**: Implementada com padrões modernos
- **Sistema de Autenticação**: NextAuth.js configurado e funcional
- **Banco de Dados**: PostgreSQL com Prisma ORM e migrações
- **Interface Moderna**: Tailwind CSS + shadcn/ui responsiva
- **WebSocket**: Comunicação em tempo real implementada
- **Containerização**: Docker e Docker Compose configurados
- **Sistema de Versioning**: API de versões e verificação de atualizações
- **Múltiplos Endereços**: Suporte completo para clientes com vários endereços
- **Configurações Avançadas**: Painel de configurações com aba Sobre
- **API RESTful**: Endpoints completos com documentação Swagger
- **Sistema de Logs**: Monitoramento detalhado de atividades
- **Sistema de Webmail**: Cliente de email completo com IMAP/SMTP
- **Composição de Emails**: Editor rico para criação de mensagens
- **Sincronização de Email**: Atualização automática em tempo real
- **Gerenciamento de Pastas**: Organização completa de emails

---

**GarapaSystem** - Sistema de gestão empresarial moderno e eficiente 🚀

*Desenvolvido com ❤️ pela equipe GarapaDev* do ceara para o Mundo!

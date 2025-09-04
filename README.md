# 🚀 GarapaSystem - Sistema de Gestão Empresarial

**Plataforma Moderna de Gestão Empresarial**

O GarapaSystem é um sistema de gestão empresarial desenvolvido com Next.js 15 e TypeScript, implementando arquitetura Domain-Driven Design (DDD). A plataforma oferece funcionalidades completas para administração de usuários, clientes, colaboradores e processos de negócio, com interface moderna e comunicação em tempo real.

## ✨ Principais Funcionalidades

### 👥 **Gestão de Pessoas**
- **Usuários**: Sistema completo de autenticação e autorização
- **Clientes**: Cadastro e gerenciamento de base de clientes
- **Colaboradores**: Controle de funcionários e suas informações
- **Perfis e Permissões**: Controle granular de acesso

### 🏢 **Gestão de Negócios**
- **Pipeline de Vendas**: Gestão completa de oportunidades
- **Grupos Hierárquicos**: Organização estrutural da empresa
- **Dashboard Interativo**: Métricas e KPIs em tempo real
- **Relatórios**: Análises detalhadas do negócio

### ⚙️ **Integrações e Automação**
- **Sistema de Webhooks**: Configuração flexível de integrações
- **API RESTful**: Endpoints completos com documentação Swagger
- **Chaves API**: Geração e gerenciamento seguro de acesso
- **Logs Detalhados**: Monitoramento completo de atividades

### 🔄 **Comunicação em Tempo Real**
- **WebSocket**: Atualizações instantâneas
- **Notificações**: Sistema de alertas em tempo real
- **Sincronização**: Dados sempre atualizados

## 🛠️ Stack Tecnológico

### **Frontend**
- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática para maior segurança
- **Tailwind CSS** - Framework CSS utilitário moderno
- **shadcn/ui** - Componentes UI acessíveis e customizáveis
- **Framer Motion** - Animações fluidas e interativas
- **React Hook Form + Zod** - Formulários com validação robusta

### **Backend**
- **Prisma ORM** - Gerenciamento type-safe do banco de dados
- **PostgreSQL** - Banco de dados relacional robusto
- **NextAuth.js** - Autenticação e autorização segura
- **Socket.IO** - Comunicação bidirecional em tempo real

### **Infraestrutura**
- **Docker** - Containerização para deploy consistente
- **Rate Limiting** - Proteção contra abuso de API
- **Middleware de Segurança** - Proteção de rotas e endpoints

## 📋 Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- **Node.js** 18.0 ou superior
- **PostgreSQL** 13.0 ou superior
- **npm** ou **yarn**
- **Docker** (opcional, para containerização)

## 🚀 Instalação e Configuração

### **1. Clone o Repositório**
```bash
git clone <repository-url>
cd GarapaSystem
```

### **2. Instale as Dependências**
```bash
npm install
# ou
yarn install
```

### **3. Configuração do Ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/garapasystem"

# Autenticação NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-super-segura"
NEXTAUTH_URL="http://localhost:3000"

# Configurações da Aplicação
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="GarapaSystem"

# Configurações de Email (opcional)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="seu-email@gmail.com"
EMAIL_SERVER_PASSWORD="sua-senha-app"
EMAIL_FROM="noreply@garapasystem.com"
```

### **4. Configuração do Banco de Dados**

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# Popular banco com dados iniciais
npm run db:seed
```

### **5. Iniciar o Servidor de Desenvolvimento**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 🐳 Instalação com Docker

### **Docker Compose (Recomendado)**

```bash
# Construir e iniciar todos os serviços
docker-compose up -d

# Executar migrações no container
docker-compose exec app npm run db:migrate

# Popular banco de dados
docker-compose exec app npm run db:seed
```

### **Docker Manual**

```bash
# Construir imagem
docker build -t garapasystem .

# Executar container
docker run -p 3000:3000 --env-file .env.local garapasystem
```

## 📖 Guia de Uso

### **Primeiro Acesso**

1. **Acesse a aplicação** em `http://localhost:3000`
2. **Faça login** com as credenciais padrão:
   - Email: `admin@garapasystem.com`
   - Senha: `admin123`
3. **Altere a senha** imediatamente após o primeiro login

### **Configuração Inicial**

1. **Configurações Gerais**
   - Acesse `Configurações > Geral`
   - Configure informações da empresa
   - Defina preferências do sistema

2. **Configuração de API/Webhook**
   - Acesse `Configurações > API/Webhook`
   - Gere chaves API para integrações
   - Configure webhooks para sistemas externos

3. **Gestão de Usuários**
   - Acesse `Usuários`
   - Crie perfis de acesso
   - Defina permissões granulares

### **Funcionalidades Principais**

#### **Dashboard**
- Visão geral de métricas importantes
- Gráficos interativos em tempo real
- Widgets customizáveis

#### **Gestão de Clientes**
```typescript
// Exemplo de uso da API de clientes
const cliente = {
  nome: "Empresa XYZ Ltda",
  email: "contato@empresaxyz.com",
  telefone: "+55 11 99999-9999",
  endereco: {
    rua: "Rua das Flores, 123",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01234-567"
  }
};

// POST /api/clientes
const response = await fetch('/api/clientes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sua-api-key'
  },
  body: JSON.stringify(cliente)
});
```

#### **Pipeline de Vendas**
```typescript
// Exemplo de criação de negócio
const negocio = {
  titulo: "Venda Software ERP",
  valor: 50000.00,
  clienteId: "cliente-uuid",
  responsavelId: "usuario-uuid",
  etapa: "PROPOSTA",
  dataFechamento: "2024-12-31"
};

// POST /api/negocios
const response = await fetch('/api/negocios', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer sua-api-key'
  },
  body: JSON.stringify(negocio)
});
```

## 📁 Estrutura do Projeto

```
GarapaSystem/
├── 📁 backup/                 # Backups de sanitização
├── 📁 docs/                   # Documentação do projeto
├── 📁 prisma/                 # Configuração do banco de dados
│   ├── schema.prisma          # Schema do Prisma
│   └── migrations/            # Migrações do banco
├── 📁 public/                 # Arquivos estáticos
├── 📁 src/
│   ├── 📁 app/               # Páginas e rotas (App Router)
│   │   ├── 📁 api/           # Endpoints da API
│   │   │   ├── auth/         # Autenticação
│   │   │   ├── clientes/     # CRUD de clientes
│   │   │   ├── colaboradores/ # CRUD de colaboradores
│   │   │   ├── negocios/     # Pipeline de vendas
│   │   │   ├── usuarios/     # Gestão de usuários
│   │   │   ├── webhooks/     # Sistema de webhooks
│   │   │   └── logs/         # Logs do sistema
│   │   ├── 📁 auth/          # Páginas de autenticação
│   │   ├── 📁 clientes/      # Interface de clientes
│   │   ├── 📁 colaboradores/ # Interface de colaboradores
│   │   ├── 📁 configuracoes/ # Configurações do sistema
│   │   ├── 📁 negocios/      # Interface de negócios
│   │   ├── 📁 usuarios/      # Interface de usuários
│   │   └── layout.tsx        # Layout principal
│   ├── 📁 components/        # Componentes reutilizáveis
│   │   ├── 📁 auth/          # Componentes de autenticação
│   │   ├── 📁 configuracoes/ # Componentes de configuração
│   │   ├── 📁 layout/        # Componentes de layout
│   │   ├── 📁 providers/     # Provedores de contexto
│   │   ├── 📁 realtime/      # Componentes WebSocket
│   │   └── 📁 ui/            # Componentes UI base
│   ├── 📁 hooks/             # Hooks customizados
│   │   ├── useAuth.ts        # Hook de autenticação
│   │   ├── useClientes.ts    # Hook de clientes
│   │   ├── useNegocios.ts    # Hook de negócios
│   │   ├── useWebhooks.ts    # Hook de webhooks
│   │   └── useLogs.ts        # Hook de logs
│   ├── 📁 lib/               # Utilitários e configurações
│   │   ├── auth.ts           # Configuração NextAuth
│   │   ├── db.ts             # Cliente Prisma
│   │   ├── webhook.ts        # Sistema de webhooks
│   │   ├── api-middleware.ts # Middleware da API
│   │   └── utils.ts          # Funções utilitárias
│   └── 📁 types/             # Definições de tipos
├── 📁 docker/                # Configurações Docker
├── 📁 scripts/               # Scripts utilitários
├── docker-compose.yml        # Orquestração Docker
├── package.json              # Dependências e scripts
└── README.md                 # Este arquivo
```

## 🔌 API e Integrações

### **Documentação da API**

A documentação completa da API está disponível via Swagger:
- **Desenvolvimento**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
- **Produção**: `https://seu-dominio.com/api/docs`

### **Principais Endpoints**

| Método | Endpoint | Descrição |
|--------|----------|----------|
| `GET` | `/api/clientes` | Listar clientes |
| `POST` | `/api/clientes` | Criar cliente |
| `GET` | `/api/clientes/[id]` | Obter cliente |
| `PUT` | `/api/clientes/[id]` | Atualizar cliente |
| `DELETE` | `/api/clientes/[id]` | Excluir cliente |
| `GET` | `/api/negocios` | Listar negócios |
| `POST` | `/api/negocios` | Criar negócio |
| `GET` | `/api/webhooks` | Listar webhooks |
| `POST` | `/api/webhooks` | Criar webhook |
| `GET` | `/api/logs` | Obter logs do sistema |

### **Autenticação da API**

```bash
# Obter token de acesso
curl -X POST http://localhost:3000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@exemplo.com","password":"sua-senha"}'

# Usar token nas requisições
curl -X GET http://localhost:3000/api/clientes \
  -H "Authorization: Bearer seu-token-jwt"
```

### **Webhooks**

```javascript
// Exemplo de configuração de webhook
const webhook = {
  url: "https://seu-sistema.com/webhook",
  eventos: ["cliente.criado", "negocio.atualizado"],
  ativo: true,
  headers: {
    "Authorization": "Bearer token-do-sistema-externo",
    "Content-Type": "application/json"
  }
};

// Payload enviado pelo webhook
{
  "evento": "cliente.criado",
  "timestamp": "2024-01-15T10:30:00Z",
  "dados": {
    "id": "cliente-uuid",
    "nome": "Empresa XYZ",
    "email": "contato@empresaxyz.com"
  }
}
```

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Constrói aplicação para produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linting do código

# Banco de Dados
npm run db:generate  # Gera cliente Prisma
npm run db:migrate   # Executa migrações
npm run db:push      # Sincroniza schema com banco
npm run db:reset     # Reseta banco de dados
npm run db:seed      # Popula banco com dados iniciais

# Docker
docker-compose up -d    # Inicia todos os serviços
docker-compose down     # Para todos os serviços
docker-compose logs app # Visualiza logs da aplicação
```

## 🔧 Configurações Avançadas

### **Variáveis de Ambiente**

```env
# Banco de Dados
DATABASE_URL="postgresql://user:pass@localhost:5432/db"

# Autenticação
NEXTAUTH_SECRET="chave-super-secreta"
NEXTAUTH_URL="http://localhost:3000"

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# Webhooks
WEBHOOK_TIMEOUT=30000
WEBHOOK_RETRY_ATTEMPTS=3

# Logs
LOG_LEVEL="info"
LOG_RETENTION_DAYS=30

# Upload de Arquivos
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,application/pdf"
```

### **Configuração de Produção**

```bash
# Build otimizado
NODE_ENV=production npm run build

# Variáveis de produção
export DATABASE_URL="postgresql://prod-user:prod-pass@prod-host:5432/prod-db"
export NEXTAUTH_SECRET="chave-producao-super-segura"
export NEXTAUTH_URL="https://seu-dominio.com"

# Iniciar em produção
npm start
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes com coverage
npm run test:coverage

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e
```

## 📊 Monitoramento e Logs

### **Logs do Sistema**
- **Logs de API**: Todas as requisições são registradas
- **Logs de Webhook**: Histórico completo de envios
- **Logs de Erro**: Rastreamento detalhado de problemas
- **Métricas de Performance**: Análise de desempenho

### **Acesso aos Logs**
```bash
# Logs de desenvolvimento
tail -f dev.log

# Logs de produção
tail -f server.log

# Logs via interface
# Acesse: Configurações > API/Webhook > Logs
```

## 🚀 Deploy

### **Deploy Manual**

```bash
# 1. Build da aplicação
npm run build

# 2. Configurar variáveis de produção
export NODE_ENV=production
export DATABASE_URL="sua-url-de-producao"

# 3. Executar migrações
npm run db:migrate

# 4. Iniciar servidor
npm start
```

### **Deploy com Docker**

```bash
# 1. Build da imagem
docker build -t garapasystem:latest .

# 2. Executar container
docker run -d \
  --name garapasystem \
  -p 3000:3000 \
  --env-file .env.production \
  garapasystem:latest
```

### **Deploy com Docker Compose**

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/garapasystem
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=garapasystem
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🤝 Contribuição

Contribuições são bem-vindas! Siga estas etapas:

### **1. Fork e Clone**
```bash
git clone https://github.com/garapadev/gsmvp30.git
cd gsmvp30
```

### **2. Crie uma Branch**
```bash
git checkout -b feature/nova-funcionalidade
```

### **3. Desenvolva e Teste**
```bash
# Instale dependências
npm install

# Execute testes
npm test

# Verifique linting
npm run lint
```

### **4. Commit e Push**
```bash
git add .
git commit -m "feat: adiciona nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### **5. Abra um Pull Request**
- Descreva claramente as mudanças
- Inclua testes para novas funcionalidades
- Mantenha o código documentado

### **Padrões de Commit**

Utilizamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nova funcionalidade
fix: correção de bug
docs: atualização de documentação
style: formatação de código
refactor: refatoração de código
test: adição de testes
chore: tarefas de manutenção
```

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**. Veja o arquivo [LICENSE](LICENSE) para detalhes.

```
MIT License

Copyright (c) 2024 GarapaSystem

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 📞 Suporte

- **Documentação**: [Wiki do Projeto](https://github.com/garapadev/gsmvp30/wiki)
- **Issues**: [GitHub Issues](https://github.com/garapadev/gsmvp30/issues)
- **Discussões**: [GitHub Discussions](https://github.com/garapadev/gsmvp30/discussions)
- **Email**: suporte@garapadev.com

## 📈 Status do Projeto

### **Estado Atual**
- ✅ **Arquitetura DDD**: Implementada com entidades, repositórios e serviços
- ✅ **Sistema de Autenticação**: NextAuth.js configurado e funcional
- ✅ **Banco de Dados**: PostgreSQL com Prisma ORM
- ✅ **Interface Moderna**: Tailwind CSS + shadcn/ui
- ✅ **WebSocket**: Comunicação em tempo real implementada
- ✅ **Sanitização**: Projeto limpo e otimizado (ver SANITIZATION_REPORT.md)

### **Funcionalidades Implementadas**
- ✅ Gestão de usuários com perfis e permissões
- ✅ CRUD completo de clientes e colaboradores
- ✅ Sistema de grupos hierárquicos
- ✅ Dashboard com métricas em tempo real
- ✅ API RESTful com documentação
- ✅ Sistema de logs e auditoria
- ✅ Containerização com Docker

### **Processo de Sanitização**
O projeto passou por um processo completo de sanitização que removeu:
- Arquivos de teste e debug não utilizados
- Bancos de dados SQLite obsoletos
- Metadados do Windows (Zone.Identifier)
- Diretórios de exemplo não referenciados
- Scripts utilitários não utilizados

Todos os arquivos removidos foram preservados em backup. Consulte o arquivo `SANITIZATION_REPORT.md` para detalhes completos.

---

**GarapaSystem** - Sistema de gestão empresarial moderno e eficiente 🚀

*Desenvolvido com ❤️ pela equipe GarapaDev*
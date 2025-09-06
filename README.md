# 🚀 GarapaSystem

**Sistema de Gestão Empresarial Moderno**

Plataforma completa de gestão empresarial desenvolvida com Next.js 15, TypeScript e arquitetura Domain-Driven Design (DDD). Oferece funcionalidades avançadas para administração de usuários, clientes, colaboradores e processos de negócio com interface moderna e comunicação em tempo real.

![Dashboard Principal](./screenshots/dashboard-principal-2025-09-06T14-11-55-405Z.png)

## ✨ Principais Funcionalidades

### 👥 Gestão de Pessoas
- **Usuários**: Sistema completo de autenticação e autorização
- **Clientes**: Cadastro e gerenciamento de base de clientes
- **Colaboradores**: Controle de funcionários e suas informações
- **Perfis e Permissões**: Controle granular de acesso

![Gestão de Clientes](./screenshots/clientes-gestao-2025-09-06T14-12-07-966Z.png)

### 🏢 Gestão de Negócios
- **Pipeline de Vendas**: Gestão completa de oportunidades
- **Grupos Hierárquicos**: Organização estrutural da empresa
- **Dashboard Interativo**: Métricas e KPIs em tempo real
- **Relatórios**: Análises detalhadas do negócio

![Pipeline de Vendas](./screenshots/pipeline-vendas-completo-2025-09-06T14-18-23-046Z.png)

### ⚙️ Integrações e Automação
- **Sistema de Webhooks**: Configuração flexível de integrações
- **API RESTful**: Endpoints completos com documentação Swagger
- **Chaves API**: Geração e gerenciamento seguro de acesso
- **Logs Detalhados**: Monitoramento completo de atividades

![Configurações de API](./screenshots/api-config-completo-2025-09-06T14-18-41-758Z.png)

### 🔄 Comunicação em Tempo Real
- **WebSocket**: Atualizações instantâneas
- **Notificações**: Sistema de alertas em tempo real
- **Sincronização**: Dados sempre atualizados

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

### Infraestrutura
- **Docker** - Containerização para deploy consistente
- **Rate Limiting** - Proteção contra abuso de API
- **Middleware de Segurança** - Proteção de rotas e endpoints

## 🚀 Instalação Rápida

### Pré-requisitos
- Node.js 18.0+
- PostgreSQL 13.0+
- Docker (opcional)

### 1. Clone o Repositório
```bash
git clone https://github.com/garapadev/garapasystem.git
cd garapasystem
```

### 2. Configuração do Ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Configure suas variáveis de ambiente
nano .env
```

### 3. Instalação com Docker (Recomendado)
```bash
# Inicie todos os serviços
docker-compose up -d

# Execute as migrações
docker-compose exec app npm run db:migrate

# Popule o banco com dados iniciais
docker-compose exec app npm run db:seed
```

### 4. Instalação Manual
```bash
# Instale as dependências
npm install

# Configure o banco de dados
npm run db:generate
npm run db:migrate
npm run db:seed

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) para ver a aplicação.

## 📖 Primeiro Acesso

**Credenciais padrão:**
- Email: `admin@garapasystem.com`
- Senha: `password`

> ⚠️ **Importante**: Altere a senha imediatamente após o primeiro login!

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
│   │   └── 📁 usuarios/      # Interface de usuários
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

- ✅ **Arquitetura DDD**: Implementada
- ✅ **Sistema de Autenticação**: NextAuth.js configurado
- ✅ **Banco de Dados**: PostgreSQL com Prisma ORM
- ✅ **Interface Moderna**: Tailwind CSS + shadcn/ui
- ✅ **WebSocket**: Comunicação em tempo real
- ✅ **Containerização**: Docker configurado

---

**GarapaSystem** - Sistema de gestão empresarial moderno e eficiente 🚀

*Desenvolvido com ❤️ pela equipe GarapaDev*

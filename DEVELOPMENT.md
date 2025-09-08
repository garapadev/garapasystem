# Configuração de Desenvolvimento Local

Este documento descreve como configurar o ambiente de desenvolvimento local para o GarapaSystem.

## Variáveis de Ambiente

### Arquivo .env.local

Para desenvolvimento local, use o arquivo `.env.local` que contém todas as configurações necessárias para rodar o projeto localmente.

#### Configurações do Banco de Dados

```bash
# Database - Local Development
DB_HOST=localhost
DB_PORT=5434
DB_NAME=crm_erp
DB_USER=crm_user
DB_PASSWORD=crm_password
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
```

#### Configurações de Autenticação

```bash
# NextAuth Configuration
NEXTAUTH_SECRET="KmYl85qqhLFfe0VMH+k+bAelK+r1fWcGem+F+beJj+M="
NEXTAUTH_URL=http://localhost:3000
```

#### Outras Configurações

- **API_BASE_URL**: URL base da API local
- **REDIS_URL**: URL do Redis para cache local
- **UPLOAD_DIR**: Diretório para uploads de arquivos
- **SMTP_***: Configurações de email para testes locais
- **WEBHOOK_SECRET**: Chave secreta para webhooks
- **RATE_LIMIT_***: Configurações de rate limiting

## Como Usar

### 1. Configuração Inicial

```bash
# Copie o arquivo de exemplo (se necessário)
cp .env.local.example .env.local

# Edite as configurações conforme necessário
nano .env.local
```

### 2. Banco de Dados Local

Para usar um banco PostgreSQL local:

```bash
# Instale PostgreSQL localmente
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# macOS (com Homebrew):
brew install postgresql

# Crie o banco de dados
sudo -u postgres createdb crm_erp
sudo -u postgres createuser crm_user
sudo -u postgres psql -c "ALTER USER crm_user PASSWORD 'crm_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crm_erp TO crm_user;"
```

### 3. Executar Migrações

```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# Seed do banco (opcional)
npm run db:seed
```

### 4. Iniciar o Projeto

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run dev
```

## Comandos Úteis

### Banco de Dados

```bash
# Resetar banco de dados
npm run db:reset

# Push schema sem migração
npm run db:push

# Visualizar banco no Prisma Studio
npx prisma studio
```

### Desenvolvimento

```bash
# Verificar lint
npm run lint

# Build do projeto
npm run build

# Iniciar em produção
npm start
```

## Estrutura de Arquivos de Ambiente

- `.env` - Configurações para Docker/produção
- `.env.local` - Configurações para desenvolvimento local
- `.env.example` - Exemplo de configurações (se existir)

## Notas Importantes

1. **Nunca commite** o arquivo `.env.local` no repositório
2. O arquivo `.env.local` tem **prioridade** sobre `.env` no Next.js
3. Variáveis com `NEXT_PUBLIC_` são expostas no frontend
4. Para produção, use as configurações do `.env` ou variáveis de ambiente do sistema

## Troubleshooting

### Erro de Conexão com Banco

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql

# Verificar conexão
psql -h localhost -p 5434 -U crm_user -d crm_erp
```

### Erro de Porta em Uso

```bash
# Verificar qual processo está usando a porta 3000
lsof -i :3000

# Matar processo se necessário
kill -9 <PID>
```

### Limpar Cache

```bash
# Limpar cache do Next.js
rm -rf .next

# Limpar node_modules
rm -rf node_modules
npm install
```
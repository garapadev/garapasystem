# 🐳 Guia de Deploy com Docker

Este guia explica como executar a aplicação CRM/ERP usando Docker e Docker Compose.

## 📋 Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado
- Pelo menos 2GB de RAM disponível
- Portas 3000, 5432 e 8080 livres

## 🚀 Deploy Rápido

### Opção 1: Script Automatizado

```bash
# Executar script de build e deploy
./scripts/docker-build.sh
```

### Opção 2: Comandos Manuais

```bash
# 1. Clonar variáveis de ambiente
cp .env.docker .env.production

# 2. Editar variáveis de produção (opcional)
nano .env.production

# 3. Build e iniciar containers
docker-compose up -d --build

# 4. Executar migrações do banco
docker-compose exec app npx prisma migrate deploy

# 5. (Opcional) Popular banco com dados iniciais
docker-compose exec app npx prisma db seed
```

## 🔧 Configuração

### Variáveis de Ambiente

Edite o arquivo `.env.production` com suas configurações:

```env
# Database
DATABASE_URL="postgresql://crm_user:crm_password@postgres:5432/crm_erp?schema=public"

# Next.js
NEXTAUTH_SECRET="seu-secret-super-seguro-aqui"
NEXTAUTH_URL="http://seu-dominio.com:3000"

# Environment
NODE_ENV="production"
```

### Portas dos Serviços

- **Aplicação**: http://localhost:3000
- **Banco PostgreSQL**: localhost:5432
- **Adminer** (gerenciador de BD): http://localhost:8080

## 📊 Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver status dos containers
docker-compose ps

# Ver logs da aplicação
docker-compose logs -f app

# Ver logs do banco
docker-compose logs -f postgres

# Parar todos os serviços
docker-compose down

# Parar e remover volumes (⚠️ apaga dados do banco)
docker-compose down -v

# Reiniciar apenas a aplicação
docker-compose restart app
```

### Banco de Dados

```bash
# Executar migrações
docker-compose exec app npx prisma migrate deploy

# Resetar banco de dados (⚠️ apaga todos os dados)
docker-compose exec app npx prisma migrate reset

# Gerar cliente Prisma
docker-compose exec app npx prisma generate

# Acessar console do PostgreSQL
docker-compose exec postgres psql -U crm_user -d crm_erp
```

### Desenvolvimento

```bash
# Executar comandos dentro do container
docker-compose exec app bash

# Instalar nova dependência
docker-compose exec app npm install nova-dependencia

# Rebuild apenas a aplicação
docker-compose build app
```

## 🔍 Monitoramento

### Health Check

A aplicação possui um endpoint de health check:

```bash
# Verificar saúde da aplicação
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "message": "Application is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}
```

### Logs

```bash
# Logs em tempo real
docker-compose logs -f

# Logs apenas da aplicação
docker-compose logs -f app

# Últimas 100 linhas
docker-compose logs --tail=100 app
```

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Porta já em uso
```bash
# Verificar o que está usando a porta
sudo lsof -i :3000

# Matar processo na porta
sudo kill -9 $(sudo lsof -t -i:3000)
```

#### 2. Erro de permissão
```bash
# Dar permissões corretas
sudo chown -R $USER:$USER .
chmod +x scripts/docker-build.sh
```

#### 3. Banco não conecta
```bash
# Verificar se o container do postgres está rodando
docker-compose ps postgres

# Reiniciar serviço do banco
docker-compose restart postgres

# Verificar logs do banco
docker-compose logs postgres
```

#### 4. Aplicação não inicia
```bash
# Verificar logs detalhados
docker-compose logs app

# Rebuild sem cache
docker-compose build --no-cache app

# Verificar variáveis de ambiente
docker-compose exec app env | grep -E "DATABASE_URL|NODE_ENV"
```

### Limpeza Completa

Para remover tudo e começar do zero:

```bash
# Parar e remover containers, redes e volumes
docker-compose down -v --rmi all

# Remover imagens órfãs
docker system prune -a

# Rebuild completo
docker-compose up -d --build
```

## 🔒 Segurança

### Produção

Para deploy em produção:

1. **Altere as senhas padrão**:
   - `POSTGRES_PASSWORD`
   - `NEXTAUTH_SECRET`

2. **Configure HTTPS**:
   - Use um proxy reverso (nginx, traefik)
   - Configure certificados SSL

3. **Limite acesso ao banco**:
   - Remova a exposição da porta 5432
   - Configure firewall

4. **Backup regular**:
   ```bash
   # Backup do banco
   docker-compose exec postgres pg_dump -U crm_user crm_erp > backup.sql
   ```

## 📚 Recursos Adicionais

- [Documentação do Docker](https://docs.docker.com/)
- [Documentação do Docker Compose](https://docs.docker.com/compose/)
- [Documentação do Prisma](https://www.prisma.io/docs/)
- [Documentação do Next.js](https://nextjs.org/docs/)

---

**💡 Dica**: Para desenvolvimento, use `npm run dev` localmente. Para produção, use este setup com Docker.
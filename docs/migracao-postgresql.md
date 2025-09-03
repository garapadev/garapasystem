# Guia de Migração para PostgreSQL

## Visão Geral

Este documento fornece orientações detalhadas para migrar o banco de dados do sistema CRM/ERP de SQLite para PostgreSQL. A migração é necessária para ambientes de produção que exigem maior escalabilidade, desempenho e recursos avançados.

## Pré-requisitos

### Software Necessário
- PostgreSQL 13 ou superior
- Node.js 18 ou superior
- Prisma CLI
- Acesso ao servidor de banco de dados

### Conhecimentos Necessários
- Conhecimento básico de SQL
- Familiaridade com Prisma ORM
- Noções de administração de banco de dados

## Passo a Passo da Migração

### 1. Preparação do Ambiente

#### 1.1. Instalação do PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# macOS (usando Homebrew)
brew install postgresql
brew services start postgresql
```

#### 1.2. Criação do Banco de Dados e Usuário
```sql
-- Conecte-se ao PostgreSQL como superusuário
sudo -u postgres psql

-- Crie o banco de dados
CREATE DATABASE crm_erp;

-- Crie o usuário do aplicativo
CREATE USER crm_user WITH PASSWORD 'sua_senha_segura';

-- Conceda privilégios ao usuário
GRANT ALL PRIVILEGES ON DATABASE crm_erp TO crm_user;
GRANT ALL ON SCHEMA public TO crm_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO crm_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO crm_user;

-- Saia do psql
\q
```

### 2. Configuração do Prisma

#### 2.1. Atualização do Schema
Modifique o arquivo `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

#### 2.2. Configuração da Variável de Ambiente
Atualize o arquivo `.env`:

```env
DATABASE_URL="postgresql://crm_user:sua_senha_segura@localhost:5432/crm_erp?schema=public"
```

### 3. Geração e Execução das Migrações

#### 3.1. Instalação do Cliente PostgreSQL
```bash
npm install pg
```

#### 3.2. Criação da Migração Inicial
```bash
npx prisma migrate dev --name init-postgresql
```

Este comando irá:
- Comparar o schema com o banco de dados PostgreSQL
- Criar um arquivo de migração
- Aplicar a migração ao banco de dados

#### 3.3. Verificação da Migração
```bash
npx prisma db pull
npx prisma generate
```

### 4. Migração dos Dados

#### 4.1. Exportação dos Dados do SQLite
```bash
# Instale o sqlite3 se necessário
npm install -g sqlite3

# Exporte os dados
sqlite3 dev.db ".dump" > backup_sqlite.sql
```

#### 4.2. Transformação dos Dados
Crie um script para converter os dados do SQLite para PostgreSQL:

```javascript
// scripts/migrate-data.js
const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const prisma = new PrismaClient();

async function migrateData() {
  try {
    console.log('Iniciando migração de dados...');
    
    // Conectar ao SQLite
    const db = new sqlite3.Database('./dev.db');
    
    // Migrar Usuários
    console.log('Migrando usuários...');
    const usuarios = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM usuarios", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const usuario of usuarios) {
      await prisma.usuario.create({
        data: {
          id: usuario.id,
          email: usuario.email,
          senha: usuario.senha,
          nome: usuario.nome,
          ativo: usuario.ativo,
          createdAt: new Date(usuario.createdAt),
          updatedAt: new Date(usuario.updatedAt),
          colaboradorId: usuario.colaboradorId
        }
      });
    }
    
    // Migrar Clientes
    console.log('Migrando clientes...');
    const clientes = await new Promise((resolve, reject) => {
      db.all("SELECT * FROM clientes", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const cliente of clientes) {
      await prisma.cliente.create({
        data: {
          id: cliente.id,
          nome: cliente.nome,
          email: cliente.email,
          telefone: cliente.telefone,
          documento: cliente.documento,
          tipo: cliente.tipo,
          status: cliente.status,
          endereco: cliente.endereco,
          cidade: cliente.cidade,
          estado: cliente.estado,
          cep: cliente.cep,
          observacoes: cliente.observacoes,
          valorPotencial: cliente.valorPotencial,
          grupoHierarquicoId: cliente.grupoHierarquicoId,
          createdAt: new Date(cliente.createdAt),
          updatedAt: new Date(cliente.updatedAt)
        }
      });
    }
    
    // Repetir para outras entidades...
    
    db.close();
    console.log('Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('Erro durante a migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
```

#### 4.3. Execução do Script de Migração
```bash
node scripts/migrate-data.js
```

### 5. Validação e Testes

#### 5.1. Verificação da Integridade dos Dados
```sql
-- Verificar contagem de registros
SELECT 
  'usuarios' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 
  'clientes' as tabela, COUNT(*) as total FROM clientes
UNION ALL
SELECT 
  'colaboradores' as tabela, COUNT(*) as total FROM colaboradores
UNION ALL
SELECT 
  'grupos_hierarquicos' as tabela, COUNT(*) as total FROM grupos_hierarquicos
UNION ALL
SELECT 
  'permissoes' as tabela, COUNT(*) as total FROM permissoes;
```

#### 5.2. Testes de Funcionalidade
```bash
# Execute os testes da aplicação
npm test

# Verifique se a aplicação inicia corretamente
npm run dev
```

## Considerações Específicas do PostgreSQL

### 1. Tipos de Dados

#### Diferenças Importantes:
- **String vs TEXT**: No PostgreSQL, prefira `TEXT` para strings longas
- **Boolean**: PostgreSQL tem suporte nativo a booleanos
- **Data/Hora**: PostgreSQL tem tipos de data/hora mais precisos

#### Exemplo de Mapeamento:
```prisma
model Usuario {
  id        String   @id @default(cuid())
  email     String   @unique
  senha     String
  nome      String
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 2. Índices e Performance

#### Criação de Índices Adicionais:
```sql
-- Índices para performance
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_grupo ON clientes(grupoHierarquicoId);
CREATE INDEX idx_colaboradores_ativo ON colaboradores(ativo);
CREATE INDEX idx_colaboradores_grupo ON colaboradores(grupoHierarquicoId);
CREATE INDEX idx_grupos_parent ON grupos_hierarquicos(parentId);
```

### 3. Constraints e Validação

#### Exemplo de Constraints:
```sql
-- Adicionar check constraints
ALTER TABLE clientes 
ADD CONSTRAINT chk_valor_potencial 
CHECK (valorPotencial IS NULL OR valorPotencial >= 0);

-- Adicionar unique constraints
ALTER TABLE colaboradores 
ADD CONSTRAINT uk_colaborador_documento 
UNIQUE (documento) WHERE documento IS NOT NULL;
```

## Script de Migração Automatizada

Crie um script completo para automatizar o processo:

```bash
#!/bin/bash
# scripts/migrate-to-postgresql.sh

echo "=== Iniciando Migração para PostgreSQL ==="

# 1. Backup do SQLite
echo "1. Criando backup do SQLite..."
sqlite3 dev.db ".backup dev.db.backup"

# 2. Atualizar configuração
echo "2. Atualizando configuração do Prisma..."
cp prisma/schema.prisma prisma/schema.prisma.backup
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma

# 3. Configurar variável de ambiente
echo "3. Configurando variável de ambiente..."
read -p "Digite a URL do PostgreSQL: " db_url
echo "DATABASE_URL=\"$db_url\"" > .env

# 4. Gerar migração
echo "4. Gerando migração..."
npx prisma migrate dev --name migration-to-postgresql

# 5. Executar script de migração de dados
echo "5. Migrando dados..."
node scripts/migrate-data.js

# 6. Validar
echo "6. Validando migração..."
npx prisma db push

echo "=== Migração concluída! ==="
```

## Troubleshooting

### Problemas Comuns

#### 1. Erros de Conexão
```bash
# Verificar se o PostgreSQL está rodando
sudo systemctl status postgresql

# Testar conexão
psql -h localhost -U crm_user -d crm_erp
```

#### 2. Problemas com Tipos de Dados
```sql
-- Verificar tipos de dados das colunas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public';
```

#### 3. Erros de Permissão
```sql
-- Verificar permissões do usuário
SELECT * FROM pg_user WHERE usename = 'crm_user';

-- Conceder permissões adicionais se necessário
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO crm_user;
```

## Monitoramento e Manutenção

### 1. Monitoramento de Performance
```sql
-- Consultas lentas
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Uso de índices
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
ORDER BY idx_scan;
```

### 2. Backup Automático
```bash
# Script de backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
pg_dump -h localhost -U crm_user -d crm_erp > $BACKUP_DIR/backup_$DATE.sql
```

### 3. Otimizações Recomendadas
```sql
-- Configurações do PostgreSQL
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Recarregar configuração
SELECT pg_reload_conf();
```

## Conclusão

A migração para PostgreSQL oferece benefícios significativos em termos de escalabilidade, performance e recursos empresariais. Siga este guia cuidadosamente e faça testes completos antes de colocar o sistema em produção.

Para suporte adicional, consulte:
- [Documentação oficial do PostgreSQL](https://www.postgresql.org/docs/)
- [Documentação do Prisma](https://www.prisma.io/docs/)
- [Melhores práticas de PostgreSQL](https://www.postgresql.org/docs/current/best-practices.html)
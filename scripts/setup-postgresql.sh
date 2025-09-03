#!/bin/bash

# Script para configurar PostgreSQL para o projeto CRM/ERP

echo "🐘 === Configurando PostgreSQL para CRM/ERP ==="

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL não está instalado."
    echo "📦 Para instalar no Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "📦 Para instalar no macOS: brew install postgresql"
    echo "📦 Para instalar no CentOS/RHEL: sudo yum install postgresql-server postgresql-contrib"
    exit 1
fi

# Verificar se PostgreSQL está rodando
if ! sudo systemctl is-active --quiet postgresql 2>/dev/null && ! brew services list | grep postgresql | grep started &> /dev/null; then
    echo "⚠️  PostgreSQL não está rodando."
    echo "🚀 Tentando iniciar PostgreSQL..."
    
    # Tentar iniciar no Linux
    if command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    # Tentar iniciar no macOS
    elif command -v brew &> /dev/null; then
        brew services start postgresql
    fi
fi

echo "📋 Configurando banco de dados e usuário..."

# Criar script SQL temporário
cat > /tmp/setup_crm_db.sql << EOF
-- Criar banco de dados
DROP DATABASE IF EXISTS crm_erp;
CREATE DATABASE crm_erp;

-- Criar usuário
DROP USER IF EXISTS crm_user;
CREATE USER crm_user WITH PASSWORD 'crm_password';

-- Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE crm_erp TO crm_user;

-- Conectar ao banco crm_erp para configurar permissões no schema
\c crm_erp;

-- Conceder privilégios no schema public
GRANT ALL ON SCHEMA public TO crm_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO crm_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO crm_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO crm_user;

-- Configurar privilégios padrão para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO crm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO crm_user;

EOF

# Executar script SQL
echo "🔧 Executando configuração do banco..."
if sudo -u postgres psql -f /tmp/setup_crm_db.sql; then
    echo "✅ Banco de dados configurado com sucesso!"
else
    echo "❌ Erro ao configurar banco de dados."
    echo "💡 Tente executar manualmente:"
    echo "   sudo -u postgres psql"
    echo "   Depois execute os comandos do arquivo /tmp/setup_crm_db.sql"
    exit 1
fi

# Limpar arquivo temporário
rm /tmp/setup_crm_db.sql

# Testar conexão
echo "🧪 Testando conexão..."
if PGPASSWORD=crm_password psql -h localhost -U crm_user -d crm_erp -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Conexão testada com sucesso!"
else
    echo "⚠️  Não foi possível testar a conexão automaticamente."
    echo "🔍 Teste manualmente com: PGPASSWORD=crm_password psql -h localhost -U crm_user -d crm_erp"
fi

echo ""
echo "🎉 === Configuração Concluída ==="
echo "📊 Banco de dados: crm_erp"
echo "👤 Usuário: crm_user"
echo "🔑 Senha: crm_password"
echo "🌐 Host: localhost"
echo "🔌 Porta: 5432"
echo ""
echo "🔗 String de conexão:"
echo "   postgresql://crm_user:crm_password@localhost:5432/crm_erp?schema=public"
echo ""
echo "▶️  Próximos passos:"
echo "   1. npx prisma migrate dev --name init-postgresql"
echo "   2. node scripts/migrate-data.js"
echo "   3. npx prisma generate"
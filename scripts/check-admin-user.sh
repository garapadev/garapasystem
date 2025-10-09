#!/bin/sh
# check-admin-user.sh
# Script para verificar se existe usuário admin no banco de dados

set -e

echo "🔍 Verificando se existe usuário admin no banco de dados..."

# Verificar se o banco está acessível
echo "🔗 Testando conectividade com o banco..."
timeout 10 sh -c "echo 'SELECT 1;' | npx prisma db execute --url=\"$DATABASE_URL\" --stdin" 2>&1 || {
    echo "❌ Erro ao conectar com o banco de dados"
    exit 1
}

echo "✅ Conexão com banco estabelecida"

# Verificar se existe usuário admin
echo "👤 Verificando existência de usuário admin..."

# Usar Prisma para verificar se existe usuário admin
ADMIN_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const adminCount = await prisma.usuario.count({
      where: {
        OR: [
          { email: 'admin@garapasystem.com' },
          { email: 'admin@admin.com' },
          { 
            colaborador: {
              perfil: {
                nome: 'Administrador'
              }
            }
          }
        ]
      }
    });
    console.log(adminCount);
    await prisma.\$disconnect();
  } catch (error) {
    console.log('0');
    await prisma.\$disconnect();
  }
}

checkAdmin();
" 2>/dev/null || echo "0")

if [ "$ADMIN_COUNT" -gt 0 ]; then
    echo "✅ Usuário admin encontrado no banco de dados (total: $ADMIN_COUNT)"
    exit 0
else
    echo "❌ Nenhum usuário admin encontrado no banco de dados"
    exit 1
fi
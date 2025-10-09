#!/bin/sh
# baseline-migrations.sh
# Script para resolver migrações pendentes do Prisma marcando-as como aplicadas

set -e

echo "🔄 Iniciando processo de baseline das migrações Prisma..."

# Lista de migrações que precisam ser marcadas como aplicadas
MIGRATIONS=(
    "20250903140411_init_postgresql"
    "20250908162636_update_endereco_schema"
    "20250908180219_add_email_system"
    "20250910183451_add_helpdesk_module"
    "20250912154623_helpdesk_logs"
    "20250914153549_add_tasks_module"
    "20250916022500_add_whatsapp_models"
    "20250925174941_add_ordem_servico_module"
    "20250925180927_add_aprovacao_ordem_servico"
    "20250925181650_add_empresa_table"
    "20250926152120_add_laudo_tecnico_module"
    "20250926153452_add_orcamento_model"
    "20251006135145_add_module_system"
)

echo "📋 Verificando status atual das migrações..."
npx prisma migrate status || echo "⚠️  Migrações pendentes detectadas (esperado)"

echo ""
echo "🎯 Aplicando baseline para ${#MIGRATIONS[@]} migrações..."

# Aplicar baseline para cada migração
for migration in "${MIGRATIONS[@]}"; do
    echo "✅ Marcando como aplicada: $migration"
    npx prisma migrate resolve --applied "$migration" || {
        echo "⚠️  Migração $migration já estava marcada como aplicada ou não existe"
    }
done

echo ""
echo "🔍 Verificando status final das migrações..."
npx prisma migrate status

echo ""
echo "✨ Processo de baseline concluído!"
echo "🚀 O sistema agora está pronto para futuras migrações com 'npx prisma migrate deploy'"
#!/usr/bin/env node
/**
 * grant-all-permissions-to-admin.js
 * Concede TODAS as permissões existentes no banco ao perfil "Administrador".
 * - Cria perfil Administrador se não existir
 * - Vincula cada permissao (tabela permissoes) ao perfil via perfil_permissao
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function ensureAdminProfile() {
  let admin = await prisma.perfil.findFirst({ where: { nome: 'Administrador' } });
  if (!admin) {
    console.log('⚠️  Perfil Administrador não encontrado, criando...');
    admin = await prisma.perfil.create({
      data: { nome: 'Administrador', descricao: 'Acesso total ao sistema', ativo: true },
    });
  }
  return admin;
}

async function grantAllPermissionsToAdmin() {
  const admin = await ensureAdminProfile();

  const allPerms = await prisma.permissao.findMany({
    select: { id: true, nome: true },
    orderBy: { nome: 'asc' },
  });

  console.log(`📊 Total de permissões existentes: ${allPerms.length}`);

  let linked = 0;
  for (const perm of allPerms) {
    try {
      await prisma.perfilPermissao.upsert({
        where: { perfilId_permissaoId: { perfilId: admin.id, permissaoId: perm.id } },
        update: {},
        create: { perfilId: admin.id, permissaoId: perm.id },
      });
      linked++;
    } catch (e) {
      console.warn('Não foi possível vincular:', perm?.nome, e?.message || e);
    }
  }

  const adminWithCount = await prisma.perfil.findUnique({
    where: { id: admin.id },
    include: { permissoes: true },
  });

  console.log(`✅ Vinculações processadas: ${linked}`);
  console.log(`✅ Total vinculado ao Administrador: ${adminWithCount.permissoes.length}`);
}

async function main() {
  try {
    await grantAllPermissionsToAdmin();
    console.log('✅ Todas as permissões foram concedidas ao perfil Administrador.');
  } catch (error) {
    console.error('❌ Erro ao conceder permissões ao Administrador:', error?.message || error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { grantAllPermissionsToAdmin: grantAllPermissionsToAdmin };
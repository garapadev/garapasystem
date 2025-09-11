const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function checkEmailConfigs() {
  try {
    console.log('Verificando configurações de email...');
    
    const configs = await db.emailConfig.findMany({
      where: {
        ativo: true,
        syncEnabled: true
      },
      select: {
        id: true,
        email: true,
        ativo: true,
        syncEnabled: true,
        colaboradorId: true,
        imapHost: true,
        imapPort: true
      }
    });
    
    console.log(`Encontradas ${configs.length} configurações ativas:`);
    configs.forEach((config, index) => {
      console.log(`${index + 1}. Email: ${config.email}`);
      console.log(`   ID: ${config.id}`);
      console.log(`   Colaborador: ${config.colaboradorId}`);
      console.log(`   IMAP: ${config.imapHost}:${config.imapPort}`);
      console.log(`   Ativo: ${config.ativo}`);
      console.log(`   Sync Habilitado: ${config.syncEnabled}`);
      console.log('---');
    });
    
    // Verificar também departamentos do helpdesk
    const departamentos = await db.helpdeskDepartamento.findMany({
      where: {
        ativo: true
      },
      select: {
        id: true,
        nome: true,
        imapEmail: true,
        imapHost: true,
        imapPort: true,
        lastSync: true,
        syncEnabled: true
      }
    });
    
    console.log(`\nDepartamentos de helpdesk ativos: ${departamentos.length}`);
    departamentos.forEach((dept, index) => {
      console.log(`${index + 1}. Departamento: ${dept.nome}`);
      console.log(`   Email: ${dept.imapEmail}`);
      console.log(`   IMAP: ${dept.imapHost}:${dept.imapPort}`);
      console.log(`   Sync Habilitado: ${dept.syncEnabled}`);
      console.log(`   Última sincronização: ${dept.lastSync || 'Nunca'}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Erro ao verificar configurações:', error);
  } finally {
    await db.$disconnect();
  }
}

checkEmailConfigs();
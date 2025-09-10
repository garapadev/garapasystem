const { PrismaClient } = require('@prisma/client');

async function checkSyncEnabled() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Verificando configurações de email...');
    
    // Buscar todas as configurações de email
    const configs = await prisma.emailConfig.findMany({
      include: {
        colaborador: {
          select: {
            nome: true
          }
        }
      }
    });
    
    console.log(`Encontradas ${configs.length} configurações:`);
    
    configs.forEach((config, index) => {
      console.log(`\nConfiguração ${index + 1}:`);
      console.log('- ID:', config.id);
      console.log('- Email:', config.email);
      console.log('- Ativo:', config.ativo);
      console.log('- Sync Enabled:', config.syncEnabled);
      console.log('- Last Sync:', config.lastSync);
      console.log('- Colaborador:', config.colaborador?.nome || 'N/A');
    });
    
    // Verificar configurações ativas com sync habilitado
    const activeWithSync = await prisma.emailConfig.findMany({
      where: {
        ativo: true,
        syncEnabled: true
      }
    });
    
    console.log(`\n✅ Configurações ativas com sync habilitado: ${activeWithSync.length}`);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSyncEnabled();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSyncConfig() {
  try {
    console.log('Verificando configuração de sincronização...');
    
    // Buscar configuração de email
    const config = await prisma.emailConfig.findFirst({
      include: {
        colaborador: true
      }
    });
    
    if (!config) {
      console.log('❌ Nenhuma configuração de email encontrada');
      return;
    }
    
    console.log('📧 Configuração de email encontrada:');
    console.log('- ID:', config.id);
    console.log('- Email:', config.email);
    console.log('- syncEnabled:', config.syncEnabled);
    console.log('- ativo:', config.ativo);
    console.log('- syncInterval:', config.syncInterval);
    console.log('- lastSync:', config.lastSync);
    console.log('- colaboradorId:', config.colaboradorId);
    console.log('- colaborador:', config.colaborador?.nome || 'Não encontrado');
    
    // Verificar se precisa atualizar syncEnabled
    if (!config.syncEnabled) {
      console.log('\n⚠️  syncEnabled está como false. Atualizando para true...');
      
      await prisma.emailConfig.update({
        where: { id: config.id },
        data: { syncEnabled: true }
      });
      
      console.log('✅ syncEnabled atualizado para true');
    } else {
      console.log('✅ syncEnabled já está como true');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSyncConfig();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSchedulerStatus() {
  try {
    console.log('🔍 Debugando status do scheduler...');
    
    // 1. Verificar configuração no banco
    const emailConfig = await prisma.emailConfig.findFirst({
      where: {
        ativo: true,
        syncEnabled: true
      },
      include: {
        colaborador: true
      }
    });
    
    if (!emailConfig) {
      console.log('❌ Nenhuma configuração ativa encontrada');
      return;
    }
    
    console.log('📧 Configuração encontrada:');
    console.log('- ID:', emailConfig.id);
    console.log('- Email:', emailConfig.email);
    console.log('- Ativo:', emailConfig.ativo);
    console.log('- Sync Enabled:', emailConfig.syncEnabled);
    console.log('- Colaborador ID:', emailConfig.colaboradorId);
    
    // 2. Simular o que o endpoint faz
    console.log('\n🔧 Simulando lógica do endpoint /api/email-sync/auto:');
    console.log('- Busca colaborador pelo email da sessão: ✓');
    console.log('- Busca emailConfig pelo colaboradorId: ✓');
    console.log('- Chama emailSyncScheduler.getSyncStatus(emailConfig.id)');
    console.log('- emailConfig.id:', emailConfig.id);
    
    // 3. O problema é que o scheduler pode não ter o job registrado
    console.log('\n❗ PROBLEMA IDENTIFICADO:');
    console.log('O emailSyncScheduler.getSyncStatus() retorna null se não há job registrado.');
    console.log('Isso acontece quando:');
    console.log('1. O servidor reinicia (nodemon)');
    console.log('2. O worker não foi iniciado corretamente');
    console.log('3. O job foi removido por algum erro');
    
    console.log('\n💡 SOLUÇÃO:');
    console.log('O endpoint deve verificar se syncEnabled=true no banco,');
    console.log('independente do status do scheduler em memória.');
    console.log('Se syncEnabled=true mas não há job ativo, deve recriar o job.');
    
    // 4. Verificar se o auto-sync-initializer está funcionando
    console.log('\n🚀 Verificando auto-sync-initializer:');
    console.log('- O auto-sync-initializer deveria iniciar todos os jobs ativos');
    console.log('- Mas pode estar sendo interrompido pelos restarts do nodemon');
    console.log('- Logs mostram: "Shutdown graceful" seguido de reinicialização');
    
    console.log('\n🔧 CORREÇÃO NECESSÁRIA:');
    console.log('1. Modificar endpoint GET /api/email-sync/auto para:');
    console.log('   - Verificar syncEnabled no banco');
    console.log('   - Se true mas sem job ativo, recriar o job');
    console.log('   - Retornar isActive baseado no banco, não apenas no scheduler');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSchedulerStatus();
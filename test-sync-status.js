const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function testSyncStatus() {
  try {
    console.log('🔍 Testando status da sincronização...');
    
    // 1. Verificar configurações no banco
    const emailConfig = await prisma.emailConfig.findFirst({
      where: {
        ativo: true,
        syncEnabled: true
      },
      include: {
        colaborador: {
          include: {
            usuarios: true
          }
        }
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
    console.log('- Usuários:', emailConfig.colaborador.usuarios.map(u => u.email));
    
    // 2. Testar endpoint local (se o servidor estiver rodando)
    try {
      console.log('\n🌐 Testando endpoint /api/email-sync/auto...');
      
      // Simular uma requisição sem autenticação para ver o erro
      const response = await fetch('http://localhost:3000/api/email-sync/auto', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Resposta:', JSON.stringify(data, null, 2));
      
    } catch (fetchError) {
      console.log('⚠️  Não foi possível testar o endpoint (servidor pode não estar rodando):', fetchError.message);
    }
    
    // 3. Verificar se há jobs ativos no scheduler (simulação)
    console.log('\n📊 Informações da configuração:');
    console.log('- syncInterval:', emailConfig.syncInterval || 180);
    console.log('- lastSync:', emailConfig.lastSync);
    
    // 4. Verificar se o campo syncEnabled está correto
    if (!emailConfig.syncEnabled) {
      console.log('\n⚠️  PROBLEMA ENCONTRADO: syncEnabled está como false!');
      console.log('Atualizando para true...');
      
      await prisma.emailConfig.update({
        where: { id: emailConfig.id },
        data: { syncEnabled: true }
      });
      
      console.log('✅ syncEnabled atualizado para true');
    } else {
      console.log('\n✅ syncEnabled está correto (true)');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSyncStatus();
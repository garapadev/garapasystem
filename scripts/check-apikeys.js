const { PrismaClient } = require('@prisma/client');

async function checkApiKeys() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando API Keys no banco de dados...');
    
    const apiKeys = await prisma.apiKey.findMany({
      select: {
        id: true,
        nome: true,
        permissoes: true,
        ativo: true,
        createdAt: true,
        expiresAt: true
      }
    });
    
    console.log(`📊 Total de API Keys encontradas: ${apiKeys.length}`);
    
    if (apiKeys.length === 0) {
      console.log('❌ Nenhuma API Key encontrada no banco de dados');
      console.log('💡 Isso explica o erro 403 - não há autenticação configurada');
    } else {
      console.log('\n📋 API Keys encontradas:');
      apiKeys.forEach((key, index) => {
        console.log(`\n${index + 1}. ${key.nome}`);
        console.log(`   ID: ${key.id}`);
        console.log(`   Ativo: ${key.ativo ? '✅' : '❌'}`);
        console.log(`   Permissões: ${key.permissoes}`);
        console.log(`   Criada em: ${key.createdAt}`);
        console.log(`   Expira em: ${key.expiresAt || 'Nunca'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar API Keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkApiKeyPermissions() {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        nome: 'Test GAZAPI Key'
      }
    });
    
    console.log('API Keys encontradas:');
    apiKeys.forEach(key => {
      console.log('ID:', key.id);
      console.log('Nome:', key.nome);
      console.log('Ativa:', key.ativo);
      console.log('Permissões (raw):', key.permissoes);
      
      try {
        const permissoes = JSON.parse(key.permissoes || '[]');
        console.log('Permissões (parsed):', permissoes);
      } catch (error) {
        console.log('Erro ao fazer parse das permissões:', error);
      }
      console.log('---');
    });
    
  } catch (error) {
    console.error('Erro ao verificar API keys:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeyPermissions();
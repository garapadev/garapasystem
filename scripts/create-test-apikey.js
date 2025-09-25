const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createTestApiKey() {
  try {
    // Gerar chave de API
    const apiKey = crypto.randomBytes(32).toString('base64url');
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Criar no banco
    const result = await prisma.apiKey.create({
      data: {
        nome: 'Test GAZAPI Key',
        chave: hashedKey,
        permissoes: JSON.stringify(['gazapi.read', 'gazapi.write', 'gazapi.admin']),
        ativo: true
      }
    });
    
    console.log('API Key criada com sucesso!');
    console.log('ID:', result.id);
    console.log('Nome:', result.nome);
    console.log('Chave (guarde esta chave):', apiKey);
    console.log('Ativa:', result.ativo);
    
  } catch (error) {
    console.error('Erro ao criar API key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestApiKey();
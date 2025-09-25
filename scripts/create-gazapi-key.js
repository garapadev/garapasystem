const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function createGazapiKey() {
  try {
    // Gerar uma chave aleatória
    const rawKey = 'gazapi_test_' + crypto.randomBytes(16).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    
    // Criar a API key no banco
    const apiKey = await prisma.apiKey.create({
      data: {
        nome: 'Gazapi Test Key',
        chave: hashedKey,
        permissoes: JSON.stringify(['gazapi.admin', 'gazapi.read', 'gazapi.write']),
        ativo: true,
        expiresAt: null
      }
    });
    
    console.log('✅ API Key criada com sucesso!');
    console.log('🔑 Chave:', rawKey);
    console.log('📋 ID:', apiKey.id);
    console.log('📝 Nome:', apiKey.nome);
    console.log('🔐 Permissões:', JSON.parse(apiKey.permissoes));
    
  } catch (error) {
    console.error('❌ Erro ao criar API key:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createGazapiKey();
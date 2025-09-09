const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Função de criptografia (mesma lógica do arquivo TypeScript)
function encryptPassword(password) {
  try {
    const SECRET_KEY = process.env.EMAIL_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'default-secret-key-change-in-production';
    
    // Gerar IV aleatório
    const iv = crypto.randomBytes(16);
    
    // Criar chave de 32 bytes a partir do secret
    const key = crypto.scryptSync(SECRET_KEY, 'salt', 32);
    
    // Criar cipher
    const cipher = crypto.createCipher('aes-256-cbc', key);
    
    // Criptografar
    let encrypted = cipher.update(password, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retornar IV + dados criptografados em base64
    const result = iv.toString('hex') + ':' + encrypted;
    return Buffer.from(result).toString('base64');
    
  } catch (error) {
    console.error('Erro ao criptografar senha:', error);
    throw new Error('Falha na criptografia da senha');
  }
}

async function migrateEmailPassword() {
  try {
    console.log('Iniciando migração da senha de email...');
    
    // Buscar todas as configurações de email
    const emailConfigs = await prisma.emailConfig.findMany();
    
    if (emailConfigs.length === 0) {
      console.log('Nenhuma configuração de email encontrada');
      return;
    }
    
    for (const config of emailConfigs) {
      console.log(`\nProcessando configuração: ${config.email}`);
      
      // Verificar se a senha está em formato bcrypt
      if (config.password.startsWith('$2')) {
        console.log('Senha está em formato bcrypt, migrando...');
        
        // A senha original que foi usada (substitua pela senha real)
        const originalPassword = 'Aadmin@sup09'; // IMPORTANTE: Use a senha real aqui
        
        // Criptografar com o novo método
        const encryptedPassword = encryptPassword(originalPassword);
        
        // Atualizar no banco
        await prisma.emailConfig.update({
          where: { id: config.id },
          data: { password: encryptedPassword }
        });
        
        console.log('✅ Senha migrada com sucesso!');
      } else {
        console.log('Senha já está no formato correto ou não é bcrypt');
      }
    }
    
    console.log('\n🎉 Migração concluída!');
    console.log('\n⚠️  IMPORTANTE: Certifique-se de que a senha original está correta no script.');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateEmailPassword();
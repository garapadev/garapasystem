const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateEmailPassword() {
  try {
    // Buscar a configuração de email existente
    const emailConfig = await prisma.emailConfig.findFirst();
    
    if (!emailConfig) {
      console.log('Nenhuma configuração de email encontrada');
      return;
    }
    
    console.log('Configuração atual:', {
      id: emailConfig.id,
      email: emailConfig.email,
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort
    });
    
    // Atualizar com uma senha de teste (substitua pela senha real)
    const testPassword = 'Aadmin@sup09';
    
    await prisma.emailConfig.update({
      where: { id: emailConfig.id },
      data: { password: testPassword }
    });
    
    console.log('Senha atualizada com sucesso!');
    console.log('IMPORTANTE: Substitua "sua_senha_real_aqui" pela senha real do email.');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmailPassword();
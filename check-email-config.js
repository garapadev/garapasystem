const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkEmailConfig() {
  try {
    console.log('Verificando configurações de email...');
    
    // Buscar todos os usuários com suas configurações de email
    const usuarios = await prisma.usuario.findMany({
      include: {
        colaborador: {
          include: {
            emailConfig: true
          }
        }
      }
    });
    
    console.log('Usuários encontrados:', usuarios.length);
    
    usuarios.forEach((usuario, index) => {
      console.log(`\nUsuário ${index + 1}:`);
      console.log('- ID:', usuario.id);
      console.log('- Email:', usuario.email);
      console.log('- Colaborador ID:', usuario.colaborador?.id || 'Não encontrado');
      console.log('- Email Config:', usuario.colaborador?.emailConfig ? 'Existe' : 'Não existe');
      
      if (usuario.colaborador?.emailConfig) {
        const config = usuario.colaborador.emailConfig;
        console.log('  - Email configurado:', config.email);
        console.log('  - IMAP Host:', config.imapHost);
        console.log('  - SMTP Host:', config.smtpHost);
        console.log('  - Ativo:', config.ativo);
        console.log('  - Criado em:', config.createdAt);
      }
    });
    
  } catch (error) {
    console.error('Erro ao verificar configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmailConfig();
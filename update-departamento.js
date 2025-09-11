const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDepartamento() {
  try {
    console.log('Atualizando configurações do departamento...');
    
    // Buscar o departamento existente
    const departamento = await prisma.helpdeskDepartamento.findFirst({
      where: {
        nome: 'Suporte ti'
      }
    });
    
    if (!departamento) {
      console.log('Departamento não encontrado!');
      return;
    }
    
    console.log('Departamento encontrado:', departamento.id);
    
    // Atualizar com as configurações corretas
    const updated = await prisma.helpdeskDepartamento.update({
      where: {
        id: departamento.id
      },
      data: {
        imapEmail: 'suporteti@garapasystem.com',
        imapHost: 'mail.garapasystem.com',
        imapPort: 993,
        imapSecure: true,
        imapPassword: 'Aadmin@sup09', // Você pode criptografar isso depois
        syncEnabled: true,
        syncInterval: 300 // 5 minutos
      }
    });
    
    console.log('Departamento atualizado com sucesso!');
    console.log('Configurações:');
    console.log('- Email IMAP:', updated.imapEmail);
    console.log('- Host IMAP:', updated.imapHost);
    console.log('- Porta IMAP:', updated.imapPort);
    console.log('- Sync habilitado:', updated.syncEnabled);
    console.log('- Intervalo de sync:', updated.syncInterval, 'segundos');
    
  } catch (error) {
    console.error('Erro ao atualizar departamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDepartamento();
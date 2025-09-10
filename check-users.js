const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.usuario.findMany();
    console.log('Usuários encontrados:');
    users.forEach(u => {
      console.log('Email:', u.email, 'Ativo:', u.ativo);
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Testando conexão com PostgreSQL...');
    const user = await prisma.usuario.findUnique({
      where: {
        email: 'admin@sistema.com'
      }
    })

    if (user) {
      console.log('Usuário encontrado:', {
        email: user.email,
        senha: user.senha,
        ativo: user.ativo
      })
    } else {
      console.log('Usuário não encontrado')
    }
    
  } catch (error) {
    console.error('Erro na conexão:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
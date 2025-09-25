const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.usuario.findUnique({
      where: {
        email: 'admin@garapasystem.com'
      },
      include: {
        colaborador: true
      }
    });
    
    console.log('Admin user:', admin);
    
    if (!admin) {
      console.log('Admin user not found!');
    } else {
      console.log('Admin user found:', {
        id: admin.id,
        email: admin.email,
        nome: admin.nome,
        ativo: admin.ativo,
        colaborador: admin.colaborador
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
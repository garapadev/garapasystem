const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const admin = await prisma.usuario.findUnique({
      where: {
        email: 'admin@garapasystem.com'
      }
    });
    
    if (!admin) {
      console.log('User not found');
      return;
    }
    
    const isPasswordValid = await bcrypt.compare('password', admin.senha);
    console.log('Password valid:', isPasswordValid);
    
    if (isPasswordValid) {
      console.log('Login would succeed');
    } else {
      console.log('Login would fail - password mismatch');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
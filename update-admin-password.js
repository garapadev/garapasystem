const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function updateAdminPassword() {
  try {
    console.log('🔐 Atualizando senha do administrador...')
    
    const senhaHash = await bcrypt.hash('admin123', 10)
    
    const user = await prisma.usuario.update({
      where: {
        email: 'admin@sistema.com'
      },
      data: {
        senha: senhaHash
      }
    })
    
    console.log('✅ Senha do administrador atualizada com sucesso!')
    console.log('📧 Email: admin@sistema.com')
    console.log('🔑 Senha: admin123')
    
  } catch (error) {
    console.error('❌ Erro ao atualizar senha:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateAdminPassword()
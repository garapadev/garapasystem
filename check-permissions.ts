import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    console.log('=== VERIFICANDO PERMISSÕES ===');
    
    // Verificar se a permissão admin.modules existe
    const adminModulesPermission = await prisma.permissao.findFirst({
      where: { nome: 'admin.modules' }
    });
    
    console.log('Permissão admin.modules:', adminModulesPermission);
    
    // Listar todas as permissões relacionadas a módulos
    const modulePermissions = await prisma.permissao.findMany({
      where: {
        OR: [
          { nome: { contains: 'module' } },
          { nome: { contains: 'modulo' } },
          { nome: { contains: 'admin' } }
        ]
      }
    });
    
    console.log('Permissões relacionadas a módulos/admin:', modulePermissions);
    
    // Verificar todos os usuários
    const users = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true
      }
    });
    
    console.log('Usuários:', users);
    
    // Verificar perfis com permissões de admin
    const adminProfiles = await prisma.perfil.findMany({
      include: {
        permissoes: {
          include: {
            permissao: true
          }
        }
      }
    });
    
    console.log('Perfis e suas permissões:');
    adminProfiles.forEach(perfil => {
      console.log(`Perfil: ${perfil.nome}`);
      perfil.permissoes.forEach(pp => {
        console.log(`  - ${pp.permissao.nome}: ${pp.permissao.descricao}`);
      });
    });
    
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
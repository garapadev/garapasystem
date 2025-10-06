import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurrentUser() {
  try {
    console.log('=== VERIFICANDO USUÁRIO ATUAL ===');
    
    // Buscar o usuário admin
    const adminUser = await prisma.usuario.findFirst({
      where: { email: 'admin@garapasystem.com' },
      include: {
        colaborador: {
          include: {
            perfil: {
              include: {
                permissoes: {
                  include: {
                    permissao: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    console.log('Usuário admin encontrado:', adminUser?.nome);
    console.log('Tem colaborador:', !!adminUser?.colaborador);
    
    if (adminUser?.colaborador?.perfil) {
      console.log('Perfil:', adminUser.colaborador.perfil.nome);
      console.log('Permissões do perfil:');
      adminUser.colaborador.perfil.permissoes.forEach(pp => {
        console.log(`  - ${pp.permissao.nome}: ${pp.permissao.descricao}`);
      });
      
      // Verificar se tem permissão de sistema_administrar
      const hasSystemAdmin = adminUser.colaborador.perfil.permissoes.some(
        pp => pp.permissao.nome === 'sistema_administrar'
      );
      console.log('Tem permissão sistema_administrar:', hasSystemAdmin);
    } else {
      console.log('Usuário não tem perfil associado');
    }
    
  } catch (error) {
    console.error('Erro ao verificar usuário atual:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentUser();
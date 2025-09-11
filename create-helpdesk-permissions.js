const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function createHelpdeskPermissions() {
  try {
    console.log('=== CRIANDO PERMISSÕES DO HELPDESK ===');
    
    // Definir as permissões necessárias
    const permissions = [
      {
        nome: 'helpdesk.visualizar',
        descricao: 'Visualizar tickets do helpdesk',
        recurso: 'helpdesk',
        acao: 'visualizar'
      },
      {
        nome: 'helpdesk.gerenciar',
        descricao: 'Gerenciar helpdesk completo',
        recurso: 'helpdesk',
        acao: 'gerenciar'
      },
      {
        nome: 'helpdesk.criar',
        descricao: 'Criar tickets',
        recurso: 'helpdesk',
        acao: 'criar'
      },
      {
        nome: 'helpdesk.editar',
        descricao: 'Editar tickets',
        recurso: 'helpdesk',
        acao: 'editar'
      },
      {
        nome: 'helpdesk.excluir',
        descricao: 'Excluir tickets',
        recurso: 'helpdesk',
        acao: 'excluir'
      }
    ];
    
    // Criar as permissões
    const createdPermissions = [];
    for (const perm of permissions) {
      // Verificar se já existe
      const existing = await db.permissao.findFirst({
        where: { nome: perm.nome }
      });
      
      if (!existing) {
        const created = await db.permissao.create({
          data: perm
        });
        createdPermissions.push(created);
        console.log(`✅ Criada: ${perm.nome}`);
      } else {
        console.log(`⚠️  Já existe: ${perm.nome}`);
        createdPermissions.push(existing);
      }
    }
    
    // Buscar o perfil administrador
    console.log('\n=== ASSOCIANDO PERMISSÕES AO PERFIL ADMINISTRADOR ===');
    const adminProfile = await db.perfil.findFirst({
      where: { nome: 'Administrador' }
    });
    
    if (!adminProfile) {
      console.log('❌ Perfil Administrador não encontrado!');
      return;
    }
    
    // Associar todas as permissões do helpdesk ao perfil administrador
    for (const permission of createdPermissions) {
      // Verificar se já está associada
      const existing = await db.perfilPermissao.findFirst({
        where: {
          perfilId: adminProfile.id,
          permissaoId: permission.id
        }
      });
      
      if (!existing) {
        await db.perfilPermissao.create({
          data: {
            perfilId: adminProfile.id,
            permissaoId: permission.id
          }
        });
        console.log(`✅ Associada ao perfil: ${permission.nome}`);
      } else {
        console.log(`⚠️  Já associada: ${permission.nome}`);
      }
    }
    
    console.log('\n=== VERIFICAÇÃO FINAL ===');
    const updatedProfile = await db.perfil.findFirst({
      where: { nome: 'Administrador' },
      include: {
        permissoes: {
          include: {
            permissao: true
          }
        }
      }
    });
    
    const helpdeskPermissions = updatedProfile.permissoes.filter(p => 
      p.permissao.nome.includes('helpdesk') || p.permissao.nome === 'sistema_administrar'
    );
    
    console.log('Permissões do helpdesk no perfil Administrador:');
    helpdeskPermissions.forEach(p => {
      console.log(`- ${p.permissao.nome}: ${p.permissao.descricao}`);
    });
    
    console.log('\n✅ Configuração concluída!');
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.$disconnect();
  }
}

createHelpdeskPermissions();
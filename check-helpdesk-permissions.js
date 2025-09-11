const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkHelpdeskPermissions() {
  try {
    // Verificar se existem permissões específicas do helpdesk
    console.log('=== PERMISSÕES DO HELPDESK NO SISTEMA ===');
    const helpdeskPermissions = await db.permissao.findMany({
      where: {
        OR: [
          { nome: { contains: 'helpdesk' } },
          { recurso: 'helpdesk' }
        ]
      }
    });
    
    console.log('Permissões encontradas:');
    helpdeskPermissions.forEach(p => {
      console.log(`- ${p.nome}: ${p.descricao} (Recurso: ${p.recurso}, Ação: ${p.acao})`);
    });
    
    // Verificar se o perfil administrador tem permissões do helpdesk
    console.log('\n=== VERIFICANDO PERFIL ADMINISTRADOR ===');
    const adminProfile = await db.perfil.findFirst({
      where: { nome: 'Administrador' },
      include: {
        permissoes: {
          include: {
            permissao: true
          }
        }
      }
    });
    
    if (adminProfile) {
      console.log('Perfil encontrado:', adminProfile.nome);
      const hasHelpdeskPermissions = adminProfile.permissoes.filter(p => 
        p.permissao.nome.includes('helpdesk') || 
        p.permissao.nome === 'sistema_administrar' ||
        p.permissao.nome === 'admin'
      );
      
      console.log('Permissões relacionadas ao helpdesk:');
      hasHelpdeskPermissions.forEach(p => {
        console.log(`- ${p.permissao.nome}: ${p.permissao.descricao}`);
      });
      
      if (hasHelpdeskPermissions.length === 0) {
        console.log('⚠️  PROBLEMA: Perfil administrador não tem permissões específicas do helpdesk!');
        console.log('Verificando se sistema_administrar é suficiente...');
        
        const hasSystemAdmin = adminProfile.permissoes.some(p => 
          p.permissao.nome === 'sistema_administrar'
        );
        
        if (hasSystemAdmin) {
          console.log('✅ Tem permissão sistema_administrar - deveria funcionar');
        } else {
          console.log('❌ Não tem nem sistema_administrar!');
        }
      }
    }
    
    // Verificar se precisamos criar permissões específicas do helpdesk
    console.log('\n=== VERIFICANDO NECESSIDADE DE CRIAR PERMISSÕES ===');
    const requiredPermissions = [
      { nome: 'helpdesk.visualizar', descricao: 'Visualizar tickets do helpdesk', recurso: 'helpdesk', acao: 'visualizar' },
      { nome: 'helpdesk.gerenciar', descricao: 'Gerenciar helpdesk completo', recurso: 'helpdesk', acao: 'gerenciar' },
      { nome: 'helpdesk.criar', descricao: 'Criar tickets', recurso: 'helpdesk', acao: 'criar' },
      { nome: 'helpdesk.editar', descricao: 'Editar tickets', recurso: 'helpdesk', acao: 'editar' }
    ];
    
    for (const perm of requiredPermissions) {
      const exists = await db.permissao.findFirst({
        where: { nome: perm.nome }
      });
      
      if (!exists) {
        console.log(`❌ Permissão ${perm.nome} não existe - precisa ser criada`);
      } else {
        console.log(`✅ Permissão ${perm.nome} existe`);
      }
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.$disconnect();
  }
}

checkHelpdeskPermissions();
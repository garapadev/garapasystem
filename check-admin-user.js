const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkAdminUser() {
  try {
    const user = await db.usuario.findFirst({
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
            },
            grupoHierarquico: true
          }
        }
      }
    });

    console.log('=== USUÁRIO ADMINISTRADOR ===');
    console.log('Email:', user?.email);
    console.log('Nome:', user?.nome);
    console.log('ID:', user?.id);
    
    if (user?.colaborador) {
      console.log('\n=== COLABORADOR ===');
      console.log('ID:', user.colaborador.id);
      console.log('Nome:', user.colaborador.nome);
      console.log('Cargo:', user.colaborador.cargo);
      
      if (user.colaborador.perfil) {
        console.log('\n=== PERFIL ===');
        console.log('Nome do Perfil:', user.colaborador.perfil.nome);
        console.log('Descrição:', user.colaborador.perfil.descricao);
        
        console.log('\n=== PERMISSÕES ===');
        user.colaborador.perfil.permissoes.forEach(p => {
          console.log(`- ${p.permissao.nome} (${p.permissao.descricao})`);
        });
      }
      
      if (user.colaborador.grupoHierarquico) {
        console.log('\n=== GRUPO HIERÁRQUICO ===');
        console.log('ID:', user.colaborador.grupoHierarquico.id);
        console.log('Nome:', user.colaborador.grupoHierarquico.nome);
        console.log('Descrição:', user.colaborador.grupoHierarquico.descricao);
      } else {
        console.log('\n=== GRUPO HIERÁRQUICO ===');
        console.log('Nenhum grupo hierárquico associado');
      }
    }
    
    // Verificar departamentos do helpdesk
    console.log('\n=== DEPARTAMENTOS DO HELPDESK ===');
    const departamentos = await db.helpdeskDepartamento.findMany({
      include: {
        grupoHierarquico: {
          select: {
            id: true,
            nome: true
          }
        }
      }
    });
    
    departamentos.forEach(dept => {
      console.log(`\nDepartamento: ${dept.nome}`);
      console.log(`ID: ${dept.id}`);
      console.log(`Email: ${dept.email}`);
      if (dept.grupoHierarquico) {
        console.log(`Grupo Hierárquico: ${dept.grupoHierarquico.nome} (${dept.grupoHierarquico.id})`);
      } else {
        console.log('Grupo Hierárquico: Nenhum (público)');
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.$disconnect();
  }
}

checkAdminUser();
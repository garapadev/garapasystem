const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAllGrupos() {
  try {
    console.log('=== Verificando todos os grupos hierárquicos ===');
    
    const grupos = await prisma.grupoHierarquico.findMany({
      include: {
        parent: true,
        children: true,
        clientes: true,
        colaboradores: true
      },
      orderBy: {
        nome: 'asc'
      }
    });
    
    console.log(`\nTotal de grupos encontrados: ${grupos.length}`);
    
    grupos.forEach((grupo, index) => {
      console.log(`\n--- Grupo ${index + 1} ---`);
      console.log(`ID: ${grupo.id}`);
      console.log(`Nome: ${grupo.nome}`);
      console.log(`Descrição: ${grupo.descricao}`);
      console.log(`Status: ${grupo.ativo ? 'Ativo' : 'Inativo'}`);
      console.log(`Pai: ${grupo.parent ? grupo.parent.nome : 'Nenhum (Raiz)'}`);
      console.log(`Filhos: ${grupo.children.length > 0 ? grupo.children.map(f => f.nome).join(', ') : 'Nenhum'}`);
      console.log(`Clientes: ${grupo.clientes.length}`);
      console.log(`Colaboradores: ${grupo.colaboradores.length}`);
    });
    
    // Verificar estrutura hierárquica
    console.log('\n=== Estrutura Hierárquica ===');
    const gruposRaiz = grupos.filter(g => !g.parentId);
    
    function printHierarchy(grupo, level = 0) {
      const indent = '  '.repeat(level);
      console.log(`${indent}- ${grupo.nome} (ID: ${grupo.id})`);
      
      const filhos = grupos.filter(g => g.parentId === grupo.id);
      filhos.forEach(filho => printHierarchy(filho, level + 1));
    }
    
    gruposRaiz.forEach(grupo => printHierarchy(grupo));
    
  } catch (error) {
    console.error('Erro ao verificar grupos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllGrupos();
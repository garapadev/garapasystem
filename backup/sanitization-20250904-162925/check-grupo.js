const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkGrupo() {
  try {
    const grupo = await prisma.grupoHierarquico.findUnique({
      where: { id: 'cmf448tv8000qo0ozwa161398' }
    });
    
    console.log('Resultado:', grupo);
    
    if (!grupo) {
      console.log('❌ Grupo não encontrado no banco de dados');
    } else {
      console.log('✅ Grupo encontrado:', grupo.nome);
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGrupo();
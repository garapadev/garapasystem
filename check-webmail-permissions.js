const { PrismaClient } = require('@prisma/client');

async function checkWebmailPermissions() {
  const db = new PrismaClient();
  
  try {
    console.log('Verificando permissões do webmail...');
    
    // Buscar permissões que contenham 'webmail' no recurso ou nome
    const webmailPermissions = await db.permissao.findMany({
      where: {
        OR: [
          { recurso: { contains: 'webmail', mode: 'insensitive' } },
          { nome: { contains: 'webmail', mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { recurso: 'asc' },
        { acao: 'asc' }
      ]
    });
    
    console.log(`Encontradas ${webmailPermissions.length} permissões do webmail:`);
    webmailPermissions.forEach(perm => {
      console.log(`- ${perm.nome} (${perm.recurso}.${perm.acao})`);
    });
    
    // Buscar todas as permissões para ver a estrutura
    const allPermissions = await db.permissao.findMany({
      select: {
        recurso: true
      },
      distinct: ['recurso'],
      orderBy: {
        recurso: 'asc'
      }
    });
    
    console.log('\nRecursos disponíveis:');
    allPermissions.forEach(perm => {
      console.log(`- ${perm.recurso}`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar permissões:', error);
  } finally {
    await db.$disconnect();
  }
}

checkWebmailPermissions();
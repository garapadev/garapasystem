import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndUpdateModulos() {
  try {
    console.log('📋 Status atual dos módulos:');
    
    const modulos = await prisma.modulo.findMany({
      select: {
        nome: true,
        titulo: true,
        ativo: true,
        core: true,
        ordem: true
      },
      orderBy: {
        ordem: 'asc'
      }
    });
    
    console.table(modulos);
    
    // Vamos ativar o módulo "clientes" para testar
    console.log('\n🔄 Ativando módulo "clientes"...');
    await prisma.modulo.update({
      where: { nome: 'clientes' },
      data: { ativo: true }
    });
    
    console.log('✅ Módulo "clientes" ativado!');
    
    // Verificar status após a atualização
    console.log('\n📋 Status após ativação:');
    const modulosAtualizados = await prisma.modulo.findMany({
      select: {
        nome: true,
        titulo: true,
        ativo: true,
        core: true,
        ordem: true
      },
      orderBy: {
        ordem: 'asc'
      }
    });
    
    console.table(modulosAtualizados);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateModulos();
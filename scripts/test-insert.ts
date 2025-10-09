import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testInsert() {
  try {
    console.log('Testando inserção...');
    
    const testId = '01JDQHQHQHQHQHQHQHQHQH';
    const testNome = 'dashboard';
    const testTitulo = 'Dashboard';
    
    console.log('Valores a inserir:');
    console.log('ID:', testId);
    console.log('Nome:', testNome);
    console.log('Título:', testTitulo);
    
    await prisma.$executeRaw`
      INSERT INTO modulos_sistema (id, nome, titulo, descricao, ativo, core, icone, ordem, categoria, rota, permissao, "createdAt", "updatedAt")
      VALUES (${testId}, ${testNome}, ${testTitulo}, 'Painel principal do sistema', true, true, 'LayoutDashboard', 1, 'core', '/dashboard', null, NOW(), NOW())
    `;
    
    console.log('✅ Inserção realizada com sucesso!');
    
    // Verificar se foi inserido
    const result = await prisma.$queryRaw`SELECT * FROM modulos_sistema WHERE nome = ${testNome}`;
    console.log('Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInsert();
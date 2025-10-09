const { PrismaClient } = require('@prisma/client');

async function checkClientesTable() {
  const prisma = new PrismaClient();
  
  try {
    // Verificar a estrutura da tabela clientes
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'clientes' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('Estrutura da tabela clientes:');
    console.table(result);
    
    // Verificar se as colunas antigas ainda existem
    const oldColumns = ['cep', 'cidade', 'endereco', 'estado'];
    const existingOldColumns = result.filter(col => oldColumns.includes(col.column_name));
    
    if (existingOldColumns.length > 0) {
      console.log('\n❌ Colunas antigas ainda existem:');
      console.table(existingOldColumns);
    } else {
      console.log('\n✅ Colunas antigas foram removidas com sucesso');
    }
    
    // Verificar se há dados na tabela
    const count = await prisma.clientes.count();
    console.log(`\nTotal de registros na tabela clientes: ${count}`);
    
  } catch (error) {
    console.error('Erro ao verificar tabela clientes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClientesTable();
import { Client } from 'pg';

async function testInsert() {
  console.log('🧪 Testando inserção com pg...');

  const pgClient = new Client({
    host: process.env.DATABASE_HOST || 'garapasystem-postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'crm_erp',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  });

  try {
    await pgClient.connect();
    console.log('✅ Conectado ao PostgreSQL');

    // Limpar registros de teste
    await pgClient.query("DELETE FROM modulos_sistema WHERE nome = 'test-module'");
    console.log('🧹 Limpeza realizada');

    // Inserir um registro de teste
    const result = await pgClient.query(`
      INSERT INTO modulos_sistema (
        id, nome, titulo, descricao, ativo, core, icone, ordem, categoria, rota, "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
      )
    `, [
      'test-id-123',
      'test-module',
      'Módulo de Teste',
      'Teste de inserção',
      true,
      false,
      'TestIcon',
      999,
      'teste',
      '/teste'
    ]);

    console.log('✅ Inserção realizada:', result.rowCount);

    // Verificar se foi inserido
    const check = await pgClient.query("SELECT * FROM modulos_sistema WHERE nome = 'test-module'");
    console.log('📋 Registro encontrado:', check.rows.length > 0 ? 'SIM' : 'NÃO');

    if (check.rows.length > 0) {
      console.log('📄 Dados:', check.rows[0]);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pgClient.end();
    console.log('🔌 Conexão fechada');
  }
}

testInsert().catch(console.error);
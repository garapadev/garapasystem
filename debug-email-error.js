const { PrismaClient } = require('@prisma/client');

async function debugEmailError() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Testando conexão com banco de dados...');
    
    // Teste básico de conexão
    await prisma.$connect();
    console.log('✅ Conexão com banco estabelecida');
    
    // Verificar se existem configurações de email
    const emailConfigs = await prisma.emailConfig.findMany({
      include: {
        colaborador: {
          include: {
            usuarios: true
          }
        }
      }
    });
    
    console.log(`📧 Encontradas ${emailConfigs.length} configurações de email`);
    
    if (emailConfigs.length > 0) {
      const config = emailConfigs[0];
      console.log('📋 Primeira configuração:', {
        id: config.id,
        email: config.email,
        colaboradorId: config.colaboradorId,
        colaborador: config.colaborador ? {
          id: config.colaborador.id,
          nome: config.colaborador.nome,
          usuarios: config.colaborador.usuarios?.length || 0
        } : null
      });
      
      // Testar consulta específica que está falhando
      console.log('🔍 Testando consulta findFirst que falha...');
      const testEmail = await prisma.email.findFirst({
        where: {
          messageId: 'test-message-id',
          emailConfigId: config.id
        }
      });
      
      console.log('✅ Consulta findFirst executada com sucesso:', testEmail ? 'Email encontrado' : 'Email não encontrado');
      
      // Verificar pastas de email
      const folders = await prisma.emailFolder.findMany({
        where: {
          emailConfigId: config.id
        }
      });
      
      console.log(`📁 Encontradas ${folders.length} pastas para esta configuração`);
    }
    
    // Verificar usuários
    const usuarios = await prisma.usuario.findMany({
      include: {
        colaborador: {
          include: {
            emailConfig: true
          }
        }
      }
    });
    
    console.log(`👥 Encontrados ${usuarios.length} usuários`);
    
    const usuariosComEmail = usuarios.filter(u => u.colaborador?.emailConfig);
    console.log(`📧 ${usuariosComEmail.length} usuários têm configuração de email`);
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugEmailError().catch(console.error);
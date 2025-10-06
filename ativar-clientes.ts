import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function ativarClientes() {
  try {
    console.log('🔄 Ativando módulo "clientes"...');
    
    const resultado = await prisma.moduloSistema.update({
      where: { nome: 'clientes' },
      data: { ativo: true }
    });
    
    console.log('✅ Módulo "clientes" ativado com sucesso!');
    console.log('📋 Dados atualizados:', resultado);
    
  } catch (error) {
    console.error('❌ Erro ao ativar módulo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

ativarClientes();
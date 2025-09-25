const { PrismaClient } = require('@prisma/client');

async function checkConfig() {
  const prisma = new PrismaClient();
  
  try {
    const configs = await prisma.configuracao.findMany({
      where: {
        chave: {
          in: ['wuzapi_url', 'wuzapi_admin_token']
        }
      }
    });
    
    console.log('Configurações encontradas:');
    configs.forEach(config => {
      console.log(`${config.chave}: ${config.valor}`);
    });
    
    if (configs.length === 0) {
      console.log('Nenhuma configuração encontrada. Criando configurações padrão...');
      
      await prisma.configuracao.createMany({
        data: [
          {
            chave: 'wuzapi_url',
            valor: 'http://localhost:8080',
            descricao: 'URL da API WuzAPI'
          },
          {
            chave: 'wuzapi_admin_token',
            valor: 'Aadmin@sup09',
            descricao: 'Token de administrador da API WuzAPI'
          }
        ]
      });
      
      console.log('Configurações criadas com sucesso!');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkConfig();
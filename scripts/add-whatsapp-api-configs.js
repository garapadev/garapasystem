const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addWhatsAppApiConfigs() {
  try {
    // Configurações para o tipo de API WhatsApp
    const configs = [
      {
        chave: 'whatsapp_api_type',
        valor: 'wuzapi',
        descricao: 'Tipo de API WhatsApp utilizada (wuzapi ou waha)'
      },
      {
        chave: 'waha_url',
        valor: 'https://waha.devlike.pro',
        descricao: 'URL da API WAHA'
      },
      {
        chave: 'waha_api_key',
        valor: '',
        descricao: 'Chave de API para WAHA'
      }
    ];

    for (const config of configs) {
      await prisma.configuracao.upsert({
        where: { chave: config.chave },
        update: {
          valor: config.valor,
          descricao: config.descricao
        },
        create: config
      });
      console.log(`✓ Configuração ${config.chave} adicionada/atualizada`);
    }

    console.log('✅ Todas as configurações foram adicionadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao adicionar configurações:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addWhatsAppApiConfigs();
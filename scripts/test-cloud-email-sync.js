#!/usr/bin/env node

/**
 * Script para testar a sincronização de e-mail no servidor em nuvem
 * Verifica se as melhorias implementadas resolveram os problemas de timeout e autenticação
 */

const { PrismaClient } = require('@prisma/client');
const { ImapFlow } = require('imapflow');

const prisma = new PrismaClient();

async function testCloudEmailSync() {
  console.log('🚀 Iniciando teste de sincronização de e-mail no servidor em nuvem...');
  console.log('=' .repeat(60));

  try {
    // 1. Verificar conexão com banco de dados
    console.log('\n📊 Testando conexão com banco de dados...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexão com banco de dados: OK');

    // 2. Buscar configurações ativas
    console.log('\n📧 Buscando configurações de e-mail ativas...');
    const configs = await prisma.emailConfig.findMany({
      where: {
        ativo: true,
        syncEnabled: true
      },
      include: {
        colaborador: {
          select: {
            id: true,
            nome: true,
            email: true
          }
        }
      }
    });

    console.log(`📋 Encontradas ${configs.length} configurações ativas`);

    if (configs.length === 0) {
      console.log('⚠️  Nenhuma configuração ativa encontrada');
      return;
    }

    // 3. Testar cada configuração
    for (const config of configs) {
      console.log(`\n🔍 Testando configuração: ${config.email}`);
      console.log(`   Colaborador: ${config.colaborador.nome}`);
      
      await testImapConnection(config);
    }

    console.log('\n🎉 Teste concluído com sucesso!');

  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function testImapConnection(config) {
  const startTime = Date.now();
  
  try {
    console.log(`   🔌 Conectando ao IMAP ${config.imapHost}:${config.imapPort}...`);
    
    const client = new ImapFlow({
      host: config.imapHost,
      port: config.imapPort,
      secure: config.imapSecure,
      auth: {
        user: config.email,
        pass: config.password
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA'
      },
      socketTimeout: 45000,
      connectionTimeout: 20000,
      greetingTimeout: 15000,
      logger: false
    });

    // Conectar com timeout
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 25000)
      )
    ]);

    const connectionTime = Date.now() - startTime;
    console.log(`   ✅ Conexão estabelecida em ${connectionTime}ms`);

    // Testar operações básicas
    console.log('   📂 Testando acesso à caixa de entrada...');
    const mailbox = await client.getMailboxLock('INBOX');
    
    try {
      const status = await client.status('INBOX', { messages: true, unseen: true });
      console.log(`   📊 INBOX: ${status.messages} mensagens, ${status.unseen} não lidas`);
      
      // Testar noop (keep-alive)
      console.log('   💓 Testando keep-alive...');
      await client.noop();
      console.log('   ✅ Keep-alive: OK');
      
    } finally {
      mailbox.release();
    }

    await client.logout();
    
    const totalTime = Date.now() - startTime;
    console.log(`   🎯 Teste completo em ${totalTime}ms: SUCESSO`);
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.log(`   ❌ Falha após ${totalTime}ms:`, error.message);
    
    // Analisar tipo de erro
    if (error.message.includes('AUTHENTICATIONFAILED')) {
      console.log('   🔐 Erro de autenticação - verificar credenciais');
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEOUT')) {
      console.log('   ⏰ Erro de timeout - verificar conectividade');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('   🚫 Conexão recusada - verificar host/porta');
    } else {
      console.log('   🔍 Erro desconhecido - investigar logs');
    }
    
    throw error;
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testCloudEmailSync()
    .then(() => {
      console.log('\n✨ Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script falhou:', error);
      process.exit(1);
    });
}

module.exports = { testCloudEmailSync };
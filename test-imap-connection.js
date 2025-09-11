const { ImapFlow } = require('imapflow');

async function testImapConnection() {
  console.log('Testando conexão IMAP...');
  
  const config = {
    host: 'mail.garapasystem.com',
    port: 993,
    secure: true,
    auth: {
      user: 'suporteti@garapasystem.com',
      pass: 'Aadmin@sup09'
    },
    logger: {
      debug: (msg) => console.log('DEBUG:', msg),
      info: (msg) => console.log('INFO:', msg),
      warn: (msg) => console.log('WARN:', msg),
      error: (msg) => console.log('ERROR:', msg)
    }
  };
  
  console.log('Configuração IMAP:');
  console.log('- Host:', config.host);
  console.log('- Porta:', config.port);
  console.log('- Seguro:', config.secure);
  console.log('- Usuário:', config.auth.user);
  console.log('- Senha:', config.auth.pass ? '[DEFINIDA]' : '[NÃO DEFINIDA]');
  
  try {
    console.log('\nCriando cliente IMAP...');
    const client = new ImapFlow(config);
    
    console.log('Conectando...');
    await client.connect();
    console.log('✓ Conectado com sucesso!');
    
    console.log('\nInformações da conexão:');
    console.log('- Servidor:', client.serverInfo);
    console.log('- Capacidades:', client.capabilities);
    
    console.log('\nListando pastas...');
    const folders = await client.list();
    console.log('Pastas encontradas:');
    folders.forEach(folder => {
      const flags = Array.isArray(folder.flags) ? folder.flags.join(', ') : (folder.flags || 'sem flags');
      console.log(`- ${folder.path} (${flags})`);
    });
    
    console.log('\nSelecionando INBOX...');
    let lock = await client.getMailboxLock('INBOX');
    try {
      const mailbox = client.mailbox;
      console.log('✓ INBOX selecionada com sucesso!');
      console.log('- Total de mensagens:', mailbox?.exists || 0);
      console.log('- Mensagens não lidas:', mailbox?.unseen || 0);
      console.log('- UID próximo:', mailbox?.uidNext || 'N/A');
      console.log('- Validade UID:', mailbox?.uidValidity || 'N/A');
    } finally {
      lock.release();
    }
    
    console.log('\nDesconectando...');
    await client.logout();
    console.log('✓ Desconectado com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro na conexão IMAP:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.code) {
      console.error('Código:', error.code);
    }
    
    if (error.response) {
      console.error('Resposta do servidor:', error.response);
    }
  }
}

testImapConnection();
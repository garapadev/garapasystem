const { ImapFlow } = require('imapflow');

async function testImapAuth() {
  const client = new ImapFlow({
    host: 'mail.garapasystem.com',
    port: 993,
    secure: true,
    auth: {
      user: 'suporteti@garapasystem.com',
      pass: 'Aadmin@sup09'
    },
    logger: false
  });

  try {
    console.log('Tentando conectar ao IMAP...');
    await client.connect();
    console.log('✅ Conexão IMAP bem-sucedida!');
    
    console.log('Listando pastas...');
    const mailboxes = await client.list();
    console.log('Pastas disponíveis:', mailboxes.map(m => m.name));
    
    await client.logout();
    console.log('Desconectado com sucesso.');
    
  } catch (error) {
    console.error('❌ Erro na conexão IMAP:', error.message);
    if (error.authenticationFailed) {
      console.error('Falha de autenticação - verifique email e senha');
    }
  }
}

testImapAuth();
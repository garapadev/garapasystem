const { ImapFlow } = require('imapflow');
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function testImapConnection() {
  try {
    // Buscar configuração do departamento
    const departamento = await db.helpdeskDepartamento.findFirst({
      where: {
        ativo: true,
        syncEnabled: true,
        nome: 'Suporte ti'
      }
    });

    if (!departamento) {
      console.log('Departamento não encontrado');
      return;
    }

    console.log('=== Testando Conexão IMAP ===');
    console.log(`Departamento: ${departamento.nome}`);
    console.log(`Host: ${departamento.imapHost}`);
    console.log(`Port: ${departamento.imapPort}`);
    console.log(`Email: ${departamento.imapEmail}`);
    console.log(`Secure: ${departamento.imapSecure}`);

    const client = new ImapFlow({
      host: departamento.imapHost,
      port: departamento.imapPort,
      secure: departamento.imapSecure,
      auth: {
        user: departamento.imapEmail,
        pass: departamento.imapPassword // Assumindo que está em texto plano
      },
      logger: false
    });

    console.log('\nConectando ao IMAP...');
    await client.connect();
    console.log('✓ Conectado com sucesso!');

    // Abrir INBOX
    console.log('\nAbrindo INBOX...');
    const mailboxInfo = await client.mailboxOpen('INBOX');
    console.log(`✓ INBOX aberta - Total de mensagens: ${mailboxInfo.messages}`);
    console.log(`✓ Mensagens não lidas: ${mailboxInfo.unseen}`);

    // Buscar emails não lidos
    console.log('\n=== Buscando Emails Não Lidos ===');
    const messages = client.fetch({ unseen: true }, {
      envelope: true,
      uid: true,
      flags: true
    });

    let emailCount = 0;
    for await (const message of messages) {
      emailCount++;
      console.log(`\n--- Email ${emailCount} ---`);
      console.log(`UID: ${message.uid}`);
      console.log(`Message-ID: ${message.envelope?.messageId || 'N/A'}`);
      console.log(`De: ${message.envelope?.from?.[0]?.address || 'N/A'}`);
      console.log(`Para: ${message.envelope?.to?.[0]?.address || 'N/A'}`);
      console.log(`Assunto: ${message.envelope?.subject || 'N/A'}`);
      console.log(`Data: ${message.envelope?.date || 'N/A'}`);
      console.log(`Flags: ${Array.isArray(message.flags) ? message.flags.join(', ') : 'N/A'}`);

      // Verificar se já existe ticket para este email
      const existingTicket = await db.helpdeskTicket.findFirst({
        where: {
          emailMessageId: message.envelope?.messageId,
          departamentoId: departamento.id
        }
      });

      if (existingTicket) {
        console.log(`⚠️  Ticket já existe: #${existingTicket.numero}`);
      } else {
        console.log('✓ Email não processado - pode gerar novo ticket');
        
        // Tentar processar este email manualmente
        console.log('🔄 Tentando processar email...');
        try {
          // Simular o processamento do worker
          const { helpdeskEmailWorker } = require('./src/lib/helpdesk/email-automation-worker');
          // Note: Isso é apenas para debug, não vai funcionar diretamente
          console.log('Worker disponível para processamento');
        } catch (err) {
          console.log('Erro ao acessar worker:', err.message);
        }
      }
    }

    if (emailCount === 0) {
      console.log('Nenhum email não lido encontrado.');
    }

    // Buscar emails recentes (últimos 5 dias)
    console.log('\n=== Buscando Emails Recentes (últimos 5 dias) ===');
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const recentMessages = client.fetch({
      since: fiveDaysAgo
    }, {
      envelope: true,
      uid: true,
      flags: true
    });

    let recentCount = 0;
    for await (const message of recentMessages) {
      recentCount++;
      console.log(`${recentCount}. UID: ${message.uid} - ${message.envelope?.subject || 'Sem assunto'} - ${message.envelope?.from?.[0]?.address || 'N/A'}`);
    }

    console.log(`\nTotal de emails recentes: ${recentCount}`);

    await client.logout();
    console.log('\n✓ Desconectado do IMAP');

  } catch (error) {
    console.error('❌ Erro ao testar conexão IMAP:', error);
  } finally {
    await db.$disconnect();
  }
}

testImapConnection();
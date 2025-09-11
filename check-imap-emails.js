const { PrismaClient } = require('@prisma/client');
const { ImapFlow } = require('imapflow');

const prisma = new PrismaClient();

async function checkImapEmails() {
  try {
    console.log('Verificando emails no servidor IMAP...');
    
    // Buscar departamentos ativos com sync habilitado
    const departamentos = await prisma.helpdeskDepartamento.findMany({
      where: {
        ativo: true,
        syncEnabled: true,
        imapEmail: {
          not: null
        }
      }
    });
    
    if (departamentos.length === 0) {
      console.log('Nenhum departamento ativo com sync habilitado encontrado.');
      return;
    }
    
    for (const dept of departamentos) {
      console.log(`\nConectando ao IMAP do departamento: ${dept.nome}`);
      console.log(`Email: ${dept.imapEmail}`);
      console.log(`Host: ${dept.imapHost}:${dept.imapPort}`);
      
      try {
        const client = new ImapFlow({
          host: dept.imapHost,
          port: dept.imapPort,
          secure: dept.imapSecure,
          auth: {
            user: dept.imapEmail,
            pass: 'Aadmin@sup09'
          },
          logger: false
        });
        
        await client.connect();
        console.log('Conectado ao servidor IMAP com sucesso!');
        
        // Selecionar a caixa de entrada
        let lock = await client.getMailboxLock('INBOX');
        try {
          const mailbox = client.mailbox;
          console.log(`\nInformações da caixa de entrada:`);
          console.log(`Total de mensagens: ${mailbox?.exists || 0}`);
          console.log(`Mensagens não lidas: ${mailbox?.unseen || 0}`);
          
          if (!mailbox?.exists || mailbox.exists === 0) {
            console.log('Caixa de entrada vazia.');
            continue;
          }
          
          // Buscar os últimos 10 emails
          const range = mailbox.exists > 10 ? `${mailbox.exists - 9}:${mailbox.exists}` : '1:*';
          const messages = client.fetch(range, {
            envelope: true,
            uid: true,
            flags: true,
            bodyStructure: true
          });
          
          console.log(`\nÚltimos emails (máximo 10):`);
          let emailCount = 0;
          
          for await (let message of messages) {
            emailCount++;
            const from = message.envelope?.from?.[0];
            const subject = message.envelope?.subject || 'Sem assunto';
            const date = message.envelope?.date || 'Sem data';
            
            console.log(`\n--- Email ${emailCount} ---`);
            console.log(`UID: ${message.uid}`);
            console.log(`De: ${from?.name || ''} <${from?.address || ''}>`);
            console.log(`Assunto: ${subject}`);
            console.log(`Data: ${date}`);
            const flags = Array.isArray(message.flags) ? message.flags.join(', ') : (message.flags || 'sem flags');
            console.log(`Flags: ${flags}`);
            
            // Verificar se este email já foi processado
            const ticketExistente = await prisma.helpdeskTicket.findFirst({
              where: {
                emailUid: message.uid,
                departamentoId: dept.id
              }
            });
            
            if (ticketExistente) {
              console.log(`✓ JÁ PROCESSADO - Ticket #${ticketExistente.numero}`);
            } else {
              console.log(`⚠ NÃO PROCESSADO - Precisa criar ticket`);
            }
          }
          
          if (emailCount === 0) {
            console.log('Nenhum email encontrado na faixa especificada.');
          }
          
        } finally {
          lock.release();
        }
        
        await client.logout();
        console.log('Desconectado do servidor IMAP.');
        
      } catch (error) {
        console.error(`Erro ao conectar no departamento ${dept.nome}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImapEmails();
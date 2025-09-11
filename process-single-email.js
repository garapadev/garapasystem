const { PrismaClient } = require('@prisma/client');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const prisma = new PrismaClient();

async function generateTicketNumber() {
  const lastTicket = await prisma.helpdeskTicket.findFirst({
    orderBy: { numero: 'desc' }
  });
  
  return lastTicket ? lastTicket.numero + 1 : 1;
}

async function processSingleEmail() {
  try {
    console.log('Conectando ao IMAP...');
    
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

    await client.connect();
    console.log('✓ Conectado ao IMAP');

    const lock = await client.getMailboxLock('INBOX');
    
    try {
      console.log('Buscando primeiro email...');
      
      // Buscar apenas o primeiro email
      const messages = client.fetch('1', {
        envelope: true,
        uid: true,
        flags: true
      });

      for await (const message of messages) {
        console.log(`Email encontrado - UID: ${message.uid}`);
        console.log(`De: ${message.envelope.from?.[0]?.address}`);
        console.log(`Assunto: ${message.envelope.subject}`);
        
        // Verificar se já foi processado
        const ticketExistente = await prisma.helpdeskTicket.findFirst({
          where: {
            emailUid: message.uid
          }
        });

        if (ticketExistente) {
          console.log(`✓ Email já processado - Ticket #${ticketExistente.numero}`);
          break;
        }

        console.log('Baixando conteúdo do email...');
        
        // Buscar o corpo do email
        const { content } = await client.download(message.uid, 'TEXT');
        const parsed = await simpleParser(content);

        console.log('Criando ticket...');
        
        // Buscar departamento
        const departamento = await prisma.helpdeskDepartamento.findFirst({
          where: { ativo: true }
        });
        
        if (!departamento) {
          console.error('Nenhum departamento ativo encontrado');
          break;
        }

        // Criar ticket
        const novoTicket = await prisma.helpdeskTicket.create({
          data: {
            numero: await generateTicketNumber(),
            assunto: parsed.subject || 'Sem assunto',
            descricao: parsed.text || parsed.html || 'Email sem conteúdo',
            status: 'ABERTO',
            prioridade: 'MEDIA',
            emailOrigem: parsed.from?.text || message.envelope.from?.[0]?.address || 'Desconhecido',
            emailUid: message.uid,
            departamentoId: departamento.id,
            criadoEm: new Date(),
            atualizadoEm: new Date()
          }
        });

        console.log(`✓ Ticket #${novoTicket.numero} criado com sucesso!`);
        console.log(`  Assunto: ${novoTicket.assunto}`);
        console.log(`  De: ${novoTicket.emailOrigem}`);
        console.log(`  UID: ${novoTicket.emailUid}`);
        
        break; // Processar apenas um email
      }
      
    } finally {
      lock.release();
    }

    await client.logout();
    console.log('✓ Desconectado do IMAP');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

processSingleEmail();
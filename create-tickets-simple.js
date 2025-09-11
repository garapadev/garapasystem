const { PrismaClient } = require('@prisma/client');
const { ImapFlow } = require('imapflow');

const prisma = new PrismaClient();

async function generateTicketNumber() {
  const lastTicket = await prisma.helpdeskTicket.findFirst({
    orderBy: { numero: 'desc' }
  });
  
  return lastTicket ? lastTicket.numero + 1 : 1;
}

async function createTicketsSimple() {
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
      console.log('Buscando emails...');
      
      // Buscar departamento
      const departamento = await prisma.helpdeskDepartamento.findFirst({
        where: { ativo: true }
      });
      
      if (!departamento) {
        console.error('Nenhum departamento ativo encontrado');
        return;
      }
      
      console.log(`Departamento encontrado: ${departamento.nome}`);
      
      // Buscar emails com timeout
      const messages = client.fetch('1:2', {
        envelope: true,
        uid: true
      });

      let count = 0;
      for await (const message of messages) {
        count++;
        console.log(`\n--- Email ${count} ---`);
        console.log(`UID: ${message.uid}`);
        console.log(`De: ${message.envelope.from?.[0]?.address}`);
        console.log(`Assunto: ${message.envelope.subject}`);
        
        // Verificar se já foi processado
        const ticketExistente = await prisma.helpdeskTicket.findFirst({
          where: {
            emailUid: message.uid,
            departamentoId: departamento.id
          }
        });

        if (ticketExistente) {
          console.log(`✓ Já processado - Ticket #${ticketExistente.numero}`);
          continue;
        }

        console.log('Criando ticket...');
        
        // Criar ticket com informações básicas
        const novoTicket = await prisma.helpdeskTicket.create({
          data: {
            numero: await generateTicketNumber(),
            assunto: message.envelope.subject || 'Sem assunto',
            descricao: `Email recebido de ${message.envelope.from?.[0]?.address || 'remetente desconhecido'}\n\nData: ${message.envelope.date}\n\nEste ticket foi criado automaticamente a partir de um email.`,
            status: 'ABERTO',
            prioridade: 'MEDIA',
            solicitanteNome: message.envelope.from?.[0]?.name || message.envelope.from?.[0]?.address || 'Desconhecido',
            solicitanteEmail: message.envelope.from?.[0]?.address || 'desconhecido@email.com',
            emailUid: message.uid,
            departamentoId: departamento.id
          }
        });

        console.log(`✓ Ticket #${novoTicket.numero} criado com sucesso!`);
        console.log(`  Assunto: ${novoTicket.assunto}`);
        console.log(`  De: ${novoTicket.emailOrigem}`);
      }
      
      // Atualizar lastSync do departamento
      await prisma.helpdeskDepartamento.update({
        where: { id: departamento.id },
        data: { lastSync: new Date() }
      });
      
      console.log(`\n✓ Processamento concluído. LastSync atualizado.`);
      
    } finally {
      lock.release();
    }

    await client.logout();
    console.log('✓ Desconectado do IMAP');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createTicketsSimple();
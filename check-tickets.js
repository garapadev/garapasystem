const { PrismaClient } = require('@prisma/client');

const db = new PrismaClient();

async function checkTickets() {
  try {
    console.log('Verificando tickets no banco de dados...');
    
    const tickets = await db.helpdeskTicket.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        assunto: true,
        solicitanteEmail: true,
        createdAt: true,
        departamentoId: true,
        numero: true,
        status: true
      }
    });
    
    console.log(`\nTickets encontrados: ${tickets.length}`);
    console.log('=' .repeat(50));
    
    tickets.forEach(ticket => {
      console.log(`ID: ${ticket.id}`);
      console.log(`Número: ${ticket.numero}`);
      console.log(`Assunto: ${ticket.assunto}`);
      console.log(`Email: ${ticket.solicitanteEmail}`);
      console.log(`Status: ${ticket.status}`);
      console.log(`Departamento: ${ticket.departamentoId}`);
      console.log(`Data: ${ticket.createdAt}`);
      console.log('-'.repeat(30));
    });
    
    // Verificar também mensagens
    const mensagens = await db.helpdeskMensagem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        ticketId: true,
        conteudo: true,
        createdAt: true,
        emailMessageId: true,
        remetenteEmail: true
      }
    });
    
    console.log(`\nMensagens encontradas: ${mensagens.length}`);
    console.log('=' .repeat(50));
    
    mensagens.forEach(msg => {
      console.log(`ID: ${msg.id}`);
      console.log(`Ticket: ${msg.ticketId}`);
      console.log(`Conteúdo: ${msg.conteudo.substring(0, 100)}...`);
      console.log(`Email ID: ${msg.emailMessageId}`);
      console.log(`Remetente: ${msg.remetenteEmail}`);
      console.log(`Data: ${msg.createdAt}`);
      console.log('-'.repeat(30));
    });
    
  } catch (error) {
    console.error('Erro ao verificar tickets:', error);
  } finally {
    await db.$disconnect();
  }
}

checkTickets();
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkTicket() {
  try {
    const ticket = await db.helpdeskTicket.findFirst({
      where: { numero: 2025001 }
    });
    
    if (ticket) {
      console.log('Ticket 2025001 encontrado:');
      console.log('ID:', ticket.id);
      console.log('Assunto:', ticket.assunto);
      console.log('Status:', ticket.status);
    } else {
      console.log('Ticket 2025001 não encontrado');
      
      // Vamos ver qual é o maior número
      const lastTicket = await db.helpdeskTicket.findFirst({
        orderBy: { numero: 'desc' }
      });
      
      console.log('Último ticket:', lastTicket ? `#${lastTicket.numero} (ID: ${lastTicket.id})` : 'Nenhum');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await db.$disconnect();
  }
}

checkTicket();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDepartamentos() {
  try {
    console.log('Verificando departamentos no banco de dados...');
    
    // Buscar todos os departamentos
    const departamentos = await prisma.helpdeskDepartamento.findMany();
    
    console.log(`\nTotal de departamentos: ${departamentos.length}`);
    
    departamentos.forEach((dept, index) => {
      console.log(`\n=== Departamento ${index + 1} ===`);
      console.log('ID:', dept.id);
      console.log('Nome:', dept.nome);
      console.log('Descrição:', dept.descricao);
      console.log('Ativo:', dept.ativo);
      console.log('Email:', dept.email);
      console.log('IMAP Host:', dept.imapHost);
      console.log('IMAP Port:', dept.imapPort);
      console.log('IMAP Username:', dept.imapUsername);
      console.log('IMAP Password:', dept.imapPassword ? '[DEFINIDA]' : '[NÃO DEFINIDA]');
      console.log('Sync Habilitado:', dept.syncHabilitado);
      console.log('Última Sync:', dept.ultimaSync);
      console.log('Criado em:', dept.createdAt);
      console.log('Atualizado em:', dept.updatedAt);
    });
    
    // Verificar se há tickets associados
    const totalTickets = await prisma.helpdeskTicket.count();
    console.log(`\nTotal de tickets no sistema: ${totalTickets}`);
    
    if (totalTickets > 0) {
      const ticketsComDepartamento = await prisma.helpdeskTicket.findMany({
        include: {
          departamento: true
        },
        take: 5
      });
      
      console.log('\nÚltimos 5 tickets:');
      ticketsComDepartamento.forEach(ticket => {
        console.log(`- Ticket #${ticket.numero}: ${ticket.assunto}`);
        console.log(`  Departamento: ${ticket.departamento?.nome || 'Não definido'}`);
        console.log(`  Status: ${ticket.status}`);
        console.log(`  Criado: ${ticket.createdAt}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDepartamentos();
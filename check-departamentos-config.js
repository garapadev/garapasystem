const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function checkDepartamentos() {
  try {
    const departamentos = await db.helpdeskDepartamento.findMany({
      where: {
        ativo: true,
        syncEnabled: true
      },
      select: {
        id: true,
        nome: true,
        imapHost: true,
        imapPort: true,
        imapSecure: true,
        imapEmail: true,
        imapPassword: true,
        lastSync: true,
        syncEnabled: true,
        ativo: true
      }
    });

    console.log('=== Departamentos Ativos com Sync Habilitado ===');
    console.log(`Total encontrado: ${departamentos.length}`);
    
    departamentos.forEach((dep, index) => {
      console.log(`\n--- Departamento ${index + 1} ---`);
      console.log(`ID: ${dep.id}`);
      console.log(`Nome: ${dep.nome}`);
      console.log(`IMAP Host: ${dep.imapHost || 'NÃO CONFIGURADO'}`);
      console.log(`IMAP Port: ${dep.imapPort || 'NÃO CONFIGURADO'}`);
      console.log(`IMAP Secure: ${dep.imapSecure}`);
      console.log(`IMAP Email: ${dep.imapEmail || 'NÃO CONFIGURADO'}`);
      console.log(`IMAP Password: ${dep.imapPassword ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
      console.log(`Última Sync: ${dep.lastSync || 'NUNCA'}`);
      console.log(`Sync Habilitado: ${dep.syncEnabled}`);
      console.log(`Ativo: ${dep.ativo}`);
    });

    // Verificar se há emails na caixa de entrada
    if (departamentos.length > 0) {
      console.log('\n=== Verificando Tickets Existentes ===');
      const tickets = await db.helpdeskTicket.findMany({
        where: {
          departamentoId: {
            in: departamentos.map(d => d.id)
          }
        },
        select: {
          id: true,
          numero: true,
          assunto: true,
          emailMessageId: true,
          emailUid: true,
          createdAt: true,
          departamento: {
            select: {
              nome: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      console.log(`Total de tickets: ${tickets.length}`);
      tickets.forEach((ticket, index) => {
        console.log(`${index + 1}. #${ticket.numero} - ${ticket.assunto} (${ticket.departamento.nome}) - ${ticket.createdAt}`);
      });
    }

  } catch (error) {
    console.error('Erro ao verificar departamentos:', error);
  } finally {
    await db.$disconnect();
  }
}

checkDepartamentos();
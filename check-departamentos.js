const { PrismaClient } = require('@prisma/client');

async function checkDepartamentos() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== ANÁLISE COMPLETA DOS DEPARTAMENTOS ===\n');
    
    // Buscar todos os departamentos
    const departamentos = await prisma.helpdeskDepartamento.findMany({
      include: {
        grupoHierarquico: true,
        _count: {
          select: {
            tickets: true
          }
        }
      }
    });
    
    console.log(`Total de departamentos: ${departamentos.length}\n`);
    
    departamentos.forEach((dep, index) => {
      console.log(`${index + 1}. DEPARTAMENTO: ${dep.nome}`);
      console.log(`   ID: ${dep.id}`);
      console.log(`   Ativo: ${dep.ativo}`);
      console.log(`   Descrição: ${dep.descricao || 'Não informada'}`);
      console.log(`   Grupo Hierárquico: ${dep.grupoHierarquico?.nome || 'Não vinculado'}`);
      console.log(`   `);
      console.log(`   CONFIGURAÇÕES DE EMAIL:`);
      console.log(`   - IMAP Host: ${dep.imapHost || 'Não configurado'}`);
      console.log(`   - IMAP Port: ${dep.imapPort || 'Não configurado'}`);
      console.log(`   - IMAP Email: ${dep.imapEmail || 'Não configurado'}`);
      console.log(`   - IMAP Secure: ${dep.imapSecure}`);
      console.log(`   - SMTP Host: ${dep.smtpHost || 'Não configurado'}`);
      console.log(`   - SMTP Port: ${dep.smtpPort || 'Não configurado'}`);
      console.log(`   - SMTP Email: ${dep.smtpEmail || 'Não configurado'}`);
      console.log(`   - SMTP Secure: ${dep.smtpSecure}`);
      console.log(`   `);
      console.log(`   SINCRONIZAÇÃO:`);
      console.log(`   - Habilitada: ${dep.syncEnabled}`);
      console.log(`   - Intervalo: ${dep.syncInterval}s`);
      console.log(`   - Última Sync: ${dep.lastSync || 'Nunca'}`);
      console.log(`   `);
      console.log(`   TICKETS: ${dep._count.tickets}`);
      console.log(`   Criado em: ${dep.createdAt}`);
      console.log(`   Atualizado em: ${dep.updatedAt}`);
      console.log(`   ${'='.repeat(50)}\n`);
    });
    
    // Verificar se há emails duplicados
    const emails = [];
    departamentos.forEach(dep => {
      if (dep.imapEmail) emails.push({ tipo: 'IMAP', email: dep.imapEmail, departamento: dep.nome });
      if (dep.smtpEmail) emails.push({ tipo: 'SMTP', email: dep.smtpEmail, departamento: dep.nome });
    });
    
    console.log(`\n=== ANÁLISE DE EMAILS ===`);
    console.log(`Total de emails configurados: ${emails.length}`);
    emails.forEach((item, index) => {
      console.log(`${index + 1}. ${item.tipo}: ${item.email} (${item.departamento})`);
    });
    
    // Verificar emails únicos
    const emailsUnicos = [...new Set(emails.map(e => e.email))];
    console.log(`\nEmails únicos: ${emailsUnicos.length}`);
    emailsUnicos.forEach((email, index) => {
      console.log(`${index + 1}. ${email}`);
    });
    
    // Verificar se há tickets
    const totalTickets = await prisma.helpdeskTicket.count();
    console.log(`\n=== TICKETS ===`);
    console.log(`Total de tickets no sistema: ${totalTickets}`);
    
    if (totalTickets > 0) {
      const ticketsPorDepartamento = await prisma.helpdeskTicket.groupBy({
        by: ['departamentoId'],
        _count: {
          id: true
        },
        include: {
          departamento: {
            select: {
              nome: true
            }
          }
        }
      });
      
      console.log('\nTickets por departamento:');
      for (const grupo of ticketsPorDepartamento) {
        const dep = await prisma.helpdeskDepartamento.findUnique({
          where: { id: grupo.departamentoId },
          select: { nome: true }
        });
        console.log(`- ${dep?.nome || 'Departamento não encontrado'}: ${grupo._count.id} tickets`);
      }
    }
    
  } catch (error) {
    console.error('Erro ao consultar departamentos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDepartamentos();
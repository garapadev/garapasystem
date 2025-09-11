const { PrismaClient } = require('@prisma/client');
const { ImapFlow } = require('imapflow');

const db = new PrismaClient();

async function testWorkerComponents() {
  console.log('=== TESTE DO WORKER DE PROCESSAMENTO DE EMAILS ===\n');
  
  try {
    // 1. Verificar departamentos configurados
    console.log('1. Verificando departamentos do helpdesk...');
    const departamentos = await db.helpdeskDepartamento.findMany({
      where: {
        ativo: true
      }
    });
    
    console.log(`   Encontrados ${departamentos.length} departamentos ativos`);
    
    for (const dept of departamentos) {
      console.log(`   - ${dept.nome}:`);
      console.log(`     IMAP: ${dept.imapEmail ? '✓' : '✗'} configurado`);
      console.log(`     SMTP: ${dept.smtpEmail ? '✓' : '✗'} configurado`);
      console.log(`     Sync: ${dept.syncEnabled ? '✓' : '✗'} habilitado`);
      console.log(`     Última sync: ${dept.lastSync || 'Nunca'}`);
    }
    
    // 2. Testar conexão IMAP (se houver configuração)
    console.log('\n2. Testando conexões IMAP...');
    
    for (const dept of departamentos) {
      if (dept.imapEmail && dept.imapPassword && dept.syncEnabled) {
        console.log(`   Testando ${dept.nome}...`);
        
        try {
          const client = new ImapFlow({
            host: dept.imapHost || 'localhost',
            port: dept.imapPort || 993,
            secure: dept.imapSecure !== false,
            auth: {
              user: dept.imapEmail,
              pass: dept.imapPassword // Em produção, descriptografar
            },
            logger: false
          });
          
          await client.connect();
          console.log(`   ✓ Conexão IMAP estabelecida para ${dept.nome}`);
          
          // Verificar caixas de entrada
          const mailboxes = await client.list();
          console.log(`   ✓ ${mailboxes.length} caixas de entrada encontradas`);
          
          await client.logout();
        } catch (error) {
          console.log(`   ✗ Erro na conexão IMAP para ${dept.nome}: ${error.message}`);
        }
      } else {
        console.log(`   - ${dept.nome}: Configuração IMAP incompleta`);
      }
    }
    
    // 3. Verificar tickets existentes
    console.log('\n3. Verificando tickets existentes...');
    const tickets = await db.helpdeskTicket.findMany({
      orderBy: { numero: 'desc' },
      take: 5,
      include: {
        departamento: {
          select: { nome: true }
        }
      }
    });
    
    console.log(`   Total de tickets: ${tickets.length}`);
    
    if (tickets.length > 0) {
      console.log('   Últimos 5 tickets:');
      for (const ticket of tickets) {
        console.log(`   - #${ticket.numero}: ${ticket.assunto} (${ticket.departamento?.nome || 'Sem departamento'})`);
        console.log(`     Status: ${ticket.status}, Prioridade: ${ticket.prioridade}`);
        console.log(`     Email ID: ${ticket.emailMessageId || 'N/A'}`);
      }
    }
    
    // 4. Verificar mensagens de tickets
    console.log('\n4. Verificando mensagens de tickets...');
    const mensagens = await db.helpdeskMensagem.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        ticket: {
          select: { numero: true, assunto: true }
        }
      }
    });
    
    console.log(`   Total de mensagens: ${mensagens.length}`);
    
    if (mensagens.length > 0) {
      console.log('   Últimas 3 mensagens:');
      for (const msg of mensagens) {
        console.log(`   - Ticket #${msg.ticket?.numero}: ${msg.remetenteNome} (${msg.remetenteEmail})`);
        console.log(`     Conteúdo: ${msg.conteudo.substring(0, 100)}...`);
        console.log(`     Email ID: ${msg.emailMessageId || 'N/A'}`);
      }
    }
    
    // 5. Simular criação de ticket
    console.log('\n5. Simulando criação de ticket...');
    
    if (departamentos.length > 0) {
      const dept = departamentos[0];
      
      // Gerar número sequencial
      const lastTicket = await db.helpdeskTicket.findFirst({
        orderBy: { numero: 'desc' }
      });
      
      const numero = (lastTicket?.numero || 0) + 1;
      
      const ticketData = {
        numero,
        assunto: 'Teste do Worker - Email Automático',
        descricao: 'Este é um ticket de teste criado pelo worker de processamento de emails.',
        prioridade: 'MEDIA',
        status: 'ABERTO',
        solicitanteNome: 'Sistema de Teste',
        solicitanteEmail: 'teste@worker.local',
        emailMessageId: `test-${Date.now()}@worker.local`,
        emailUid: Math.floor(Math.random() * 10000),
        departamentoId: dept.id,
        dataAbertura: new Date()
      };
      
      const novoTicket = await db.helpdeskTicket.create({
        data: ticketData
      });
      
      console.log(`   ✓ Ticket de teste criado: #${novoTicket.numero}`);
      
      // Criar mensagem inicial
      await db.helpdeskMensagem.create({
        data: {
          conteudo: ticketData.descricao,
          remetenteNome: ticketData.solicitanteNome,
          remetenteEmail: ticketData.solicitanteEmail,
          emailMessageId: ticketData.emailMessageId,
          emailUid: ticketData.emailUid,
          ticketId: novoTicket.id,
          isInterno: false
        }
      });
      
      console.log(`   ✓ Mensagem inicial criada para o ticket #${novoTicket.numero}`);
    }
    
    console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error);
  } finally {
    await db.$disconnect();
  }
}

// Executar teste
testWorkerComponents().catch(console.error);
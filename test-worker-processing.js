const { PrismaClient } = require('@prisma/client');
const { ImapFlow } = require('imapflow');
const { simpleParser } = require('mailparser');

const db = new PrismaClient();

async function testWorkerProcessing() {
  try {
    console.log('=== Teste de Processamento do Worker ===');
    
    // Buscar departamento
    const departamento = await db.helpdeskDepartamento.findFirst({
      where: {
        ativo: true,
        syncEnabled: true,
        nome: 'Suporte ti'
      }
    });

    if (!departamento) {
      console.log('❌ Departamento não encontrado');
      return;
    }

    console.log(`✓ Departamento encontrado: ${departamento.nome}`);
    console.log(`  Last Sync: ${departamento.lastSync}`);

    // Conectar ao IMAP
    const client = new ImapFlow({
      host: departamento.imapHost,
      port: departamento.imapPort,
      secure: departamento.imapSecure,
      auth: {
        user: departamento.imapEmail,
        pass: departamento.imapPassword
      },
      logger: false
    });

    await client.connect();
    console.log('✓ Conectado ao IMAP');

    await client.mailboxOpen('INBOX');
    console.log('✓ INBOX aberta');

    // Simular critério de busca do worker (corrigido)
    const searchCriteria = { unseen: true };
    // Não aplicar filtro de data para emails não lidos

    console.log('\n=== Critério de Busca ===');
    console.log(JSON.stringify(searchCriteria, null, 2));

    // Buscar emails
    const messages = client.fetch(searchCriteria, {
      envelope: true,
      uid: true,
      flags: true,
      bodyStructure: true,
      source: true
    });

    console.log('\n=== Processando Emails ===');
    let emailCount = 0;
    
    for await (const message of messages) {
      emailCount++;
      console.log(`\n--- Email ${emailCount} ---`);
      console.log(`UID: ${message.uid}`);
      console.log(`Message-ID: ${message.envelope?.messageId}`);
      console.log(`De: ${message.envelope?.from?.[0]?.address}`);
      console.log(`Assunto: ${message.envelope?.subject}`);

      // Verificar se já existe ticket
      const existingTicket = await db.helpdeskTicket.findFirst({
        where: {
          emailMessageId: message.envelope?.messageId,
          departamentoId: departamento.id
        }
      });

      if (existingTicket) {
        console.log(`⚠️  Ticket já existe: #${existingTicket.numero}`);
        continue;
      }

      console.log('✓ Email não processado - tentando processar...');

      try {
        // Simular extração de dados
        console.log('🔄 Extraindo dados do email...');
        
        // Parse do email
        const parsed = await simpleParser(message.source);
        console.log(`  Assunto extraído: ${parsed.subject}`);
        console.log(`  De extraído: ${parsed.from?.text}`);
        console.log(`  Texto: ${parsed.text?.substring(0, 100)}...`);

        // Simular criação de ticket
        console.log('🔄 Simulando criação de ticket...');
        
        const ticketData = {
          assunto: parsed.subject || 'Sem assunto',
          descricao: parsed.text || parsed.html || 'Sem conteúdo',
          solicitanteNome: parsed.from?.text?.split('<')[0]?.trim() || 'Desconhecido',
          solicitanteEmail: parsed.from?.value?.[0]?.address || message.envelope?.from?.[0]?.address,
          prioridade: 'MEDIA', // HelpdeskPrioridade.MEDIA
          status: 'ABERTO', // HelpdeskStatus.ABERTO
          departamentoId: departamento.id,
          emailMessageId: message.envelope?.messageId,
          emailUid: message.uid,
          dataAbertura: new Date(),
          numero: Math.floor(Math.random() * 100000) // Número temporário para teste
        };

        console.log('  Dados do ticket:');
        console.log(`    Assunto: ${ticketData.assunto}`);
        console.log(`    Solicitante: ${ticketData.solicitanteNome} <${ticketData.solicitanteEmail}>`);
        console.log(`    Prioridade: ${ticketData.prioridade}`);
        
        // Tentar criar o ticket (comentado para não criar duplicatas)
        // const ticket = await db.helpdeskTicket.create({ data: ticketData });
        // console.log(`✓ Ticket criado: #${ticket.numero}`);
        
        console.log('✓ Processamento simulado com sucesso');
        
      } catch (error) {
        console.error(`❌ Erro ao processar email:`, error.message);
      }
    }

    if (emailCount === 0) {
      console.log('\nNenhum email encontrado com os critérios de busca.');
      
      // Testar sem critério de data
      console.log('\n=== Testando sem critério de data ===');
      const allUnseenMessages = client.fetch({ unseen: true }, {
        envelope: true,
        uid: true
      });
      
      let allUnseenCount = 0;
      for await (const message of allUnseenMessages) {
        allUnseenCount++;
        console.log(`${allUnseenCount}. UID: ${message.uid} - ${message.envelope?.subject}`);
      }
      
      console.log(`Total de emails não lidos: ${allUnseenCount}`);
    }

    await client.logout();
    console.log('\n✓ Desconectado do IMAP');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await db.$disconnect();
  }
}

testWorkerProcessing();
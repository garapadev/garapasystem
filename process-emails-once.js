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

async function processEmailsOnce() {
  try {
    console.log('Buscando departamentos ativos...');
    
    const departamentos = await prisma.helpdeskDepartamento.findMany({
      where: {
        ativo: true,
        syncEnabled: true,
        imapEmail: { not: null }
      }
    });

    console.log(`Encontrados ${departamentos.length} departamentos`);

    for (const dept of departamentos) {
      console.log(`\nProcessando departamento: ${dept.nome}`);
      
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
        console.log('✓ Conectado ao IMAP');

        const lock = await client.getMailboxLock('INBOX');
        
        try {
          // Buscar todos os emails
          const messages = client.fetch('1:*', {
            envelope: true,
            uid: true,
            flags: true
          });

          let processedCount = 0;
          let skippedCount = 0;
          
          for await (const message of messages) {
            try {
              // Verificar se já foi processado
              const ticketExistente = await prisma.helpdeskTicket.findFirst({
                where: {
                  emailUid: message.uid,
                  departamentoId: dept.id
                }
              });

              if (ticketExistente) {
                skippedCount++;
                continue;
              }

              // Buscar o corpo do email
              const { content } = await client.download(message.uid, 'TEXT');
              const parsed = await simpleParser(content);

              // Criar ticket
              const novoTicket = await prisma.helpdeskTicket.create({
                data: {
                  numero: await generateTicketNumber(),
                  assunto: parsed.subject || 'Sem assunto',
                  descricao: parsed.text || parsed.html || 'Email sem conteúdo',
                  status: 'ABERTO',
                  prioridade: 'MEDIA',
                  emailOrigem: parsed.from?.text || 'Desconhecido',
                  emailUid: message.uid,
                  departamentoId: dept.id,
                  criadoEm: new Date(),
                  atualizadoEm: new Date()
                }
              });

              console.log(`✓ Ticket #${novoTicket.numero} criado para email UID ${message.uid}`);
              console.log(`  Assunto: ${parsed.subject}`);
              console.log(`  De: ${parsed.from?.text}`);
              processedCount++;
              
            } catch (emailError) {
              console.error(`❌ Erro ao processar email UID ${message.uid}:`, emailError.message);
            }
          }
          
          console.log(`\n📊 Resumo para ${dept.nome}:`);
          console.log(`   - Novos tickets criados: ${processedCount}`);
          console.log(`   - Emails já processados: ${skippedCount}`);
          
          // Atualizar lastSync
          await prisma.helpdeskDepartamento.update({
            where: { id: dept.id },
            data: { lastSync: new Date() }
          });
          
        } finally {
          lock.release();
        }

        await client.logout();
        console.log('✓ Desconectado do IMAP');
        
      } catch (error) {
        console.error(`❌ Erro ao processar departamento ${dept.nome}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processEmailsOnce();
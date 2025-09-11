const { ImapFlow } = require('imapflow');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const db = new PrismaClient();

// Função para descriptografar senha (por enquanto em texto plano)
function decryptPassword(encryptedPassword) {
  // Por enquanto, assumindo que a senha está em texto plano
  // Em produção, implementar descriptografia adequada
  return encryptedPassword;
}

// Função para mover emails para lixeira
async function moveEmailsToTrash(client, emailUids) {
  try {
    // Verificar se existe pasta de lixeira
    const mailboxes = await client.list();
    let trashFolder = null;
    
    console.log('Pastas disponíveis:', mailboxes.map(m => m.name));
    
    // Procurar por pastas de lixeira comuns
    const trashNames = ['Trash', 'Deleted Items', 'Lixeira', 'Deleted', 'INBOX.Trash'];
    for (const mailbox of mailboxes) {
      if (trashNames.some(name => mailbox.name.toLowerCase().includes(name.toLowerCase()))) {
        trashFolder = mailbox.name;
        break;
      }
    }
    
    if (!trashFolder) {
      // Se não encontrar pasta de lixeira, criar uma
      trashFolder = 'Trash';
      try {
        await client.mailboxCreate(trashFolder);
        console.log(`Pasta de lixeira '${trashFolder}' criada`);
      } catch (error) {
        console.warn('Não foi possível criar pasta de lixeira, marcando emails como deletados');
        // Como fallback, apenas marcar como deletado
        await client.messageFlagsAdd(emailUids, ['\\Deleted']);
        return;
      }
    }
    
    console.log(`Movendo ${emailUids.length} emails para ${trashFolder}`);
    
    // Mover emails para a pasta de lixeira
    await client.messageMove(emailUids, trashFolder);
    console.log(`${emailUids.length} emails movidos para ${trashFolder}`);
    
  } catch (error) {
    console.error('Erro ao mover emails para lixeira:', error);
    // Como fallback, tentar marcar como deletado
    try {
      await client.messageFlagsAdd(emailUids, ['\\Deleted']);
      console.log(`${emailUids.length} emails marcados como deletados`);
    } catch (flagError) {
      console.error('Erro ao marcar emails como deletados:', flagError);
      throw flagError;
    }
  }
}

async function testEmailTrash() {
  try {
    // Buscar departamento de teste
    const departamento = await db.helpdeskDepartamento.findFirst({
      where: { nome: 'Suporte ti' }
    });
    
    if (!departamento) {
      console.log('Departamento não encontrado');
      return;
    }
    
    console.log(`Testando com departamento: ${departamento.nome}`);
    
    // Configurar conexão IMAP
    const client = new ImapFlow({
      host: departamento.imapHost,
      port: departamento.imapPort,
      secure: departamento.imapSecure,
      auth: {
        user: departamento.imapEmail,
        pass: decryptPassword(departamento.imapPassword)
      },
      logger: false
    });
    
    await client.connect();
    console.log('Conectado ao IMAP');
    
    // Abrir INBOX
    let lock = await client.getMailboxLock('INBOX');
    try {
      console.log('INBOX aberta');
      
      // Buscar emails não lidos (limitando a 2 para teste)
      const messages = client.fetch('1:2', {
        uid: true,
        flags: true,
        envelope: true
      });
      
      const emailUids = [];
      for await (const message of messages) {
        emailUids.push(message.uid);
        console.log(`Email encontrado - UID: ${message.uid}, De: ${message.envelope?.from?.[0]?.address || 'unknown'}`);
      }
      
      if (emailUids.length > 0) {
        console.log(`\nTestando mover ${emailUids.length} emails para lixeira...`);
        await moveEmailsToTrash(client, emailUids);
        
        // Verificar se emails foram movidos
        console.log('\nVerificando se emails foram movidos...');
        const remainingMessages = client.fetch(emailUids, { uid: true });
        let count = 0;
        for await (const message of remainingMessages) {
          count++;
        }
        
        if (count === 0) {
          console.log('✅ Emails movidos com sucesso!');
        } else {
          console.log(`⚠️  Ainda existem ${count} emails na INBOX`);
        }
      } else {
        console.log('Nenhum email encontrado para teste');
      }
      
    } finally {
      lock.release();
    }
    
    await client.logout();
    console.log('Desconectado do IMAP');
    
  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    await db.$disconnect();
  }
}

// Executar teste
testEmailTrash();
const { PrismaClient } = require('@prisma/client');
const { ImapFlow } = require('imapflow');

prisma = new PrismaClient();

async function checkAllFolders() {
  try {
    console.log('Verificando todos os departamentos e pastas...');
    
    // Buscar todos os departamentos ativos
    const departamentos = await prisma.helpdeskDepartamento.findMany({
      where: {
        ativo: true
      }
    });
    
    console.log(`Encontrados ${departamentos.length} departamentos ativos:`);
    
    for (const dept of departamentos) {
      console.log(`\n=== Departamento: ${dept.nome} ===`);
      console.log(`Email: ${dept.email}`);
      console.log(`Host: ${dept.imapHost}:${dept.imapPort}`);
      console.log(`Sync habilitado: ${dept.syncHabilitado}`);
      
      if (!dept.syncHabilitado) {
        console.log('Sync desabilitado, pulando...');
        continue;
      }
      
      try {
        const client = new ImapFlow({
          host: dept.imapHost,
          port: dept.imapPort,
          secure: dept.imapPort === 993,
          auth: {
            user: dept.email,
            pass: dept.imapSenha
          },
          logger: false
        });
        
        await client.connect();
        console.log('Conectado com sucesso!');
        
        // Listar todas as pastas
        const folders = await client.list();
        console.log('\nPastas disponíveis:');
        folders.forEach(folder => {
          console.log(`- ${folder.path} (${folder.flags?.join(', ') || 'sem flags'})`);
        });
        
        // Verificar INBOX
        let lock = await client.getMailboxLock('INBOX');
        try {
          const mailbox = client.mailbox;
          console.log(`\nINBOX - Total: ${mailbox?.exists || 0}, Não lidas: ${mailbox?.unseen || 0}`);
          
          if (mailbox?.exists > 0) {
            // Buscar os últimos 5 emails
            const messages = client.fetch('1:5', {
              envelope: true,
              uid: true,
              flags: true
            });
            
            console.log('\nÚltimos emails na INBOX:');
            for await (let message of messages) {
              const from = message.envelope?.from?.[0];
              console.log(`- UID: ${message.uid}`);
              console.log(`  De: ${from?.name || ''} <${from?.address || ''}>`);
              console.log(`  Assunto: ${message.envelope?.subject || 'Sem assunto'}`);
              console.log(`  Data: ${message.envelope?.date || 'Sem data'}`);
              console.log(`  Flags: ${message.flags?.join(', ') || 'sem flags'}`);
              console.log('');
            }
          }
        } finally {
          lock.release();
        }
        
        // Verificar outras pastas comuns
        const commonFolders = ['Sent', 'Enviados', 'Spam', 'Junk', 'Trash', 'Lixeira'];
        for (const folderName of commonFolders) {
          try {
            let lock = await client.getMailboxLock(folderName);
            try {
              const mailbox = client.mailbox;
              if (mailbox?.exists > 0) {
                console.log(`${folderName} - Total: ${mailbox.exists}, Não lidas: ${mailbox?.unseen || 0}`);
              }
            } finally {
              lock.release();
            }
          } catch (err) {
            // Pasta não existe, ignorar
          }
        }
        
        await client.logout();
        
      } catch (error) {
        console.error(`Erro ao conectar no departamento ${dept.nome}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllFolders();
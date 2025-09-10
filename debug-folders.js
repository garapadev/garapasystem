const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugFolders() {
  try {
    console.log('🔍 Verificando pastas e emails...');
    
    // Buscar todas as pastas
    const folders = await prisma.emailFolder.findMany({
      include: {
        _count: {
          select: {
            emails: true
          }
        },
        emails: {
          select: {
            id: true,
            subject: true,
            isDeleted: true,
            date: true
          },
          take: 5
        }
      }
    });
    
    console.log('\n📁 Pastas encontradas:');
    folders.forEach(folder => {
      console.log(`\n📂 ${folder.name} (${folder.path})`);
      console.log(`   Total de emails: ${folder._count.emails}`);
      console.log(`   Special Use: ${folder.specialUse || 'N/A'}`);
      
      if (folder.emails.length > 0) {
        console.log('   📧 Emails (primeiros 5):');
        folder.emails.forEach(email => {
          console.log(`     - ${email.subject} (${email.isDeleted ? 'DELETADO' : 'ATIVO'}) - ${email.date}`);
        });
      } else {
        console.log('   📭 Nenhum email nesta pasta');
      }
    });
    
    // Verificar pastas específicas mencionadas no problema
    const problematicFolders = ['Trash', 'Archive', 'Drafts', 'Spam', 'Junk'];
    console.log('\n🔍 Verificando pastas problemáticas:');
    
    for (const folderName of problematicFolders) {
      const folder = folders.find(f => 
        f.name.toLowerCase().includes(folderName.toLowerCase()) ||
        f.path.toLowerCase().includes(folderName.toLowerCase())
      );
      
      if (folder) {
        console.log(`\n📂 ${folder.name} (${folder.path}):`);
        console.log(`   Emails no banco: ${folder._count.emails}`);
        
        // Verificar emails não deletados
        const activeEmails = await prisma.email.count({
          where: {
            folderId: folder.id,
            isDeleted: false
          }
        });
        console.log(`   Emails ativos: ${activeEmails}`);
      }
    }
    
    // Verificar emails deletados
    const deletedEmails = await prisma.email.count({
      where: {
        isDeleted: true
      }
    });
    
    console.log(`\n🗑️  Total de emails marcados como deletados: ${deletedEmails}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFolders();
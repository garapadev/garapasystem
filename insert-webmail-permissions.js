const { PrismaClient } = require('@prisma/client');

async function insertWebmailPermissions() {
  const db = new PrismaClient();
  
  try {
    console.log('Inserindo permissões do webmail...');
    
    // Definir as permissões do webmail com suas descrições
    const webmailPermissions = [
      // Configuração de Email
      {
        nome: 'webmail.config.read',
        descricao: 'Visualizar própria configuração de email',
        recurso: 'webmail',
        acao: 'config.read'
      },
      {
        nome: 'webmail.config.write',
        descricao: 'Editar própria configuração de email',
        recurso: 'webmail',
        acao: 'config.write'
      },
      {
        nome: 'webmail.config.delete',
        descricao: 'Excluir configuração de email',
        recurso: 'webmail',
        acao: 'config.delete'
      },
      {
        nome: 'webmail.config.test',
        descricao: 'Testar configuração de email',
        recurso: 'webmail',
        acao: 'config.test'
      },
      
      // Leitura de Emails
      {
        nome: 'webmail.email.read',
        descricao: 'Ler próprios emails',
        recurso: 'webmail',
        acao: 'email.read'
      },
      {
        nome: 'webmail.email.read.all',
        descricao: 'Ler emails de outros usuários',
        recurso: 'webmail',
        acao: 'email.read.all'
      },
      
      // Composição e Envio
      {
        nome: 'webmail.email.compose',
        descricao: 'Compor emails',
        recurso: 'webmail',
        acao: 'email.compose'
      },
      {
        nome: 'webmail.email.send',
        descricao: 'Enviar emails',
        recurso: 'webmail',
        acao: 'email.send'
      },
      {
        nome: 'webmail.email.send.as',
        descricao: 'Enviar email como outro usuário',
        recurso: 'webmail',
        acao: 'email.send.as'
      },
      
      // Gerenciamento de Emails
      {
        nome: 'webmail.email.delete',
        descricao: 'Excluir próprios emails',
        recurso: 'webmail',
        acao: 'email.delete'
      },
      {
        nome: 'webmail.email.archive',
        descricao: 'Arquivar emails',
        recurso: 'webmail',
        acao: 'email.archive'
      },
      {
        nome: 'webmail.email.move',
        descricao: 'Mover emails entre pastas',
        recurso: 'webmail',
        acao: 'email.move'
      },
      {
        nome: 'webmail.email.flag',
        descricao: 'Marcar/desmarcar emails',
        recurso: 'webmail',
        acao: 'email.flag'
      },
      
      // Pastas
      {
        nome: 'webmail.folder.read',
        descricao: 'Visualizar próprias pastas',
        recurso: 'webmail',
        acao: 'folder.read'
      },
      {
        nome: 'webmail.folder.create',
        descricao: 'Criar pastas',
        recurso: 'webmail',
        acao: 'folder.create'
      },
      {
        nome: 'webmail.folder.delete',
        descricao: 'Excluir pastas',
        recurso: 'webmail',
        acao: 'folder.delete'
      },
      {
        nome: 'webmail.folder.manage',
        descricao: 'Gerenciar pastas',
        recurso: 'webmail',
        acao: 'folder.manage'
      },
      
      // Sincronização
      {
        nome: 'webmail.sync.manual',
        descricao: 'Sincronização manual',
        recurso: 'webmail',
        acao: 'sync.manual'
      },
      {
        nome: 'webmail.sync.auto',
        descricao: 'Configurar sincronização automática',
        recurso: 'webmail',
        acao: 'sync.auto'
      },
      {
        nome: 'webmail.sync.settings',
        descricao: 'Configurações avançadas de sincronização',
        recurso: 'webmail',
        acao: 'sync.settings'
      },
      
      // Anexos
      {
        nome: 'webmail.attachment.download',
        descricao: 'Baixar anexos',
        recurso: 'webmail',
        acao: 'attachment.download'
      },
      {
        nome: 'webmail.attachment.upload',
        descricao: 'Enviar anexos',
        recurso: 'webmail',
        acao: 'attachment.upload'
      },
      
      // Administração
      {
        nome: 'webmail.admin.view.all',
        descricao: 'Visualizar configurações de subordinados',
        recurso: 'webmail',
        acao: 'admin.view.all'
      },
      {
        nome: 'webmail.admin.manage.configs',
        descricao: 'Gerenciar todas as configurações',
        recurso: 'webmail',
        acao: 'admin.manage.configs'
      },
      {
        nome: 'webmail.admin.manage.users',
        descricao: 'Gerenciar usuários do webmail',
        recurso: 'webmail',
        acao: 'admin.manage.users'
      },
      {
        nome: 'webmail.admin.logs',
        descricao: 'Acessar logs do sistema',
        recurso: 'webmail',
        acao: 'admin.logs'
      }
    ];
    
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const permission of webmailPermissions) {
      try {
        // Verificar se a permissão já existe
        const existing = await db.permissao.findUnique({
          where: { nome: permission.nome }
        });
        
        if (existing) {
          console.log(`Permissão já existe: ${permission.nome}`);
          skippedCount++;
          continue;
        }
        
        // Inserir a permissão
        await db.permissao.create({
          data: {
            nome: permission.nome,
            descricao: permission.descricao,
            recurso: permission.recurso,
            acao: permission.acao
          }
        });
        
        console.log(`Permissão inserida: ${permission.nome}`);
        insertedCount++;
        
      } catch (error) {
        console.error(`Erro ao inserir permissão ${permission.nome}:`, error.message);
      }
    }
    
    console.log(`\nResumo:`);
    console.log(`- Permissões inseridas: ${insertedCount}`);
    console.log(`- Permissões já existentes: ${skippedCount}`);
    console.log(`- Total de permissões do webmail: ${webmailPermissions.length}`);
    
  } catch (error) {
    console.error('Erro ao inserir permissões:', error);
  } finally {
    await db.$disconnect();
  }
}

insertWebmailPermissions();
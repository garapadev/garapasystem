const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');

async function debugEmailSend() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Simulando processo de envio de email...');
    
    await prisma.$connect();
    console.log('✅ Conexão estabelecida');
    
    // Buscar usuário e configuração (simulando o que acontece na API)
    const user = await prisma.usuario.findUnique({
      where: { email: 'admin@garapasystem.com' },
      include: {
        colaborador: {
          include: {
            emailConfig: true
          }
        }
      }
    });
    
    console.log('👤 Usuário encontrado:', {
      id: user?.id,
      email: user?.email,
      colaborador: user?.colaborador ? {
        id: user.colaborador.id,
        emailConfig: user.colaborador.emailConfig ? 'Presente' : 'Ausente'
      } : 'Ausente'
    });
    
    if (!user || !user.colaborador || !user.colaborador.emailConfig) {
      console.log('❌ Configuração de email não encontrada');
      return;
    }
    
    const emailConfig = user.colaborador.emailConfig;
    console.log('📧 EmailConfig:', {
      id: emailConfig.id,
      email: emailConfig.email
    });
    
    // Simular criação de messageId
    const messageId = `<${randomUUID()}@${emailConfig.email.split('@')[1]}>`;
    console.log('📨 MessageId gerado:', messageId);
    
    // Verificar se a pasta Sent existe (linha que pode estar falhando)
    console.log('🔍 Verificando pasta Sent...');
    let sentFolder = await prisma.emailFolder.findFirst({
      where: {
        emailConfigId: emailConfig.id,
        path: 'INBOX.Sent'
      }
    });
    
    console.log('📁 Pasta Sent:', sentFolder ? 'Encontrada' : 'Não encontrada');
    
    if (!sentFolder) {
      console.log('🔧 Criando pasta Sent...');
      sentFolder = await prisma.emailFolder.create({
        data: {
          name: 'Sent',
          path: 'INBOX.Sent',
          specialUse: '\\Sent',
          emailConfigId: emailConfig.id
        }
      });
      console.log('✅ Pasta Sent criada:', sentFolder.id);
    }
    
    // Verificar se o email já existe (LINHA 207 - onde está o erro)
    console.log('🔍 Executando consulta da linha 207...');
    let sentEmail = await prisma.email.findFirst({
      where: {
        messageId,
        emailConfigId: emailConfig.id
      }
    });
    
    console.log('📧 Email existente:', sentEmail ? 'Encontrado' : 'Não encontrado');
    
    if (!sentEmail) {
      console.log('🔧 Criando novo email...');
      
      // Dados de teste
      const emailToSend = {
        to: ['ronaldo@garapasystem.com'],
        subject: 'Teste - Debug'
      };
      
      sentEmail = await prisma.email.create({
        data: {
          messageId,
          uid: Math.floor(Math.random() * 1000000),
          from: JSON.stringify(['admin@garapasystem.com']),
          to: JSON.stringify(emailToSend.to),
          cc: null,
          bcc: null,
          subject: emailToSend.subject,
          textContent: 'Teste de debug',
          htmlContent: null,
          date: new Date(),
          flags: JSON.stringify(['\\Seen']),
          isRead: true,
          folderId: sentFolder.id,
          emailConfigId: emailConfig.id
        }
      });
      
      console.log('✅ Email criado com sucesso:', sentEmail.id);
    }
    
    // Testar notificação (pode ser onde está o erro)
    console.log('🔍 Testando notificação...');
    
    const emailConfigForNotification = await prisma.emailConfig.findUnique({
      where: { id: emailConfig.id },
      include: {
        colaborador: {
          include: {
            usuarios: true
          }
        }
      }
    });
    
    console.log('📧 EmailConfig para notificação:', {
      id: emailConfigForNotification?.id,
      colaborador: emailConfigForNotification?.colaborador ? {
        id: emailConfigForNotification.colaborador.id,
        usuarios: emailConfigForNotification.colaborador.usuarios?.length || 0
      } : null
    });
    
    console.log('✅ Simulação concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante simulação:', error);
    console.error('Stack trace:', error.stack);
    
    // Verificar se é erro de constraint
    if (error.code) {
      console.error('Código do erro:', error.code);
    }
    if (error.meta) {
      console.error('Meta informações:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

debugEmailSend().catch(console.error);
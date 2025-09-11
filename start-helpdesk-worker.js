const { PrismaClient } = require('@prisma/client');
const { ImapFlow } = require('imapflow');
const nodemailer = require('nodemailer');
const { simpleParser } = require('mailparser');
const crypto = require('crypto');

const db = new PrismaClient();

class HelpdeskEmailWorker {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.syncInterval = 5 * 60 * 1000; // 5 minutos
  }

  async start() {
    if (this.isRunning) {
      console.log('[Helpdesk Worker] Worker já está rodando');
      return;
    }

    this.isRunning = true;
    console.log('[Helpdesk Worker] Iniciando worker de processamento de emails...');

    // Processar imediatamente
    await this.processAllDepartments();

    // Agendar processamento periódico
    this.intervalId = setInterval(async () => {
      await this.processAllDepartments();
    }, this.syncInterval);

    console.log(`[Helpdesk Worker] Worker iniciado com intervalo de ${this.syncInterval / 1000} segundos`);
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('[Helpdesk Worker] Worker parado');
  }

  async processAllDepartments() {
    try {
      const departamentos = await db.helpdeskDepartamento.findMany({
        where: {
          ativo: true,
          syncEnabled: true,
          imapEmail: { not: null },
          imapPassword: { not: null }
        }
      });

      console.log(`[Helpdesk Worker] Processando ${departamentos.length} departamentos`);

      for (const departamento of departamentos) {
        try {
          await this.processDepartmentEmails(departamento);
          
          // Atualizar lastSync
          await db.helpdeskDepartamento.update({
            where: { id: departamento.id },
            data: { lastSync: new Date() }
          });
        } catch (error) {
          console.error(`[Helpdesk Worker] Erro ao processar departamento ${departamento.nome}:`, error);
        }
      }
    } catch (error) {
      console.error('[Helpdesk Worker] Erro ao buscar departamentos:', error);
    }
  }

  async processDepartmentEmails(departamento) {
    console.log(`[Helpdesk Worker] Processando emails do departamento: ${departamento.nome}`);
    
    try {
      const client = new ImapFlow({
        host: departamento.imapHost,
        port: departamento.imapPort,
        secure: departamento.imapSecure,
        auth: {
          user: departamento.imapEmail,
          pass: 'Aadmin@sup09' // Usar a senha correta
        },
        logger: false
      });

      await client.connect();
      console.log(`[Helpdesk Worker] Conectado ao IMAP: ${departamento.imapEmail}`);

      // Selecionar INBOX
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        // Buscar emails não lidos ou recentes
        const messages = client.fetch('1:*', {
          envelope: true,
          bodyStructure: true,
          uid: true,
          flags: true
        });

        let processedCount = 0;
        
        for await (const message of messages) {
          try {
            // Verificar se já foi processado
            const ticketExistente = await db.helpdeskTicket.findFirst({
              where: {
                emailUid: message.uid,
                departamentoId: departamento.id
              }
            });

            if (ticketExistente) {
              continue; // Já processado
            }

            // Buscar o corpo do email
            const { content } = await client.download(message.uid, 'TEXT');
            const parsed = await simpleParser(content);

            // Criar ticket
            const novoTicket = await db.helpdeskTicket.create({
              data: {
                numero: await this.generateTicketNumber(),
                assunto: parsed.subject || 'Sem assunto',
                descricao: parsed.text || parsed.html || 'Email sem conteúdo',
                status: 'ABERTO',
                prioridade: 'MEDIA',
                emailOrigem: parsed.from?.text || 'Desconhecido',
                emailUid: message.uid,
                departamentoId: departamento.id,
                criadoEm: new Date(),
                atualizadoEm: new Date()
              }
            });

            console.log(`[Helpdesk Worker] Ticket #${novoTicket.numero} criado para email UID ${message.uid}`);
            processedCount++;
            
          } catch (emailError) {
            console.error(`[Helpdesk Worker] Erro ao processar email UID ${message.uid}:`, emailError.message);
          }
        }
        
        console.log(`[Helpdesk Worker] Processados ${processedCount} novos emails para ${departamento.nome}`);
        
      } finally {
        lock.release();
      }

      await client.logout();
      
    } catch (error) {
      console.error(`[Helpdesk Worker] Erro ao processar emails do departamento ${departamento.nome}:`, error.message);
    }
  }

  async generateTicketNumber() {
    const lastTicket = await db.helpdeskTicket.findFirst({
      orderBy: { numero: 'desc' }
    });
    
    return lastTicket ? lastTicket.numero + 1 : 1;
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      syncInterval: this.syncInterval
    };
  }
}

// Criar instância do worker
const worker = new HelpdeskEmailWorker();

// Iniciar worker
worker.start().then(() => {
  console.log('Worker do helpdesk iniciado com sucesso!');
}).catch(error => {
  console.error('Erro ao iniciar worker:', error);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Recebido SIGINT, parando worker...');
  worker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, parando worker...');
  worker.stop();
  process.exit(0);
});

// Manter o processo rodando
setInterval(() => {
  const status = worker.getStatus();
  console.log(`[Status] Worker rodando: ${status.isRunning}`);
}, 30000); // Log de status a cada 30 segundos
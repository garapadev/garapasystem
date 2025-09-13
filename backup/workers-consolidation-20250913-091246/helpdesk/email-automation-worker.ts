import { ImapFlow } from 'imapflow';
import * as nodemailer from 'nodemailer';
import { PrismaClient, HelpdeskPrioridade, HelpdeskStatus } from '@prisma/client';
import { simpleParser } from 'mailparser';
import * as crypto from 'crypto';

const db = new PrismaClient();
import { emailResponseSystem, EmailResponseConfig } from './email-response-system';

interface EmailProcessingResult {
  success: boolean;
  ticketNumber?: number;
  error?: string;
}

interface TicketData {
  assunto: string;
  descricao: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  prioridade: HelpdeskPrioridade;
  emailMessageId: string;
  emailUid: number;
}

class HelpdeskEmailWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 60 * 1000; // 1 minuto

  /**
   * Inicia o worker de processamento de emails
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('[Helpdesk Worker] Worker já está em execução');
      return;
    }

    this.isRunning = true;
    console.log('[Helpdesk Worker] Iniciando worker de processamento de emails...');

    // Executar processamento inicial
    await this.processAllDepartments();

    // Agendar execuções periódicas
    this.intervalId = setInterval(async () => {
      await this.processAllDepartments();
    }, this.SYNC_INTERVAL);

    console.log('[Helpdesk Worker] Worker iniciado com sucesso');
  }

  /**
   * Para o worker
   */
  stop(): void {
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

  /**
   * Processa emails de todos os departamentos ativos
   */
  private async processAllDepartments(): Promise<void> {
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
        } catch (error) {
          console.error(`[Helpdesk Worker] Erro ao processar departamento ${departamento.nome}:`, error);
        }
      }
    } catch (error) {
      console.error('[Helpdesk Worker] Erro ao buscar departamentos:', error);
    }
  }

  /**
   * Processa emails de um departamento específico
   */
  private async processDepartmentEmails(departamento: any): Promise<void> {
    if (!departamento.imapEmail || !departamento.imapPassword) {
      console.log(`[Helpdesk Worker] Departamento ${departamento.nome} sem configuração IMAP`);
      return;
    }

    const client = new ImapFlow({
      host: departamento.imapHost || 'localhost',
      port: departamento.imapPort || 993,
      secure: departamento.imapSecure !== false,
      auth: {
        user: departamento.imapEmail,
        pass: this.decryptPassword(departamento.imapPassword)
      },
      logger: false
    });

    try {
      await client.connect();
      console.log(`[Helpdesk Worker] Conectado ao IMAP do departamento ${departamento.nome}`);

      // Selecionar pasta INBOX
      await client.mailboxOpen('INBOX');

      // Buscar emails não lidos desde a última sincronização
      const searchCriteria = this.buildSearchCriteria(departamento.lastSync);
      const messages = client.fetch(searchCriteria, {
        envelope: true,
        uid: true,
        flags: true,
        bodyStructure: true,
        source: true
      });

      let processedCount = 0;
      const emailsToMove: number[] = [];
      
      for await (const message of messages) {
        try {
          const result = await this.processEmail(message, departamento);
          if (result.success) {
            processedCount++;
            emailsToMove.push(message.uid);
            console.log(`[Helpdesk Worker] Ticket #${result.ticketNumber} criado para email ${message.envelope ? message.envelope.messageId : 'unknown'}`);
          }
        } catch (error) {
          console.error(`[Helpdesk Worker] Erro ao processar email ${message.envelope ? message.envelope.messageId : 'unknown'}:`, error);
        }
      }

      // Mover emails processados para a lixeira
      if (emailsToMove.length > 0) {
        try {
          await this.moveEmailsToTrash(client, emailsToMove);
          console.log(`[Helpdesk Worker] ${emailsToMove.length} emails movidos para a lixeira`);
        } catch (error) {
          console.error(`[Helpdesk Worker] Erro ao mover emails para a lixeira:`, error);
        }
      }

      // Atualizar timestamp da última sincronização
      await db.helpdeskDepartamento.update({
        where: { id: departamento.id },
        data: { lastSync: new Date() }
      });

      console.log(`[Helpdesk Worker] Departamento ${departamento.nome}: ${processedCount} emails processados`);

    } catch (error) {
      console.error(`[Helpdesk Worker] Erro na conexão IMAP do departamento ${departamento.nome}:`, error);
    } finally {
      await client.logout();
    }
  }

  /**
   * Move emails processados para a lixeira do IMAP
   */
  private async moveEmailsToTrash(client: ImapFlow, emailUids: number[]): Promise<void> {
    try {
      // Verificar se existe pasta de lixeira
      const mailboxes = await client.list();
      let trashFolder = null;
      
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
          console.log(`[Helpdesk Worker] Pasta de lixeira '${trashFolder}' criada`);
        } catch (error) {
          console.warn(`[Helpdesk Worker] Não foi possível criar pasta de lixeira, marcando emails como deletados`);
          // Como fallback, apenas marcar como deletado
          await client.messageFlagsAdd(emailUids, ['\\Deleted']);
          return;
        }
      }
      
      // Mover emails para a pasta de lixeira
      await client.messageMove(emailUids, trashFolder);
      console.log(`[Helpdesk Worker] ${emailUids.length} emails movidos para ${trashFolder}`);
      
    } catch (error) {
      console.error(`[Helpdesk Worker] Erro ao mover emails para lixeira:`, error);
      // Como fallback, tentar marcar como deletado
      try {
        await client.messageFlagsAdd(emailUids, ['\\Deleted']);
        console.log(`[Helpdesk Worker] ${emailUids.length} emails marcados como deletados`);
      } catch (flagError) {
        console.error(`[Helpdesk Worker] Erro ao marcar emails como deletados:`, flagError);
        throw flagError;
      }
    }
  }

  /**
   * Processa um email individual e cria ticket se necessário
   */
  private async processEmail(message: any, departamento: any): Promise<EmailProcessingResult> {
    try {
      // Verificar se já existe ticket para este email
      const existingTicket = await db.helpdeskTicket.findFirst({
        where: {
          emailMessageId: message.envelope ? message.envelope.messageId : null,
          departamentoId: departamento.id
        }
      });

      if (existingTicket) {
        return { success: false, error: 'Ticket já existe para este email' };
      }

      // Extrair dados do email
      const ticketData = await this.extractTicketData(message);
      
      // Criar ticket
      const ticket = await this.createTicket(ticketData, departamento.id);
      
      // Enviar resposta automática
      await this.sendAutoReply(ticket, departamento);
      
      return { success: true, ticketNumber: ticket.numero };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' };
    }
  }

  /**
   * Extrai dados essenciais do email para criação do ticket
   */
  private async extractTicketData(message: any): Promise<TicketData> {
    // Parse do conteúdo do email
    const parsed = await simpleParser(message.source);
    
    // Extrair assunto
    const assunto = message.envelope.subject || 'Sem assunto';
    
    // Extrair corpo da mensagem (preferir texto, fallback para HTML)
    let descricao = '';
    if (parsed.text) {
      descricao = parsed.text.trim();
    } else if (parsed.html) {
      // Remover tags HTML básicas para extrair texto
      descricao = parsed.html.replace(/<[^>]*>/g, '').trim();
    }
    
    if (!descricao) {
      descricao = 'Conteúdo não disponível';
    }
    
    // Extrair informações do remetente
    const fromAddress = message.envelope.from[0];
    const solicitanteEmail = fromAddress.address;
    const solicitanteNome = fromAddress.name || solicitanteEmail.split('@')[0];
    
    // Ticket inicia com status aberto - técnico define prioridade manualmente
        const prioridade = HelpdeskPrioridade.BAIXA; // Prioridade padrão
    
    return {
      assunto,
      descricao,
      solicitanteNome,
      solicitanteEmail,
      prioridade,
      emailMessageId: message.envelope.messageId,
      emailUid: message.uid
    };
  }

  /**
   * Cria um novo ticket no banco de dados
   */
  private async createTicket(ticketData: TicketData, departamentoId: string): Promise<any> {
    // Gerar número sequencial do ticket
    const lastTicket = await db.helpdeskTicket.findFirst({
      orderBy: { numero: 'desc' }
    });
    
    const numero = (lastTicket?.numero || 0) + 1;
    
    // Criar ticket
    const ticket = await db.helpdeskTicket.create({
      data: {
        numero,
        assunto: ticketData.assunto,
        descricao: ticketData.descricao,
        prioridade: ticketData.prioridade,
        status: HelpdeskStatus.ABERTO,
        solicitanteNome: ticketData.solicitanteNome,
        solicitanteEmail: ticketData.solicitanteEmail,
        emailMessageId: ticketData.emailMessageId,
        emailUid: ticketData.emailUid,
        departamentoId: departamentoId,
        dataAbertura: new Date()
      }
    });
    
    // Criar mensagem inicial do ticket
    await db.helpdeskMensagem.create({
      data: {
        conteudo: ticketData.descricao,
        remetenteNome: ticketData.solicitanteNome,
        remetenteEmail: ticketData.solicitanteEmail,
        emailMessageId: ticketData.emailMessageId,
        emailUid: ticketData.emailUid,
        ticketId: ticket.id,
        isInterno: false
      }
    });
    
    return ticket;
  }

  /**
   * Envia resposta automática via SMTP
   */
  private async sendAutoReply(ticket: any, departamento: any): Promise<void> {
    if (!departamento.smtpEmail || !departamento.smtpPassword) {
      console.log(`[Helpdesk Worker] Departamento ${departamento.nome} sem configuração SMTP para resposta automática`);
      return;
    }

    try {
      // Preparar configuração para o sistema de resposta automática
      const responseConfig: EmailResponseConfig = {
        departamentoId: departamento.id,
        ticketNumero: ticket.numero,
        ticketAssunto: ticket.assunto,
        ticketPrioridade: ticket.prioridade,
        solicitanteNome: ticket.solicitanteNome,
        solicitanteEmail: ticket.solicitanteEmail,
        departamentoNome: departamento.nome,
        grupoHierarquico: departamento.grupoHierarquico?.nome
      };
      
      // Usar o sistema de resposta automática avançado
      const success = await emailResponseSystem.sendTicketConfirmation(responseConfig);
      
      if (success) {
        console.log(`[Helpdesk Worker] Resposta automática enviada para ${ticket.solicitanteEmail} - Ticket #${ticket.numero}`);
      } else {
        console.error(`[Helpdesk Worker] Falha ao enviar resposta automática para ticket #${ticket.numero}`);
      }
      
    } catch (error) {
      console.error(`[Helpdesk Worker] Erro ao enviar resposta automática para ticket #${ticket.numero}:`, error);
    }
  }

  /**
   * Determina a prioridade do ticket baseada em palavras-chave
   */
  private determinePriority(assunto: string, descricao: string): HelpdeskPrioridade {
    const content = `${assunto} ${descricao}`.toLowerCase();
    
    // Palavras-chave para prioridade URGENTE
    const urgentKeywords = ['urgente', 'crítico', 'parado', 'emergência', 'falha crítica', 'sistema fora'];
    if (urgentKeywords.some(keyword => content.includes(keyword))) {
      return HelpdeskPrioridade.URGENTE;
    }
    
    // Palavras-chave para prioridade ALTA
    const highKeywords = ['importante', 'alta', 'problema grave', 'não funciona', 'erro'];
    if (highKeywords.some(keyword => content.includes(keyword))) {
      return HelpdeskPrioridade.ALTA;
    }
    
    // Palavras-chave para prioridade BAIXA
    const lowKeywords = ['dúvida', 'pergunta', 'sugestão', 'melhoria', 'quando possível'];
    if (lowKeywords.some(keyword => content.includes(keyword))) {
      return HelpdeskPrioridade.BAIXA;
    }
    
    // Padrão: prioridade MÉDIA
    return HelpdeskPrioridade.MEDIA;
  }

  /**
   * Constrói critérios de busca para emails
   */
  private buildSearchCriteria(lastSync: Date | null): any {
    // Sempre buscar emails não lidos, independentemente da data de sincronização
    // Emails não lidos devem ser processados mesmo se forem antigos
    const criteria: any = { unseen: true };
    
    // Não aplicar filtro de data para emails não lidos
    // O filtro de data pode impedir o processamento de emails antigos não lidos
    
    return criteria;
  }

  /**
   * Descriptografa senha (implementação básica - melhorar em produção)
   */
  private decryptPassword(encryptedPassword: string): string {
    // Por enquanto, assumindo que a senha está em texto plano
    // Em produção, implementar descriptografia adequada
    return encryptedPassword;
  }

  /**
   * Converte prioridade para texto legível
   */
  private getPriorityText(prioridade: HelpdeskPrioridade): string {
    const priorities = {
      [HelpdeskPrioridade.BAIXA]: 'Baixa',
      [HelpdeskPrioridade.MEDIA]: 'Média',
      [HelpdeskPrioridade.ALTA]: 'Alta',
      [HelpdeskPrioridade.URGENTE]: 'Urgente'
    };
    
    return priorities[prioridade] || 'Média';
  }

  /**
   * Retorna status do worker
   */
  getStatus(): { isRunning: boolean; syncInterval: number } {
    return {
      isRunning: this.isRunning,
      syncInterval: this.SYNC_INTERVAL
    };
  }
}

// Instância singleton do worker
export const helpdeskEmailWorker = new HelpdeskEmailWorker();

// Função para iniciar o worker
export async function startHelpdeskEmailWorker(): Promise<void> {
  await helpdeskEmailWorker.start();
}

// Função para parar o worker
export function stopHelpdeskEmailWorker(): void {
  helpdeskEmailWorker.stop();
}

export default helpdeskEmailWorker;
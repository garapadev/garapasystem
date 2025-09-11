import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
interface EmailConfig {
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapUser: string;
  imapPassword: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
}

interface EmailMessage {
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: Date;
  body: string;
  html?: string;
  messageId: string;
}

export class HelpdeskEmailService {
  private imapClient: ImapFlow | null = null;
  private smtpTransporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;
  private departamento: any;

  constructor(departamento: any) {
    this.departamento = departamento;
    this.config = {
      imapHost: departamento.imapHost || '',
      imapPort: departamento.imapPort || 993,
      imapSecure: departamento.imapSecure || true,
      imapUser: departamento.imapUser || '',
      imapPassword: departamento.imapPassword || '',
      smtpHost: departamento.smtpHost || '',
      smtpPort: departamento.smtpPort || 587,
      smtpSecure: departamento.smtpSecure || false,
      smtpUser: departamento.smtpUser || '',
      smtpPassword: departamento.smtpPassword || ''
    };
  }

  /**
   * Conecta ao servidor IMAP
   */
  async connectImap(): Promise<void> {
    if (!this.config.imapHost || !this.config.imapUser || !this.config.imapPassword) {
      throw new Error('Configurações IMAP incompletas');
    }

    this.imapClient = new ImapFlow({
      host: this.config.imapHost,
      port: this.config.imapPort,
      secure: this.config.imapSecure,
      auth: {
        user: this.config.imapUser,
        pass: this.config.imapPassword
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    });

    await this.imapClient.connect();
  }

  /**
   * Desconecta do servidor IMAP
   */
  async disconnectImap(): Promise<void> {
    if (this.imapClient) {
      await this.imapClient.logout();
      this.imapClient = null;
    }
  }

  /**
   * Configura o transportador SMTP
   */
  private createSmtpTransporter(): nodemailer.Transporter {
    if (!this.config.smtpHost || !this.config.smtpUser || !this.config.smtpPassword) {
      throw new Error('Configurações SMTP incompletas');
    }

    return nodemailer.createTransport({
      host: this.config.smtpHost,
      port: this.config.smtpPort,
      secure: this.config.smtpSecure,
      auth: {
        user: this.config.smtpUser,
        pass: this.config.smtpPassword
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    });
  }

  /**
   * Busca novos emails não lidos
   */
  async fetchNewEmails(): Promise<EmailMessage[]> {
    if (!this.imapClient) {
      await this.connectImap();
    }

    if (!this.imapClient) {
      throw new Error('Falha ao conectar com IMAP');
    }

    const lock = await this.imapClient.getMailboxLock('INBOX');
    const messages: EmailMessage[] = [];

    try {
      // Busca emails não lidos
      for await (const message of this.imapClient.fetch('UNSEEN', {
        envelope: true,
        source: true,
        uid: true
      })) {
        const emailMessage: EmailMessage = {
          uid: message.uid,
          subject: message.envelope?.subject || 'Sem assunto',
          from: message.envelope?.from?.[0]?.address || '',
          to: message.envelope?.to?.[0]?.address || '',
          date: message.envelope?.date || new Date(),
          body: message.source?.toString() || '',
          messageId: message.envelope?.messageId || ''
        };

        messages.push(emailMessage);
      }
    } finally {
      lock.release();
    }

    return messages;
  }

  /**
   * Marca email como lido
   */
  async markAsRead(uid: number): Promise<void> {
    if (!this.imapClient) {
      await this.connectImap();
    }

    if (!this.imapClient) {
      throw new Error('Falha ao conectar com IMAP');
    }

    const lock = await this.imapClient.getMailboxLock('INBOX');
    try {
      await this.imapClient.messageFlagsAdd(uid, ['\\Seen'], { uid: true });
    } finally {
      lock.release();
    }
  }

  /**
   * Envia email via SMTP
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    inReplyTo?: string;
    references?: string;
  }): Promise<void> {
    if (!this.smtpTransporter) {
      this.smtpTransporter = this.createSmtpTransporter();
    }

    const mailOptions = {
      from: this.config.smtpUser,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      inReplyTo: options.inReplyTo,
      references: options.references
    };

    await this.smtpTransporter.sendMail(mailOptions);
  }

  /**
   * Testa a conexão IMAP
   */
  async testImapConnection(): Promise<boolean> {
    try {
      await this.connectImap();
      await this.disconnectImap();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão IMAP:', error);
      return false;
    }
  }

  /**
   * Testa a conexão SMTP
   */
  async testSmtpConnection(): Promise<boolean> {
    try {
      const transporter = this.createSmtpTransporter();
      await transporter.verify();
      return true;
    } catch (error) {
      console.error('Erro ao testar conexão SMTP:', error);
      return false;
    }
  }

  /**
   * Cria ticket automaticamente a partir de email
   */
  async createTicketFromEmail(email: EmailMessage): Promise<string> {
    // Busca cliente pelo email
    const cliente = await db.cliente.findFirst({
      where: {
        email: email.from
      }
    });

    // Gera número sequencial do ticket
    const lastTicket = await db.helpdeskTicket.findFirst({
      where: {
        departamentoId: this.departamento.id
      },
      orderBy: {
        numero: 'desc'
      }
    });

    const nextNumber = (lastTicket?.numero || 0) + 1;
    const ticketNumber = `${this.departamento.prefixo || 'HD'}-${nextNumber.toString().padStart(6, '0')}`;

    // Cria o ticket
    const ticket = await db.helpdeskTicket.create({
      data: {
        numero: nextNumber,
        numeroFormatado: ticketNumber,
        assunto: email.subject,
        descricao: email.body,
        status: 'ABERTO',
        prioridade: 'MEDIA',
        departamentoId: this.departamento.id,
        clienteId: cliente?.id,
        emailOrigem: email.from,
        emailMessageId: email.messageId,
        dataAbertura: email.date
      }
    });

    // Cria a primeira mensagem do ticket
    await db.helpdeskMensagem.create({
      data: {
        ticketId: ticket.id,
        conteudo: email.body,
        tipo: 'EMAIL_RECEBIDO',
        emailFrom: email.from,
        emailTo: email.to,
        emailMessageId: email.messageId,
        dataEnvio: email.date
      }
    });

    return ticketNumber;
  }

  /**
   * Sincroniza emails automaticamente
   */
  async syncEmails(): Promise<{ processed: number; tickets: string[] }> {
    const emails = await this.fetchNewEmails();
    const ticketsCreated: string[] = [];

    for (const email of emails) {
      try {
        // Verifica se já existe ticket para este email
        const ticketExistente = await db.helpdeskTicket.findFirst({
          where: {
            emailMessageId: email.messageId,
            departamentoId: this.departamento.id
          }
        });

        if (!ticketExistente) {
          const ticketNumber = await this.createTicketFromEmail(email);
          ticketsCreated.push(ticketNumber);
        }

        // Marca email como lido
        await this.markAsRead(email.uid);
      } catch (error) {
        console.error(`Erro ao processar email ${email.messageId}:`, error);
      }
    }

    // Atualiza última sincronização
    await db.helpdeskDepartamento.update({
      where: { id: this.departamento.id },
      data: { ultimaSincronizacao: new Date() }
    });

    return {
      processed: emails.length,
      tickets: ticketsCreated
    };
  }
}

/**
 * Factory para criar instância do serviço de email
 */
export async function createHelpdeskEmailService(departamentoId: string): Promise<HelpdeskEmailService> {
  const departamento = await db.helpdeskDepartamento.findUnique({
    where: { id: departamentoId }
  });

  if (!departamento) {
    throw new Error('Departamento não encontrado');
  }

  return new HelpdeskEmailService(departamento);
}
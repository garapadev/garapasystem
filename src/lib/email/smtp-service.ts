import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import type { EmailConfig } from '@prisma/client';

interface EmailRecipient {
  name?: string;
  address: string;
}

interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  cid?: string;
}

interface SendEmailOptions {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  inReplyTo?: string;
  references?: string[];
}

export class SmtpService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  constructor(private emailConfigId: string) {}

  async connect(): Promise<boolean> {
    try {
      // Buscar configuração de email
      this.config = await db.emailConfig.findUnique({
        where: { id: this.emailConfigId }
      });

      if (!this.config || !this.config.ativo) {
        throw new Error('Configuração de email não encontrada ou inativa');
      }

      console.log('Configuração SMTP encontrada:', {
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpSecure,
        email: this.config.email
      });

      // Criar transporter SMTP
      // Para porta 587, usar secure: false e STARTTLS
      // Para porta 465, usar secure: true
      const isSecure = this.config.smtpPort === 465;
      
      this.transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: isSecure, // true apenas para porta 465
        auth: {
          user: this.config.email,
          pass: this.config.password // Em produção, descriptografar adequadamente
        },
        tls: {
          rejectUnauthorized: false // Para desenvolvimento, em produção configurar adequadamente
        },
        debug: true, // Habilitar logs de debug
        logger: true // Habilitar logger
      });

      console.log('Tentando verificar conexão SMTP...');
      // Verificar conexão
      await this.transporter.verify();
      console.log(`Conectado ao SMTP: ${this.config.email}`);
      return true;

    } catch (error) {
      console.error('Erro ao conectar SMTP:', error);
      console.error('Detalhes do erro:', {
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        code: (error as any)?.code,
        command: (error as any)?.command
      });
      return false;
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.transporter || !this.config) {
      return { success: false, error: 'Serviço SMTP não conectado' };
    }

    try {
      const mailOptions: nodemailer.SendMailOptions = {
        from: {
          name: this.config.email,
          address: this.config.email
        },
        to: options.to.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.address}>` : recipient.address
        ),
        cc: options.cc?.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.address}>` : recipient.address
        ),
        bcc: options.bcc?.map(recipient => 
          recipient.name ? `${recipient.name} <${recipient.address}>` : recipient.address
        ),
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
          cid: att.cid
        })),
        inReplyTo: options.inReplyTo,
        references: options.references?.join(' ')
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // Salvar email enviado no banco
      await this.saveOutgoingEmail(options, info.messageId || '');
      
      return { 
        success: true, 
        messageId: info.messageId || '' 
      };

    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async replyToEmail(originalMessageId: string, replyText: string, replyHtml?: string, replyToAll: boolean = false): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Configuração não encontrada' };
    }

    try {
      // Buscar email original
      const originalEmail = await db.email.findUnique({
        where: {
          emailConfigId_messageId: {
            emailConfigId: this.config.id,
            messageId: originalMessageId
          }
        }
      });

      if (!originalEmail) {
        return { success: false, error: 'Email original não encontrado' };
      }

      // Parsear destinatários
      const originalFrom = JSON.parse(originalEmail.from) as EmailRecipient[];
      const originalTo = JSON.parse(originalEmail.to) as EmailRecipient[];
      const originalCc = originalEmail.cc ? JSON.parse(originalEmail.cc) as EmailRecipient[] : [];
      const originalReferences = originalEmail.references ? JSON.parse(originalEmail.references) as string[] : [];

      // Determinar destinatários da resposta
      const replyTo = originalFrom;
      let replyCc: EmailRecipient[] = [];

      if (replyToAll) {
        // Incluir todos os destinatários originais, exceto o remetente atual
        const allRecipients = [...originalTo, ...originalCc];
        replyCc = allRecipients.filter(recipient => 
          recipient.address.toLowerCase() !== this.config!.email.toLowerCase()
        );
      }

      // Criar subject da resposta
      const replySubject = originalEmail.subject.startsWith('Re: ') 
        ? originalEmail.subject 
        : `Re: ${originalEmail.subject}`;

      // Criar referências
      const references = [...originalReferences, originalEmail.messageId];

      return await this.sendEmail({
        to: replyTo,
        cc: replyCc.length > 0 ? replyCc : undefined,
        subject: replySubject,
        text: replyText,
        html: replyHtml,
        inReplyTo: originalEmail.messageId,
        references: references
      });

    } catch (error) {
      console.error('Erro ao responder email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  async forwardEmail(originalMessageId: string, forwardTo: EmailRecipient[], forwardText?: string, forwardHtml?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'Configuração não encontrada' };
    }

    try {
      // Buscar email original
      const originalEmail = await db.email.findUnique({
        where: {
          emailConfigId_messageId: {
            emailConfigId: this.config.id,
            messageId: originalMessageId
          }
        },
        include: {
          attachments: true
        }
      });

      if (!originalEmail) {
        return { success: false, error: 'Email original não encontrado' };
      }

      // Criar subject do encaminhamento
      const forwardSubject = originalEmail.subject.startsWith('Fwd: ') 
        ? originalEmail.subject 
        : `Fwd: ${originalEmail.subject}`;

      // Preparar conteúdo do encaminhamento
      const originalFrom = JSON.parse(originalEmail.from) as EmailRecipient[];
      const originalTo = JSON.parse(originalEmail.to) as EmailRecipient[];
      
      const forwardHeader = `\n\n---------- Mensagem encaminhada ----------\n` +
        `De: ${originalFrom.map(f => f.name ? `${f.name} <${f.address}>` : f.address).join(', ')}\n` +
        `Data: ${originalEmail.date.toLocaleString()}\n` +
        `Assunto: ${originalEmail.subject}\n` +
        `Para: ${originalTo.map(t => t.name ? `${t.name} <${t.address}>` : t.address).join(', ')}\n\n`;

      const finalText = (forwardText || '') + forwardHeader + (originalEmail.textContent || '');
      const finalHtml = (forwardHtml || '') + forwardHeader.replace(/\n/g, '<br>') + (originalEmail.htmlContent || '');

      // Preparar anexos
      const attachments: EmailAttachment[] = originalEmail.attachments.map(att => ({
        filename: att.filename,
        content: Buffer.from(att.content, 'base64'),
        contentType: att.contentType || undefined
      }));

      return await this.sendEmail({
        to: forwardTo,
        subject: forwardSubject,
        text: finalText,
        html: finalHtml,
        attachments: attachments.length > 0 ? attachments : undefined
      });

    } catch (error) {
      console.error('Erro ao encaminhar email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      };
    }
  }

  private async saveOutgoingEmail(options: SendEmailOptions, messageId: string): Promise<void> {
    if (!this.config) return;

    try {
      // Buscar pasta "Sent" ou "Enviados"
      let sentFolder = await db.emailFolder.findFirst({
        where: {
          emailConfigId: this.config.id,
          OR: [
            { specialUse: 'Sent' },
            { name: { contains: 'Sent', mode: 'insensitive' } },
            { name: { contains: 'Enviados', mode: 'insensitive' } }
          ]
        }
      });

      // Se não encontrar, criar pasta "Sent"
      if (!sentFolder) {
        sentFolder = await db.emailFolder.create({
          data: {
            name: 'Sent',
            path: 'INBOX.Sent',
            delimiter: '.',
            specialUse: 'Sent',
            subscribed: true,
            emailConfigId: this.config.id
          }
        });
      }

      // Salvar email enviado
      await db.email.create({
        data: {
          messageId: messageId,
          uid: 0, // Emails enviados não têm UID do IMAP
          subject: options.subject,
          from: JSON.stringify([{ address: this.config.email, name: this.config.displayName }]),
          to: JSON.stringify(options.to),
          cc: JSON.stringify(options.cc || []),
          bcc: JSON.stringify(options.bcc || []),
          date: new Date(),
          size: (options.text || options.html || '').length,
          flags: JSON.stringify(['\\Seen']),
          isRead: true,
          isFlagged: false,
          isDeleted: false,
          textContent: options.text || null,
          htmlContent: options.html || null,
          inReplyTo: options.inReplyTo || null,
          references: JSON.stringify(options.references || []),
          emailConfigId: this.config.id,
          folderId: sentFolder.id
        }
      });

    } catch (error) {
      console.error('Erro ao salvar email enviado:', error);
    }
  }

  disconnect(): void {
    if (this.transporter) {
      this.transporter.close();
      this.transporter = null;
    }
  }
}

// Função utilitária para envio rápido de email
export async function sendQuickEmail(
  emailConfigId: string, 
  to: string[], 
  subject: string, 
  content: string, 
  isHtml: boolean = false
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const smtpService = new SmtpService(emailConfigId);
  
  try {
    const connected = await smtpService.connect();
    if (!connected) {
      return { success: false, error: 'Falha ao conectar ao servidor SMTP' };
    }

    const recipients: EmailRecipient[] = to.map(email => ({ address: email }));
    
    const result = await smtpService.sendEmail({
      to: recipients,
      subject,
      ...(isHtml ? { html: content } : { text: content })
    });

    return result;

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    };
  } finally {
    smtpService.disconnect();
  }
}
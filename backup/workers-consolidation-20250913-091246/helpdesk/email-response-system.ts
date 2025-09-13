import * as nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

export interface EmailResponseConfig {
  departamentoId: string;
  ticketNumero: number;
  ticketAssunto: string;
  ticketPrioridade: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  departamentoNome: string;
  grupoHierarquico?: string;
}

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailResponseSystem {
  private static instance: EmailResponseSystem;
  private transporters: Map<string, nodemailer.Transporter> = new Map();

  private constructor() {}

  public static getInstance(): EmailResponseSystem {
    if (!EmailResponseSystem.instance) {
      EmailResponseSystem.instance = new EmailResponseSystem();
    }
    return EmailResponseSystem.instance;
  }

  /**
   * Cria ou reutiliza um transporter SMTP para um departamento
   */
  private async getTransporter(departamentoId: string): Promise<nodemailer.Transporter | null> {
    try {
      // Verificar se já existe um transporter em cache
      if (this.transporters.has(departamentoId)) {
        return this.transporters.get(departamentoId)!;
      }

      // Buscar configurações SMTP do departamento
      const departamento = await db.helpdeskDepartamento.findUnique({
        where: { id: departamentoId },
        select: {
          smtpHost: true,
          smtpPort: true,
          smtpSecure: true,
          smtpEmail: true,
          smtpPassword: true,
          nome: true
        }
      });

      if (!departamento || !departamento.smtpEmail || !departamento.smtpPassword) {
        console.warn(`Departamento ${departamentoId} não possui configuração SMTP completa`);
        return null;
      }

      const smtpConfig: SMTPConfig = {
        host: departamento.smtpHost || 'localhost',
        port: departamento.smtpPort || 587,
        secure: departamento.smtpSecure === true,
        auth: {
          user: departamento.smtpEmail,
          pass: departamento.smtpPassword
        }
      };

      const transporter = nodemailer.createTransport(smtpConfig);

      // Verificar conexão
      await transporter.verify();
      
      // Armazenar em cache
      this.transporters.set(departamentoId, transporter);
      
      console.log(`Transporter SMTP criado para departamento: ${departamento.nome}`);
      return transporter;

    } catch (error) {
      console.error(`Erro ao criar transporter SMTP para departamento ${departamentoId}:`, error);
      return null;
    }
  }

  /**
   * Gera o template de email de confirmação de recebimento
   */
  private generateConfirmationTemplate(config: EmailResponseConfig): { subject: string; html: string; text: string } {
    const { ticketNumero, ticketAssunto, ticketPrioridade, solicitanteNome, departamentoNome, grupoHierarquico } = config;
    
    const prioridadeLabel = this.getPrioridadeLabel(ticketPrioridade);
    const prioridadeColor = this.getPrioridadeColor(ticketPrioridade);
    
    const subject = `[Ticket #${ticketNumero}] Confirmação de recebimento - ${ticketAssunto}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmação de Ticket</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .ticket-info { background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; color: white; }
        .footer { background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #6c757d; }
        .highlight { color: #007bff; font-weight: bold; }
        .warning { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h2>🎫 Ticket Criado com Sucesso</h2>
        <p>Olá <strong>${solicitanteNome}</strong>,</p>
        <p>Recebemos sua solicitação e criamos um ticket para acompanhamento.</p>
    </div>
    
    <div class="ticket-info">
        <h3>📋 Informações do Ticket</h3>
        <p><strong>Número:</strong> <span class="highlight">#${ticketNumero}</span></p>
        <p><strong>Assunto:</strong> ${ticketAssunto}</p>
        <p><strong>Prioridade:</strong> <span class="priority" style="background-color: ${prioridadeColor}">${prioridadeLabel}</span></p>
        <p><strong>Departamento:</strong> ${departamentoNome}</p>
        ${grupoHierarquico ? `<p><strong>Grupo:</strong> ${grupoHierarquico}</p>` : ''}
        <p><strong>Data de Abertura:</strong> ${new Date().toLocaleString('pt-BR')}</p>
    </div>
    
    <div class="ticket-info">
        <h3>⏱️ Próximos Passos</h3>
        <ul>
            <li>Sua solicitação foi registrada e está na fila de atendimento</li>
            <li>Nossa equipe analisará o ticket conforme a prioridade definida</li>
            <li>Você receberá atualizações por email sobre o progresso</li>
            <li>Para respostas, sempre mantenha o número do ticket no assunto</li>
        </ul>
    </div>
    
    <div class="ticket-info">
        <h3>📞 Tempo de Resposta Estimado</h3>
        <p>${this.getTempoRespostaEstimado(ticketPrioridade)}</p>
    </div>
    
    <div class="footer">
        <p><strong>⚠️ Importante:</strong></p>
        <ul>
            <li>Mantenha este email para referência futura</li>
            <li>Para respostas, responda a este email mantendo o número do ticket no assunto</li>
            <li>Não crie novos tickets para o mesmo problema</li>
        </ul>
        <hr>
        <p>Este é um email automático. Para dúvidas, responda a este email.</p>
        <p><em>Sistema de Helpdesk - ${departamentoNome}</em></p>
    </div>
</body>
</html>`;
    
    const text = `
TICKET CRIADO COM SUCESSO

Olá ${solicitanteNome},

Recebemos sua solicitação e criamos um ticket para acompanhamento.

INFORMAÇÕES DO TICKET:
- Número: #${ticketNumero}
- Assunto: ${ticketAssunto}
- Prioridade: ${prioridadeLabel}
- Departamento: ${departamentoNome}
${grupoHierarquico ? `- Grupo: ${grupoHierarquico}\n` : ''}- Data de Abertura: ${new Date().toLocaleString('pt-BR')}

PRÓXIMOS PASSOS:
- Sua solicitação foi registrada e está na fila de atendimento
- Nossa equipe analisará o ticket conforme a prioridade definida
- Você receberá atualizações por email sobre o progresso
- Para respostas, sempre mantenha o número do ticket no assunto

TEMPO DE RESPOSTA ESTIMADO:
${this.getTempoRespostaEstimado(ticketPrioridade)}

IMPORTANTE:
- Mantenha este email para referência futura
- Para respostas, responda a este email mantendo o número do ticket no assunto
- Não crie novos tickets para o mesmo problema

Este é um email automático. Para dúvidas, responda a este email.
Sistema de Helpdesk - ${departamentoNome}
`;
    
    return { subject, html, text };
  }

  /**
   * Obtém o label da prioridade em português
   */
  private getPrioridadeLabel(prioridade: string): string {
    const labels: Record<string, string> = {
      'BAIXA': 'Baixa',
      'MEDIA': 'Média',
      'ALTA': 'Alta',
      'URGENTE': 'Urgente',
      'CRITICA': 'Crítica'
    };
    return labels[prioridade] || prioridade;
  }

  /**
   * Obtém a cor da prioridade
   */
  private getPrioridadeColor(prioridade: string): string {
    const colors: Record<string, string> = {
      'BAIXA': '#28a745',
      'MEDIA': '#ffc107',
      'ALTA': '#fd7e14',
      'URGENTE': '#dc3545',
      'CRITICA': '#6f42c1'
    };
    return colors[prioridade] || '#6c757d';
  }

  /**
   * Obtém o tempo de resposta estimado baseado na prioridade
   */
  private getTempoRespostaEstimado(prioridade: string): string {
    const tempos: Record<string, string> = {
      'BAIXA': 'Até 5 dias úteis',
      'MEDIA': 'Até 3 dias úteis',
      'ALTA': 'Até 1 dia útil',
      'URGENTE': 'Até 4 horas',
      'CRITICA': 'Até 1 hora'
    };
    return tempos[prioridade] || 'Conforme disponibilidade da equipe';
  }

  /**
   * Envia email de confirmação de recebimento do ticket
   */
  public async sendTicketConfirmation(config: EmailResponseConfig): Promise<boolean> {
    try {
      const transporter = await this.getTransporter(config.departamentoId);
      
      if (!transporter) {
        console.error(`Não foi possível obter transporter para departamento ${config.departamentoId}`);
        return false;
      }

      const departamento = await db.helpdeskDepartamento.findUnique({
        where: { id: config.departamentoId },
        select: { smtpEmail: true, nome: true }
      });

      if (!departamento) {
        console.error(`Departamento ${config.departamentoId} não encontrado`);
        return false;
      }

      const template = this.generateConfirmationTemplate(config);

      const mailOptions = {
        from: {
          name: `${departamento.nome} - Helpdesk`,
          address: departamento.smtpEmail
        },
        to: {
          name: config.solicitanteNome,
          address: config.solicitanteEmail
        },
        subject: template.subject,
        text: template.text,
        html: template.html,
        headers: {
          'X-Ticket-Number': config.ticketNumero.toString(),
          'X-Department': config.departamentoNome,
          'X-Priority': config.ticketPrioridade
        }
      };

      const result = await transporter.sendMail(mailOptions);
      
      console.log(`Email de confirmação enviado para ${config.solicitanteEmail} - Ticket #${config.ticketNumero}`);
      console.log(`Message ID: ${result.messageId}`);
      
      // Registrar o envio no banco de dados
      await this.logEmailSent(config, result.messageId);
      
      return true;

    } catch (error) {
      console.error(`Erro ao enviar email de confirmação para ticket #${config.ticketNumero}:`, error);
      return false;
    }
  }

  /**
   * Registra o envio do email no banco de dados
   */
  private async logEmailSent(config: EmailResponseConfig, messageId: string): Promise<void> {
    try {
      // Buscar o ticket
      const ticket = await db.helpdeskTicket.findFirst({
        where: {
          numero: config.ticketNumero,
          departamentoId: config.departamentoId
        }
      });

      if (ticket) {
        // Criar uma mensagem de sistema indicando o envio da resposta automática
        await db.helpdeskMensagem.create({
          data: {
            conteudo: `Email de confirmação automática enviado para ${config.solicitanteEmail}`,
            remetenteNome: 'Sistema',
            remetenteEmail: 'sistema@helpdesk.local',
            emailMessageId: messageId,
            ticketId: ticket.id,
            isInterno: true
          }
        });
      }
    } catch (error) {
      console.error('Erro ao registrar envio de email:', error);
    }
  }

  /**
   * Envia email de atualização de status do ticket
   */
  public async sendStatusUpdate(ticketId: string, novoStatus: string, mensagem?: string): Promise<boolean> {
    try {
      const ticket = await db.helpdeskTicket.findUnique({
        where: { id: ticketId },
        include: {
          departamento: {
            select: {
              id: true,
              nome: true,
              smtpEmail: true,
              grupoHierarquico: {
                select: { nome: true }
              }
            }
          }
        }
      });

      if (!ticket) {
        console.error(`Ticket ${ticketId} não encontrado`);
        return false;
      }

      const config: EmailResponseConfig = {
        departamentoId: ticket.departamento.id,
        ticketNumero: ticket.numero,
        ticketAssunto: ticket.assunto,
        ticketPrioridade: ticket.prioridade,
        solicitanteNome: ticket.solicitanteNome,
        solicitanteEmail: ticket.solicitanteEmail,
        departamentoNome: ticket.departamento.nome,
        grupoHierarquico: ticket.departamento.grupoHierarquico?.nome
      };

      // Aqui você pode implementar templates específicos para diferentes tipos de atualização
      // Por enquanto, vamos usar o template de confirmação como base
      
      return await this.sendTicketConfirmation(config);

    } catch (error) {
      console.error(`Erro ao enviar atualização de status para ticket ${ticketId}:`, error);
      return false;
    }
  }

  /**
   * Limpa o cache de transporters
   */
  public clearTransporterCache(): void {
    this.transporters.clear();
    console.log('Cache de transporters SMTP limpo');
  }

  /**
   * Testa a configuração SMTP de um departamento
   */
  public async testSMTPConnection(departamentoId: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter(departamentoId);
      return transporter !== null;
    } catch (error) {
      console.error(`Erro ao testar conexão SMTP para departamento ${departamentoId}:`, error);
      return false;
    }
  }
}

// Exportar instância singleton
export const emailResponseSystem = EmailResponseSystem.getInstance();
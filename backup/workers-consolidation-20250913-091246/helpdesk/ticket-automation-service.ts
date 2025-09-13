import { db } from '../db';
import { HelpdeskImapMonitor } from './imap-monitor';
import { HelpdeskEmailParser } from './email-parser';
import { ImapService } from '../email/imap-service';
import { ClientIntegrationService } from './client-integration-service';

interface AutomationConfig {
  enabled: boolean;
  checkInterval: number; // em minutos
  maxEmailsPerCheck: number;
  retryAttempts: number;
  retryDelay: number; // em segundos
}

interface DepartmentStats {
  departmentId: number;
  departmentName: string;
  emailsProcessed: number;
  ticketsCreated: number;
  emailsIgnored: number;
  clientsAssociated: number;
  clientsCreated: number;
  errors: number;
  lastCheck: Date;
}

/**
 * Serviço principal de automação de tickets via IMAP
 * Gerencia o processo completo de monitoramento e criação de tickets
 */
export class TicketAutomationService {
  private static instance: TicketAutomationService;
  private monitors: Map<number, HelpdeskImapMonitor> = new Map();
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private stats: Map<number, DepartmentStats> = new Map();
  
  private config: AutomationConfig = {
    enabled: true,
    checkInterval: 5, // 5 minutos
    maxEmailsPerCheck: 50,
    retryAttempts: 3,
    retryDelay: 30 // 30 segundos
  };

  private constructor() {}

  /**
   * Singleton instance
   */
  static getInstance(): TicketAutomationService {
    if (!TicketAutomationService.instance) {
      TicketAutomationService.instance = new TicketAutomationService();
    }
    return TicketAutomationService.instance;
  }

  /**
   * Inicia o serviço de automação
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 Serviço de automação já está em execução');
      return;
    }

    try {
      console.log('🚀 Iniciando serviço de automação de tickets...');
      
      // Carregar departamentos com configuração IMAP
      await this.loadDepartments();
      
      // Iniciar monitoramento periódico
      this.startPeriodicCheck();
      
      this.isRunning = true;
      console.log('✅ Serviço de automação iniciado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar serviço de automação:', error);
      throw error;
    }
  }

  /**
   * Para o serviço de automação
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⏹️ Serviço de automação já está parado');
      return;
    }

    try {
      console.log('🛑 Parando serviço de automação...');
      
      // Parar verificação periódica
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      
      // Parar todos os monitores
      for (const monitor of this.monitors.values()) {
        await monitor.stopMonitoring();
      }
      
      this.monitors.clear();
      this.isRunning = false;
      
      console.log('✅ Serviço de automação parado');
      
    } catch (error) {
      console.error('❌ Erro ao parar serviço de automação:', error);
      throw error;
    }
  }

  /**
   * Reinicia o serviço
   */
  async restart(): Promise<void> {
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
    await this.start();
  }

  /**
   * Carrega departamentos com configuração IMAP
   */
  private async loadDepartments(): Promise<void> {
    try {
      const departamentos = await db.helpdeskDepartamento.findMany({
      where: {
        syncEnabled: true,
        AND: [
          { imapHost: { not: null } },
          { imapPort: { not: null } },
          { imapEmail: { not: null } },
          { imapPassword: { not: null } }
        ]
      }
      });

      console.log(`📂 Carregados ${departamentos.length} departamentos com IMAP configurado`);

      // Criar monitores para cada departamento
      for (const dept of departamentos) {
        try {
          const monitor = new HelpdeskImapMonitor(dept);
          this.monitors.set(dept.id, monitor);
          
          // Inicializar estatísticas
          this.stats.set(dept.id, {
            departmentId: dept.id,
            departmentName: dept.nome,
            emailsProcessed: 0,
            ticketsCreated: 0,
            emailsIgnored: 0,
            clientsAssociated: 0,
            clientsCreated: 0,
            errors: 0,
            lastCheck: new Date()
          });
          
          console.log(`✅ Monitor criado para departamento: ${dept.nome}`);
          
        } catch (error) {
          console.error(`❌ Erro ao criar monitor para ${dept.nome}:`, error);
        }
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar departamentos:', error);
      throw error;
    }
  }

  /**
   * Inicia verificação periódica
   */
  private startPeriodicCheck(): void {
    if (!this.config.enabled) {
      console.log('⏸️ Automação desabilitada na configuração');
      return;
    }

    const intervalMs = this.config.checkInterval * 60 * 1000;
    
    this.intervalId = setInterval(async () => {
      await this.checkAllDepartments();
    }, intervalMs);

    console.log(`⏰ Verificação periódica configurada para ${this.config.checkInterval} minutos`);
    
    // Executar primeira verificação imediatamente
    setTimeout(() => this.checkAllDepartments(), 5000); // 5 segundos após o início
  }

  /**
   * Verifica emails de todos os departamentos
   */
  private async checkAllDepartments(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🔍 Iniciando verificação de emails...');
    const startTime = Date.now();
    
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalIgnored = 0;
    let totalErrors = 0;

    for (const [deptId, monitor] of this.monitors) {
      try {
        const stats = this.stats.get(deptId);
        if (!stats) continue;

        console.log(`📧 Verificando departamento: ${stats.departmentName}`);
        
        const result = await this.checkDepartmentEmails(monitor, deptId);
        
        // Atualizar estatísticas
        stats.emailsProcessed += result.processed;
        stats.ticketsCreated += result.created;
        stats.emailsIgnored += result.ignored;
        stats.errors += result.errors;
        stats.lastCheck = new Date();
        
        totalProcessed += result.processed;
        totalCreated += result.created;
        totalIgnored += result.ignored;
        totalErrors += result.errors;
        
        console.log(`✅ ${stats.departmentName}: ${result.processed} processados, ${result.created} tickets criados`);
        
      } catch (error) {
        console.error(`❌ Erro ao verificar departamento ${deptId}:`, error);
        const stats = this.stats.get(deptId);
        if (stats) {
          stats.errors++;
        }
        totalErrors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`🏁 Verificação concluída em ${duration}ms`);
    console.log(`📊 Total: ${totalProcessed} processados, ${totalCreated} tickets, ${totalIgnored} ignorados, ${totalErrors} erros`);
  }

  /**
   * Verifica emails de um departamento específico
   */
  private async checkDepartmentEmails(
    monitor: HelpdeskImapMonitor, 
    deptId: number
  ): Promise<{ processed: number; created: number; ignored: number; errors: number }> {
    let processed = 0;
    let created = 0;
    let ignored = 0;
    let errors = 0;

    try {
      // Sincronizar emails
          const emails = await monitor.synchronizeEmails(this.config.maxEmailsPerCheck);
      
      for (const email of emails) {
        try {
          processed++;
          
          // Verificar se o email já foi processado
          if (await this.isEmailProcessed(email.messageId)) {
            ignored++;
            continue;
          }
          
          // Tentar criar ticket
          const ticket = await this.createTicketFromEmailData(monitor, email);
          
          if (ticket) {
            created++;
            // Marcar email como processado
            await this.markEmailAsProcessed(email.messageId, ticket.id);
          } else {
            ignored++;
            // Marcar como processado mas ignorado
            await this.markEmailAsProcessed(email.messageId, null);
          }
          
        } catch (error) {
          console.error(`❌ Erro ao processar email ${email.messageId}:`, error);
          errors++;
        }
      }
      
    } catch (error) {
      console.error(`❌ Erro na sincronização do departamento ${deptId}:`, error);
      errors++;
    }

    return { processed, created, ignored, errors };
  }

  /**
   * Verifica se um email já foi processado
   */
  private async isEmailProcessed(messageId: string): Promise<boolean> {
    if (!messageId) return false;
    
    const existing = await db.helpdeskMensagem.findFirst({
      where: {
        emailMessageId: messageId
      }
    });
    
    return !!existing;
  }

  /**
   * Marca um email como processado
   */
  private async markEmailAsProcessed(messageId: string, ticketId: number | null): Promise<void> {
    if (!messageId) return;
    
    try {
      // Criar registro de processamento
      await db.$executeRaw`
        INSERT INTO helpdesk_email_processados (message_id, ticket_id, processado_em)
        VALUES (${messageId}, ${ticketId}, NOW())
        ON DUPLICATE KEY UPDATE 
          ticket_id = VALUES(ticket_id),
          processado_em = VALUES(processado_em)
      `;
    } catch (error) {
      console.error('❌ Erro ao marcar email como processado:', error);
    }
  }

  /**
   * Cria ticket a partir de dados de email
   */
  private async createTicketFromEmailData(monitor: HelpdeskImapMonitor, emailData: any): Promise<any> {
    try {
      // Usar o parser para extrair dados estruturados
      const parsedData = HelpdeskEmailParser.parseEmail(
        {
          subject: emailData.subject,
          from: emailData.from,
          to: emailData.to,
          cc: emailData.cc,
          date: emailData.date,
          messageId: emailData.messageId,
          inReplyTo: emailData.inReplyTo,
          references: emailData.references
        },
        {
          text: emailData.text,
          html: emailData.html,
          attachments: emailData.attachments
        }
      );

      // Verificar se deve criar o ticket
      if (!HelpdeskEmailParser.shouldCreateTicket(parsedData)) {
        return null;
      }

      const remetente = emailData.from?.[0]?.address || 'desconhecido';
      const nomeRemetente = emailData.from?.[0]?.name || remetente;
      const departamento = monitor.getDepartment();

      // Gerar número do ticket
      const numero = await this.generateTicketNumber();

      // Criar ticket
      const ticket = await db.helpdeskTicket.create({
        data: {
          numero: numero,
          assunto: parsedData.assunto,
          descricao: parsedData.descricao,
          prioridade: parsedData.prioridade as any,
          status: 'ABERTO',
          solicitanteEmail: remetente,
          solicitanteNome: nomeRemetente,
          departamentoId: departamento.id,
          categoria: parsedData.categoria,
          tags: parsedData.tags.join(','),
          criadoEm: new Date(),
          atualizadoEm: new Date()
        }
      });

      // Criar mensagem inicial
      await db.helpdeskMensagem.create({
        data: {
          ticketId: ticket.id,
          remetente: remetente,
          nomeRemetente: nomeRemetente,
          assunto: parsedData.assunto,
          conteudo: parsedData.descricao,
          tipoConteudo: emailData.html ? 'HTML' : 'TEXTO',
          emailMessageId: emailData.messageId,
          emailInReplyTo: emailData.inReplyTo,
          emailReferences: emailData.references?.join(','),
          criadoEm: new Date()
        }
      });

      // Tentar associar cliente automaticamente
      await this.associateClientToTicket(ticket.id, remetente, nomeRemetente);

      return ticket;
    } catch (error) {
      console.error('❌ Erro ao criar ticket:', error);
      throw error;
    }
  }

  /**
   * Associa cliente ao ticket automaticamente
   */
  private async associateClientToTicket(
    ticketId: number,
    email: string,
    nome?: string
  ): Promise<void> {
    try {
      const result = await ClientIntegrationService.autoAssociateTicketToClient(
        ticketId.toString(),
        email,
        undefined, // telefone não disponível no email
        nome
      );
      
      if (result.success) {
          console.log(`Cliente associado ao ticket: ${result.message}`);
      } else {
        console.log(`Associação de cliente falhou: ${result.message}`);
        
        // Se não encontrou cliente e a confiança é baixa, tentar criar novo cliente
        if (result.confidence === undefined || result.confidence < 50) {
          const createResult = await ClientIntegrationService.createClientFromTicket(
            email,
            nome
          );
          
          if (createResult.success && createResult.clienteId) {
             // Associar o novo cliente ao ticket
              await db.helpdeskTicket.update({
                where: { id: ticketId },
                data: { clienteId: createResult.clienteId }
              });
              
              console.log(`Novo cliente criado e associado: ${createResult.message}`);
            }
        }
      }
    } catch (error) {
      console.error('Erro ao associar cliente ao ticket:', error);
    }
  }

  /**
   * Atualiza estatísticas
   */
  private updateStats(departamentoId: number | undefined, type: 'ticketsCreated' | 'emailsIgnored' | 'clientsAssociated' | 'clientsCreated' | 'errors'): void {
    // Atualizar estatísticas do departamento (se fornecido)
    if (departamentoId) {
      const stats = this.stats.get(departamentoId);
      if (stats) {
        switch (type) {
          case 'ticketsCreated':
            stats.ticketsCreated++;
            break;
          case 'emailsIgnored':
            stats.emailsIgnored++;
            break;
          case 'clientsAssociated':
            stats.clientsAssociated++;
            break;
          case 'clientsCreated':
            stats.clientsCreated++;
            break;
          case 'errors':
            stats.errors++;
            break;
        }
        stats.lastCheck = new Date();
      }
    }
  }

  /**
   * Gera número sequencial do ticket
   */
  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await db.helpdeskTicket.count({
      where: {
        criadoEm: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1)
        }
      }
    });
    
    return `${year}${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Força verificação manual de um departamento
   */
  async checkDepartment(departmentId: number): Promise<void> {
    const monitor = this.monitors.get(departmentId);
    if (!monitor) {
      throw new Error(`Monitor não encontrado para departamento ${departmentId}`);
    }

    console.log(`🔍 Verificação manual do departamento ${departmentId}`);
    await this.checkDepartmentEmails(monitor, departmentId);
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats(): DepartmentStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * Obtém status do serviço
   */
  getStatus(): {
    isRunning: boolean;
    config: AutomationConfig;
    departmentCount: number;
    uptime: number;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      departmentCount: this.monitors.size,
      uptime: this.isRunning ? Date.now() : 0
    };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<AutomationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar se necessário
    if (this.isRunning && (newConfig.checkInterval || newConfig.enabled !== undefined)) {
      console.log('🔄 Reiniciando serviço devido à mudança de configuração...');
      this.restart();
    }
  }

  /**
   * Adiciona novo departamento ao monitoramento
   */
  async addDepartment(departmentId: number): Promise<void> {
    try {
      const dept = await db.helpdeskDepartamento.findUnique({
        where: { id: departmentId }
      });

      if (!dept || !dept.imapEnabled) {
        throw new Error('Departamento não encontrado ou IMAP não habilitado');
      }

      const monitor = new HelpdeskImapMonitor(dept);
      this.monitors.set(dept.id, monitor);
      
      this.stats.set(dept.id, {
        departmentId: dept.id,
        departmentName: dept.nome,
        emailsProcessed: 0,
        ticketsCreated: 0,
        emailsIgnored: 0,
        clientsAssociated: 0,
        clientsCreated: 0,
        errors: 0,
        lastCheck: new Date()
      });

      console.log(`✅ Departamento ${dept.nome} adicionado ao monitoramento`);
      
    } catch (error) {
      console.error(`❌ Erro ao adicionar departamento ${departmentId}:`, error);
      throw error;
    }
  }

  /**
   * Remove departamento do monitoramento
   */
  async removeDepartment(departmentId: number): Promise<void> {
    const monitor = this.monitors.get(departmentId);
    if (monitor) {
      await monitor.stopMonitoring();
      this.monitors.delete(departmentId);
      this.stats.delete(departmentId);
      console.log(`✅ Departamento ${departmentId} removido do monitoramento`);
    }
  }
}

// Instância global do serviço
export const ticketAutomationService = TicketAutomationService.getInstance();
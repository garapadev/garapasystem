import { ImapFlow } from 'imapflow';
import { db } from '@/lib/db';
// Tipos do Prisma serão inferidos automaticamente
import { createHash } from 'crypto';
import { HelpdeskEmailParser } from './email-parser';

interface EmailMessage {
  uid: number;
  messageId: string;
  subject: string;
  from: { name?: string; address: string }[];
  to: { name?: string; address: string }[];
  date: Date;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    content: Buffer;
  }>;
}

interface TicketData {
  assunto: string;
  descricao: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  emailMessageId: string;
  emailUid: number;
}

export class HelpdeskImapMonitor {
  private client: ImapFlow | null = null;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private departamento: any;

  constructor(departamento: any) {
    this.departamento = departamento;
  }

  /**
   * Inicia o monitoramento IMAP para o departamento
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log(`Monitoramento já ativo para departamento ${this.departamento.nome}`);
      return;
    }

    if (!this.departamento.syncEnabled) {
      console.log(`Sincronização desabilitada para departamento ${this.departamento.nome}`);
      return;
    }

    if (!this.validateImapConfig()) {
      console.error(`Configuração IMAP inválida para departamento ${this.departamento.nome}`);
      return;
    }

    try {
      await this.connect();
      this.isMonitoring = true;
      
      // Sincronização inicial
      await this.syncNewEmails();
      
      // Configurar monitoramento contínuo
      this.setupContinuousMonitoring();
      
      console.log(`Monitoramento IMAP iniciado para departamento ${this.departamento.nome}`);
    } catch (error) {
      console.error(`Erro ao iniciar monitoramento para ${this.departamento.nome}:`, error);
      this.isMonitoring = false;
    }
  }

  /**
   * Para o monitoramento IMAP
   */
  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.client) {
      try {
        await this.client.logout();
      } catch (error) {
        console.error('Erro ao desconectar IMAP:', error);
      }
      this.client = null;
    }

    console.log(`Monitoramento IMAP parado para departamento ${this.departamento.nome}`);
  }

  /**
   * Sincroniza emails (método público para uso externo)
   */
  async synchronizeEmails(maxEmails: number = 50): Promise<any[]> {
    try {
      if (!this.client) {
        await this.connect();
      }

      const emails = await this.syncNewEmails();
      return emails || [];
    } catch (error) {
      console.error(`❌ Erro na sincronização de emails para ${this.departamento.nome}:`, error);
      return [];
    }
  }

  /**
   * Obtém o departamento associado
   */
  getDepartment(): any {
    return this.departamento;
  }

  /**
   * Valida a configuração IMAP do departamento
   */
  private validateImapConfig(): boolean {
    return !!(this.departamento.imapHost && 
             this.departamento.imapEmail && 
             this.departamento.imapPassword);
  }

  /**
   * Conecta ao servidor IMAP
   */
  private async connect(): Promise<void> {
    if (!this.departamento.imapHost || !this.departamento.imapEmail || !this.departamento.imapPassword) {
      throw new Error('Configuração IMAP incompleta');
    }

    this.client = new ImapFlow({
      host: this.departamento.imapHost,
      port: this.departamento.imapPort || 993,
      secure: this.departamento.imapSecure ?? true,
      auth: {
        user: this.departamento.imapEmail,
        pass: this.departamento.imapPassword
      },
      logger: false
    });

    await this.client.connect();
    console.log(`Conectado ao IMAP para ${this.departamento.nome}`);
  }

  /**
   * Configura o monitoramento contínuo
   */
  private setupContinuousMonitoring(): void {
    const interval = (this.departamento.syncInterval || 300) * 1000; // Converter para ms
    
    this.monitoringInterval = setInterval(async () => {
      if (this.isMonitoring) {
        try {
          await this.syncNewEmails();
        } catch (error) {
          console.error(`Erro na sincronização contínua para ${this.departamento.nome}:`, error);
        }
      }
    }, interval);
  }

  /**
   * Sincroniza novos emails e cria tickets
   */
  private async syncNewEmails(): Promise<void> {
    if (!this.client) {
      throw new Error('Cliente IMAP não conectado');
    }

    try {
      // Selecionar INBOX
      const lock = await this.client.getMailboxLock('INBOX');
      
      try {
        // Buscar emails não lidos
        const messages = this.client.fetch('1:*', {
          envelope: true,
          bodyStructure: true,
          source: true,
          uid: true,
          flags: true
        }, {
          uid: false
        });

        for await (const message of messages) {
          // Verificar se é um email não lido
          if (message.flags && !message.flags.has('\\Seen')) {
            await this.processNewEmail(message);
          }
        }

        // Atualizar timestamp da última sincronização
        await db.helpdeskDepartamento.update({
          where: { id: this.departamento.id },
          data: { lastSync: new Date() }
        });

      } finally {
        lock.release();
      }
    } catch (error) {
      console.error(`Erro ao sincronizar emails para ${this.departamento.nome}:`, error);
      throw error;
    }
  }

  /**
   * Processa um novo email e cria um ticket
   */
  private async processNewEmail(message: any): Promise<void> {
    try {
      // Verificar se já existe um ticket para este email
      const existingTicket = await db.helpdeskTicket.findFirst({
        where: {
          emailMessageId: message.envelope.messageId,
          departamentoId: this.departamento.id
        }
      });

      if (existingTicket) {
        console.log(`Ticket já existe para email ${message.envelope.messageId}`);
        return;
      }

      // Extrair dados do email
      const ticketData = await this.extractTicketData(message);
      
      // Criar ticket
      const ticket = await this.createTicket(ticketData);
      
      // Marcar email como lido
      if (this.client) {
        await this.client.messageFlagsAdd(message.uid, ['\\Seen'], { uid: true });
      }

      console.log(`Ticket #${ticket.numero} criado a partir do email ${message.envelope.messageId}`);
    } catch (error) {
      console.error(`Erro ao processar email ${message.envelope.messageId}:`, error);
    }
  }

  /**
   * Extrai dados do ticket a partir do email
   */
  private async extractTicketData(message: any): Promise<TicketData> {
    const envelope = message.envelope;
    const from = envelope.from?.[0];
    
    if (!from) {
      throw new Error('Email sem remetente');
    }

    // Buscar conteúdo do email
    let textContent = '';
    let htmlContent = '';

    if (this.client) {
      try {
        // Buscar conteúdo TEXT
        const textResult = await this.client.fetchOne(message.uid, {
          bodyParts: ['TEXT']
        }, { uid: true });
        
        if (textResult && textResult.bodyParts?.get('TEXT')) {
          textContent = textResult.bodyParts.get('TEXT').toString();
        }

        // Buscar conteúdo HTML se disponível
        const htmlResult = await this.client.fetchOne(message.uid, {
          bodyParts: ['1.1']
        }, { uid: true });
        
        if (htmlResult && htmlResult.bodyParts?.get('1.1')) {
          htmlContent = htmlResult.bodyParts.get('1.1').toString();
        }
      } catch (error) {
        console.warn('Erro ao buscar conteúdo do email:', error);
      }
    }

    // Usar texto ou HTML como descrição
    const descricao = textContent || htmlContent || 'Email sem conteúdo';

    return {
      assunto: envelope.subject || 'Sem assunto',
      descricao: this.cleanEmailContent(descricao),
      solicitanteNome: from.name || from.address.split('@')[0],
      solicitanteEmail: from.address,
      emailMessageId: envelope.messageId,
      emailUid: message.uid
    };
  }

  /**
   * Limpa o conteúdo do email removendo headers e formatação desnecessária
   */
  private cleanEmailContent(content: string): string {
    // Remover headers comuns de email
    let cleaned = content
      .replace(/^From:.*$/gm, '')
      .replace(/^To:.*$/gm, '')
      .replace(/^Subject:.*$/gm, '')
      .replace(/^Date:.*$/gm, '')
      .replace(/^Message-ID:.*$/gm, '')
      .replace(/^Content-Type:.*$/gm, '')
      .replace(/^Content-Transfer-Encoding:.*$/gm, '')
      .replace(/^MIME-Version:.*$/gm, '')
      .replace(/^X-.*$/gm, '')
      .replace(/^Received:.*$/gm, '')
      .replace(/^Return-Path:.*$/gm, '')
      .replace(/^Delivered-To:.*$/gm, '');

    // Remover linhas vazias excessivas
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Remover espaços em branco no início e fim
    cleaned = cleaned.trim();

    // Limitar tamanho se muito longo
    if (cleaned.length > 5000) {
      cleaned = cleaned.substring(0, 5000) + '\n\n[Conteúdo truncado...]';
    }

    return cleaned || 'Email sem conteúdo';
  }

  /**
   * Cria um novo ticket no banco de dados
   */
  private async createTicket(ticketData: TicketData): Promise<any> {
    // Usar o parser para extrair dados estruturados do email
    const emailContent = {
      text: ticketData.descricao,
      html: null,
      attachments: []
    };

    const parsedData = HelpdeskEmailParser.parseEmail(
      {
        subject: ticketData.assunto,
        from: [{ name: ticketData.solicitanteNome, address: ticketData.solicitanteEmail }],
        to: [],
        cc: [],
        date: new Date(),
        messageId: ticketData.emailMessageId,
        inReplyTo: null,
        references: []
      },
      emailContent
    );

    // Verificar se deve criar o ticket
    if (!HelpdeskEmailParser.shouldCreateTicket(parsedData)) {
      console.log(`⏭️ Email ignorado: ${HelpdeskEmailParser.generateSummary(parsedData)}`);
      return null;
    }

    // Gerar número sequencial do ticket
    const ultimoTicket = await db.helpdeskTicket.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true }
    });
    
    const novoNumero = (ultimoTicket?.numero || 0) + 1;

    // Tentar associar com cliente existente
    const cliente = await db.cliente.findFirst({
      where: { email: ticketData.solicitanteEmail }
    });

    // Criar ticket com dados parseados
    const ticket = await db.helpdeskTicket.create({
      data: {
        numero: novoNumero,
        assunto: parsedData.assunto,
        descricao: parsedData.descricao,
        prioridade: parsedData.prioridade,
        categoria: parsedData.categoria,
        tags: parsedData.tags.join(','),
        solicitanteNome: ticketData.solicitanteNome,
        solicitanteEmail: ticketData.solicitanteEmail,
        emailMessageId: ticketData.emailMessageId,
        emailUid: ticketData.emailUid,
        departamentoId: this.departamento.id,
        clienteId: cliente?.id,
        dataAbertura: new Date(),
        dataUltimaResposta: new Date()
      }
    });

    // Criar mensagem inicial do ticket
    await db.helpdeskMensagem.create({
      data: {
        conteudo: parsedData.descricao,
        remetenteNome: ticketData.solicitanteNome,
        remetenteEmail: ticketData.solicitanteEmail,
        emailMessageId: ticketData.emailMessageId,
        emailUid: ticketData.emailUid,
        ticketId: ticket.id,
        isInterno: false
      }
    });

    console.log(`✅ Ticket criado: #${ticket.numero} - ${parsedData.assunto}`);
    console.log(`📊 Dados: ${HelpdeskEmailParser.generateSummary(parsedData)}`);

    return ticket;
  }
}

/**
 * Gerenciador global de monitoramento IMAP para todos os departamentos
 */
export class HelpdeskImapManager {
  private static instance: HelpdeskImapManager;
  private monitors: Map<string, HelpdeskImapMonitor> = new Map();

  private constructor() {}

  static getInstance(): HelpdeskImapManager {
    if (!HelpdeskImapManager.instance) {
      HelpdeskImapManager.instance = new HelpdeskImapManager();
    }
    return HelpdeskImapManager.instance;
  }

  /**
   * Inicia monitoramento para todos os departamentos ativos
   */
  async startAllMonitoring(): Promise<void> {
    try {
      const departamentos = await db.helpdeskDepartamento.findMany({
        where: {
          ativo: true,
          syncEnabled: true,
          imapHost: { not: null },
          imapEmail: { not: null },
          imapPassword: { not: null }
        }
      });

      console.log(`Iniciando monitoramento para ${departamentos.length} departamentos`);

      for (const departamento of departamentos) {
        await this.startMonitoringForDepartment(departamento.id);
      }
    } catch (error) {
      console.error('Erro ao iniciar monitoramento geral:', error);
    }
  }

  /**
   * Inicia monitoramento para um departamento específico
   */
  async startMonitoringForDepartment(departamentoId: string): Promise<void> {
    try {
      const departamento = await db.helpdeskDepartamento.findUnique({
        where: { id: departamentoId }
      });

      if (!departamento) {
        throw new Error(`Departamento ${departamentoId} não encontrado`);
      }

      if (!departamento.ativo || !departamento.syncEnabled) {
        console.log(`Departamento ${departamento.nome} está inativo ou com sync desabilitado`);
        return;
      }

      // Parar monitoramento existente se houver
      await this.stopMonitoringForDepartment(departamentoId);

      // Criar novo monitor
      const monitor = new HelpdeskImapMonitor(departamento);
      this.monitors.set(departamentoId, monitor);

      // Iniciar monitoramento
      await monitor.startMonitoring();
    } catch (error) {
      console.error(`Erro ao iniciar monitoramento para departamento ${departamentoId}:`, error);
    }
  }

  /**
   * Para monitoramento para um departamento específico
   */
  async stopMonitoringForDepartment(departamentoId: string): Promise<void> {
    const monitor = this.monitors.get(departamentoId);
    if (monitor) {
      await monitor.stopMonitoring();
      this.monitors.delete(departamentoId);
    }
  }

  /**
   * Para todos os monitoramentos
   */
  async stopAllMonitoring(): Promise<void> {
    const promises = Array.from(this.monitors.keys()).map(id => 
      this.stopMonitoringForDepartment(id)
    );
    
    await Promise.all(promises);
    console.log('Todos os monitoramentos IMAP foram parados');
  }

  /**
   * Retorna status de todos os monitoramentos
   */
  getMonitoringStatus(): { departamentoId: string; isActive: boolean }[] {
    return Array.from(this.monitors.entries()).map(([departamentoId, monitor]) => ({
      departamentoId,
      isActive: true // Se está no Map, está ativo
    }));
  }
}
import { PrismaClient } from '@prisma/client';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { EventEmitter } from 'events';
import { RetryManager } from './retry-manager';

interface EmailMessage {
  uid: number;
  subject: string;
  from: string;
  to: string;
  date: Date;
  text?: string;
  html?: string;
  messageId: string;
}

interface DepartmentConfig {
  id: string;
  nome: string;
  imapHost: string;
  imapPort: number;
  imapEmail: string;
  imapPassword: string;
  imapSecure: boolean;
  syncInterval: number;
}

interface ConnectionPool {
  [departmentId: string]: {
    connection: ImapFlow;
    lastUsed: Date;
    isActive: boolean;
    retryCount: number;
    healthCheckCount: number;
    circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    lastFailure?: Date;
    consecutiveFailures: number;
  };
}

interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  circuitBreakerOpen: number;
  averageResponseTime: number;
}

class ConsolidatedHelpdeskWorker extends EventEmitter {
  private db: PrismaClient;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private connectionPool: ConnectionPool = {};
  private readonly maxRetries = 5;
  private readonly baseRetryDelay = 1000; // 1 segundo
  private readonly maxRetryDelay = 30000; // 30 segundos
  private readonly connectionTimeout = 60000; // 1 minuto
  private readonly poolCleanupInterval = 300000; // 5 minutos
  private readonly healthCheckInterval = 30000; // 30 segundos
  private readonly circuitBreakerThreshold = 3; // falhas consecutivas
  private readonly circuitBreakerTimeout = 60000; // 1 minuto
  private cleanupIntervalId: NodeJS.Timeout | null = null;
  private healthCheckIntervalId: NodeJS.Timeout | null = null;
  private retryManager: RetryManager;
  private poolStats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    circuitBreakerOpen: 0,
    averageResponseTime: 0
  };

  constructor() {
    super();
    this.db = new PrismaClient();
    this.retryManager = new RetryManager({
      maxRetries: this.maxRetries,
      baseDelay: this.baseRetryDelay,
      maxDelay: this.maxRetryDelay,
      backoffMultiplier: 2,
      jitterFactor: 0.1,
      retryableErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EHOSTUNREACH',
        'ENETUNREACH',
        'EAI_AGAIN',
        'IMAP_TIMEOUT',
        'IMAP_CONNECTION_LOST',
        'Error: Connection timeout',
        'Error: Authentication failed'
      ]
    });
    this.setupCleanupInterval();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Worker já está em execução');
      return;
    }

    console.log('Iniciando Consolidated Helpdesk Worker...');
    this.isRunning = true;
    this.emit('started');

    // Processar imediatamente
    await this.processAllDepartments();

    // Agendar processamento periódico
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        await this.processAllDepartments();
      }
    }, 60000); // 1 minuto

    console.log('Worker iniciado com sucesso');
  }

  async stop(): Promise<void> {
    console.log('Parando Consolidated Helpdesk Worker...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    
    if (this.healthCheckIntervalId) {
      clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
    }

    // Fechar todas as conexões do pool
    await this.closeAllConnections();
    
    await this.db.$disconnect();
    this.emit('stopped');
    console.log('Worker parado');
  }

  private setupCleanupInterval(): void {
    this.cleanupIntervalId = setInterval(() => {
      this.cleanupConnectionPool();
    }, this.poolCleanupInterval);
    
    this.healthCheckIntervalId = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckInterval);
  }

  private async processAllDepartments(): Promise<void> {
    try {
      const departments = await this.db.helpdeskDepartamento.findMany({
        where: {
          ativo: true,
          imapHost: { not: null },
          imapEmail: { not: null },
          imapPassword: { not: null }
        }
      });

      console.log(`Processando ${departments.length} departamentos`);

      for (const dept of departments) {
        if (!this.isRunning) break;
        
        try {
          await this.processDepartmentEmails({
            id: dept.id,
            nome: dept.nome,
            imapHost: dept.imapHost!,
            imapPort: dept.imapPort || 993,
            imapEmail: dept.imapEmail!,
            imapPassword: dept.imapPassword!,
            imapSecure: dept.imapSecure,
            syncInterval: dept.syncInterval
          });
        } catch (error) {
          console.error(`Erro ao processar departamento ${dept.nome}:`, error);
          this.emit('departmentError', { departmentId: dept.id, error });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      this.emit('error', error);
    }
  }

  private async processDepartmentEmails(department: DepartmentConfig): Promise<void> {
    console.log(`Processando emails do departamento: ${department.nome}`);
    
    const connection = await this.getConnection(department);
    if (!connection) {
      console.error(`Não foi possível obter conexão para ${department.nome}`);
      return;
    }

    try {
      await connection.mailboxOpen('INBOX');
      
      // Buscar emails não lidos
      const messages = await connection.search({ seen: false });
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        console.log(`Nenhum email não lido encontrado em ${department.nome}`);
        return;
      }
      console.log(`Encontrados ${messages.length} emails não lidos em ${department.nome}`);

      for (const uid of messages) {
        if (!this.isRunning) break;
        
        try {
          await this.processEmail(connection, uid, department);
        } catch (error) {
          console.error(`Erro ao processar email ${uid}:`, error);
        }
      }
    } catch (error) {
      console.error(`Erro ao processar emails de ${department.nome}:`, error);
      await this.handleConnectionError(department.id, error);
    }
  }

  private async getConnection(department: DepartmentConfig): Promise<ImapFlow | null> {
    const poolEntry = this.connectionPool[department.id];
    
    // Verificar circuit breaker
    if (poolEntry && poolEntry.circuitBreakerState === 'OPEN') {
      const now = new Date();
      if (poolEntry.lastFailure && (now.getTime() - poolEntry.lastFailure.getTime()) < this.circuitBreakerTimeout) {
        console.log(`Circuit breaker aberto para ${department.nome}, aguardando timeout`);
        return null;
      } else {
        // Tentar half-open
        poolEntry.circuitBreakerState = 'HALF_OPEN';
        console.log(`Circuit breaker em half-open para ${department.nome}`);
      }
    }
    
    // Verificar se existe conexão ativa no pool
    if (poolEntry && poolEntry.isActive && poolEntry.circuitBreakerState !== 'OPEN') {
      try {
        const startTime = Date.now();
        // Testar se a conexão ainda está válida
        await poolEntry.connection.noop();
        const responseTime = Date.now() - startTime;
        
        poolEntry.lastUsed = new Date();
        poolEntry.healthCheckCount++;
        this.updateResponseTime(responseTime);
        
        // Reset circuit breaker em caso de sucesso
        if (poolEntry.circuitBreakerState === 'HALF_OPEN') {
          poolEntry.circuitBreakerState = 'CLOSED';
          poolEntry.consecutiveFailures = 0;
          console.log(`Circuit breaker fechado para ${department.nome}`);
        }
        
        return poolEntry.connection;
      } catch (error) {
        console.log(`Conexão inválida para ${department.nome}, criando nova`);
        await this.handleConnectionFailure(department.id, error);
      }
    }

    // Criar nova conexão
    return await this.createConnection(department);
  }

  private async createConnection(department: DepartmentConfig): Promise<ImapFlow | null> {
    const retryKey = `imap-connection-${department.id}`;
    const startTime = Date.now();

    try {
      return await this.retryManager.executeWithRetry(
        retryKey,
        async () => {
          console.log(`Tentando conexão IMAP para ${department.nome}`);
          
          const connection = new ImapFlow({
            host: department.imapHost,
            port: department.imapPort,
            secure: department.imapSecure,
            auth: {
              user: department.imapEmail,
              pass: department.imapPassword
            },
            logger: false
          });

          await connection.connect();
          
          this.connectionPool[department.id] = {
            connection,
            lastUsed: new Date(),
            isActive: true,
            retryCount: 0,
            healthCheckCount: 0,
            circuitBreakerState: 'CLOSED',
            consecutiveFailures: 0
          };
          
          this.poolStats.totalConnections++;
          this.poolStats.activeConnections++;

          console.log(`Conexão IMAP estabelecida para ${department.nome}`);
          return connection;
        },
        (attempt, error, delay) => {
          console.log(`Tentativa ${attempt} falhou para ${department.nome}: ${error.message}. Próxima tentativa em ${delay}ms`);
          this.poolStats.failedConnections++;
          this.handleConnectionFailure(department.id, error);
        }
      );
    } catch (error) {
      console.error(`Falha ao conectar com IMAP após ${this.maxRetries} tentativas para ${department.nome}:`, error);
      return null;
    }
  }

  private async processEmail(connection: ImapFlow, uid: number, department: DepartmentConfig): Promise<void> {
    try {
      const message = await connection.fetchOne(uid, { source: true });
      if (!message || !message.source) {
        console.error(`Não foi possível buscar email ${uid}`);
        return;
      }
      const parsed = await simpleParser(message.source);
      
      const emailData: EmailMessage = {
        uid,
        subject: parsed.subject || 'Sem assunto',
        from: Array.isArray(parsed.from) ? parsed.from[0]?.text || '' : parsed.from?.text || '',
        to: Array.isArray(parsed.to) ? parsed.to[0]?.text || '' : parsed.to?.text || '',
        date: parsed.date || new Date(),
        text: parsed.text,
        html: parsed.html?.toString(),
        messageId: parsed.messageId || `${uid}-${Date.now()}`
      };

      // Verificar se o ticket já existe
      const existingTicket = await this.db.helpdeskTicket.findFirst({
        where: {
          emailMessageId: emailData.messageId
        }
      });

      if (existingTicket) {
        console.log(`Email ${emailData.messageId} já processado`);
        return;
      }

      // Criar novo ticket
      await this.createTicket(emailData, department);
      
      // Marcar email como lido
      await connection.messageFlagsAdd(uid, ['\\Seen']);
      
      console.log(`Ticket criado para email: ${emailData.subject}`);
      this.emit('ticketCreated', { emailData, department });
    } catch (error) {
      console.error(`Erro ao processar email ${uid}:`, error);
      throw error;
    }
  }

  private async createTicket(emailData: EmailMessage, department: DepartmentConfig): Promise<void> {
    const ticketNumber = await this.generateTicketNumber();
    
    await this.db.helpdeskTicket.create({
      data: {
        numero: parseInt(ticketNumber),
        assunto: emailData.subject,
        descricao: emailData.text || emailData.html || 'Sem conteúdo',
        prioridade: 'MEDIA',
        status: 'ABERTO',
        solicitanteNome: this.extractName(emailData.from),
        solicitanteEmail: this.extractEmail(emailData.from),
        departamentoId: department.id,
        emailMessageId: emailData.messageId,
        emailUid: emailData.uid
      }
    });
  }

  private async generateTicketNumber(): Promise<string> {
    const count = await this.db.helpdeskTicket.count();
    return String(count + 1).padStart(6, '0');
  }

  private extractName(fromField: string): string {
    const match = fromField.match(/^(.+?)\s*</);
    return match ? match[1].trim().replace(/"/g, '') : fromField.split('@')[0];
  }

  private extractEmail(fromField: string): string {
    const match = fromField.match(/<(.+?)>/);
    return match ? match[1] : fromField;
  }

  private async handleConnectionError(departmentId: string, error: any): Promise<void> {
    console.error(`Erro de conexão para departamento ${departmentId}:`, error);
    await this.removeFromPool(departmentId);
  }
  
  private async handleConnectionFailure(departmentId: string, error: any): Promise<void> {
    const poolEntry = this.connectionPool[departmentId];
    if (!poolEntry) return;
    
    poolEntry.consecutiveFailures++;
    poolEntry.lastFailure = new Date();
    
    // Ativar circuit breaker se necessário
    if (poolEntry.consecutiveFailures >= this.circuitBreakerThreshold) {
      poolEntry.circuitBreakerState = 'OPEN';
      this.poolStats.circuitBreakerOpen++;
      console.log(`Circuit breaker ativado para departamento ${departmentId} após ${poolEntry.consecutiveFailures} falhas`);
    }
    
    await this.removeFromPool(departmentId);
    this.emit('departmentError', { departmentId, error });
  }
  
  private updateResponseTime(responseTime: number): void {
    // Calcular média móvel simples
    this.poolStats.averageResponseTime = 
      (this.poolStats.averageResponseTime + responseTime) / 2;
  }
  
  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Object.entries(this.connectionPool)
      .filter(([_, entry]) => entry.isActive && entry.circuitBreakerState !== 'OPEN')
      .map(async ([departmentId, entry]) => {
        try {
          const startTime = Date.now();
          await entry.connection.noop();
          const responseTime = Date.now() - startTime;
          
          entry.healthCheckCount++;
          entry.lastUsed = new Date();
          this.updateResponseTime(responseTime);
          
          // Reset falhas consecutivas em caso de sucesso
          if (entry.consecutiveFailures > 0) {
            entry.consecutiveFailures = 0;
            if (entry.circuitBreakerState === 'HALF_OPEN') {
              entry.circuitBreakerState = 'CLOSED';
              this.poolStats.circuitBreakerOpen--;
            }
          }
        } catch (error) {
          console.log(`Health check falhou para departamento ${departmentId}`);
          await this.handleConnectionFailure(departmentId, error);
        }
      });
    
    await Promise.allSettled(healthCheckPromises);
    
    // Atualizar estatísticas
    this.poolStats.activeConnections = Object.values(this.connectionPool)
      .filter(entry => entry.isActive).length;
  }

  private async removeFromPool(departmentId: string): Promise<void> {
    const poolEntry = this.connectionPool[departmentId];
    if (poolEntry) {
      try {
        if (poolEntry.connection && poolEntry.isActive) {
          await poolEntry.connection.logout();
          this.poolStats.activeConnections--;
        }
        
        if (poolEntry.circuitBreakerState === 'OPEN') {
          this.poolStats.circuitBreakerOpen--;
        }
      } catch (error) {
        // Ignorar erros ao fechar conexão
      }
      delete this.connectionPool[departmentId];
    }
  }

  private cleanupConnectionPool(): void {
    const now = new Date();
    const timeout = this.connectionTimeout;
    
    Object.keys(this.connectionPool).forEach(async (departmentId) => {
      const poolEntry = this.connectionPool[departmentId];
      
      if (poolEntry && (now.getTime() - poolEntry.lastUsed.getTime()) > timeout) {
        console.log(`Limpando conexão inativa para departamento ${departmentId}`);
        await this.removeFromPool(departmentId);
      }
    });

    // Limpar estados de retry antigos (1 hora)
    this.retryManager.cleanup(3600000);
  }

  private async closeAllConnections(): Promise<void> {
    const promises = Object.keys(this.connectionPool).map(departmentId => 
      this.removeFromPool(departmentId)
    );
    await Promise.all(promises);
  }

  getStatus(): object {
    return {
      isRunning: this.isRunning,
      poolStats: this.poolStats,
      connectionPool: Object.fromEntries(
        Object.entries(this.connectionPool).map(([id, entry]) => [
          id,
          {
            isActive: entry.isActive,
            lastUsed: entry.lastUsed,
            retryCount: entry.retryCount,
            healthCheckCount: entry.healthCheckCount,
            circuitBreakerState: entry.circuitBreakerState,
            consecutiveFailures: entry.consecutiveFailures,
            lastFailure: entry.lastFailure
          }
        ])
      ),
      healthMetrics: {
        totalHealthChecks: Object.values(this.connectionPool)
          .reduce((sum, entry) => sum + entry.healthCheckCount, 0),
        averageResponseTime: this.poolStats.averageResponseTime,
        circuitBreakersOpen: this.poolStats.circuitBreakerOpen
      },
      retryStats: this.retryManager.getRetryStats()
    };
  }
}

export { ConsolidatedHelpdeskWorker };
export default ConsolidatedHelpdeskWorker;
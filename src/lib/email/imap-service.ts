import { ImapFlow } from 'imapflow';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { EmailNotificationService } from './notification-service';
import { decryptPassword } from './password-crypto';
import type { EmailConfig, Colaborador } from '@prisma/client';

interface ImapMessage {
  uid: number;
  flags: Set<string>;
  envelope: {
    messageId: string;
    subject: string;
    from: Array<{ name?: string; address: string }>;
    to?: Array<{ name?: string; address: string }>;
    cc?: Array<{ name?: string; address: string }>;
    bcc?: Array<{ name?: string; address: string }>;
    replyTo?: Array<{ name?: string; address: string }>;
    date: Date;
    inReplyTo?: string;
    references?: string[];
  };
  bodyStructure: any;
  size: number;
}

interface ImapFolder {
  name: string;
  path: string;
  delimiter: string;
  flags: Set<string>;
  specialUse?: string;
  subscribed: boolean;
  listed: boolean;
}

// Pool de conexões IMAP para reutilização
class ImapConnectionPool {
  private static instance: ImapConnectionPool;
  private connections: Map<string, { client: ImapFlow; lastUsed: number; inUse: boolean; isHealthy: boolean }> = new Map();
  private readonly maxConnections = 3; // Reduzido para evitar sobrecarga
  private readonly connectionTTL = 180000; // 3 minutos
  private readonly healthCheckInterval = 30000; // 30 segundos
  private healthCheckTimer?: NodeJS.Timeout;

  static getInstance(): ImapConnectionPool {
    if (!ImapConnectionPool.instance) {
      ImapConnectionPool.instance = new ImapConnectionPool();
      ImapConnectionPool.instance.startHealthCheck();
    }
    return ImapConnectionPool.instance;
  }

  private startHealthCheck() {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.healthCheckInterval);
  }

  private async performHealthCheck() {
    for (const [key, connection] of this.connections.entries()) {
      if (!connection.inUse) {
        try {
          await Promise.race([
            connection.client.noop(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Health check timeout')), 5000)
            )
          ]);
          connection.isHealthy = true;
        } catch (error) {
          console.log(`Conexão não saudável detectada: ${key}`);
          connection.isHealthy = false;
          this.connections.delete(key);
          try {
            await connection.client.logout();
          } catch (e) {
            // Ignorar erros de logout
          }
        }
      }
    }
  }

  private async decryptPasswordInternal(password: string): Promise<string> {
    try {
      return decryptPassword(password);
    } catch (error) {
      console.warn('Erro ao descriptografar senha:', error);
      return password;
    }
  }

  async getConnection(configId: string, config: EmailConfig): Promise<ImapFlow> {
    const existing = this.connections.get(configId);
    
    // Verificar se conexão existente ainda está válida e saudável
    if (existing && !existing.inUse && existing.isHealthy && (Date.now() - existing.lastUsed) < this.connectionTTL) {
      try {
        // Testar rapidamente se a conexão ainda está ativa
        await Promise.race([
          existing.client.noop(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection test timeout')), 3000)
          )
        ]);
        existing.inUse = true;
        existing.lastUsed = Date.now();
        console.log(`Reutilizando conexão IMAP para ${config.email}`);
        return existing.client;
      } catch (error) {
        console.warn('Conexão IMAP existente inválida, removendo do pool:', error);
        this.connections.delete(configId);
        try {
          await existing.client.logout();
        } catch (e) {
          // Ignorar erros de logout
        }
      }
    }

    // Limpar conexões antigas
    this.cleanupOldConnections();

    // Verificar limite de conexões
    if (this.connections.size >= this.maxConnections) {
      // Remover a conexão mais antiga não utilizada
      const oldestKey = Array.from(this.connections.entries())
        .filter(([_, conn]) => !conn.inUse)
        .sort(([_, a], [__, b]) => a.lastUsed - b.lastUsed)[0]?.[0];
      
      if (oldestKey) {
        const oldConnection = this.connections.get(oldestKey);
        this.connections.delete(oldestKey);
        try {
          await oldConnection?.client.logout();
        } catch (e) {
          // Ignorar erros de logout
        }
      } else {
        throw new Error('Pool de conexões IMAP esgotado');
      }
    }

    // Descriptografar senha
    const password = await this.decryptPasswordInternal(config.password);

    // Criar nova conexão com configurações otimizadas
    let lastError;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`Tentativa ${attempt}/3 de conexão IMAP para ${config.email}`);
        
        const client = new ImapFlow({
          host: config.imapHost,
          port: config.imapPort,
          secure: config.imapSecure,
          auth: {
            user: config.email,
            pass: password
          },
          logger: false, // Desabilitar logs verbosos em produção
          tls: {
            rejectUnauthorized: false, // Mais permissivo para servidores em nuvem
            minVersion: 'TLSv1.2', // Mais seguro que TLSv1.0
            maxVersion: 'TLSv1.3',
            ciphers: 'HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA'
          },
          connectionTimeout: 20000, // Reduzido para detectar problemas mais rápido
          greetingTimeout: 15000,
          socketTimeout: 45000, // Reduzido
          maxIdleTime: 180000, // 3 minutos
          clientInfo: {
            name: 'GarapaSystem WebMail',
            version: '1.0.0'
          },
          disableAutoIdle: true,
          emitLogs: false
        });

        // Conectar com timeout
        await Promise.race([
          client.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout')), 25000)
          )
        ]);
        
        this.connections.set(configId, {
          client,
          lastUsed: Date.now(),
          inUse: true,
          isHealthy: true
        });

        console.log(`Conexão IMAP estabelecida com sucesso para ${config.email}`);
        return client;
      } catch (error) {
        lastError = error;
        console.error(`Tentativa ${attempt}/3 falhou para ${config.email}:`, error);
        
        if (attempt < 3) {
          // Intervalo crescente entre tentativas
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt * attempt));
        }
      }
    }

    throw new Error(`Falha ao conectar ao servidor IMAP após 3 tentativas: ${lastError?.message || 'Erro desconhecido'}`);
  }

  releaseConnection(configId: string): void {
    const connection = this.connections.get(configId);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
      // Manter como saudável até próxima verificação
      connection.isHealthy = true;
    }
  }

  private cleanupOldConnections(): void {
    const now = Date.now();
    for (const [configId, connection] of this.connections.entries()) {
      if (!connection.inUse && (now - connection.lastUsed) > this.connectionTTL) {
        console.log(`Removendo conexão expirada: ${configId}`);
        this.connections.delete(configId);
        connection.client.logout().catch(() => {
          // Ignorar erros de logout em conexões expiradas
        });
      }
    }
  }

  // Método para limpeza completa do pool
  async cleanup(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    for (const [configId, connection] of this.connections.entries()) {
      try {
        await connection.client.logout();
      } catch (error) {
        // Ignorar erros de logout
      }
    }
    
    this.connections.clear();
    console.log('Pool de conexões IMAP limpo');
  }

  async closeAll(): Promise<void> {
    await this.cleanup();
  }
}

export class ImapService {
  private client: ImapFlow | null = null;
  private config: (EmailConfig & { colaborador: Colaborador }) | null = null;
  private isConnected = false;
  private connectionPool = ImapConnectionPool.getInstance();

  constructor(private emailConfigId: string) {}

  async connect(colaboradorId?: string): Promise<boolean> {
    try {
      // Buscar configuração de email do colaborador
      const searchId = colaboradorId || this.emailConfigId;
      if (!searchId) {
        throw new Error('ID do colaborador não fornecido');
      }

      console.log(`Buscando configuração de email para ID: ${searchId}`);
      
      this.config = await db.emailConfig.findUnique({
        where: { id: searchId },
        include: {
          colaborador: true
        }
      });

      if (!this.config || !this.config.ativo) {
        throw new Error(`Configuração de email não encontrada ou inativa para ID ${searchId}`);
      }

      console.log(`Configuração encontrada para ${this.config.email}`);

      // Validar configurações obrigatórias
      if (!this.config.imapHost || !this.config.email || !this.config.password) {
        throw new Error('Configurações IMAP incompletas (host, email ou senha em falta)');
      }

      // Usar pool de conexões para melhor eficiência
      console.log(`Estabelecendo conexão IMAP para ${this.config.email}...`);
      this.client = await this.connectionPool.getConnection(this.emailConfigId, this.config);
      this.isConnected = true;

      console.log(`Conexão IMAP estabelecida com sucesso para ${this.config.email}`);
      return true;

    } catch (error) {
      console.error('Erro ao conectar IMAP:', error);
      this.isConnected = false;
      
      // Re-throw com mais contexto
      if (error instanceof Error) {
        throw new Error(`Falha ao conectar ao servidor IMAP: ${error.message}`);
      }
      throw new Error('Falha ao conectar ao servidor IMAP: Erro desconhecido');
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      // Liberar conexão de volta para o pool em vez de fechar
      this.connectionPool.releaseConnection(this.emailConfigId);
      this.client = null;
      this.isConnected = false;
    }
  }

  async syncFolders(): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Cliente IMAP não conectado');
    }

    try {
      // Listar todas as pastas
      const folders = await this.client.list();
      
      for (const folder of folders) {
        const imapFolder = folder as ImapFolder;
        
        // Salvar ou atualizar pasta no banco
        await db.emailFolder.upsert({
          where: {
            emailConfigId_path: {
              emailConfigId: this.config.id,
              path: imapFolder.path
            }
          },
          create: {
            name: imapFolder.name,
            path: imapFolder.path,
            delimiter: imapFolder.delimiter,
            specialUse: imapFolder.specialUse || null,
            subscribed: imapFolder.subscribed,
            emailConfigId: this.config.id
          },
          update: {
            name: imapFolder.name,
            delimiter: imapFolder.delimiter,
            specialUse: imapFolder.specialUse || null,
            subscribed: imapFolder.subscribed,
            updatedAt: new Date()
          }
        });
      }

      console.log('Sincronização de pastas concluída');

    } catch (error) {
      console.error('Erro ao sincronizar pastas:', error);
      throw error;
    }
  }

  async syncEmails(folderPath: string = 'INBOX', limit: number = 50): Promise<void> {
    if (!this.client || !this.config) {
      throw new Error('Cliente IMAP não conectado');
    }

    let lock: any = null;
    try {
      // Selecionar pasta com timeout
      lock = await Promise.race([
        this.client.getMailboxLock(folderPath),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout ao acessar pasta')), 30000)
        )
      ]);
      
      // Buscar pasta no banco
      const folder = await db.emailFolder.findUnique({
        where: {
          emailConfigId_path: {
            emailConfigId: this.config.id,
            path: folderPath
          }
        }
      });

      if (!folder) {
        throw new Error(`Pasta ${folderPath} não encontrada`);
      }

      // Obter informações da pasta com retry
      let mailboxInfo;
      let retries = 3;
      while (retries > 0) {
        try {
          mailboxInfo = await this.client.status(folderPath, { 
            messages: true, 
            unseen: true, 
            uidNext: true,
            uidValidity: true 
          });
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      }
      
      // Atualizar contadores da pasta
      await db.emailFolder.update({
        where: { id: folder.id },
        data: {
          totalMessages: mailboxInfo.messages || 0,
          unreadMessages: mailboxInfo.unseen || 0
        }
      });

      // Buscar apenas emails novos (otimização)
      const totalMessages = mailboxInfo.messages || 0;
      if (totalMessages === 0) {
        console.log(`Pasta ${folderPath} está vazia`);
        return;
      }

      // Buscar UIDs dos emails mais recentes
      const startUid = Math.max(1, totalMessages - limit + 1);
      const messages = this.client.fetch(
        `${startUid}:*`,
        {
          envelope: true,
          flags: true,
          bodyStructure: true,
          size: true
        },
        { uid: true }
      );

      let processedCount = 0;
      for await (const message of messages) {
        const msg = message as ImapMessage;
        await this.saveEmail(msg, folder.id);
        processedCount++;
        
        // Limitar processamento para evitar sobrecarga
        if (processedCount >= limit) break;
      }

      console.log(`Sincronização de emails da pasta ${folderPath} concluída (${processedCount} emails processados)`);

      return {
        success: true,
        emailsSincronizados: processedCount,
        pastasSincronizadas: 1,
        message: 'Sincronização concluída com sucesso'
      };

    } catch (error) {
      console.error(`Erro ao sincronizar emails da pasta ${folderPath}:`, error);
      throw error;
    } finally {
      // Garantir que o lock seja liberado
      if (lock) {
        try {
          lock.release();
        } catch (e) {
          console.warn('Erro ao liberar lock da pasta:', e);
        }
      }
    }
  }

  private async saveEmail(message: ImapMessage, folderId: string): Promise<void> {
    if (!this.config) return;

    try {
      // Verificar se o email já existe
      const existingEmail = await db.email.findUnique({
        where: {
          emailConfigId_messageId: {
            emailConfigId: this.config.id,
            messageId: message.envelope.messageId
          }
        }
      });

      if (existingEmail) {
        // Atualizar flags se necessário
        const isRead = message.flags.has('\\Seen');
        const isFlagged = message.flags.has('\\Flagged');
        const isDeleted = message.flags.has('\\Deleted');

        if (existingEmail.isRead !== isRead || 
            existingEmail.isFlagged !== isFlagged || 
            existingEmail.isDeleted !== isDeleted) {
          await db.email.update({
            where: { id: existingEmail.id },
            data: {
              isRead,
              isFlagged,
              isDeleted,
              flags: JSON.stringify(Array.from(message.flags)),
              updatedAt: new Date()
            }
          });
        }
        return;
      }

      // Criar novo email
      const newEmail = await db.email.create({
        data: {
          messageId: message.envelope.messageId,
          uid: message.uid,
          subject: message.envelope.subject || '',
          from: JSON.stringify(message.envelope.from || []),
          to: JSON.stringify(message.envelope.to || []),
          cc: JSON.stringify(message.envelope.cc || []),
          bcc: JSON.stringify(message.envelope.bcc || []),
          replyTo: JSON.stringify(message.envelope.replyTo || []),
          date: message.envelope.date,
          size: message.size,
          flags: JSON.stringify(Array.from(message.flags)),
          isRead: message.flags.has('\\Seen'),
          isFlagged: message.flags.has('\\Flagged'),
          isDeleted: message.flags.has('\\Deleted'),
          inReplyTo: message.envelope.inReplyTo || null,
          references: JSON.stringify(message.envelope.references || []),
          emailConfigId: this.config.id,
          folderId: folderId
        }
      });

      // Disparar notificação para novos emails não lidos na INBOX
      if (!message.flags.has('\\Seen') && folderId === 'INBOX') {
        const fromAddress = message.envelope.from?.[0];
        const fromName = fromAddress?.name || fromAddress?.address || 'Desconhecido';
        
        await EmailNotificationService.notifyNewEmail({
          from: fromName,
          subject: message.envelope.subject || 'Sem assunto',
          folder: 'INBOX',
          emailConfigId: this.config.id,
          messageId: message.envelope.messageId
        });
      }

    } catch (error) {
      console.error('Erro ao salvar email:', error);
    }
  }

  async getEmailContent(messageId: string): Promise<{ text?: string; html?: string } | null> {
    if (!this.client || !this.config) {
      throw new Error('Cliente IMAP não conectado');
    }

    try {
      // Buscar email no banco
      const email = await db.email.findUnique({
        where: {
          emailConfigId_messageId: {
            emailConfigId: this.config.id,
            messageId: messageId
          }
        },
        include: {
          folder: true
        }
      });

      if (!email) {
        return null;
      }

      // Selecionar pasta
      const lock = await this.client.getMailboxLock(email.folder.path);

      try {
        // Buscar conteúdo do email
        const textContent = await this.client.fetchOne(email.uid, {
          bodyParts: ['TEXT']
        }, { uid: true });

        const htmlContent = await this.client.fetchOne(email.uid, {
          bodyParts: ['HTML']
        }, { uid: true });

        const result: { text?: string; html?: string } = {};

        if (textContent && typeof textContent === 'object' && 'bodyParts' in textContent) {
          const bodyParts = textContent.bodyParts as Map<string, Buffer>;
          if (bodyParts.get('TEXT')) {
            result.text = bodyParts.get('TEXT')?.toString();
          }
        }

        if (htmlContent && typeof htmlContent === 'object' && 'bodyParts' in htmlContent) {
          const bodyParts = htmlContent.bodyParts as Map<string, Buffer>;
          if (bodyParts.get('HTML')) {
            result.html = bodyParts.get('HTML')?.toString();
          }
        }
      } finally {
        lock.release();
      }

      // Atualizar conteúdo no banco
      await db.email.update({
        where: { id: email.id },
        data: {
          textContent: emailContent.text || null,
          htmlContent: emailContent.html || null
        }
      });

      return emailContent;

    } catch (error) {
      console.error('Erro ao buscar conteúdo do email:', error);
      return null;
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    if (!this.client || !this.config) {
      throw new Error('Cliente IMAP não conectado');
    }

    try {
      const email = await db.email.findUnique({
        where: {
          emailConfigId_messageId: {
            emailConfigId: this.config.id,
            messageId: messageId
          }
        },
        include: {
          folder: true
        }
      });

      if (!email) {
        return false;
      }

      // Selecionar pasta
      const lock = await this.client.getMailboxLock(email.folder.path);

      try {
        // Marcar como lido no servidor
        await this.client.messageFlagsAdd(email.uid, ['\\Seen'], { uid: true });
      } finally {
        lock.release();
      }

      // Atualizar no banco
      await db.email.update({
        where: { id: email.id },
        data: {
          isRead: true,
          updatedAt: new Date()
        }
      });

      return true;

    } catch (error) {
      console.error('Erro ao marcar email como lido:', error);
      return false;
    }
  }
}

// Função para iniciar sincronização automática
export async function startEmailSync(emailConfigId: string): Promise<void> {
  const imapService = new ImapService(emailConfigId);
  
  try {
    const connected = await imapService.connect();
    if (!connected) {
      throw new Error('Falha ao conectar ao servidor IMAP');
    }

    // Sincronizar pastas
    await imapService.syncFolders();

    // Sincronizar emails da INBOX
    await imapService.syncEmails('INBOX', 100);

    // Atualizar timestamp da última sincronização
    await db.emailConfig.update({
      where: { id: emailConfigId },
      data: {
        lastSync: new Date()
      }
    });

  } catch (error) {
    console.error('Erro na sincronização de email:', error);
  } finally {
    await imapService.disconnect();
  }
}
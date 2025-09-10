import { startEmailSync } from './imap-service';
import { db } from '@/lib/db';
import { emailSyncMonitor, initializeSyncMonitor } from './sync-monitor';

interface SyncJob {
  emailConfigId: string;
  intervalId: NodeJS.Timeout;
  isRunning: boolean;
}

class EmailSyncScheduler {
  private jobs: Map<string, SyncJob> = new Map();
  private readonly SYNC_INTERVAL = 30 * 1000; // 30 segundos em millisegundos (otimizado)
  private syncCount = 0; // Contador para verificações de consistência
  private isGlobalSyncEnabled = true; // Controle global do worker

  // Método para validar configuração de email
  private validateEmailConfig(config: any): boolean {
    try {
      // Validação básica dos campos obrigatórios
      if (!config.email || !config.imapHost || !config.imapPort || !config.password) {
        return false;
      }
      return true;
    } catch (error) {
      console.error('Erro na validação da configuração de email:', error);
      return false;
    }
  }

  // Método para lidar com erros de validação
  private handleValidationError(error: any, context: string): void {
    if (error.name === 'ZodError') {
      console.error(`Erro de validação Zod em ${context}:`, error.errors);
    } else {
      console.error(`Erro em ${context}:`, error);
    }
  }

  // Método para retry de operações
  private async retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`Tentativa ${attempt}/${maxRetries} falhou:`, error);
        if (attempt === maxRetries) {
          console.error('Todas as tentativas falharam');
          return null;
        }
        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    return null;
  }

  async startSyncForUser(colaboradorId: string): Promise<boolean> {
    try {
      // Buscar configuração de email do colaborador
      const emailConfig = await db.emailConfig.findFirst({
        where: {
          colaboradorId: colaboradorId,
          ativo: true
        }
      });

      if (!emailConfig) {
        console.log(`Nenhuma configuração de email ativa encontrada para colaborador ${colaboradorId}`);
        return false;
      }

      // Verificar se já existe um job rodando para esta configuração
      if (this.jobs.has(emailConfig.id)) {
        console.log(`Sincronização já está rodando para configuração ${emailConfig.id}`);
        return true;
      }

      // Executar sincronização inicial
      await this.performSync(emailConfig.id);

      // Agendar sincronizações periódicas
      const intervalId = setInterval(async () => {
        await this.performSync(emailConfig.id);
      }, this.SYNC_INTERVAL);

      // Armazenar job
      this.jobs.set(emailConfig.id, {
        emailConfigId: emailConfig.id,
        intervalId,
        isRunning: true
      });

      console.log(`[Worker] Sincronização iniciada para configuração ${emailConfig.id} (colaborador ${colaboradorId})`);
      return true;

    } catch (error) {
      console.error(`Erro ao iniciar sincronização para colaborador ${colaboradorId}:`, error);
      return false;
    }
  }

  stopSyncForUser(colaboradorId: string): boolean {
    try {
      // Encontrar job pelo colaboradorId
      const jobEntry = Array.from(this.jobs.entries()).find(async ([configId, job]) => {
        const config = await db.emailConfig.findUnique({
          where: { id: configId }
        });
        return config?.colaboradorId === colaboradorId;
      });

      if (!jobEntry) {
        console.log(`Nenhuma sincronização encontrada para colaborador ${colaboradorId}`);
        return false;
      }

      const [configId, job] = jobEntry;
      
      // Parar intervalo
      clearInterval(job.intervalId);
      
      // Remover job
      this.jobs.delete(configId);
      
      console.log(`Sincronização parada para colaborador ${colaboradorId}`);
      return true;

    } catch (error) {
      console.error(`Erro ao parar sincronização para colaborador ${colaboradorId}:`, error);
      return false;
    }
  }

  async startSyncForConfig(emailConfigId: string, syncInterval?: number): Promise<boolean> {
    try {
      // Verificar se já existe um job rodando para esta configuração
      if (this.jobs.has(emailConfigId)) {
        console.log(`Sincronização já está rodando para configuração ${emailConfigId}`);
        return true;
      }

      // Buscar configuração de email
      const emailConfig = await db.emailConfig.findUnique({
        where: { id: emailConfigId }
      });

      if (!emailConfig || !emailConfig.ativo) {
        console.log(`Configuração de email ${emailConfigId} não encontrada ou inativa`);
        return false;
      }

      // Executar sincronização inicial
      await this.performSync(emailConfigId);

      // Usar intervalo personalizado ou padrão
      const interval = (syncInterval || emailConfig.syncInterval || 180) * 1000;

      // Agendar sincronizações periódicas
      const intervalId = setInterval(async () => {
        await this.performSync(emailConfigId);
      }, interval);

      // Armazenar job
      this.jobs.set(emailConfigId, {
        emailConfigId,
        intervalId,
        isRunning: true
      });

      console.log(`[Worker] Sincronização iniciada para configuração ${emailConfigId}`);
      return true;

    } catch (error) {
      console.error(`Erro ao iniciar sincronização para configuração ${emailConfigId}:`, error);
      return false;
    }
  }

  stopSyncForConfig(emailConfigId: string): boolean {
    const job = this.jobs.get(emailConfigId);
    
    if (!job) {
      console.log(`Nenhuma sincronização encontrada para configuração ${emailConfigId}`);
      return false;
    }

    // Parar intervalo
    clearInterval(job.intervalId);
    
    // Remover job
    this.jobs.delete(emailConfigId);
    
    console.log(`Sincronização parada para configuração ${emailConfigId}`);
    return true;
  }

  private async performSync(emailConfigId: string): Promise<void> {
    // Verificar se o worker global está habilitado
    if (!this.isGlobalSyncEnabled) {
      emailSyncMonitor.logSyncSkip(emailConfigId, 'Sincronização global desabilitada');
      return;
    }

    const job = this.jobs.get(emailConfigId);
    
    if (!job || job.isRunning) {
      if (job?.isRunning) {
        emailSyncMonitor.logSyncSkip(emailConfigId, 'Sincronização já em andamento');
      }
      return; // Evitar sobreposição de sincronizações
    }

    const startTime = Date.now();
    emailSyncMonitor.logSyncStart(emailConfigId);

    try {
      job.isRunning = true;
      
      // Contar emails antes da sincronização
      const emailsBefore = await db.email.count({
        where: {
          emailConfigId: emailConfigId,
          isRead: false
        }
      });

      // Executar sincronização
      await startEmailSync(emailConfigId);
      
      // Incrementar contador de sincronizações
      this.syncCount++;
      
      // Verificar consistência a cada 5 sincronizações (aproximadamente 15 minutos)
      const shouldCheckConsistency = this.syncCount % 5 === 0;
      if (shouldCheckConsistency) {
        try {
          const { FolderConsistencyService } = await import('./folder-consistency');
          const consistencyService = new FolderConsistencyService(emailConfigId);
          const result = await consistencyService.maintainConsistency();
          
          if (result.success && result.fixes) {
            console.log(`[Worker] Consistência verificada para configuração ${emailConfigId}: ${result.fixes.foldersFixed} pastas corrigidas`);
          }
        } catch (consistencyError) {
          console.error(`[Worker] Erro na verificação de consistência para configuração ${emailConfigId}:`, consistencyError);
        }
      }
      
      // Contar emails após a sincronização
      const emailsAfter = await db.email.count({
        where: {
          emailConfigId: emailConfigId,
          isRead: false
        }
      });

      // Se há novos emails, emitir notificação
      if (emailsAfter > emailsBefore) {
        const newEmailsCount = emailsAfter - emailsBefore;
        await this.notifyNewEmails(emailConfigId, newEmailsCount);
      }

      // Atualizar timestamp da última sincronização
      await db.emailConfig.update({
        where: { id: emailConfigId },
        data: {
          lastSync: new Date()
        }
      });

      // Log de sucesso com métricas
      const duration = Date.now() - startTime;
      const newEmails = emailsAfter - emailsBefore;
      emailSyncMonitor.logSyncSuccess(emailConfigId, duration, newEmails);

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      emailSyncMonitor.logSyncError(emailConfigId, errorMessage, duration);
    } finally {
      if (job) {
        job.isRunning = false;
      }
    }
  }

  private async notifyNewEmails(emailConfigId: string, count: number): Promise<void> {
    try {
      // Buscar configuração e colaborador
      const emailConfig = await db.emailConfig.findUnique({
        where: { id: emailConfigId },
        include: {
          colaborador: {
            include: {
              usuarios: true
            }
          }
        }
      });

      if (!emailConfig || !emailConfig.colaborador) {
        return;
      }

      // Buscar emails mais recentes não lidos
      const recentEmails = await db.email.findMany({
        where: {
          emailConfigId: emailConfigId,
          isRead: false
        },
        orderBy: {
          date: 'desc'
        },
        take: count
      });

      // Criar notificação no banco (se houver tabela de notificações)
      // Por enquanto, apenas log
      console.log(`📧 ${count} novo(s) email(s) para ${emailConfig.email}:`);
      
      recentEmails.forEach(email => {
        const from = JSON.parse(email.from);
        console.log(`  - De: ${from[0]?.name || from[0]?.address} | Assunto: ${email.subject}`);
      });

      // Aqui você pode implementar notificações em tempo real
      // usando WebSockets, Server-Sent Events, ou push notifications
      
    } catch (error) {
      console.error('Erro ao processar notificação de novos emails:', error);
    }
  }

  async startAllActiveConfigs(): Promise<void> {
    try {
      // Buscar todas as configurações ativas
      const activeConfigs = await db.emailConfig.findMany({
        where: {
          ativo: true
        },
        include: {
          colaborador: true
        }
      });

      console.log(`Iniciando sincronização para ${activeConfigs.length} configuração(ões) ativa(s)`);

      // Iniciar sincronização para cada configuração
      for (const config of activeConfigs) {
        if (config.colaborador) {
          await this.startSyncForUser(config.colaborador.id);
        }
      }

    } catch (error) {
      console.error('Erro ao iniciar sincronizações automáticas:', error);
    }
  }

  stopAllSyncs(): void {
    console.log('Parando todas as sincronizações...');
    
    for (const [emailConfigId, job] of this.jobs) {
      clearInterval(job.intervalId);
      console.log(`Sincronização parada para configuração ${emailConfigId}`);
    }
    
    this.jobs.clear();
    console.log('Todas as sincronizações foram paradas');
  }

  // Métodos para controle global do worker
  enableGlobalSync(): void {
    this.isGlobalSyncEnabled = true;
    console.log('[Worker] Sincronização global habilitada');
  }

  disableGlobalSync(): void {
    this.isGlobalSyncEnabled = false;
    console.log('[Worker] Sincronização global desabilitada');
  }

  getGlobalStatus(): { isEnabled: boolean } {
    return {
      isEnabled: this.isGlobalSyncEnabled
    };
  }

  getActiveJobs(): Array<{ emailConfigId: string; isRunning: boolean; startedAt?: Date }> {
    const activeJobs: Array<{ emailConfigId: string; isRunning: boolean; startedAt?: Date }> = [];
    
    for (const [emailConfigId, job] of this.jobs) {
      activeJobs.push({
        emailConfigId,
        isRunning: job.isRunning,
        startedAt: new Date() // Aproximação, pois não temos o timestamp exato
      });
    }
    
    return activeJobs;
  }

  getActiveSyncs(): string[] {
    return Array.from(this.jobs.keys());
  }

  getSyncStatus(emailConfigId: string): { isActive: boolean; isRunning: boolean } | null {
    const job = this.jobs.get(emailConfigId);
    if (!job) {
      return null;
    }

    return {
      isActive: true,
      isRunning: job.isRunning
    };
  }

  isGlobalSyncActive(): boolean {
    return this.isGlobalSyncEnabled;
  }

  // Estatísticas do worker
  getWorkerStats(): {
    totalActiveJobs: number;
    syncInterval: number;
    globalSyncEnabled: boolean;
    activeSyncs: string[];
  } {
    return {
      totalActiveJobs: this.jobs.size,
      syncInterval: this.SYNC_INTERVAL,
      globalSyncEnabled: this.isGlobalSyncEnabled,
      activeSyncs: this.getActiveSyncs()
    };
  }
}

// Instância singleton do scheduler
export const emailSyncScheduler = new EmailSyncScheduler();

// Função para inicializar o sistema de sincronização
export async function initializeEmailSync(): Promise<void> {
  console.log('Inicializando sistema de sincronização de emails...');
  
  // Inicializar sistema de monitoramento
  initializeSyncMonitor();
  
  // Iniciar sincronização para todas as configurações ativas
  await emailSyncScheduler.startAllActiveConfigs();
  
  // Configurar handlers para shutdown graceful
  process.on('SIGINT', () => {
    console.log('Recebido SIGINT, parando sincronizações...');
    emailSyncScheduler.stopAllSyncs();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, parando sincronizações...');
    emailSyncScheduler.stopAllSyncs();
    process.exit(0);
  });
  
  console.log('Sistema de sincronização de emails inicializado');
}

// Função para adicionar nova configuração ao scheduler
export async function addEmailConfigToSync(colaboradorId: string): Promise<boolean> {
  return await emailSyncScheduler.startSyncForUser(colaboradorId);
}

// Função para remover configuração do scheduler
export function removeEmailConfigFromSync(colaboradorId: string): boolean {
  return emailSyncScheduler.stopSyncForUser(colaboradorId);
}
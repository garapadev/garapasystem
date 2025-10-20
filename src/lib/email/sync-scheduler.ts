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

  // Loop de agendamento encadeado para evitar sobreposição de sincronizações
  private scheduleSyncLoop(emailConfigId: string, intervalMs: number): void {
    const job = this.jobs.get(emailConfigId);
    if (!job) return;

    job.intervalId = setTimeout(async () => {
      try {
        await this.performSync(emailConfigId);
      } finally {
        // Reagendar somente após a conclusão da sincronização
        const currentJob = this.jobs.get(emailConfigId);
        if (currentJob) {
          this.scheduleSyncLoop(emailConfigId, intervalMs);
        }
      }
    }, intervalMs);
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

      // Definir intervalo baseado na configuração ou padrão (180s)
      const interval = (emailConfig.syncInterval || 180) * 1000;

      // Registrar job primeiro com isRunning=false e timer placeholder
      const placeholderTimer = setTimeout(() => {}, 0);
      this.jobs.set(emailConfig.id, {
        emailConfigId: emailConfig.id,
        intervalId: placeholderTimer,
        isRunning: false
      });

      // Executar sincronização inicial (imediata)
      await this.performSync(emailConfig.id);

      // Agendar próximas sincronizações sem sobreposição
      this.scheduleSyncLoop(emailConfig.id, interval);

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
      
      // Parar timer
      clearTimeout(job.intervalId);
      
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

      // Usar intervalo personalizado ou padrão
      const interval = (syncInterval || emailConfig.syncInterval || 180) * 1000;

      // Registrar job primeiro com isRunning=false e timer placeholder
      const placeholderTimer = setTimeout(() => {}, 0);
      this.jobs.set(emailConfigId, {
        emailConfigId,
        intervalId: placeholderTimer,
        isRunning: false
      });

      // Executar sincronização inicial (imediata)
      await this.performSync(emailConfigId);

      // Agendar próximas sincronizações sem sobreposição
      this.scheduleSyncLoop(emailConfigId, interval);

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

    // Parar timer
    clearTimeout(job.intervalId);
    
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
      
      // Executar sincronização e obter contagem processada
      const processedCount = await startEmailSync(emailConfigId);

      // Atualizar timestamp da última sincronização
      await db.emailConfig.update({
        where: { id: emailConfigId },
        data: {
          lastSync: new Date()
        }
      });

      // Log de sucesso com métricas
      const duration = Date.now() - startTime;
      emailSyncMonitor.logSyncSuccess(emailConfigId, duration, processedCount);

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
      // Buscar todas as configurações ativas e habilitadas
      const activeConfigs = await db.emailConfig.findMany({
        where: {
          ativo: true,
          syncEnabled: true
        },
        include: {
          colaborador: true
        }
      });

      console.log(`Iniciando sincronização para ${activeConfigs.length} configuração(ões) ativa(s e habilitadas)`);

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
      clearTimeout(job.intervalId);
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
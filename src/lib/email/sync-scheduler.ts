import { startEmailSync } from './imap-service';
import { db } from '@/lib/db';

interface SyncJob {
  emailConfigId: string;
  intervalId: NodeJS.Timeout;
  isRunning: boolean;
}

class EmailSyncScheduler {
  private jobs: Map<string, SyncJob> = new Map();
  private readonly SYNC_INTERVAL = 3 * 60 * 1000; // 3 minutos em millisegundos
  private syncCount = 0; // Contador para verificações de consistência

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

      console.log(`Sincronização iniciada para configuração ${emailConfig.id} (colaborador ${colaboradorId})`);
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
    const job = this.jobs.get(emailConfigId);
    
    if (!job || job.isRunning) {
      return; // Evitar sobreposição de sincronizações
    }

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
            console.log(`Consistência verificada para configuração ${emailConfigId}: ${result.fixes.foldersFixed} pastas corrigidas`);
          }
        } catch (consistencyError) {
          console.warn(`Erro na verificação de consistência para configuração ${emailConfigId}:`, consistencyError);
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

      console.log(`Sincronização concluída para configuração ${emailConfigId}`);

    } catch (error) {
      console.error(`Erro na sincronização da configuração ${emailConfigId}:`, error);
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
    console.log(`Parando ${this.jobs.size} sincronização(ões) ativa(s)`);
    
    for (const [configId, job] of this.jobs.entries()) {
      clearInterval(job.intervalId);
    }
    
    this.jobs.clear();
    console.log('Todas as sincronizações foram paradas');
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
}

// Instância singleton do scheduler
export const emailSyncScheduler = new EmailSyncScheduler();

// Função para inicializar o sistema de sincronização
export async function initializeEmailSync(): Promise<void> {
  console.log('Inicializando sistema de sincronização de emails...');
  
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
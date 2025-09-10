import { db } from '@/lib/db';
import { EmailSyncStatus } from '@prisma/client';

interface SyncMetrics {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageSyncTime: number;
  lastSyncTime?: Date;
  emailsProcessed: number;
  errorsCount: number;
}

interface SyncLogEntry {
  timestamp: Date;
  emailConfigId: string;
  action: 'start' | 'success' | 'error' | 'skip';
  message: string;
  duration?: number;
  emailsCount?: number;
  error?: string;
}

export class EmailSyncMonitor {
  private static instance: EmailSyncMonitor;
  private syncLogs: Map<string, SyncLogEntry[]> = new Map();
  private syncMetrics: Map<string, SyncMetrics> = new Map();
  private readonly MAX_LOG_ENTRIES = 100; // Manter apenas os últimos 100 logs por configuração

  static getInstance(): EmailSyncMonitor {
    if (!EmailSyncMonitor.instance) {
      EmailSyncMonitor.instance = new EmailSyncMonitor();
    }
    return EmailSyncMonitor.instance;
  }

  // Registrar início de sincronização
  logSyncStart(emailConfigId: string): void {
    const entry: SyncLogEntry = {
      timestamp: new Date(),
      emailConfigId,
      action: 'start',
      message: `[${new Date().toISOString()}] Iniciando sincronização para configuração ${emailConfigId}`
    };

    this.addLogEntry(emailConfigId, entry);
    this.updateMetrics(emailConfigId, 'start');
    
    console.log(`[Worker Monitor] ${entry.message}`);
  }

  // Registrar sucesso de sincronização
  logSyncSuccess(emailConfigId: string, duration: number, emailsCount: number): void {
    const entry: SyncLogEntry = {
      timestamp: new Date(),
      emailConfigId,
      action: 'success',
      message: `[${new Date().toISOString()}] Sincronização concluída com sucesso - ${emailsCount} emails processados em ${duration}ms`,
      duration,
      emailsCount
    };

    this.addLogEntry(emailConfigId, entry);
    this.updateMetrics(emailConfigId, 'success', duration, emailsCount);
    
    console.log(`[Worker Monitor] ${entry.message}`);
  }

  // Registrar erro de sincronização
  logSyncError(emailConfigId: string, error: string, duration?: number): void {
    const entry: SyncLogEntry = {
      timestamp: new Date(),
      emailConfigId,
      action: 'error',
      message: `[${new Date().toISOString()}] Erro na sincronização: ${error}`,
      duration,
      error
    };

    this.addLogEntry(emailConfigId, entry);
    this.updateMetrics(emailConfigId, 'error');
    
    console.error(`[Worker Monitor] ${entry.message}`);
  }

  // Registrar sincronização pulada
  logSyncSkip(emailConfigId: string, reason: string): void {
    const entry: SyncLogEntry = {
      timestamp: new Date(),
      emailConfigId,
      action: 'skip',
      message: `[${new Date().toISOString()}] Sincronização pulada: ${reason}`
    };

    this.addLogEntry(emailConfigId, entry);
    
    console.log(`[Worker Monitor] ${entry.message}`);
  }

  // Adicionar entrada de log
  private addLogEntry(emailConfigId: string, entry: SyncLogEntry): void {
    if (!this.syncLogs.has(emailConfigId)) {
      this.syncLogs.set(emailConfigId, []);
    }

    const logs = this.syncLogs.get(emailConfigId)!;
    logs.push(entry);

    // Manter apenas os últimos logs
    if (logs.length > this.MAX_LOG_ENTRIES) {
      logs.shift();
    }
  }

  // Atualizar métricas
  private updateMetrics(emailConfigId: string, action: string, duration?: number, emailsCount?: number): void {
    if (!this.syncMetrics.has(emailConfigId)) {
      this.syncMetrics.set(emailConfigId, {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageSyncTime: 0,
        emailsProcessed: 0,
        errorsCount: 0
      });
    }

    const metrics = this.syncMetrics.get(emailConfigId)!;

    switch (action) {
      case 'start':
        metrics.totalSyncs++;
        break;
      case 'success':
        metrics.successfulSyncs++;
        if (duration) {
          metrics.averageSyncTime = (metrics.averageSyncTime + duration) / 2;
        }
        if (emailsCount) {
          metrics.emailsProcessed += emailsCount;
        }
        metrics.lastSyncTime = new Date();
        break;
      case 'error':
        metrics.failedSyncs++;
        metrics.errorsCount++;
        break;
    }
  }

  // Obter logs de uma configuração
  getLogs(emailConfigId: string, limit?: number): SyncLogEntry[] {
    const logs = this.syncLogs.get(emailConfigId) || [];
    return limit ? logs.slice(-limit) : logs;
  }

  // Obter métricas de uma configuração
  getMetrics(emailConfigId: string): SyncMetrics | null {
    return this.syncMetrics.get(emailConfigId) || null;
  }

  // Obter métricas globais
  getGlobalMetrics(): {
    totalConfigs: number;
    activeConfigs: number;
    totalSyncs: number;
    successRate: number;
    averageSyncTime: number;
  } {
    const allMetrics = Array.from(this.syncMetrics.values());
    
    const totalSyncs = allMetrics.reduce((sum, m) => sum + m.totalSyncs, 0);
    const successfulSyncs = allMetrics.reduce((sum, m) => sum + m.successfulSyncs, 0);
    const totalSyncTime = allMetrics.reduce((sum, m) => sum + m.averageSyncTime, 0);
    
    return {
      totalConfigs: this.syncMetrics.size,
      activeConfigs: allMetrics.filter(m => m.lastSyncTime && 
        (new Date().getTime() - m.lastSyncTime.getTime()) < 300000 // 5 minutos
      ).length,
      totalSyncs,
      successRate: totalSyncs > 0 ? (successfulSyncs / totalSyncs) * 100 : 0,
      averageSyncTime: allMetrics.length > 0 ? totalSyncTime / allMetrics.length : 0
    };
  }

  // Limpar logs antigos
  clearOldLogs(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - (olderThanHours * 60 * 60 * 1000));
    
    for (const [emailConfigId, logs] of this.syncLogs) {
      const filteredLogs = logs.filter(log => log.timestamp > cutoffTime);
      this.syncLogs.set(emailConfigId, filteredLogs);
    }
    
    console.log(`[Worker Monitor] Logs antigos removidos (mais de ${olderThanHours}h)`);
  }

  // Atualizar status no banco de dados
  async updateDatabaseStatus(emailConfigId: string, status: EmailSyncStatus): Promise<void> {
    try {
      await db.emailConfig.update({
        where: { id: emailConfigId },
        data: { 
          lastSync: new Date(),
          // Nota: EmailSyncStatus não existe no schema atual, mas pode ser adicionado futuramente
        }
      });
    } catch (error) {
      console.error(`[Worker Monitor] Erro ao atualizar status no banco:`, error);
    }
  }

  // Gerar relatório de sincronização
  generateSyncReport(): {
    summary: any;
    configDetails: Array<{
      emailConfigId: string;
      metrics: SyncMetrics;
      recentLogs: SyncLogEntry[];
    }>;
  } {
    const summary = this.getGlobalMetrics();
    const configDetails = [];

    for (const [emailConfigId, metrics] of this.syncMetrics) {
      configDetails.push({
        emailConfigId,
        metrics,
        recentLogs: this.getLogs(emailConfigId, 5) // Últimos 5 logs
      });
    }

    return {
      summary,
      configDetails
    };
  }
}

// Instância singleton do monitor
export const emailSyncMonitor = EmailSyncMonitor.getInstance();

// Função para inicializar limpeza automática de logs
export function initializeSyncMonitor(): void {
  // Limpar logs antigos a cada 6 horas
  setInterval(() => {
    emailSyncMonitor.clearOldLogs(24);
  }, 6 * 60 * 60 * 1000);
  
  console.log('[Worker Monitor] Sistema de monitoramento inicializado');
}
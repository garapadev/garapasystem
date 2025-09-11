import { useState, useCallback, useEffect } from 'react';
import { SyncStats, SyncOptions } from '@/lib/helpdesk/sync-service';

export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: Date | null;
  stats: {
    totalTickets: number;
    ticketsWithClients: number;
    ticketsWithoutClients: number;
    totalClients: number;
    clientsWithTickets: number;
  };
  nextRecommendedSync: Date;
}

export interface UseHelpdeskSyncReturn {
  // Estados
  isLoading: boolean;
  error: string | null;
  syncStatus: SyncStatus | null;
  lastSyncResult: SyncStats | null;
  
  // Funções
  startFullSync: (options?: SyncOptions) => Promise<SyncStats | null>;
  startIncrementalSync: (options?: SyncOptions) => Promise<SyncStats | null>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
  
  // Utilitários
  canSync: boolean;
  syncProgress: number;
}

export function useHelpdeskSync(): UseHelpdeskSyncReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncStats | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/helpdesk/sync');
      
      if (!response.ok) {
        throw new Error('Erro ao obter status da sincronização');
      }
      
      const data = await response.json();
      setSyncStatus({
        isRunning: data.isRunning,
        lastSyncTime: data.lastSyncTime ? new Date(data.lastSyncTime) : null,
        stats: data.stats,
        nextRecommendedSync: new Date(data.nextRecommendedSync)
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter status';
      setError(errorMessage);
    }
  }, []);

  const startFullSync = useCallback(async (options: SyncOptions = {}): Promise<SyncStats | null> => {
    setIsLoading(true);
    setError(null);
    setSyncProgress(0);
    
    try {
      const response = await fetch('/api/helpdesk/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          incremental: false
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na sincronização');
      }

      setLastSyncResult(data.stats);
      setSyncProgress(100);
      
      // Atualizar status após sincronização
      await refreshStatus();
      
      return data.stats;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na sincronização completa';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
      setSyncProgress(0);
    }
  }, [refreshStatus]);

  const startIncrementalSync = useCallback(async (options: SyncOptions = {}): Promise<SyncStats | null> => {
    setIsLoading(true);
    setError(null);
    setSyncProgress(0);
    
    try {
      const response = await fetch('/api/helpdesk/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...options,
          incremental: true
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na sincronização');
      }

      setLastSyncResult(data.stats);
      setSyncProgress(100);
      
      // Atualizar status após sincronização
      await refreshStatus();
      
      return data.stats;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na sincronização incremental';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
      setSyncProgress(0);
    }
  }, [refreshStatus]);

  // Carregar status inicial
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Polling para atualizar status durante sincronização
  useEffect(() => {
    if (syncStatus?.isRunning) {
      const interval = setInterval(() => {
        refreshStatus();
      }, 2000); // Atualizar a cada 2 segundos
      
      return () => clearInterval(interval);
    }
  }, [syncStatus?.isRunning, refreshStatus]);

  const canSync = !isLoading && !syncStatus?.isRunning;

  return {
    // Estados
    isLoading,
    error,
    syncStatus,
    lastSyncResult,
    
    // Funções
    startFullSync,
    startIncrementalSync,
    refreshStatus,
    clearError,
    
    // Utilitários
    canSync,
    syncProgress
  };
}

// Hook para monitoramento automático de sincronização
export function useAutoSync(intervalMinutes: number = 60) {
  const { startIncrementalSync, syncStatus, canSync } = useHelpdeskSync();
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [lastAutoSync, setLastAutoSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!autoSyncEnabled || !canSync) return;

    const interval = setInterval(async () => {
      try {
        console.log('Executando sincronização automática...');
        await startIncrementalSync({ syncUnassociatedOnly: true });
        setLastAutoSync(new Date());
      } catch (error) {
        console.error('Erro na sincronização automática:', error);
      }
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoSyncEnabled, canSync, intervalMinutes, startIncrementalSync]);

  return {
    autoSyncEnabled,
    setAutoSyncEnabled,
    lastAutoSync,
    syncStatus
  };
}

// Hook para estatísticas de sincronização
export function useSyncStats() {
  const [stats, setStats] = useState<{
    efficiency: number;
    associationRate: number;
    clientCreationRate: number;
    errorRate: number;
  } | null>(null);
  
  const { lastSyncResult, syncStatus } = useHelpdeskSync();

  useEffect(() => {
    if (lastSyncResult && syncStatus) {
      const efficiency = lastSyncResult.ticketsProcessed > 0 
        ? (lastSyncResult.ticketsAssociated / lastSyncResult.ticketsProcessed) * 100
        : 0;
        
      const associationRate = syncStatus.stats.totalTickets > 0
        ? (syncStatus.stats.ticketsWithClients / syncStatus.stats.totalTickets) * 100
        : 0;
        
      const clientCreationRate = lastSyncResult.ticketsProcessed > 0
        ? (lastSyncResult.clientsCreated / lastSyncResult.ticketsProcessed) * 100
        : 0;
        
      const errorRate = lastSyncResult.ticketsProcessed > 0
        ? (lastSyncResult.errors.length / lastSyncResult.ticketsProcessed) * 100
        : 0;

      setStats({
        efficiency,
        associationRate,
        clientCreationRate,
        errorRate
      });
    }
  }, [lastSyncResult, syncStatus]);

  return stats;
}
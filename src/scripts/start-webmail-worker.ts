#!/usr/bin/env node

import { AutoSyncInitializer } from '../lib/email/auto-sync-initializer';
import { emailSyncScheduler } from '../lib/email/sync-scheduler';
import { initializeSyncMonitor } from '../lib/email/sync-monitor';

/**
 * Worker dedicado para sincronização de emails do webmail
 * Gerencia a sincronização automática de todas as configurações de email ativas
 */
class WebmailWorker {
  private isRunning = false;
  private autoSyncInitializer: AutoSyncInitializer;

  constructor() {
    this.autoSyncInitializer = AutoSyncInitializer.getInstance();
    this.setupSignalHandlers();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Webmail worker já está rodando');
      return;
    }

    try {
      console.log('=== Iniciando Webmail Worker ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Processo PID:', process.pid);
      
      this.isRunning = true;

      // Inicializar monitor de sincronização
      await initializeSyncMonitor();
      console.log('Monitor de sincronização inicializado');

      // Inicializar sincronização automática
      await this.autoSyncInitializer.initialize();
      console.log('Sincronização automática inicializada');

      // Exibir status inicial
      this.logWorkerStatus();

      // Configurar log periódico de status
      setInterval(() => {
        this.logWorkerStatus();
      }, 5 * 60 * 1000); // A cada 5 minutos

      console.log('Webmail worker iniciado com sucesso');
      console.log('Worker rodando em background...');

    } catch (error) {
      console.error('Erro ao iniciar webmail worker:', error);
      this.isRunning = false;
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Parando webmail worker...');
    this.isRunning = false;

    try {
      // Parar todas as sincronizações
      emailSyncScheduler.stopAllSyncs();
      
      // Parar auto sync initializer
      await this.autoSyncInitializer.stop();
      
      console.log('Webmail worker parado com sucesso');
    } catch (error) {
      console.error('Erro ao parar webmail worker:', error);
    }
  }

  private logWorkerStatus(): void {
    const stats = emailSyncScheduler.getWorkerStats();
    console.log('=== Status do Webmail Worker ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Jobs ativos:', stats.totalActiveJobs);
    console.log('Intervalo de sincronização:', stats.syncInterval + 'ms');
    console.log('Sincronização global habilitada:', stats.globalSyncEnabled);
    console.log('Configurações ativas:', stats.activeSyncs.join(', ') || 'Nenhuma');
    console.log('================================');
  }

  private setupSignalHandlers(): void {
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Recebido SIGTERM, parando worker...');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Recebido SIGINT, parando worker...');
      await this.stop();
      process.exit(0);
    });

    // Tratamento de erros não capturados
    process.on('uncaughtException', (error) => {
      console.error('Erro não capturado:', error);
      this.stop().finally(() => process.exit(1));
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Promise rejeitada não tratada:', reason);
      console.error('Promise:', promise);
    });
  }
}

// Inicializar e executar o worker
const worker = new WebmailWorker();
worker.start().catch((error) => {
  console.error('Falha ao iniciar webmail worker:', error);
  process.exit(1);
});

// Manter o processo vivo
process.stdin.resume();
import { startHelpdeskEmailWorker, stopHelpdeskEmailWorker, helpdeskEmailWorker } from './email-automation-worker';

/**
 * Gerenciador do worker de processamento de emails do helpdesk
 */
class HelpdeskWorkerManager {
  private static instance: HelpdeskWorkerManager;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): HelpdeskWorkerManager {
    if (!HelpdeskWorkerManager.instance) {
      HelpdeskWorkerManager.instance = new HelpdeskWorkerManager();
    }
    return HelpdeskWorkerManager.instance;
  }

  /**
   * Inicializa o worker de processamento de emails
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Worker Manager] Worker já está inicializado');
      return;
    }

    try {
      console.log('[Worker Manager] Inicializando worker de processamento de emails...');
      await startHelpdeskEmailWorker();
      this.isInitialized = true;
      console.log('[Worker Manager] Worker inicializado com sucesso');
    } catch (error) {
      console.error('[Worker Manager] Erro ao inicializar worker:', error);
      throw error;
    }
  }

  /**
   * Para o worker de processamento de emails
   */
  shutdown(): void {
    if (!this.isInitialized) {
      console.log('[Worker Manager] Worker não está inicializado');
      return;
    }

    try {
      console.log('[Worker Manager] Parando worker de processamento de emails...');
      stopHelpdeskEmailWorker();
      this.isInitialized = false;
      console.log('[Worker Manager] Worker parado com sucesso');
    } catch (error) {
      console.error('[Worker Manager] Erro ao parar worker:', error);
    }
  }

  /**
   * Reinicia o worker
   */
  async restart(): Promise<void> {
    console.log('[Worker Manager] Reiniciando worker...');
    this.shutdown();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
    await this.initialize();
  }

  /**
   * Retorna o status do worker
   */
  getStatus(): { isInitialized: boolean; workerStatus: any } {
    return {
      isInitialized: this.isInitialized,
      workerStatus: helpdeskEmailWorker.getStatus()
    };
  }

  /**
   * Verifica se o worker está rodando
   */
  isRunning(): boolean {
    return this.isInitialized && helpdeskEmailWorker.getStatus().isRunning;
  }
}

// Instância singleton
export const workerManager = HelpdeskWorkerManager.getInstance();

// Função para inicializar automaticamente em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  // Inicializar worker automaticamente após 5 segundos em desenvolvimento
  setTimeout(async () => {
    try {
      await workerManager.initialize();
    } catch (error) {
      console.error('[Worker Manager] Erro na inicialização automática:', error);
    }
  }, 5000);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[Worker Manager] Recebido SIGINT, parando worker...');
  workerManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Worker Manager] Recebido SIGTERM, parando worker...');
  workerManager.shutdown();
  process.exit(0);
});

export default workerManager;
import { emailSyncScheduler } from './sync-scheduler';
import { db } from '@/lib/db';

/**
 * Classe responsável por inicializar automaticamente a sincronização de e-mail
 * no servidor, especialmente importante para ambientes em nuvem
 */
export class AutoSyncInitializer {
  private static instance: AutoSyncInitializer;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  static getInstance(): AutoSyncInitializer {
    if (!AutoSyncInitializer.instance) {
      AutoSyncInitializer.instance = new AutoSyncInitializer();
    }
    return AutoSyncInitializer.instance;
  }

  /**
   * Inicializa a sincronização automática de e-mail
   * Verifica se há configurações ativas e inicia o scheduler
   */
  async initialize(): Promise<void> {
    // Evitar múltiplas inicializações simultâneas
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      console.log('AutoSyncInitializer já foi inicializado');
      return;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      console.log('Inicializando sincronização automática de e-mail...');

      // Verificar se o banco de dados está acessível
      await this.checkDatabaseConnection();

      // Verificar se há configurações de e-mail ativas
      const activeConfigs = await this.getActiveEmailConfigs();
      
      if (activeConfigs.length === 0) {
        console.log('Nenhuma configuração de e-mail ativa encontrada. Sincronização não iniciada.');
        this.isInitialized = true;
        return;
      }

      console.log(`Encontradas ${activeConfigs.length} configurações de e-mail ativas`);

      // Aguardar um pouco antes de iniciar para garantir que o servidor esteja estável
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Iniciar sincronização para todas as configurações ativas
      await emailSyncScheduler.startAllActiveConfigs();
      
      console.log('Sincronização automática de e-mail iniciada com sucesso');
      this.isInitialized = true;

      // Configurar handlers para shutdown graceful
      this.setupShutdownHandlers();

    } catch (error) {
      console.error('Erro ao inicializar sincronização automática:', error);
      // Não relançar o erro para não quebrar a aplicação
      // Tentar novamente em 30 segundos
      setTimeout(() => {
        this.isInitialized = false;
        this.initializationPromise = null;
        this.initialize().catch(console.error);
      }, 30000);
    }
  }

  private async checkDatabaseConnection(): Promise<void> {
    try {
      await db.$queryRaw`SELECT 1`;
      console.log('Conexão com banco de dados verificada');
    } catch (error) {
      throw new Error(`Falha na conexão com banco de dados: ${error}`);
    }
  }

  private async getActiveEmailConfigs(): Promise<any[]> {
    try {
      const configs = await db.emailConfig.findMany({
        where: {
          ativo: true,
          syncEnabled: true
        },
        include: {
          colaborador: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          }
        }
      });

      return configs;
    } catch (error) {
      console.error('Erro ao buscar configurações de e-mail:', error);
      return [];
    }
  }

  private setupShutdownHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      console.log(`Recebido sinal ${signal}. Iniciando shutdown graceful...`);
      
      try {
        emailSyncScheduler.stopAllSyncs();
        console.log('Scheduler de sincronização parado');
      } catch (error) {
        console.error('Erro ao parar scheduler:', error);
      }
      
      process.exit(0);
    };

    // Configurar handlers para diferentes sinais
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Para nodemon
  }

  /**
   * Para a sincronização automática
   */
  async stop(): Promise<void> {
    emailSyncScheduler.stopAllSyncs();
    this.isInitialized = false;
    this.initializationPromise = null;
    console.log('Sincronização automática parada');
  }

  /**
   * Verifica se a sincronização está ativa
   */
  isActive(): boolean {
    return this.isInitialized && emailSyncScheduler.getActiveSyncs().length > 0;
  }

  /**
   * Força uma reinicialização da sincronização
   */
  async restart(): Promise<void> {
    console.log('Reiniciando sincronização automática...');
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.initialize();
  }
}

/**
 * Função utilitária para inicializar a sincronização automática
 * Deve ser chamada no início da aplicação
 */
export async function initializeAutoSync(): Promise<void> {
  const initializer = AutoSyncInitializer.getInstance();
  await initializer.initialize();
}

/**
 * Função utilitária para parar a sincronização automática
 */
export async function stopAutoSync(): Promise<void> {
  const initializer = AutoSyncInitializer.getInstance();
  await initializer.stop();
}
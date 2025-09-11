interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterFactor: number;
  retryableErrors: string[];
}

interface RetryAttempt {
  attempt: number;
  delay: number;
  timestamp: Date;
  error?: Error;
}

interface RetryState {
  [key: string]: {
    attempts: RetryAttempt[];
    nextRetryTime?: Date;
    isBlocked: boolean;
    consecutiveFailures: number;
  };
}

class RetryManager {
  private retryState: RetryState = {};
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      maxRetries: 5,
      baseDelay: 1000, // 1 segundo
      maxDelay: 30000, // 30 segundos
      backoffMultiplier: 2,
      jitterFactor: 0.1, // 10% de jitter
      retryableErrors: [
        'ECONNRESET',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'EHOSTUNREACH',
        'ENETUNREACH',
        'EAI_AGAIN',
        'IMAP_TIMEOUT',
        'IMAP_CONNECTION_LOST'
      ],
      ...config
    };
  }

  /**
   * Verifica se um erro é retryable
   */
  isRetryableError(error: Error): boolean {
    const errorCode = (error as any).code || error.message;
    return this.config.retryableErrors.some(retryableError => 
      errorCode.includes(retryableError)
    );
  }

  /**
   * Verifica se uma operação pode ser tentada novamente
   */
  canRetry(key: string): boolean {
    const state = this.retryState[key];
    
    if (!state) {
      return true; // Primeira tentativa
    }

    if (state.isBlocked) {
      return false;
    }

    if (state.attempts.length >= this.config.maxRetries) {
      return false;
    }

    if (state.nextRetryTime && new Date() < state.nextRetryTime) {
      return false; // Ainda no período de espera
    }

    return true;
  }

  /**
   * Registra uma tentativa de operação
   */
  recordAttempt(key: string, error?: Error): void {
    if (!this.retryState[key]) {
      this.retryState[key] = {
        attempts: [],
        isBlocked: false,
        consecutiveFailures: 0
      };
    }

    const state = this.retryState[key];
    const attemptNumber = state.attempts.length + 1;
    
    const delay = this.calculateDelay(attemptNumber);
    
    const attempt: RetryAttempt = {
      attempt: attemptNumber,
      delay,
      timestamp: new Date(),
      error
    };

    state.attempts.push(attempt);

    if (error) {
      state.consecutiveFailures++;
      
      // Definir próximo tempo de retry
      state.nextRetryTime = new Date(Date.now() + delay);
      
      // Bloquear se exceder máximo de tentativas
      if (attemptNumber >= this.config.maxRetries) {
        state.isBlocked = true;
        console.log(`Operação ${key} bloqueada após ${attemptNumber} tentativas`);
      }
    } else {
      // Sucesso - resetar estado
      this.resetRetryState(key);
    }
  }

  /**
   * Calcula o delay com backoff exponencial e jitter
   */
  private calculateDelay(attemptNumber: number): number {
    const exponentialDelay = this.config.baseDelay * 
      Math.pow(this.config.backoffMultiplier, attemptNumber - 1);
    
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelay);
    
    // Adicionar jitter para evitar thundering herd
    const jitter = cappedDelay * this.config.jitterFactor * Math.random();
    
    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Obtém o tempo de espera até a próxima tentativa
   */
  getTimeUntilNextRetry(key: string): number {
    const state = this.retryState[key];
    
    if (!state || !state.nextRetryTime) {
      return 0;
    }

    const now = new Date();
    const timeUntilRetry = state.nextRetryTime.getTime() - now.getTime();
    
    return Math.max(0, timeUntilRetry);
  }

  /**
   * Reseta o estado de retry para uma chave
   */
  resetRetryState(key: string): void {
    if (this.retryState[key]) {
      this.retryState[key] = {
        attempts: [],
        isBlocked: false,
        consecutiveFailures: 0
      };
    }
  }

  /**
   * Remove completamente o estado de retry para uma chave
   */
  clearRetryState(key: string): void {
    delete this.retryState[key];
  }

  /**
   * Executa uma operação com retry automático
   */
  async executeWithRetry<T>(
    key: string,
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error, delay: number) => void
  ): Promise<T> {
    while (this.canRetry(key)) {
      try {
        const result = await operation();
        this.recordAttempt(key); // Sucesso
        return result;
      } catch (error) {
        const err = error as Error;
        
        if (!this.isRetryableError(err)) {
          throw err; // Erro não retryable
        }

        this.recordAttempt(key, err);
        
        const state = this.retryState[key];
        const attemptNumber = state.attempts.length;
        
        if (attemptNumber >= this.config.maxRetries) {
          throw new Error(`Operação ${key} falhou após ${attemptNumber} tentativas. Último erro: ${err.message}`);
        }

        const delay = this.getTimeUntilNextRetry(key);
        
        if (onRetry) {
          onRetry(attemptNumber, err, delay);
        }

        console.log(`Tentativa ${attemptNumber}/${this.config.maxRetries} falhou para ${key}. Próxima tentativa em ${delay}ms`);
        
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Não é possível tentar novamente a operação ${key}`);
  }

  /**
   * Obtém estatísticas de retry
   */
  getRetryStats(): { [key: string]: any } {
    const stats: { [key: string]: any } = {};
    
    Object.entries(this.retryState).forEach(([key, state]) => {
      stats[key] = {
        totalAttempts: state.attempts.length,
        consecutiveFailures: state.consecutiveFailures,
        isBlocked: state.isBlocked,
        nextRetryTime: state.nextRetryTime,
        lastAttempt: state.attempts[state.attempts.length - 1],
        averageDelay: state.attempts.length > 0 ? 
          state.attempts.reduce((sum, attempt) => sum + attempt.delay, 0) / state.attempts.length : 0
      };
    });
    
    return stats;
  }

  /**
   * Limpa estados antigos de retry
   */
  cleanup(maxAge: number = 3600000): void { // 1 hora por padrão
    const now = new Date();
    
    Object.keys(this.retryState).forEach(key => {
      const state = this.retryState[key];
      const lastAttempt = state.attempts[state.attempts.length - 1];
      
      if (lastAttempt && (now.getTime() - lastAttempt.timestamp.getTime()) > maxAge) {
        delete this.retryState[key];
      }
    });
  }
}

export { RetryManager };
export type { RetryConfig, RetryAttempt, RetryState };
export default RetryManager;
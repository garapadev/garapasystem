import { db } from '@/lib/db';

interface RateLimitConfig {
  windowMs: number; // Janela de tempo em milissegundos
  maxRequests: number; // Máximo de requisições na janela
  keyGenerator?: (identifier: string) => string; // Gerador de chave personalizado
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  totalHits: number;
}

interface RateLimitRecord {
  id: string;
  identifier: string;
  hits: number;
  resetTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private keyPrefix: string;

  constructor(config: RateLimitConfig, keyPrefix: string = 'rate_limit') {
    this.config = {
      windowMs: 60000, // 1 minuto por padrão
      maxRequests: 100, // 100 requisições por padrão
      ...config
    };
    this.keyPrefix = keyPrefix;
  }

  /**
   * Gera a chave para o rate limiting
   */
  private generateKey(identifier: string): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(identifier);
    }
    return `${this.keyPrefix}:${identifier}`;
  }

  /**
   * Verifica se uma requisição deve ser permitida
   */
  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const key = this.generateKey(identifier);
      const now = new Date();
      const windowStart = new Date(now.getTime() - this.config.windowMs);

      // Busca ou cria o registro de rate limit
      let record = await db.rateLimit.findUnique({
        where: { identifier: key }
      });

      if (!record) {
        // Cria novo registro
        record = await db.rateLimit.create({
          data: {
            identifier: key,
            hits: 1,
            resetTime: new Date(now.getTime() + this.config.windowMs)
          }
        });

        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: record.resetTime,
          totalHits: 1
        };
      }

      // Verifica se a janela de tempo expirou
      if (record.resetTime <= now) {
        // Reset da janela
        record = await db.rateLimit.update({
          where: { id: record.id },
          data: {
            hits: 1,
            resetTime: new Date(now.getTime() + this.config.windowMs)
          }
        });

        return {
          allowed: true,
          remaining: this.config.maxRequests - 1,
          resetTime: record.resetTime,
          totalHits: 1
        };
      }

      // Incrementa o contador de hits
      record = await db.rateLimit.update({
        where: { id: record.id },
        data: {
          hits: record.hits + 1
        }
      });

      const allowed = record.hits <= this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - record.hits);

      return {
        allowed,
        remaining,
        resetTime: record.resetTime,
        totalHits: record.hits
      };
    } catch (error) {
      console.error('Erro no rate limiting:', error);
      // Em caso de erro, permite a requisição para não bloquear o sistema
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: new Date(Date.now() + this.config.windowMs),
        totalHits: 1
      };
    }
  }

  /**
   * Reseta o contador para um identificador específico
   */
  async resetLimit(identifier: string): Promise<void> {
    try {
      const key = this.generateKey(identifier);
      await db.rateLimit.delete({
        where: { identifier: key }
      }).catch(() => {
        // Ignora erro se o registro não existir
      });
    } catch (error) {
      console.error('Erro ao resetar rate limit:', error);
    }
  }

  /**
   * Obtém informações do rate limit sem incrementar
   */
  async getLimit(identifier: string): Promise<RateLimitResult | null> {
    try {
      const key = this.generateKey(identifier);
      const record = await db.rateLimit.findUnique({
        where: { identifier: key }
      });

      if (!record) {
        return null;
      }

      const now = new Date();
      if (record.resetTime <= now) {
        return null; // Janela expirou
      }

      const allowed = record.hits < this.config.maxRequests;
      const remaining = Math.max(0, this.config.maxRequests - record.hits);

      return {
        allowed,
        remaining,
        resetTime: record.resetTime,
        totalHits: record.hits
      };
    } catch (error) {
      console.error('Erro ao obter rate limit:', error);
      return null;
    }
  }

  /**
   * Limpa registros expirados
   */
  static async cleanup(): Promise<number> {
    try {
      const now = new Date();
      const result = await db.rateLimit.deleteMany({
        where: {
          resetTime: {
            lte: now
          }
        }
      });
      return result.count;
    } catch (error) {
      console.error('Erro na limpeza do rate limit:', error);
      return 0;
    }
  }
}

// Configurações pré-definidas de rate limiting
export const RATE_LIMIT_CONFIGS = {
  // Rate limit padrão para API
  default: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 100 // 100 requisições por minuto
  },
  
  // Rate limit restritivo para operações sensíveis
  strict: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 10 // 10 requisições por minuto
  },
  
  // Rate limit para autenticação
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxRequests: 5 // 5 tentativas por 15 minutos
  },
  
  // Rate limit para webhooks
  webhook: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 50 // 50 webhooks por minuto
  },
  
  // Rate limit para uploads
  upload: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 20 // 20 uploads por minuto
  },
  
  // Rate limit para busca/pesquisa
  search: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 200 // 200 buscas por minuto
  },
  
  // Rate limit premium (para chaves de API premium)
  premium: {
    windowMs: 60 * 1000, // 1 minuto
    maxRequests: 1000 // 1000 requisições por minuto
  }
};

// Instâncias pré-configuradas
export const defaultRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.default, 'api');
export const strictRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.strict, 'strict');
export const authRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.auth, 'auth');
export const webhookRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.webhook, 'webhook');
export const uploadRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.upload, 'upload');
export const searchRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.search, 'search');
export const premiumRateLimiter = new RateLimiter(RATE_LIMIT_CONFIGS.premium, 'premium');

/**
 * Middleware helper para aplicar rate limiting em rotas Next.js
 */
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  keyGenerator: (req: Request) => string = (req) => {
    // Usa IP como identificador padrão
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    return ip;
  }
) {
  return async function rateLimitMiddleware(req: Request): Promise<{
    allowed: boolean;
    headers: Record<string, string>;
    status?: number;
    message?: string;
  }> {
    try {
      const identifier = keyGenerator(req);
      const result = await limiter.checkLimit(identifier);
      
      const headers = {
        'X-RateLimit-Limit': limiter.config.maxRequests.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString()
      };
      
      if (!result.allowed) {
        return {
          allowed: false,
          headers,
          status: 429,
          message: 'Muitas requisições. Tente novamente mais tarde.'
        };
      }
      
      return {
        allowed: true,
        headers
      };
    } catch (error) {
      console.error('Erro no middleware de rate limiting:', error);
      // Em caso de erro, permite a requisição
      return {
        allowed: true,
        headers: {}
      };
    }
  };
}

/**
 * Função utilitária para aplicar rate limiting baseado em chave de API
 */
export async function checkApiKeyRateLimit(
  apiKeyId: string,
  customLimit?: number
): Promise<RateLimitResult> {
  const limit = customLimit || RATE_LIMIT_CONFIGS.default.maxRequests;
  const limiter = new RateLimiter({
    ...RATE_LIMIT_CONFIGS.default,
    maxRequests: limit
  }, 'api_key');
  
  return limiter.checkLimit(apiKeyId);
}
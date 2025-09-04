import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { ApiKeyManager } from '@/lib/api-key-manager';
import { checkApiKeyRateLimit } from '@/lib/rate-limiter';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface ApiKeyValidationResult {
  valid: boolean;
  apiKey?: {
    id: string;
    nome: string;
    permissoes: string[];
    limiteTaxa?: number;
  };
  error?: string;
}

interface AuthValidationResult {
  valid: boolean;
  user?: any; // Usar any para compatibilidade com o tipo de sessão do NextAuth
  apiKey?: {
    id: string;
    nome: string;
    permissoes: string[];
    limiteTaxa?: number;
  };
  error?: string;
  authType?: 'session' | 'apikey';
}

export class ApiMiddleware {
  /**
   * Valida autenticação (sessão ou API Key)
   */
  static async validateAuth(request: NextRequest): Promise<AuthValidationResult> {
    try {
      // Primeiro tenta validar por sessão
      const session = await getServerSession(authOptions);
      if (session?.user) {
        return {
          valid: true,
          user: session.user,
          authType: 'session'
        };
      }

      // Se não há sessão, tenta validar por API Key
      const apiKeyResult = await this.validateApiKey(request);
      if (apiKeyResult.valid) {
        return {
          valid: true,
          apiKey: apiKeyResult.apiKey,
          authType: 'apikey'
        };
      }

      return {
        valid: false,
        error: 'Autenticação necessária'
      };
    } catch (error) {
      console.error('Erro na validação de autenticação:', error);
      return {
        valid: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Valida uma chave de API
   */
  static async validateApiKey(request: NextRequest): Promise<ApiKeyValidationResult> {
    try {
      // Extrai a chave da API do header Authorization
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          valid: false,
          error: 'Token de autorização não fornecido ou formato inválido'
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer '
      
      // Hash da chave para comparação
      const hashedKey = crypto.createHash('sha256').update(token).digest('hex');
      
      // Busca a chave no banco de dados
      const apiKey = await db.apiKey.findFirst({
        where: {
          chave: hashedKey,
          ativo: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (!apiKey) {
        return {
          valid: false,
          error: 'Chave de API inválida ou expirada'
        };
      }

      // Verifica rate limiting se configurado
      if (apiKey.limiteTaxa) {
        const isRateLimited = await this.checkRateLimit(apiKey.id, apiKey.limiteTaxa);
        if (isRateLimited) {
          return {
            valid: false,
            error: 'Limite de taxa excedido'
          };
        }
      }

      return {
        valid: true,
        apiKey: {
          id: apiKey.id,
          nome: apiKey.nome,
          permissoes: apiKey.permissoes ? JSON.parse(apiKey.permissoes) : [],
          limiteTaxa: apiKey.limiteTaxa || undefined
        }
      };
    } catch (error) {
      console.error('Erro ao validar chave de API:', error);
      return {
        valid: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Verifica se a chave de API excedeu o limite de taxa
   */
  private static async checkRateLimit(apiKeyId: string, limiteTaxa: number): Promise<boolean> {
    try {
      // Usa o rate limiter para verificar limites
      const result = await checkApiKeyRateLimit(apiKeyId, limiteTaxa);
      return !result.allowed;
    } catch (error) {
      console.error('Erro ao verificar rate limit:', error);
      return false; // Em caso de erro, permite a requisição
    }
  }

  /**
   * Verifica se o usuário/API Key tem permissão para acessar um endpoint
   */
  static hasAuthPermission(auth: AuthValidationResult, endpoint: string, method: string): boolean {
    if (!auth.valid) return false;

    // Se é autenticação por API Key
    if (auth.authType === 'apikey' && auth.apiKey) {
      return this.hasPermission(auth.apiKey, endpoint, method);
    }

    // Se é autenticação por sessão
    if (auth.authType === 'session' && auth.user?.colaborador) {
      return this.hasSessionPermission(auth.user.colaborador, endpoint, method);
    }

    return false;
  }

  /**
   * Verifica permissões para usuários de sessão
   */
  static hasSessionPermission(colaborador: any, endpoint: string, method: string): boolean {
    // Para usuários de sessão, permitir acesso a endpoints básicos
    // Você pode implementar lógica mais específica baseada no perfil do colaborador
    const allowedEndpoints = [
      'GET:/api/api-keys',
      'POST:/api/api-keys',
      'DELETE:/api/api-keys',
      'GET:/api/webhooks',
      'POST:/api/webhooks',
      'PUT:/api/webhooks',
      'DELETE:/api/webhooks',
      'GET:/api/logs',
      'POST:/api/webhooks/test'
    ];

    const endpointKey = `${method}:${endpoint}`;
    return allowedEndpoints.includes(endpointKey);
  }

  /**
   * Verifica se a chave de API tem permissão para acessar um endpoint
   */
  static hasPermission(apiKey: { permissoes: string[] | string }, endpoint: string, method: string): boolean {
    // Converte permissoes para array se for string
    let permissoes: string[] = [];
    
    try {
      if (typeof apiKey.permissoes === 'string') {
        permissoes = JSON.parse(apiKey.permissoes || '[]');
      } else if (Array.isArray(apiKey.permissoes)) {
        permissoes = apiKey.permissoes;
      }
    } catch (error) {
      console.error('Erro ao converter permissões:', error, 'Valor:', apiKey.permissoes);
      permissoes = [];
    }
    
    // Garante que permissoes é um array
    if (!Array.isArray(permissoes)) {
      console.error('Permissões não é um array:', permissoes);
      permissoes = [];
    }
    
    // Se tem permissão de admin, permite tudo
    if (permissoes.includes('admin')) {
      return true;
    }

    // Mapeia endpoints para permissões necessárias
    const endpointPermissions: Record<string, string[]> = {
      // API Keys
      'GET:/api/api-keys': ['admin'],
      'POST:/api/api-keys': ['admin'],
      'PUT:/api/api-keys': ['admin'],
      'DELETE:/api/api-keys': ['admin'],
      
      // Webhooks
      'GET:/api/webhooks': ['admin'],
      'POST:/api/webhooks': ['admin'],
      'PUT:/api/webhooks': ['admin'],
      'DELETE:/api/webhooks': ['admin'],
      
      // Clientes
      'GET:/api/clientes': ['clientes.read', 'clientes.write'],
      'POST:/api/clientes': ['clientes.write'],
      'PUT:/api/clientes': ['clientes.write'],
      'DELETE:/api/clientes': ['clientes.delete'],
      
      // Oportunidades
      'GET:/api/oportunidades': ['oportunidades.read', 'oportunidades.write'],
      'POST:/api/oportunidades': ['oportunidades.write'],
      'PUT:/api/oportunidades': ['oportunidades.write'],
      'DELETE:/api/oportunidades': ['oportunidades.delete'],
      
      // Colaboradores
      'GET:/api/colaboradores': ['colaboradores.read', 'colaboradores.write'],
      'POST:/api/colaboradores': ['colaboradores.write'],
      'PUT:/api/colaboradores': ['colaboradores.write'],
      'DELETE:/api/colaboradores': ['colaboradores.delete'],
      
      // Usuários
      'GET:/api/usuarios': ['usuarios.read', 'usuarios.write'],
      'POST:/api/usuarios': ['usuarios.write'],
      'PUT:/api/usuarios': ['usuarios.write'],
      'DELETE:/api/usuarios': ['usuarios.delete'],
      
      // Configurações
      'GET:/api/configuracoes': ['configuracoes.read'],
      'PUT:/api/configuracoes': ['configuracoes.write'],
      
      // Logs (somente leitura)
      'GET:/api/logs': ['logs.read']
    };

    const permissionKey = `${method}:${endpoint}`;
    const requiredPermissions = endpointPermissions[permissionKey] || [];
    
    // Verifica se tem pelo menos uma das permissões necessárias
    return requiredPermissions.some(permission => 
      permissoes.includes(permission)
    );
  }

  /**
   * Registra o log de uso da API
   */
  static async logApiUsage(
    apiKeyId: string,
    request: NextRequest,
    response: NextResponse,
    responseTime: number
  ): Promise<void> {
    try {
      const url = new URL(request.url);
      const endpoint = url.pathname;
      const method = request.method;
      const status = response.status;
      const userAgent = request.headers.get('User-Agent') || undefined;
      const ip = this.getClientIP(request);

      await db.apiLog.create({
        data: {
          apiKeyId,
          endpoint,
          method,
          status,
          responseTime,
          userAgent,
          ip
        }
      });
    } catch (error) {
      console.error('Erro ao registrar log da API:', error);
    }
  }

  /**
   * Extrai o IP do cliente da requisição
   */
  private static getClientIP(request: NextRequest): string {
    // Verifica headers de proxy
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    // Fallback quando não conseguimos determinar o IP
    return 'unknown';
  }

  /**
   * Cria uma resposta de erro padronizada
   */
  static createErrorResponse(message: string, status: number = 401): NextResponse {
    return NextResponse.json(
      {
        error: {
          message,
          status,
          timestamp: new Date().toISOString()
        }
      },
      { status }
    );
  }

  /**
   * Middleware principal para validação de API
   */
  static async handleApiRequest(
    request: NextRequest,
    handler: (request: NextRequest, apiKey: any) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    
    try {
      // Valida a chave de API
      const validation = await this.validateApiKey(request);
      
      if (!validation.valid) {
        const response = this.createErrorResponse(validation.error || 'Não autorizado');
        return response;
      }

      const { apiKey } = validation;
      if (!apiKey) {
        return this.createErrorResponse('Erro interno do servidor', 500);
      }

      // Verifica permissões
      const url = new URL(request.url);
      const endpoint = url.pathname;
      const method = request.method;
      
      if (!this.hasPermission(apiKey, endpoint, method)) {
        const response = this.createErrorResponse('Permissão insuficiente', 403);
        // Registra tentativa de acesso negado
        await this.logApiUsage(apiKey.id, request, response, Date.now() - startTime);
        return response;
      }

      // Executa o handler da rota
      const response = await handler(request, apiKey);
      
      // Registra o log de uso
      const responseTime = Date.now() - startTime;
      await this.logApiUsage(apiKey.id, request, response, responseTime);
      
      return response;
    } catch (error) {
      console.error('Erro no middleware da API:', error);
      const response = this.createErrorResponse('Erro interno do servidor', 500);
      return response;
    }
  }
}

// Tipos para uso em outros arquivos
export interface ApiKeyInfo {
  id: string;
  nome: string;
  permissoes: string[];
  limiteTaxa?: number;
}

export interface ApiRequest extends NextRequest {
  apiKey?: ApiKeyInfo;
}

// Permissões disponíveis
export const API_PERMISSIONS = {
  // Admin
  ADMIN: 'admin',
  
  // Clientes
  CLIENTES_READ: 'clientes.read',
  CLIENTES_WRITE: 'clientes.write',
  CLIENTES_DELETE: 'clientes.delete',
  
  // Oportunidades
  OPORTUNIDADES_READ: 'oportunidades.read',
  OPORTUNIDADES_WRITE: 'oportunidades.write',
  OPORTUNIDADES_DELETE: 'oportunidades.delete',
  
  // Colaboradores
  COLABORADORES_READ: 'colaboradores.read',
  COLABORADORES_WRITE: 'colaboradores.write',
  COLABORADORES_DELETE: 'colaboradores.delete',
  
  // Usuários
  USUARIOS_READ: 'usuarios.read',
  USUARIOS_WRITE: 'usuarios.write',
  USUARIOS_DELETE: 'usuarios.delete',
  
  // Configurações
  CONFIGURACOES_READ: 'configuracoes.read',
  CONFIGURACOES_WRITE: 'configuracoes.write',
  
  // Logs
  LOGS_READ: 'logs.read'
} as const;

export type ApiPermission = typeof API_PERMISSIONS[keyof typeof API_PERMISSIONS];
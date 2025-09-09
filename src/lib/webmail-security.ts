import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { WebmailPermissionUtils, WEBMAIL_ENDPOINT_PERMISSIONS } from '@/lib/permissions/webmail-permissions';
import { createHash, randomBytes } from 'crypto';

/**
 * Classe para gerenciar segurança do webmail
 */
export class WebmailSecurity {
  /**
   * Valida se o usuário pode acessar um endpoint específico
   */
  static async validateEndpointAccess(
    request: NextRequest,
    endpoint: string
  ): Promise<{ allowed: boolean; reason?: string; userId?: string }> {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return { allowed: false, reason: 'Usuário não autenticado' };
      }

      // Buscar colaborador e suas permissões
      const colaborador = await db.colaborador.findFirst({
        where: {
          usuarios: {
            some: {
              id: session.user.id
            }
          }
        },
        include: {
          perfil: {
            include: {
              permissoes: {
                include: {
                  permissao: true
                }
              }
            }
          }
        }
      });

      if (!colaborador) {
        return { allowed: false, reason: 'Colaborador não encontrado' };
      }

      // Verificar se é administrador
      const isAdmin = colaborador.perfil?.permissoes.some(
        p => p.permissao.recurso === 'sistema' && p.permissao.acao === 'administrar'
      );

      if (isAdmin) {
        return { allowed: true, userId: session.user.id };
      }

      // Verificar permissões específicas do endpoint
      const requiredPermissions = WEBMAIL_ENDPOINT_PERMISSIONS[endpoint];
      if (!requiredPermissions) {
        return { allowed: false, reason: 'Endpoint não configurado' };
      }

      const userPermissions = colaborador.perfil?.permissoes.map(
        p => p.permissao.nome
      ) || [];

      const hasPermission = WebmailPermissionUtils.hasAnyWebmailPermission(
        userPermissions,
        requiredPermissions
      );

      if (!hasPermission) {
        return { 
          allowed: false, 
          reason: `Permissões insuficientes para ${endpoint}`,
          userId: session.user.id
        };
      }

      return { allowed: true, userId: session.user.id };
    } catch (error) {
      console.error('Erro na validação de acesso:', error);
      return { allowed: false, reason: 'Erro interno do servidor' };
    }
  }

  /**
   * Valida se o usuário pode acessar emails de outro usuário
   */
  static async validateEmailOwnership(
    userId: string,
    emailId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Buscar o email e sua configuração
      const email = await db.email.findUnique({
        where: { id: emailId },
        include: {
          emailConfig: {
            include: {
              colaborador: {
                include: {
                  usuarios: true
                }
              }
            }
          }
        }
      });

      if (!email) {
        return { allowed: false, reason: 'Email não encontrado' };
      }

      // Verificar se é o proprietário
      const emailOwner = email.emailConfig.colaborador.usuarios.find(
        u => u.id === userId
      );
      
      if (emailOwner) {
        return { allowed: true };
      }

      // Verificar se tem permissão para gerenciar configurações de outros usuários
      const colaborador = await db.colaborador.findFirst({
        where: {
          usuarios: {
            some: {
              id: userId
            }
          }
        },
        include: {
          perfil: {
            include: {
              permissoes: {
                include: {
                  permissao: true
                }
              }
            }
          }
        }
      });

      if (!colaborador) {
        return { allowed: false, reason: 'Colaborador não encontrado' };
      }

      // Verificar se é administrador
      const isAdmin = colaborador.perfil?.permissoes.some(
        p => p.permissao.recurso === 'sistema' && p.permissao.acao === 'administrar'
      );

      if (isAdmin) {
        return { allowed: true };
      }

      // Verificar permissão específica
      const userPermissions = colaborador.perfil?.permissoes.map(
        p => p.permissao.nome
      ) || [];

      const canReadAll = WebmailPermissionUtils.canAccessOtherUserEmails(userPermissions);
      
      if (!canReadAll) {
        return { allowed: false, reason: 'Sem permissão para acessar emails de outros usuários' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Erro na validação de propriedade do email:', error);
      return { allowed: false, reason: 'Erro interno do servidor' };
    }
  }

  /**
   * Valida se o usuário pode acessar configurações de outro usuário
   */
  static async validateConfigOwnership(
    userId: string,
    configId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Buscar a configuração
      const config = await db.emailConfig.findUnique({
        where: { id: configId },
        include: {
          colaborador: {
            include: {
              usuarios: true
            }
          }
        }
      });

      if (!config) {
        return { allowed: false, reason: 'Configuração não encontrada' };
      }

      // Verificar se é o proprietário
      const configOwner = config.colaborador.usuarios.find(
        u => u.id === userId
      );
      
      if (configOwner) {
        return { allowed: true };
      }

      // Verificar se o usuário pode acessar configurações de outro usuário
      const colaborador = await db.colaborador.findFirst({
        where: {
          usuarios: {
            some: {
              id: userId
            }
          }
        },
        include: {
          perfil: {
            include: {
              permissoes: {
                include: {
                  permissao: true
                }
              }
            }
          }
        }
      });

      if (!colaborador) {
        return { allowed: false, reason: 'Colaborador não encontrado' };
      }

      // Verificar se é administrador
      const isAdmin = colaborador.perfil?.permissoes.some(
        p => p.permissao.recurso === 'sistema' && p.permissao.acao === 'administrar'
      );

      if (isAdmin) {
        return { allowed: true };
      }

      // Verificar permissão específica
      const userPermissions = colaborador.perfil?.permissoes.map(
        p => p.permissao.nome
      ) || [];

      const canManageConfigs = WebmailPermissionUtils.canManageOtherUserConfigs(userPermissions);
      
      if (!canManageConfigs) {
        return { allowed: false, reason: 'Sem permissão para gerenciar configurações de outros usuários' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Erro na validação de propriedade da configuração:', error);
      return { allowed: false, reason: 'Erro interno do servidor' };
    }
  }

  /**
   * Registra ação de auditoria
   */
  static async logSecurityEvent(
    userId: string,
    action: string,
    details: Record<string, any>,
    ipAddress?: string
  ): Promise<void> {
    try {
      // Log seria implementado com modelo adequado
      console.log(`Security Event: webmail_security_${action}`, {
        userId,
        details,
        timestamp: new Date().toISOString(),
        ipAddress,
        userAgent: details.userAgent
      });
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
    }
  }

  /**
   * Gera token de acesso temporário para anexos
   */
  static generateAttachmentToken(
    userId: string,
    emailId: string,
    attachmentId: string,
    expiresIn: number = 3600 // 1 hora
  ): string {
    const payload = {
      userId,
      emailId,
      attachmentId,
      exp: Math.floor(Date.now() / 1000) + expiresIn
    };

    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
    const token = createHash('sha256')
      .update(JSON.stringify(payload) + secret)
      .digest('hex');

    return Buffer.from(JSON.stringify({ ...payload, token })).toString('base64');
  }

  /**
   * Valida token de acesso para anexos
   */
  static validateAttachmentToken(
    tokenString: string,
    userId: string,
    emailId: string,
    attachmentId: string
  ): boolean {
    try {
      const payload = JSON.parse(Buffer.from(tokenString, 'base64').toString());
      
      // Verificar expiração
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return false;
      }

      // Verificar dados
      if (
        payload.userId !== userId ||
        payload.emailId !== emailId ||
        payload.attachmentId !== attachmentId
      ) {
        return false;
      }

      // Verificar token
      const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret';
      const expectedToken = createHash('sha256')
        .update(JSON.stringify({
          userId: payload.userId,
          emailId: payload.emailId,
          attachmentId: payload.attachmentId,
          exp: payload.exp
        }) + secret)
        .digest('hex');

      return payload.token === expectedToken;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitiza dados de entrada para prevenir ataques
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove caracteres perigosos
      return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Valida rate limiting para ações sensíveis
   */
  static async checkRateLimit(
    userId: string,
    action: string,
    maxAttempts: number = 10,
    windowMinutes: number = 15
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    try {
      const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
      
      // Rate limit seria implementado com modelo adequado
      const attempts = 0; // Placeholder - implementar com cache/redis

      const remaining = Math.max(0, maxAttempts - attempts);
      const resetTime = new Date(Date.now() + windowMinutes * 60 * 1000);

      return {
        allowed: attempts < maxAttempts,
        remaining,
        resetTime
      };
    } catch (error) {
      console.error('Erro na verificação de rate limit:', error);
      return {
        allowed: true,
        remaining: maxAttempts,
        resetTime: new Date(Date.now() + windowMinutes * 60 * 1000)
      };
    }
  }
}
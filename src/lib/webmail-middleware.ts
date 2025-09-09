import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  WEBMAIL_PERMISSIONS, 
  WEBMAIL_ENDPOINT_PERMISSIONS,
  WebmailPermissionUtils,
  type WebmailPermission 
} from '@/lib/permissions/webmail-permissions';

/**
 * Middleware específico para validação de permissões do webmail
 */
export class WebmailMiddleware {
  /**
   * Valida se o usuário tem permissão para acessar um endpoint do webmail
   */
  static async validateEndpointAccess(
    request: NextRequest,
    endpoint: string
  ): Promise<{
    hasAccess: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      // Obter sessão do usuário
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return {
          hasAccess: false,
          error: 'Usuário não autenticado'
        };
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
        return {
          hasAccess: false,
          error: 'Colaborador não encontrado'
        };
      }

      // Extrair permissões do usuário
      const userPermissions = colaborador.perfil?.permissoes.map(p => p.permissao?.nome).filter(Boolean) || [];
      
      // Verificar se é administrador (acesso total)
      if (userPermissions.includes('admin') || userPermissions.includes('sistema.administrar')) {
        return {
          hasAccess: true,
          user: colaborador
        };
      }

      // Verificar permissões específicas do endpoint
      const requiredPermissions = WEBMAIL_ENDPOINT_PERMISSIONS[endpoint];
      
      if (!requiredPermissions) {
        // Endpoint não mapeado - negar acesso por segurança
        return {
          hasAccess: false,
          error: 'Endpoint não autorizado'
        };
      }

      // Verificar se o usuário tem pelo menos uma das permissões necessárias
      const hasPermission = WebmailPermissionUtils.hasAnyWebmailPermission(
        userPermissions,
        requiredPermissions
      );

      return {
        hasAccess: hasPermission,
        user: colaborador,
        error: hasPermission ? undefined : 'Permissões insuficientes'
      };

    } catch (error) {
      console.error('Erro na validação de permissões do webmail:', error);
      return {
        hasAccess: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Valida se o usuário pode acessar um email específico
   */
  static async validateEmailAccess(
    userId: string,
    emailId: string,
    action: 'read' | 'write' | 'delete' = 'read'
  ): Promise<{
    hasAccess: boolean;
    email?: any;
    error?: string;
  }> {
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
        return {
          hasAccess: false,
          error: 'Email não encontrado'
        };
      }

      // Buscar colaborador e suas permissões
      const colaborador = await db.colaborador.findUnique({
        where: { id: userId },
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
        return {
          hasAccess: false,
          error: 'Usuário não encontrado'
        };
      }

      const userPermissions = colaborador.perfil?.permissoes.map(p => p.permissao?.nome).filter(Boolean) || [];

      // Administradores têm acesso total
      if (userPermissions.includes('admin') || userPermissions.includes('sistema.administrar')) {
        return {
          hasAccess: true,
          email
        };
      }

      // Verificar se o email pertence ao usuário
      if (email.emailConfig.colaboradorId === userId) {
        // Verificar permissão específica para a ação
        const actionPermissions: Record<string, WebmailPermission> = {
          read: WEBMAIL_PERMISSIONS.EMAIL_READ,
          write: WEBMAIL_PERMISSIONS.EMAIL_SEND, // ou EMAIL_COMPOSE dependendo do contexto
          delete: WEBMAIL_PERMISSIONS.EMAIL_DELETE
        };

        const hasPermission = WebmailPermissionUtils.hasWebmailPermission(
          userPermissions,
          actionPermissions[action]
        );

        return {
          hasAccess: hasPermission,
          email: hasPermission ? email : undefined,
          error: hasPermission ? undefined : `Sem permissão para ${action} emails`
        };
      }

      // Verificar se pode acessar emails de outros usuários
      const canAccessOthers = WebmailPermissionUtils.canAccessOtherUserEmails(userPermissions);
      
      if (!canAccessOthers) {
        return {
          hasAccess: false,
          error: 'Sem permissão para acessar emails de outros usuários'
        };
      }

      // Verificar permissão específica para a ação em emails de outros
      const actionPermissions: Record<string, WebmailPermission> = {
        read: WEBMAIL_PERMISSIONS.EMAIL_READ_ALL,
        write: WEBMAIL_PERMISSIONS.EMAIL_SEND_AS,
        delete: WEBMAIL_PERMISSIONS.ADMIN_MANAGE_CONFIGS // Apenas admins podem deletar emails de outros
      };

      const hasPermission = WebmailPermissionUtils.hasWebmailPermission(
        userPermissions,
        actionPermissions[action]
      );

      return {
        hasAccess: hasPermission,
        email: hasPermission ? email : undefined,
        error: hasPermission ? undefined : `Sem permissão para ${action} emails de outros usuários`
      };

    } catch (error) {
      console.error('Erro na validação de acesso ao email:', error);
      return {
        hasAccess: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Valida se o usuário pode acessar uma configuração de email específica
   */
  static async validateConfigAccess(
    userId: string,
    configId: string,
    action: 'read' | 'write' | 'delete' = 'read'
  ): Promise<{
    hasAccess: boolean;
    config?: any;
    error?: string;
  }> {
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
        return {
          hasAccess: false,
          error: 'Configuração não encontrada'
        };
      }

      // Buscar colaborador e suas permissões
      const colaborador = await db.colaborador.findUnique({
        where: { id: userId },
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
        return {
          hasAccess: false,
          error: 'Usuário não encontrado'
        };
      }

      const userPermissions = colaborador.perfil?.permissoes.map(p => p.permissao?.nome).filter(Boolean) || [];

      // Administradores têm acesso total
      if (userPermissions.includes('admin') || userPermissions.includes('sistema.administrar')) {
        return {
          hasAccess: true,
          config
        };
      }

      // Verificar se a configuração pertence ao usuário
      if (config.colaboradorId === userId) {
        // Verificar permissão específica para a ação
        const actionPermissions: Record<string, WebmailPermission> = {
          read: WEBMAIL_PERMISSIONS.EMAIL_CONFIG_READ,
          write: WEBMAIL_PERMISSIONS.EMAIL_CONFIG_WRITE,
          delete: WEBMAIL_PERMISSIONS.EMAIL_CONFIG_DELETE
        };

        const hasPermission = WebmailPermissionUtils.hasWebmailPermission(
          userPermissions,
          actionPermissions[action]
        );

        return {
          hasAccess: hasPermission,
          config: hasPermission ? config : undefined,
          error: hasPermission ? undefined : `Sem permissão para ${action} configurações`
        };
      }

      // Verificar se pode gerenciar configurações de outros usuários
      const canManageOthers = WebmailPermissionUtils.canManageOtherUserConfigs(userPermissions);
      
      if (!canManageOthers) {
        return {
          hasAccess: false,
          error: 'Sem permissão para acessar configurações de outros usuários'
        };
      }

      return {
        hasAccess: true,
        config
      };

    } catch (error) {
      console.error('Erro na validação de acesso à configuração:', error);
      return {
        hasAccess: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Registra uma ação do webmail para auditoria
   */
  static async logWebmailAction(
    userId: string,
    action: string,
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<void> {
    try {
      // Log seria implementado com modelo adequado
      console.log(`Webmail Action: webmail.${action}`, {
        userId,
        details,
        timestamp: new Date().toISOString(),
        ipAddress
      });
    } catch (error) {
      console.error('Erro ao registrar log do webmail:', error);
      // Não falhar a operação principal por erro de log
    }
  }

  /**
   * Valida se o usuário pode realizar uma ação específica do webmail
   */
  static async validateWebmailAction(
    userId: string,
    action: WebmailPermission,
    resourceId?: string
  ): Promise<{
    hasAccess: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      // Buscar colaborador e suas permissões
      const colaborador = await db.colaborador.findUnique({
        where: { id: userId },
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
        return {
          hasAccess: false,
          error: 'Usuário não encontrado'
        };
      }

      const userPermissions = colaborador.perfil?.permissoes.map(p => p.permissao?.nome).filter(Boolean) || [];

      // Verificar permissão específica
      const hasPermission = WebmailPermissionUtils.hasWebmailPermission(
        userPermissions,
        action
      );

      return {
        hasAccess: hasPermission,
        user: colaborador,
        error: hasPermission ? undefined : 'Permissões insuficientes'
      };

    } catch (error) {
      console.error('Erro na validação de ação do webmail:', error);
      return {
        hasAccess: false,
        error: 'Erro interno do servidor'
      };
    }
  }
}

/**
 * Função utilitária para criar resposta de erro de permissão
 */
export function createPermissionErrorResponse(error: string, status: number = 403) {
  return new Response(
    JSON.stringify({
      success: false,
      error,
      code: 'PERMISSION_DENIED'
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Decorator para proteger rotas da API do webmail
 */
export function withWebmailPermission(requiredPermissions: WebmailPermission[]) {
  return function (handler: (request: NextRequest, context: any) => Promise<Response>) {
    return async function (request: NextRequest, context: any) {
      try {
        // Construir endpoint key
        const method = request.method;
        const pathname = new URL(request.url).pathname;
        const endpointKey = `${method}:${pathname}`;

        // Validar acesso
        const validation = await WebmailMiddleware.validateEndpointAccess(request, endpointKey);
        
        if (!validation.hasAccess) {
          return createPermissionErrorResponse(validation.error || 'Acesso negado');
        }

        // Adicionar usuário ao contexto
        context.user = validation.user;
        
        // Registrar ação
        await WebmailMiddleware.logWebmailAction(
          validation.user.id,
          `${method.toLowerCase()}_${pathname.replace(/\/api\//, '').replace(/\//g, '_')}`,
          { endpoint: endpointKey },
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
        );

        // Executar handler original
        return await handler(request, context);
        
      } catch (error) {
        console.error('Erro no middleware de permissão do webmail:', error);
        return createPermissionErrorResponse('Erro interno do servidor', 500);
      }
    };
  };
}
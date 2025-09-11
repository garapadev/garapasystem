import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ApiMiddleware } from '@/lib/api-middleware';

export interface HelpdeskAuthResult {
  hasAccess: boolean;
  colaborador?: any;
  grupoHierarquicoId?: string;
  error?: string;
}

/**
 * Middleware específico para validação de permissões do helpdesk
 */
export class HelpdeskMiddleware {
  /**
   * Valida se o usuário tem acesso ao helpdesk e retorna informações do colaborador
   */
  static async validateHelpdeskAccess(
    request?: NextRequest
  ): Promise<HelpdeskAuthResult> {
    try {
      // Se há request, tentar validar autenticação (sessão ou API key)
      if (request) {
        const authResult = await ApiMiddleware.validateAuth(request);
        
        // Se autenticado por API key com permissão admin, permitir acesso total
        if (authResult.valid && authResult.authType === 'apikey' && authResult.apiKey) {
          const permissions = authResult.apiKey.permissoes || [];
          const hasHelpdeskPermission = 
            permissions.includes('admin') ||
            permissions.includes('sistema.administrar') ||
            permissions.includes('helpdesk.visualizar') ||
            permissions.includes('helpdesk.gerenciar');
            
          if (hasHelpdeskPermission) {
            return {
              hasAccess: true,
              colaborador: null, // API key não tem colaborador associado
              grupoHierarquicoId: undefined
            };
          }
        }
        
        // Se autenticado por sessão, continuar com validação normal
        if (authResult.valid && authResult.authType === 'session' && authResult.user) {
          const session = { user: authResult.user };
          return await this.validateSessionAccess(session);
        }
        
        return {
          hasAccess: false,
          error: authResult.error || 'Usuário não autenticado'
        };
      }
      
      // Fallback para validação apenas por sessão (quando não há request)
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return {
          hasAccess: false,
          error: 'Usuário não autenticado'
        };
      }
      
      return await this.validateSessionAccess(session);
    } catch (error) {
      console.error('Erro na validação de acesso ao helpdesk:', error);
      return {
        hasAccess: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Valida acesso baseado em sessão do usuário
   */
  private static async validateSessionAccess(session: any): Promise<HelpdeskAuthResult> {
    try {

      // Buscar colaborador e suas informações
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
          },
          grupoHierarquico: {
            select: {
              id: true,
              nome: true
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
      
      // Verificar se tem permissão para acessar helpdesk
      const hasHelpdeskPermission = 
        userPermissions.includes('admin') ||
        userPermissions.includes('sistema_administrar') ||
        userPermissions.includes('helpdesk.visualizar') ||
        userPermissions.includes('helpdesk.gerenciar');

      if (!hasHelpdeskPermission) {
        return {
          hasAccess: false,
          error: 'Sem permissão para acessar helpdesk'
        };
      }

      return {
        hasAccess: true,
        colaborador,
        grupoHierarquicoId: colaborador.grupoHierarquicoId || undefined
      };

    } catch (error) {
      console.error('Erro na validação de sessão do helpdesk:', error);
      return {
        hasAccess: false,
        error: 'Erro interno do servidor'
      };
    }
  }

  /**
   * Verifica se o colaborador pode acessar um departamento específico
   */
  static async canAccessDepartamento(
    colaboradorGrupoId: string | null,
    departamentoId: string
  ): Promise<boolean> {
    try {
      // Se o colaborador não tem grupo hierárquico, pode acessar todos os departamentos
      if (!colaboradorGrupoId) {
        return true;
      }

      // Buscar o departamento e seu grupo hierárquico
      const departamento = await db.helpdeskDepartamento.findUnique({
        where: { id: departamentoId },
        select: {
          grupoHierarquicoId: true
        }
      });

      if (!departamento) {
        return false;
      }

      // Se o departamento não tem grupo hierárquico, todos podem acessar
      if (!departamento.grupoHierarquicoId) {
        return true;
      }

      // Verificar se o grupo do colaborador é o mesmo do departamento
      return departamento.grupoHierarquicoId === colaboradorGrupoId;

    } catch (error) {
      console.error('Erro ao verificar acesso ao departamento:', error);
      return false;
    }
  }

  /**
   * Constrói filtros de departamentos baseado no grupo hierárquico do colaborador
   */
  static buildDepartamentoFilter(grupoHierarquicoId?: string) {
    if (!grupoHierarquicoId) {
      // Se não tem grupo hierárquico, pode ver todos os departamentos
      return {};
    }

    return {
      OR: [
        // Departamentos do mesmo grupo hierárquico
        { grupoHierarquicoId: grupoHierarquicoId },
        // Departamentos sem grupo hierárquico (públicos)
        { grupoHierarquicoId: null }
      ]
    };
  }

  /**
   * Verifica se o colaborador é administrador do helpdesk
   */
  static isHelpdeskAdmin(colaborador: any): boolean {
    if (!colaborador) {
      return false;
    }
    
    const userPermissions = colaborador.perfil?.permissoes.map((p: any) => p.permissao?.nome).filter(Boolean) || [];
    
    return (
      userPermissions.includes('admin') ||
      userPermissions.includes('sistema_administrar') ||
      userPermissions.includes('helpdesk.gerenciar')
    );
  }
}
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface HelpdeskPermissions {
  canViewTickets: boolean;
  canCreateTickets: boolean;
  canEditTickets: boolean;
  canDeleteTickets: boolean;
  canManageDepartamentos: boolean;
  isHelpdeskAdmin: boolean;
  grupoHierarquicoId?: string;
  loading: boolean;
}

/**
 * Hook para gerenciar permissões do helpdesk
 */
export function useHelpdeskPermissions(): HelpdeskPermissions {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<HelpdeskPermissions>({
    canViewTickets: false,
    canCreateTickets: false,
    canEditTickets: false,
    canDeleteTickets: false,
    canManageDepartamentos: false,
    isHelpdeskAdmin: false,
    loading: true
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    if (!user?.colaborador) {
      setPermissions({
        canViewTickets: false,
        canCreateTickets: false,
        canEditTickets: false,
        canDeleteTickets: false,
        canManageDepartamentos: false,
        isHelpdeskAdmin: false,
        loading: false
      });
      return;
    }

    const colaborador = user.colaborador;
    const userPermissions = colaborador.perfil?.permissoes?.map((p: any) => p.permissao?.nome).filter(Boolean) || [];
    
    // Verificar se é administrador
    const isAdmin = 
      userPermissions.includes('admin') ||
      userPermissions.includes('sistema_administrar') ||
      userPermissions.includes('helpdesk.gerenciar');

    // Verificar permissões específicas do helpdesk
    const hasHelpdeskAccess = 
      isAdmin ||
      userPermissions.includes('helpdesk.visualizar') ||
      userPermissions.includes('helpdesk.criar') ||
      userPermissions.includes('helpdesk.editar');

    const canView = hasHelpdeskAccess;
    const canCreate = isAdmin || userPermissions.includes('helpdesk.criar');
    const canEdit = isAdmin || userPermissions.includes('helpdesk.editar');
    const canDelete = isAdmin || userPermissions.includes('helpdesk.excluir');
    const canManage = isAdmin;

    setPermissions({
      canViewTickets: canView,
      canCreateTickets: canCreate,
      canEditTickets: canEdit,
      canDeleteTickets: canDelete,
      canManageDepartamentos: canManage,
      isHelpdeskAdmin: isAdmin,
      grupoHierarquicoId: colaborador.grupoHierarquico?.id || undefined,
      loading: false
    });
  }, [user]);

  return permissions;
}

/**
 * Hook para verificar se o usuário pode acessar um departamento específico
 */
export function useCanAccessDepartamento(departamentoId?: string) {
  const { grupoHierarquicoId, isHelpdeskAdmin, loading } = useHelpdeskPermissions();
  const [canAccess, setCanAccess] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);

  useEffect(() => {
    if (loading || !departamentoId) {
      setCanAccess(false);
      return;
    }

    // Administradores podem acessar qualquer departamento
    if (isHelpdeskAdmin) {
      setCanAccess(true);
      return;
    }

    // Verificar acesso ao departamento específico
    const checkAccess = async () => {
      setChecking(true);
      try {
        const response = await fetch(`/api/helpdesk/departamentos/${departamentoId}/access-check`);
        const data = await response.json();
        setCanAccess(data.canAccess || false);
      } catch (error) {
        console.error('Erro ao verificar acesso ao departamento:', error);
        setCanAccess(false);
      } finally {
        setChecking(false);
      }
    };

    checkAccess();
  }, [departamentoId, grupoHierarquicoId, isHelpdeskAdmin, loading]);

  return { canAccess, checking };
}

/**
 * Função utilitária para filtrar departamentos baseado nas permissões do usuário
 */
export function filterDepartamentosByPermissions(
  departamentos: any[],
  permissions: HelpdeskPermissions
): any[] {
  if (permissions.isHelpdeskAdmin) {
    // Administradores podem ver todos os departamentos
    return departamentos;
  }

  if (!permissions.grupoHierarquicoId) {
    // Se não tem grupo hierárquico, pode ver departamentos sem grupo
    return departamentos.filter(dept => !dept.grupoHierarquicoId);
  }

  // Filtrar departamentos do mesmo grupo hierárquico ou sem grupo
  return departamentos.filter(dept => 
    !dept.grupoHierarquicoId || dept.grupoHierarquicoId === permissions.grupoHierarquicoId
  );
}
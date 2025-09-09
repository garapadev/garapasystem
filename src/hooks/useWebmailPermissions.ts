import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { 
  WEBMAIL_PERMISSIONS, 
  WEBMAIL_ACCESS_LEVELS,
  WebmailPermissionUtils,
  type WebmailPermissionHook 
} from '@/lib/permissions/webmail-permissions';

/**
 * Hook para gerenciar permissões específicas do webmail
 * Fornece uma interface simplificada para verificar permissões do webmail
 */
export function useWebmailPermissions(): WebmailPermissionHook {
  const { permissions, isAdmin } = useAuth();

  const userPermissionNames = useMemo(() => {
    return permissions.map(p => p.nome);
  }, [permissions]);

  const canAccess = useMemo(() => {
    return {
      config: {
        read: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_CONFIG_READ
        ),
        write: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_CONFIG_WRITE
        ),
        delete: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_CONFIG_DELETE
        ),
        test: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_CONFIG_TEST
        )
      },
      email: {
        read: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_READ
        ),
        readAll: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_READ_ALL
        ),
        compose: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_COMPOSE
        ),
        send: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_SEND
        ),
        sendAs: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_SEND_AS
        ),
        delete: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_DELETE
        ),
        archive: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_ARCHIVE
        ),
        move: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_MOVE
        ),
        flag: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.EMAIL_FLAG
        )
      },
      folder: {
        read: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.FOLDER_READ
        ),
        create: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.FOLDER_CREATE
        ),
        delete: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.FOLDER_DELETE
        ),
        manage: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.FOLDER_MANAGE
        )
      },
      sync: {
        manual: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.SYNC_MANUAL
        ),
        auto: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.SYNC_AUTO
        ),
        settings: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.SYNC_SETTINGS
        )
      },
      attachment: {
        download: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.ATTACHMENT_DOWNLOAD
        ),
        upload: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.ATTACHMENT_UPLOAD
        )
      },
      admin: {
        viewAll: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.ADMIN_VIEW_ALL
        ),
        manageConfigs: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.ADMIN_MANAGE_CONFIGS
        ),
        manageUsers: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.ADMIN_MANAGE_USERS
        ),
        logs: isAdmin || WebmailPermissionUtils.hasWebmailPermission(
          userPermissionNames, 
          WEBMAIL_PERMISSIONS.ADMIN_LOGS
        )
      }
    };
  }, [userPermissionNames, isAdmin]);

  const accessLevel = useMemo(() => {
    return WebmailPermissionUtils.getUserAccessLevel(userPermissionNames);
  }, [userPermissionNames]);

  return {
    canAccess,
    accessLevel,
    isAdmin
  };
}

/**
 * Hook para verificar se o usuário pode acessar uma funcionalidade específica do webmail
 */
export function useWebmailAccess(permission: string): boolean {
  const { permissions, isAdmin } = useAuth();
  
  return useMemo(() => {
    if (isAdmin) return true;
    
    const userPermissionNames = permissions.map(p => p.nome);
    return WebmailPermissionUtils.hasWebmailPermission(
      userPermissionNames, 
      permission as any
    );
  }, [permissions, isAdmin, permission]);
}

/**
 * Hook para verificar se o usuário tem pelo menos uma das permissões especificadas
 */
export function useWebmailAnyAccess(permissionList: string[]): boolean {
  const { permissions, isAdmin } = useAuth();
  
  return useMemo(() => {
    if (isAdmin) return true;
    
    const userPermissionNames = permissions.map(p => p.nome);
    return WebmailPermissionUtils.hasAnyWebmailPermission(
      userPermissionNames, 
      permissionList as any[]
    );
  }, [permissions, isAdmin, permissionList]);
}

/**
 * Hook para verificar se o usuário tem todas as permissões especificadas
 */
export function useWebmailAllAccess(permissionList: string[]): boolean {
  const { permissions, isAdmin } = useAuth();
  
  return useMemo(() => {
    if (isAdmin) return true;
    
    const userPermissionNames = permissions.map(p => p.nome);
    return WebmailPermissionUtils.hasAllWebmailPermissions(
      userPermissionNames, 
      permissionList as any[]
    );
  }, [permissions, isAdmin, permissionList]);
}
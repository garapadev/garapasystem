/**
 * Permissões específicas do módulo de webmail
 * Sistema de controle de acesso granular
 */

export const WEBMAIL_PERMISSIONS = {
  // Configuração de Email
  EMAIL_CONFIG_READ: 'webmail.config.read',
  EMAIL_CONFIG_WRITE: 'webmail.config.write',
  EMAIL_CONFIG_DELETE: 'webmail.config.delete',
  EMAIL_CONFIG_TEST: 'webmail.config.test',
  
  // Leitura de Emails
  EMAIL_READ: 'webmail.email.read',
  EMAIL_READ_ALL: 'webmail.email.read.all', // Ler emails de outros usuários
  
  // Composição e Envio
  EMAIL_COMPOSE: 'webmail.email.compose',
  EMAIL_SEND: 'webmail.email.send',
  EMAIL_SEND_AS: 'webmail.email.send.as', // Enviar como outro usuário
  
  // Gerenciamento de Emails
  EMAIL_DELETE: 'webmail.email.delete',
  EMAIL_ARCHIVE: 'webmail.email.archive',
  EMAIL_MOVE: 'webmail.email.move',
  EMAIL_FLAG: 'webmail.email.flag',
  
  // Pastas
  FOLDER_READ: 'webmail.folder.read',
  FOLDER_CREATE: 'webmail.folder.create',
  FOLDER_DELETE: 'webmail.folder.delete',
  FOLDER_MANAGE: 'webmail.folder.manage',
  
  // Sincronização
  SYNC_MANUAL: 'webmail.sync.manual',
  SYNC_AUTO: 'webmail.sync.auto',
  SYNC_SETTINGS: 'webmail.sync.settings',
  
  // Anexos
  ATTACHMENT_DOWNLOAD: 'webmail.attachment.download',
  ATTACHMENT_UPLOAD: 'webmail.attachment.upload',
  
  // Administração
  ADMIN_VIEW_ALL: 'webmail.admin.view.all',
  ADMIN_MANAGE_CONFIGS: 'webmail.admin.manage.configs',
  ADMIN_MANAGE_USERS: 'webmail.admin.manage.users',
  ADMIN_LOGS: 'webmail.admin.logs'
} as const;

export type WebmailPermission = typeof WEBMAIL_PERMISSIONS[keyof typeof WEBMAIL_PERMISSIONS];

/**
 * Níveis de acesso predefinidos para o webmail
 */
const BASIC_PERMISSIONS = [
  WEBMAIL_PERMISSIONS.EMAIL_CONFIG_READ,
  WEBMAIL_PERMISSIONS.EMAIL_CONFIG_WRITE,
  WEBMAIL_PERMISSIONS.EMAIL_CONFIG_TEST,
  WEBMAIL_PERMISSIONS.EMAIL_READ,
  WEBMAIL_PERMISSIONS.EMAIL_COMPOSE,
  WEBMAIL_PERMISSIONS.EMAIL_SEND,
  WEBMAIL_PERMISSIONS.EMAIL_DELETE,
  WEBMAIL_PERMISSIONS.EMAIL_ARCHIVE,
  WEBMAIL_PERMISSIONS.FOLDER_READ,
  WEBMAIL_PERMISSIONS.SYNC_MANUAL,
  WEBMAIL_PERMISSIONS.ATTACHMENT_DOWNLOAD,
  WEBMAIL_PERMISSIONS.ATTACHMENT_UPLOAD
];

const ADVANCED_PERMISSIONS = [
  ...BASIC_PERMISSIONS,
  WEBMAIL_PERMISSIONS.FOLDER_CREATE,
  WEBMAIL_PERMISSIONS.FOLDER_DELETE,
  WEBMAIL_PERMISSIONS.FOLDER_MANAGE,
  WEBMAIL_PERMISSIONS.SYNC_AUTO,
  WEBMAIL_PERMISSIONS.SYNC_SETTINGS,
  WEBMAIL_PERMISSIONS.EMAIL_MOVE,
  WEBMAIL_PERMISSIONS.EMAIL_FLAG
];

const SUPERVISOR_PERMISSIONS = [
  ...ADVANCED_PERMISSIONS,
  WEBMAIL_PERMISSIONS.EMAIL_READ_ALL,
  WEBMAIL_PERMISSIONS.ADMIN_VIEW_ALL
];

const ADMIN_PERMISSIONS = [
  ...SUPERVISOR_PERMISSIONS,
  WEBMAIL_PERMISSIONS.EMAIL_CONFIG_DELETE,
  WEBMAIL_PERMISSIONS.EMAIL_SEND_AS,
  WEBMAIL_PERMISSIONS.ADMIN_MANAGE_CONFIGS,
  WEBMAIL_PERMISSIONS.ADMIN_MANAGE_USERS,
  WEBMAIL_PERMISSIONS.ADMIN_LOGS
];

export const WEBMAIL_ACCESS_LEVELS = {
  BASIC: BASIC_PERMISSIONS,
  ADVANCED: ADVANCED_PERMISSIONS,
  SUPERVISOR: SUPERVISOR_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS
} as const;

export type WebmailAccessLevel = keyof typeof WEBMAIL_ACCESS_LEVELS;

/**
 * Mapeamento de endpoints para permissões necessárias
 */
export const WEBMAIL_ENDPOINT_PERMISSIONS: Record<string, WebmailPermission[]> = {
  // Configuração de Email
  'GET:/api/email-config': [WEBMAIL_PERMISSIONS.EMAIL_CONFIG_READ],
  'POST:/api/email-config': [WEBMAIL_PERMISSIONS.EMAIL_CONFIG_WRITE],
  'PUT:/api/email-config': [WEBMAIL_PERMISSIONS.EMAIL_CONFIG_WRITE],
  'DELETE:/api/email-config': [WEBMAIL_PERMISSIONS.EMAIL_CONFIG_DELETE],
  
  // Emails
  'GET:/api/emails': [WEBMAIL_PERMISSIONS.EMAIL_READ],
  'GET:/api/emails/[id]': [WEBMAIL_PERMISSIONS.EMAIL_READ],
  'POST:/api/emails/send': [WEBMAIL_PERMISSIONS.EMAIL_SEND],
  'DELETE:/api/emails/[id]': [WEBMAIL_PERMISSIONS.EMAIL_DELETE],
  'PUT:/api/emails/[id]/archive': [WEBMAIL_PERMISSIONS.EMAIL_ARCHIVE],
  'PUT:/api/emails/[id]/move': [WEBMAIL_PERMISSIONS.EMAIL_MOVE],
  'PUT:/api/emails/[id]/flag': [WEBMAIL_PERMISSIONS.EMAIL_FLAG],
  
  // Testes
  'POST:/api/emails/test': [WEBMAIL_PERMISSIONS.EMAIL_CONFIG_TEST],
  'POST:/api/emails/test-send': [WEBMAIL_PERMISSIONS.EMAIL_SEND],
  
  // Sincronização
  'POST:/api/emails/sync': [WEBMAIL_PERMISSIONS.SYNC_MANUAL],
  'PUT:/api/emails/sync/settings': [WEBMAIL_PERMISSIONS.SYNC_SETTINGS],
  
  // Pastas
  'GET:/api/emails/folders': [WEBMAIL_PERMISSIONS.FOLDER_READ],
  'POST:/api/emails/folders': [WEBMAIL_PERMISSIONS.FOLDER_CREATE],
  'DELETE:/api/emails/folders/[id]': [WEBMAIL_PERMISSIONS.FOLDER_DELETE],
  'PUT:/api/emails/folders/[id]': [WEBMAIL_PERMISSIONS.FOLDER_MANAGE],
  
  // Anexos
  'GET:/api/emails/[id]/attachments/[attachmentId]': [WEBMAIL_PERMISSIONS.ATTACHMENT_DOWNLOAD],
  'POST:/api/emails/attachments': [WEBMAIL_PERMISSIONS.ATTACHMENT_UPLOAD],
  
  // Administração
  'GET:/api/webmail/admin/users': [WEBMAIL_PERMISSIONS.ADMIN_MANAGE_USERS],
  'GET:/api/webmail/admin/configs': [WEBMAIL_PERMISSIONS.ADMIN_MANAGE_CONFIGS],
  'GET:/api/webmail/admin/logs': [WEBMAIL_PERMISSIONS.ADMIN_LOGS],
  'PUT:/api/webmail/admin/users/[id]/permissions': [WEBMAIL_PERMISSIONS.ADMIN_MANAGE_USERS],
  'DELETE:/api/webmail/admin/configs/[id]': [WEBMAIL_PERMISSIONS.ADMIN_MANAGE_CONFIGS]
};

/**
 * Utilitários para verificação de permissões do webmail
 */
export class WebmailPermissionUtils {
  /**
   * Verifica se o usuário tem uma permissão específica do webmail
   */
  static hasWebmailPermission(
    userPermissions: string[],
    requiredPermission: WebmailPermission
  ): boolean {
    // Administradores têm acesso total
    if (userPermissions.includes('admin') || userPermissions.includes('sistema.administrar')) {
      return true;
    }
    
    return userPermissions.includes(requiredPermission);
  }
  
  /**
   * Verifica se o usuário tem pelo menos uma das permissões especificadas
   */
  static hasAnyWebmailPermission(
    userPermissions: string[],
    requiredPermissions: WebmailPermission[]
  ): boolean {
    // Administradores têm acesso total
    if (userPermissions.includes('admin') || userPermissions.includes('sistema.administrar')) {
      return true;
    }
    
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }
  
  /**
   * Verifica se o usuário tem todas as permissões especificadas
   */
  static hasAllWebmailPermissions(
    userPermissions: string[],
    requiredPermissions: WebmailPermission[]
  ): boolean {
    // Administradores têm acesso total
    if (userPermissions.includes('admin') || userPermissions.includes('sistema.administrar')) {
      return true;
    }
    
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  }
  
  /**
   * Obtém o nível de acesso do usuário baseado em suas permissões
   */
  static getUserAccessLevel(userPermissions: string[]): WebmailAccessLevel | null {
    // Administradores têm acesso total
    if (userPermissions.includes('admin') || userPermissions.includes('sistema.administrar')) {
      return 'ADMIN';
    }
    
    // Verifica do maior para o menor nível
    if (this.hasAllWebmailPermissions(userPermissions, WEBMAIL_ACCESS_LEVELS.ADMIN)) {
      return 'ADMIN';
    }
    
    if (this.hasAllWebmailPermissions(userPermissions, WEBMAIL_ACCESS_LEVELS.SUPERVISOR)) {
      return 'SUPERVISOR';
    }
    
    if (this.hasAllWebmailPermissions(userPermissions, WEBMAIL_ACCESS_LEVELS.ADVANCED)) {
      return 'ADVANCED';
    }
    
    if (this.hasAllWebmailPermissions(userPermissions, WEBMAIL_ACCESS_LEVELS.BASIC)) {
      return 'BASIC';
    }
    
    return null;
  }
  
  /**
   * Verifica se o usuário pode acessar emails de outro usuário
   */
  static canAccessOtherUserEmails(userPermissions: string[]): boolean {
    return this.hasWebmailPermission(userPermissions, WEBMAIL_PERMISSIONS.EMAIL_READ_ALL) ||
           this.hasWebmailPermission(userPermissions, WEBMAIL_PERMISSIONS.ADMIN_VIEW_ALL);
  }
  
  /**
   * Verifica se o usuário pode gerenciar configurações de outros usuários
   */
  static canManageOtherUserConfigs(userPermissions: string[]): boolean {
    return this.hasWebmailPermission(userPermissions, WEBMAIL_PERMISSIONS.ADMIN_MANAGE_CONFIGS);
  }
  
  /**
   * Verifica se o usuário pode enviar emails como outro usuário
   */
  static canSendAsOtherUser(userPermissions: string[]): boolean {
    return this.hasWebmailPermission(userPermissions, WEBMAIL_PERMISSIONS.EMAIL_SEND_AS);
  }
}

/**
 * Hook para verificação de permissões do webmail
 */
export interface WebmailPermissionHook {
  canAccess: {
    config: {
      read: boolean;
      write: boolean;
      delete: boolean;
      test: boolean;
    };
    email: {
      read: boolean;
      readAll: boolean;
      compose: boolean;
      send: boolean;
      sendAs: boolean;
      delete: boolean;
      archive: boolean;
      move: boolean;
      flag: boolean;
    };
    folder: {
      read: boolean;
      create: boolean;
      delete: boolean;
      manage: boolean;
    };
    sync: {
      manual: boolean;
      auto: boolean;
      settings: boolean;
    };
    attachment: {
      download: boolean;
      upload: boolean;
    };
    admin: {
      viewAll: boolean;
      manageConfigs: boolean;
      manageUsers: boolean;
      logs: boolean;
    };
  };
  accessLevel: WebmailAccessLevel | null;
  isAdmin: boolean;
}
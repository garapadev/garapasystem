import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { 
  WEBMAIL_PERMISSIONS, 
  WEBMAIL_ACCESS_LEVELS,
  WebmailPermissionUtils 
} from '@/lib/permissions/webmail-permissions'

export interface Permission {
  id: string
  nome: string
  recurso: string
  acao: string
}

export interface UserProfile {
  id: string
  nome: string
  email: string
  cargo?: string | null
  perfil?: {
    id: string
    nome: string
    descricao?: string | null
    permissoes: {
      permissao: Permission
    }[]
  } | null
  grupoHierarquico?: {
    id: string
    nome: string
    descricao?: string | null
  } | null
}

export function useAuth() {
  const { data: session, status } = useSession()

  const user = useMemo(() => {
    if (!session?.user) return null
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      colaborador: session.user.colaborador
    }
  }, [session])

  const colaborador = useMemo(() => {
    return session?.user?.colaborador || null
  }, [session])

  const permissions = useMemo(() => {
    if (!colaborador?.perfil?.permissoes) return []
    return colaborador.perfil.permissoes.map(p => p.permissao)
  }, [colaborador])

  const hasPermission = useMemo(() => {
    return (recurso: string, acao: string) => {
      if (!permissions.length) return false
      
      // Verificar se tem permissão específica
      const hasSpecificPermission = permissions.some(
        p => p.recurso === recurso && p.acao === acao
      )
      
      // Verificar se tem permissão de administrador
      const hasAdminPermission = permissions.some(
        p => p.recurso === 'sistema' && p.acao === 'administrar'
      )
      
      return hasSpecificPermission || hasAdminPermission
    }
  }, [permissions])

  const hasAnyPermission = useMemo(() => {
    return (recurso: string, acoes: string[]) => {
      return acoes.some(acao => hasPermission(recurso, acao))
    }
  }, [hasPermission])

  const isAdmin = useMemo(() => {
    return hasPermission('sistema', 'administrar')
  }, [hasPermission])

  const canAccess = useMemo(() => {
    return {
      // Clientes
      clientes: {
        create: hasPermission('clientes', 'criar'),
        read: hasPermission('clientes', 'ler'),
        update: hasPermission('clientes', 'editar'),
        delete: hasPermission('clientes', 'excluir'),
        any: hasAnyPermission('clientes', ['criar', 'ler', 'editar', 'excluir'])
      },
      // Colaboradores
      colaboradores: {
        create: hasPermission('colaboradores', 'criar'),
        read: hasPermission('colaboradores', 'ler'),
        update: hasPermission('colaboradores', 'editar'),
        delete: hasPermission('colaboradores', 'excluir'),
        any: hasAnyPermission('colaboradores', ['criar', 'ler', 'editar', 'excluir'])
      },
      // Grupos
      grupos: {
        create: hasPermission('grupos', 'criar'),
        read: hasPermission('grupos', 'ler'),
        update: hasPermission('grupos', 'editar'),
        delete: hasPermission('grupos', 'excluir'),
        any: hasAnyPermission('grupos', ['criar', 'ler', 'editar', 'excluir'])
      },
      // Perfis
      perfis: {
        create: hasPermission('perfis', 'criar'),
        read: hasPermission('perfis', 'ler'),
        update: hasPermission('perfis', 'editar'),
        delete: hasPermission('perfis', 'excluir'),
        any: hasAnyPermission('perfis', ['criar', 'ler', 'editar', 'excluir'])
      },
      // Permissões
      permissoes: {
        create: hasPermission('permissoes', 'criar'),
        read: hasPermission('permissoes', 'ler'),
        update: hasPermission('permissoes', 'editar'),
        delete: hasPermission('permissoes', 'excluir'),
        any: hasAnyPermission('permissoes', ['criar', 'ler', 'editar', 'excluir'])
      },
      // Usuários
      usuarios: {
        create: hasPermission('usuarios', 'criar'),
        read: hasPermission('usuarios', 'ler'),
        update: hasPermission('usuarios', 'editar'),
        delete: hasPermission('usuarios', 'excluir'),
        any: hasAnyPermission('usuarios', ['criar', 'ler', 'editar', 'excluir'])
      },
      // Ordens de Serviço
      ordens_servico: {
        create: hasPermission('ordens_servico', 'criar'),
        read: hasPermission('ordens_servico', 'ler'),
        update: hasPermission('ordens_servico', 'editar'),
        delete: hasPermission('ordens_servico', 'excluir'),
        approve: hasPermission('ordens_servico', 'aprovar'),
        manage: hasPermission('ordens_servico', 'gerenciar'),
        any: hasAnyPermission('ordens_servico', ['criar', 'ler', 'editar', 'excluir', 'aprovar', 'gerenciar'])
      },
      // Orçamentos
      orcamentos: {
        create: hasPermission('orcamentos', 'criar'),
        read: hasPermission('orcamentos', 'ler'),
        update: hasPermission('orcamentos', 'editar'),
        delete: hasPermission('orcamentos', 'excluir'),
        approve: hasPermission('orcamentos', 'aprovar'),
        generate: hasPermission('orcamentos', 'gerar'),
        any: hasAnyPermission('orcamentos', ['criar', 'ler', 'editar', 'excluir', 'aprovar', 'gerar'])
      },
      // Laudos Técnicos
      laudos: {
        create: hasPermission('laudos', 'criar'),
        read: hasPermission('laudos', 'ler'),
        update: hasPermission('laudos', 'editar'),
        delete: hasPermission('laudos', 'excluir'),
        approve: hasPermission('laudos', 'aprovar'),
        any: hasAnyPermission('laudos', ['criar', 'ler', 'editar', 'excluir', 'aprovar'])
      },
      // Webmail
       webmail: {
          access: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.EMAIL_READ),
          viewEmails: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.EMAIL_READ),
          sendEmails: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.EMAIL_SEND),
          deleteEmails: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.EMAIL_DELETE),
          manageConfig: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.EMAIL_CONFIG_WRITE),
          viewConfig: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.EMAIL_CONFIG_READ),
          manageFolders: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.FOLDER_MANAGE),
          viewFolders: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.FOLDER_READ),
          manageAttachments: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.ATTACHMENT_UPLOAD),
          viewAttachments: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.ATTACHMENT_DOWNLOAD),
          viewAuditLogs: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.ADMIN_LOGS),
          manageUsers: WebmailPermissionUtils.hasWebmailPermission(permissions.map(p => p.nome), WEBMAIL_PERMISSIONS.ADMIN_MANAGE_USERS),
          any: WebmailPermissionUtils.hasAnyWebmailPermission(permissions.map(p => p.nome), [WEBMAIL_PERMISSIONS.EMAIL_READ, WEBMAIL_PERMISSIONS.EMAIL_CONFIG_READ])
        }
    }
  }, [hasPermission, hasAnyPermission])

  return {
    user,
    colaborador,
    permissions,
    hasPermission,
    hasAnyPermission,
    isAdmin,
    canAccess,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated'
  }
}
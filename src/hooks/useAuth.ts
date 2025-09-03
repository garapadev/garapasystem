import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

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
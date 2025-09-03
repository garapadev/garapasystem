'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermission?: {
    recurso: string
    acao: string
  }
  requiredPermissions?: {
    recurso: string
    acao: string
  }[]
  requireAdmin?: boolean
  fallback?: ReactNode
  redirectTo?: string
}

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requireAdmin = false,
  fallback,
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, isLoading, router, redirectTo])

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não está autenticado, não renderizar nada (redirecionamento já foi feito)
  if (!isAuthenticated) {
    return null
  }

  // Verificar se requer admin
  if (requireAdmin && !isAdmin) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Você não tem permissão de administrador para acessar esta página.
            </p>
          </div>
        </div>
      )
    )
  }

  // Verificar permissão específica
  if (requiredPermission) {
    const hasAccess = hasPermission(requiredPermission.recurso, requiredPermission.acao)
    if (!hasAccess) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
              <p className="text-muted-foreground">
                Você não tem permissão para {requiredPermission.acao} {requiredPermission.recurso}.
              </p>
            </div>
          </div>
        )
      )
    }
  }

  // Verificar múltiplas permissões (todas devem ser atendidas)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(perm => 
      hasPermission(perm.recurso, perm.acao)
    )
    
    if (!hasAllPermissions) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-destructive">Acesso Negado</h2>
              <p className="text-muted-foreground">
                Você não tem todas as permissões necessárias para acessar esta página.
              </p>
            </div>
          </div>
        )
      )
    }
  }

  return <>{children}</>
}

// Componente para proteger elementos específicos
interface ProtectedElementProps {
  children: ReactNode
  requiredPermission?: {
    recurso: string
    acao: string
  }
  requireAdmin?: boolean
  fallback?: ReactNode
}

export function ProtectedElement({
  children,
  requiredPermission,
  requireAdmin = false,
  fallback = null
}: ProtectedElementProps) {
  const { hasPermission, isAdmin, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <>{fallback}</>
  }

  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>
  }

  if (requiredPermission) {
    const hasAccess = hasPermission(requiredPermission.recurso, requiredPermission.acao)
    if (!hasAccess) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
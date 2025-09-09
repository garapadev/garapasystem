'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useWebmailPermissions, useWebmailAccess } from '@/hooks/useWebmailPermissions';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';

interface WebmailProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Componente para proteger rotas específicas do webmail
 * Verifica se o usuário tem as permissões necessárias para acessar a funcionalidade
 */
export function WebmailProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  fallback,
  redirectTo
}: WebmailProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const { canAccess } = useWebmailPermissions();
  const hasPermission = useWebmailAccess(requiredPermission || '');

  // Aguardar carregamento da autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar se está autenticado
  if (!isAuthenticated) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }
    
    return (
      <Alert className="m-4">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Você precisa estar logado para acessar esta funcionalidade.
        </AlertDescription>
      </Alert>
    );
  }

  // Admin tem acesso total
  if (isAdmin) {
    return <>{children}</>;
  }

  // Verificar permissão única
  if (requiredPermission && !hasPermission) {
    return renderAccessDenied();
  }

  // Verificar múltiplas permissões
  if (requiredPermissions.length > 0) {
    const hasRequiredAccess = requireAll
      ? requiredPermissions.every(permission => 
          useWebmailAccess(permission)
        )
      : requiredPermissions.some(permission => 
          useWebmailAccess(permission)
        );

    if (!hasRequiredAccess) {
      return renderAccessDenied();
    }
  }

  // Verificar acesso básico ao webmail
  if (!canAccess.email.read && !canAccess.config.read) {
    return renderAccessDenied();
  }

  return <>{children}</>;

  function renderAccessDenied() {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-semibold text-foreground">
            Acesso Negado
          </h2>
          <p className="text-muted-foreground max-w-md">
            Você não possui as permissões necessárias para acessar esta funcionalidade do webmail.
            Entre em contato com o administrador do sistema para solicitar acesso.
          </p>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button 
              onClick={() => router.push('/webmail')}
            >
              Ir para Webmail
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * HOC para proteger componentes do webmail
 */
export function withWebmailProtection<T extends object>(
  Component: React.ComponentType<T>,
  options: Omit<WebmailProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: T) {
    return (
      <WebmailProtectedRoute {...options}>
        <Component {...props} />
      </WebmailProtectedRoute>
    );
  };
}

/**
 * Componente para mostrar conteúdo baseado em permissões
 */
interface ConditionalWebmailContentProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  adminOnly?: boolean;
}

export function ConditionalWebmailContent({
  children,
  requiredPermission,
  requiredPermissions = [],
  requireAll = false,
  fallback = null,
  adminOnly = false
}: ConditionalWebmailContentProps) {
  const { isAdmin } = useAuth();
  const hasPermission = useWebmailAccess(requiredPermission || '');

  // Verificar se é admin only
  if (adminOnly && !isAdmin) {
    return <>{fallback}</>;
  }

  // Admin tem acesso total
  if (isAdmin) {
    return <>{children}</>;
  }

  // Verificar permissão única
  if (requiredPermission && !hasPermission) {
    return <>{fallback}</>;
  }

  // Verificar múltiplas permissões
  if (requiredPermissions.length > 0) {
    const hasRequiredAccess = requireAll
      ? requiredPermissions.every(permission => 
          useWebmailAccess(permission)
        )
      : requiredPermissions.some(permission => 
          useWebmailAccess(permission)
        );

    if (!hasRequiredAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}
'use client';

import { AlertTriangle, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

interface ModuleInactiveMessageProps {
  moduleName: string;
  moduleTitle?: string;
  description?: string;
}

export function ModuleInactiveMessage({ 
  moduleName, 
  moduleTitle, 
  description 
}: ModuleInactiveMessageProps) {
  const { isAdmin } = useAuth();

  const defaultTitle = moduleTitle || moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  const defaultDescription = description || `O módulo ${defaultTitle} está atualmente desativado.`;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle className="text-xl">Módulo Inativo</CardTitle>
          <CardDescription className="text-center">
            {defaultDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este módulo foi desativado pelo administrador do sistema.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Voltar ao Dashboard
              </Link>
            </Button>

            {isAdmin && (
              <Button asChild variant="default" className="w-full">
                <Link href="/configuracoes/modulos">
                  <Settings className="mr-2 h-4 w-4" />
                  Gerenciar Módulos
                </Link>
              </Button>
            )}
          </div>

          {isAdmin && (
            <div className="text-xs text-muted-foreground text-center">
              Como administrador, você pode ativar este módulo nas configurações.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook para usar em páginas que precisam verificar se o módulo está ativo
export function useModuleCheck(moduleName: string) {
  // Este hook pode ser expandido para fazer verificações do lado do cliente
  // Por enquanto, apenas retorna uma função para renderizar a mensagem
  
  const renderInactiveMessage = (moduleTitle?: string, description?: string) => (
    <ModuleInactiveMessage 
      moduleName={moduleName}
      moduleTitle={moduleTitle}
      description={description}
    />
  );

  return {
    renderInactiveMessage,
  };
}
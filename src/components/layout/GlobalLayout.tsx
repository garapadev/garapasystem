'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

interface GlobalLayoutProps {
  children: ReactNode;
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  
  // Initialize email notifications
  useEmailNotifications();
  
  // Páginas que não devem mostrar o sidebar (login, etc.)
  const authPages = ['/auth/login', '/auth/register'];
  const isAuthPage = authPages.includes(pathname);
  
  // Se está carregando, mostra loading state melhorado
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando GarapaSystem...</p>
        </div>
      </div>
    );
  }
  
  // Se não está autenticado ou está em página de auth, mostra apenas o conteúdo
  if (!isAuthenticated || isAuthPage) {
    return <div className="min-h-screen">{children}</div>;
  }
  
  // Se está autenticado, mostra o layout com sidebar
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
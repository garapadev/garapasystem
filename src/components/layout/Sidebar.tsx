'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { 
  Users, 
  Building2, 
  Shield, 
  UserCircle, 
  Home,
  Settings,
  Key,
  Menu,
  X,
  TrendingUp
} from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  requiredPermission?: {
    recurso: string;
    acao: string;
  };
  requireAdmin?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { 
    name: 'Clientes', 
    href: '/clientes', 
    icon: Users,
    requiredPermission: { recurso: 'clientes', acao: 'ler' }
  },
  { 
    name: 'Negócios', 
    href: '/negocios', 
    icon: TrendingUp,
    requiredPermission: { recurso: 'negocios', acao: 'ler' }
  },
  { 
    name: 'Colaboradores', 
    href: '/colaboradores', 
    icon: UserCircle,
    requiredPermission: { recurso: 'colaboradores', acao: 'ler' }
  },
  { 
    name: 'Grupos Hierárquicos', 
    href: '/grupos-hierarquicos', 
    icon: Building2,
    requiredPermission: { recurso: 'grupos', acao: 'ler' }
  },
  { 
    name: 'Perfis', 
    href: '/perfis', 
    icon: Key,
    requiredPermission: { recurso: 'perfis', acao: 'ler' }
  },
  { 
    name: 'Permissões', 
    href: '/permissoes', 
    icon: Shield,
    requiredPermission: { recurso: 'permissoes', acao: 'ler' }
  },
  { 
    name: 'Usuários', 
    href: '/usuarios', 
    icon: UserCircle,
    requiredPermission: { recurso: 'usuarios', acao: 'ler' }
  },
  { 
    name: 'Configurações', 
    href: '/configuracoes', 
    icon: Settings,
    requireAdmin: true
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission, isAdmin, isAuthenticated } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const filteredNavigation = navigation.filter((item) => {
    // Dashboard é sempre visível
    if (item.href === '/') return true;
    
    // Verificar se requer admin
    if (item.requireAdmin && !isAdmin) return false;
    
    // Verificar permissão específica
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission.recurso, item.requiredPermission.acao);
    }
    
    return true;
  });

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md border"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "flex h-full flex-col bg-gray-50 border-r transition-all duration-300 ease-in-out",
        "lg:relative lg:translate-x-0",
        isMobileOpen ? "fixed inset-y-0 left-0 z-50 w-64" : "lg:w-64",
        !isMobileOpen && "lg:block hidden",
        isCollapsed && "lg:w-16"
      )}>
        <div className="flex h-16 items-center justify-between px-4 lg:px-6 border-b">
          <Link 
            href="https://community.garapasystem.com/"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "font-semibold text-gray-900 transition-all duration-300 hover:text-blue-600",
              isCollapsed ? "lg:hidden" : "text-lg lg:text-xl"
            )}
          >
            {isCollapsed ? "G" : "GarapaSystem"}
          </Link>
          <button
            className="hidden lg:block p-1 rounded hover:bg-gray-200 transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-2 lg:px-3 py-4 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isCollapsed ? "" : "mr-3"
                )} />
                <span className={cn(
                  "transition-all duration-300 overflow-hidden",
                  isCollapsed ? "lg:hidden" : "block"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
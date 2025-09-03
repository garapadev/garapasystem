'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  Users, 
  Building2, 
  Shield, 
  UserCircle, 
  Home,
  Settings,
  BarChart3,
  Key
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
    name: 'Relatórios', 
    href: '/relatorios', 
    icon: BarChart3,
    requireAdmin: true
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
    <div className="flex h-full w-64 flex-col bg-gray-50 border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <h1 className="text-xl font-semibold text-gray-900">CRM/ERP</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsAppModule } from '@/hooks/useWhatsAppModule';
import { useState } from 'react';
import { 
  Users, 
  Home,
  Settings,
  Menu,
  X,
  TrendingUp,
  Mail,
  Headphones,
  CheckSquare,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  ClipboardList
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
  subItems?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { 
    name: 'Webmail', 
    href: '/webmail', 
    icon: Mail,
    requiredPermission: { recurso: 'webmail', acao: 'email.read' }
  },
  { 
    name: 'Helpdesk', 
    href: '/helpdesk', 
    icon: Headphones,
    requiredPermission: { recurso: 'helpdesk', acao: 'visualizar' }
  },
  { 
    name: 'WhatsApp Chat', 
    href: '/whatsappchat', 
    icon: MessageCircle,
    requiredPermission: { recurso: 'whatsapp', acao: 'usar' }
  },
  { 
    name: 'Tarefas', 
    href: '/tasks', 
    icon: CheckSquare,
    requiredPermission: { recurso: 'tasks', acao: 'ler' },
    subItems: [
      {
        name: 'Dashboard',
        href: '/tasks/dashboard',
        icon: BarChart3,
        requiredPermission: { recurso: 'tasks', acao: 'ler' }
      },
      {
        name: 'Calendário',
        href: '/tasks/calendar',
        icon: Calendar,
        requiredPermission: { recurso: 'tasks', acao: 'ler' }
      }
    ]
  },
  { 
    name: 'Clientes', 
    href: '/clientes', 
    icon: Users,
    requiredPermission: { recurso: 'clientes', acao: 'ler' }
  },
  { 
    name: 'Ordens de Serviço', 
    href: '/ordens-servico', 
    icon: ClipboardList,
    requiredPermission: { recurso: 'ordens_servico', acao: 'ler' }
  },
  { 
    name: 'Negócios', 
    href: '/negocios', 
    icon: TrendingUp,
    requiredPermission: { recurso: 'negocios', acao: 'ler' }
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
  const { isModuleActive } = useWhatsAppModule();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  if (!isAuthenticated) {
    return null;
  }

  const filteredNavigation = navigation.filter((item) => {
    // Dashboard é sempre visível
    if (item.href === '/') return true;
    
    // Verificar se é o menu WhatsApp e se o módulo está ativo
    if (item.href === '/whatsappchat' && !isModuleActive) return false;
    
    // Verificar se requer admin
    if (item.requireAdmin && !isAdmin) return false;
    
    // Verificar permissão específica
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission.recurso, item.requiredPermission.acao);
    }
    
    return true;
  });

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const renderNavigationItem = (item: NavigationItem, isSubItem = false) => {
    const isActive = pathname === item.href || 
      (item.href !== '/' && pathname.startsWith(item.href));
    const isExpanded = expandedItems.includes(item.name);
    const hasSubItems = item.subItems && item.subItems.length > 0;

    return (
      <div key={item.name}>
        {hasSubItems ? (
          <div className="relative">
            {/* Link principal para navegação */}
            <Link
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                'hover:scale-105 active:scale-95 group',
                isSubItem && 'ml-6 bg-gray-50 border-l-2 border-gray-200',
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
                "transition-all duration-300 overflow-hidden flex-1",
                isCollapsed ? "lg:hidden" : "block"
              )}>
                {item.name}
              </span>
            </Link>
            
            {/* Botão separado para expansão/recolhimento */}
            {!isCollapsed && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleExpanded(item.name);
                }}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 transition-colors',
                  'opacity-0 group-hover:opacity-100 focus:opacity-100'
                )}
                title={isExpanded ? 'Recolher submenu' : 'Expandir submenu'}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        ) : (
          <Link
            href={item.href}
            onClick={() => setIsMobileOpen(false)}
            className={cn(
              'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isSubItem && 'ml-6 bg-gray-50 border-l-2 border-gray-200 text-gray-600',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
            title={isCollapsed ? item.name : undefined}
          >
            <item.icon className={cn(
              "h-5 w-5 flex-shrink-0",
              isCollapsed ? "" : "mr-3",
              isSubItem && "h-4 w-4"
            )} />
            <span className={cn(
              "transition-all duration-300 overflow-hidden",
              isCollapsed ? "lg:hidden" : "block"
            )}>
              {item.name}
            </span>
          </Link>
        )}
        
        {hasSubItems && isExpanded && !isCollapsed && (
          <div className="ml-2 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
            {item.subItems!.filter(subItem => {
              if (subItem.requireAdmin && !isAdmin) return false;
              if (subItem.requiredPermission) {
                return hasPermission(subItem.requiredPermission.recurso, subItem.requiredPermission.acao);
              }
              return true;
            }).map(subItem => renderNavigationItem(subItem, true))}
          </div>
        )}
      </div>
    );
  };

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
          {filteredNavigation.map(item => renderNavigationItem(item))}
        </nav>
      </div>
    </>
  );
}
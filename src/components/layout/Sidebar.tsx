'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useWhatsAppModule } from '@/hooks/useWhatsAppModule';
import { useNotificationBadges } from '@/hooks/useNotificationBadges';
import { useModulos } from '@/hooks/useModulos';
import { BadgeWrapper } from '@/components/ui/notification-badge';
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
  ClipboardList,
  FileText,
  FileCheck
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
  moduleName?: string; // Nome do módulo para verificar se está ativo
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home, moduleName: 'dashboard' },
  { 
    name: 'Webmail', 
    href: '/webmail', 
    icon: Mail,
    requiredPermission: { recurso: 'webmail', acao: 'email.read' },
    moduleName: 'webmail'
  },
  { 
    name: 'Helpdesk', 
    href: '/helpdesk', 
    icon: Headphones,
    requiredPermission: { recurso: 'helpdesk', acao: 'visualizar' },
    moduleName: 'helpdesk'
  },
  { 
    name: 'WhatsApp Chat', 
    href: '/whatsappchat', 
    icon: MessageCircle,
    requiredPermission: { recurso: 'whatsapp', acao: 'usar' },
    moduleName: 'whatsapp-chat'
  },
  { 
    name: 'Tarefas', 
    href: '/tasks', 
    icon: CheckSquare,
    requiredPermission: { recurso: 'tasks', acao: 'ler' },
    moduleName: 'tarefas',
    subItems: [
      {
        name: 'Dashboard',
        href: '/tasks/dashboard',
        icon: BarChart3,
        requiredPermission: { recurso: 'tasks', acao: 'ler' },
        moduleName: 'tarefas'
      },
      {
        name: 'Calendário',
        href: '/tasks/calendar',
        icon: Calendar,
        requiredPermission: { recurso: 'tasks', acao: 'ler' },
        moduleName: 'tarefas'
      }
    ]
  },
  { 
    name: 'Clientes', 
    href: '/clientes', 
    icon: Users,
    requiredPermission: { recurso: 'clientes', acao: 'ler' },
    moduleName: 'clientes'
  },
  { 
    name: 'Orçamentos', 
    href: '/orcamentos', 
    icon: FileText,
    requiredPermission: { recurso: 'orcamentos', acao: 'ler' },
    moduleName: 'orcamentos'
  },
  { 
    name: 'Ordens de Serviço', 
    href: '/ordens-servico', 
    icon: ClipboardList,
    requiredPermission: { recurso: 'ordens_servico', acao: 'ler' },
    moduleName: 'ordens-servico'
  },
  { 
    name: 'Laudos Técnicos', 
    href: '/laudos-tecnicos', 
    icon: FileCheck,
    requiredPermission: { recurso: 'laudos', acao: 'ler' },
    moduleName: 'laudos-tecnicos'
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
  const { isModuleActive: isWhatsAppActive, isLoading: whatsappLoading } = useWhatsAppModule();
  const { getBadgeByModule, getBadgeColor } = useNotificationBadges();
  const { modulos, loading: modulosLoading, isModuleActive } = useModulos();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Mapeamento de rotas para módulos de notificação
  const getModuleFromHref = (href: string): string | null => {
    const moduleMap: Record<string, string> = {
      '/helpdesk': 'helpdesk',
      '/whatsappchat': 'whatsapp',
      '/orcamentos': 'orcamentos',
      '/tasks': 'tarefas',
      '/tasks/dashboard': 'tarefas',
      '/tasks/calendar': 'tarefas',
    };
    return moduleMap[href] || null;
  };

  // Obter badge para um item de navegação
  const getItemBadge = (item: NavigationItem) => {
    const module = getModuleFromHref(item.href);
    if (!module) return undefined;
    
    const badge = getBadgeByModule(module);
    if (!badge || badge.count === 0) return undefined;
    
    return {
      count: badge.count,
      variant: badge.type as any,
      size: 'sm' as const,
      position: 'top-right' as const,
    };
  };

  // Debug logs
  console.log('Sidebar render:', { 
    isAuthenticated, 
    isAdmin, 
    isModuleActive, 
    whatsappLoading,
    modulosLoading,
    pathname 
  });
  
  console.log('=== ESTADO DOS MÓDULOS ===');
  console.log('modulosLoading:', modulosLoading);
  console.log('modulos:', modulos);
  console.log('isModuleActive function:', typeof isModuleActive, isModuleActive);

  if (!isAuthenticated) {
    console.log('Sidebar: usuário não autenticado');
    return null;
  }

  console.log('=== INICIANDO FILTRO DE NAVEGAÇÃO ===');
  console.log('Total de itens de navegação:', navigation.length);
  console.log('Itens de navegação:', navigation.map(item => ({ name: item.name, href: item.href, moduleName: item.moduleName })));

  const filteredNavigation = navigation.filter((item) => {
    console.log(`Verificando item: ${item.name}`, {
      href: item.href,
      moduleName: item.moduleName,
      requireAdmin: item.requireAdmin,
      requiredPermission: item.requiredPermission
    });

    // Se o usuário não está logado, não mostrar nada
    if (!isAuthenticated) {
      console.log(`${item.name}: rejeitado - usuário não autenticado`);
      return false;
    }

    // Dashboard é sempre visível
    if (item.href === '/') {
      console.log(`${item.name}: aceito - é dashboard`);
      return true;
    }
    
    // Verificar se requer admin
    if (item.requireAdmin && !isAdmin) {
      console.log(`${item.name}: rejeitado - requer admin e usuário não é admin`);
      return false;
    }
    
    // Verificar permissão específica
    if (item.requiredPermission) {
      const hasRequiredPermission = hasPermission(item.requiredPermission.recurso, item.requiredPermission.acao);
      if (!hasRequiredPermission) {
        console.log(`${item.name}: rejeitado - sem permissão ${item.requiredPermission.recurso}.${item.requiredPermission.acao}`);
        return false;
      }
      console.log(`${item.name}: permissão ${item.requiredPermission.recurso}.${item.requiredPermission.acao} OK`);
    }

    // Verificar se o módulo está ativo (exceto para dashboard que sempre deve aparecer)
    if (item.moduleName && item.moduleName !== 'dashboard') {
      // Para WhatsApp, usar o hook específico existente
      if (item.moduleName === 'whatsapp-chat') {
        console.log(`${item.name}: WhatsApp module active: ${isWhatsAppActive}`);
        return isWhatsAppActive;
      }
      // Para outros módulos, usar o novo sistema de módulos
      if (!modulosLoading) {
        const moduleActive = isModuleActive(item.moduleName);
        console.log(`${item.name}: módulo ${item.moduleName} ativo: ${moduleActive}`);
        if (!moduleActive) {
          console.log(`${item.name}: rejeitado - módulo ${item.moduleName} não está ativo`);
          return false;
        }
      } else {
        console.log(`${item.name}: aguardando carregamento dos módulos...`);
      }
    }
    
    console.log(`${item.name}: aceito`);
    return true;
  });

  // Filtrar subitens também
  const filteredNavigationWithSubItems = filteredNavigation.map(item => {
    if (item.subItems) {
      const filteredSubItems = item.subItems.filter(subItem => {
        if (subItem.requireAdmin && !isAdmin) return false;
        if (subItem.requiredPermission) {
          if (!hasPermission(subItem.requiredPermission.recurso, subItem.requiredPermission.acao)) {
            return false;
          }
        }
        // Verificar módulo ativo para subitens
        if (subItem.moduleName && subItem.moduleName !== 'dashboard') {
          if (subItem.moduleName === 'whatsapp-chat') {
            return isWhatsAppActive;
          }
          if (!modulosLoading && !isModuleActive(subItem.moduleName)) {
            return false;
          }
        }
        return true;
      });
      return { ...item, subItems: filteredSubItems };
    }
    return item;
  });

  const finalNavigation = filteredNavigationWithSubItems

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
    const badgeProps = getItemBadge(item);

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
              <BadgeWrapper badge={badgeProps}>
                <item.icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isCollapsed ? "" : "mr-3"
                )} />
              </BadgeWrapper>
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
            <BadgeWrapper badge={badgeProps}>
              <item.icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isCollapsed ? "" : "mr-3",
                isSubItem && "h-4 w-4"
              )} />
            </BadgeWrapper>
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
          {finalNavigation.map(item => renderNavigationItem(item))}
        </nav>
      </div>
    </>
  );
}
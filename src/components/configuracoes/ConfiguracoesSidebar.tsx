'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { 
  Settings, 
  MessageSquare, 
  Headphones, 
  Info,
  UserCircle,
  Building2,
  Key,
  Shield,
  Users,
  Webhook,
  KeyRound,
  Activity,
  Building
} from 'lucide-react';

interface ConfigMenuItem {
  name: string;
  href: string;
  icon: any;
  description: string;
  requiredPermission?: {
    recurso: string;
    acao: string;
  };
  requireAdmin?: boolean;
}

const configMenuItems: ConfigMenuItem[] = [
  {
    name: 'Geral',
    href: '/configuracoes/geral',
    icon: Settings,
    description: 'Configurações básicas do sistema',
    requireAdmin: true
  },
  {
    name: 'Empresa',
    href: '/configuracoes/empresa',
    icon: Building,
    description: 'Dados da empresa e informações corporativas',
    requireAdmin: true
  },
  {
    name: 'API WhatsApp',
    href: '/configuracoes/whatsapp-api',
    icon: MessageSquare,
    description: 'Configurações da API WhatsApp',
    requireAdmin: true
  },
  {
    name: 'Logs',
    href: '/configuracoes/logs',
    icon: Activity,
    description: 'Monitoramento e logs do sistema',
    requireAdmin: true
  },
  {
    name: 'Helpdesk',
    href: '/configuracoes/helpdesk',
    icon: Headphones,
    description: 'Departamentos e configurações do Helpdesk',
    requireAdmin: true
  },
  {
    name: 'Colaboradores',
    href: '/configuracoes/colaboradores',
    icon: UserCircle,
    description: 'Gerenciar colaboradores do sistema',
    requiredPermission: { recurso: 'colaboradores', acao: 'ler' }
  },
  {
    name: 'Grupos Hierárquicos',
    href: '/configuracoes/grupos-hierarquicos',
    icon: Building2,
    description: 'Gerenciar grupos hierárquicos',
    requiredPermission: { recurso: 'grupos', acao: 'ler' }
  },
  {
    name: 'Perfis',
    href: '/configuracoes/perfis',
    icon: Key,
    description: 'Gerenciar perfis de usuário',
    requiredPermission: { recurso: 'perfis', acao: 'ler' }
  },
  {
    name: 'Permissões',
    href: '/configuracoes/permissoes',
    icon: Shield,
    description: 'Gerenciar permissões do sistema',
    requiredPermission: { recurso: 'permissoes', acao: 'ler' }
  },
  {
    name: 'Usuários',
    href: '/configuracoes/usuarios',
    icon: Users,
    description: 'Gerenciar usuários do sistema',
    requiredPermission: { recurso: 'usuarios', acao: 'ler' }
  },
  {
    name: 'Webhooks',
    href: '/configuracoes/webhooks',
    icon: Webhook,
    description: 'Gerenciar webhooks do sistema',
    requiredPermission: { recurso: 'webhooks', acao: 'ler' }
  },
  {
    name: 'Chaves de API',
    href: '/configuracoes/chaves-api',
    icon: KeyRound,
    description: 'Gerenciar chaves de API',
    requiredPermission: { recurso: 'api_keys', acao: 'ler' }
  },
  {
    name: 'Sobre',
    href: '/configuracoes/sobre',
    icon: Info,
    description: 'Informações sobre o sistema',
    requireAdmin: true
  }
];

export function ConfiguracoesSidebar() {
  const pathname = usePathname();
  const { hasPermission, isAdmin } = useAuth();

  // Filtrar itens baseado nas permissões do usuário
  const filteredMenuItems = configMenuItems.filter((item) => {
    // Verificar se requer admin
    if (item.requireAdmin && !isAdmin) return false;
    
    // Verificar permissão específica
    if (item.requiredPermission) {
      return hasPermission(item.requiredPermission.recurso, item.requiredPermission.acao);
    }
    
    return true;
  });

  return (
    <div className="w-52 bg-white border-r border-gray-200 h-full">
      <div className="p-4">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Configurações</h2>
        
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-md transition-all duration-200 group',
                  'hover:bg-gray-50',
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-gray-700 hover:text-gray-900'
                )}
              >
                <Icon className={cn(
                  'h-4 w-4 mr-2 flex-shrink-0',
                  isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-700'
                )} />
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    'text-sm font-medium truncate',
                    isActive ? 'text-primary' : 'text-gray-900'
                  )}>
                    {item.name}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
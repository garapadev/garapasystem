'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
  isActive?: boolean;
}

interface BreadcrumbsProps {
  className?: string;
  customItems?: BreadcrumbItem[];
}

// Mapeamento de rotas para labels mais amigáveis
const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  'clientes': 'Clientes',
  'colaboradores': 'Colaboradores',
  'grupos-hierarquicos': 'Grupos Hierárquicos',
  'orcamentos': 'Orçamentos',
  'ordens-servico': 'Ordens de Serviço',
  'negócios': 'Negócios',
  'helpdesk': 'Helpdesk',
  'webmail': 'Webmail',
  'tarefas': 'Tarefas',
  'calendario': 'Calendário',
  'configuracoes': 'Configurações',
  'relatorios': 'Relatórios',
  'novo': 'Novo',
  'editar': 'Editar',
  'detalhes': 'Detalhes',
  'historico': 'Histórico',
  'anexos': 'Anexos',
  'comentarios': 'Comentários'
};

// Rotas que devem ser ignoradas nos breadcrumbs
const ignoredRoutes = ['api', 'auth'];

export function Breadcrumbs({ className, customItems }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Se customItems for fornecido, use-os
  if (customItems) {
    return (
      <nav className={cn('flex items-center space-x-1 text-sm text-gray-600', className)}>
        <Link
          href="/"
          className="flex items-center hover:text-gray-900 transition-colors"
          title="Ir para Dashboard"
        >
          <Home className="h-4 w-4" />
        </Link>
        {customItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4 text-gray-400" />
            {item.isActive ? (
              <span className="font-medium text-gray-900">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-gray-900 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        ))}
      </nav>
    );
  }

  // Gerar breadcrumbs automaticamente baseado na rota
  const pathSegments = pathname.split('/').filter(segment => 
    segment && !ignoredRoutes.includes(segment)
  );

  // Se estiver na página inicial, não mostrar breadcrumbs
  if (pathSegments.length === 0) {
    return null;
  }

  const breadcrumbItems: BreadcrumbItem[] = [];
  let currentPath = '';

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    
    // Tentar obter um label mais amigável
    let label = routeLabels[segment] || segment;
    
    // Se for um ID (número), tentar obter um contexto melhor
    if (/^\d+$/.test(segment)) {
      const previousSegment = pathSegments[index - 1];
      if (previousSegment) {
        label = `${routeLabels[previousSegment] || previousSegment} #${segment}`;
      } else {
        label = `Item #${segment}`;
      }
    }

    // Capitalizar primeira letra se não estiver no mapeamento
    if (!routeLabels[segment] && !/^\d+$/.test(segment)) {
      label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    }

    breadcrumbItems.push({
      label,
      href: currentPath,
      isActive: isLast
    });
  });

  return (
    <nav 
      className={cn('flex items-center space-x-1 text-sm text-gray-600', className)}
      aria-label="Breadcrumb"
    >
      <Link
        href="/"
        className="flex items-center hover:text-gray-900 transition-colors"
        title="Ir para Dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      {breadcrumbItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.isActive ? (
            <span 
              className="font-medium text-gray-900"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}

// Hook para facilitar o uso de breadcrumbs customizados
export function useBreadcrumbs() {
  const pathname = usePathname();

  const setBreadcrumbs = (items: BreadcrumbItem[]) => {
    // Esta função pode ser expandida para gerenciar estado global
    // Por enquanto, retorna os items para uso direto no componente
    return items;
  };

  const addBreadcrumb = (item: BreadcrumbItem) => {
    // Função para adicionar um breadcrumb dinamicamente
    return item;
  };

  return {
    pathname,
    setBreadcrumbs,
    addBreadcrumb
  };
}
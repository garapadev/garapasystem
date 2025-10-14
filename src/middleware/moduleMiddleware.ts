import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db as prisma } from '@/lib/db';

// Mapeamento de rotas para módulos
const ROUTE_MODULE_MAP: Record<string, string> = {
  '/webmail': 'webmail',
  '/helpdesk': 'helpdesk',
  '/whatsappchat': 'whatsapp-chat',
  '/tasks': 'tarefas',
  '/clientes': 'clientes',
  '/orcamentos': 'orcamentos',
  '/ordens-servico': 'ordens-servico',
  '/financeiro': 'financeiro',
  '/configuracoes': 'configuracoes',
  '/admin': 'admin',
};

// Rotas que sempre devem estar disponíveis (não dependem de módulos)
const ALWAYS_AVAILABLE_ROUTES = [
  '/',
  '/api',
  '/auth',
  '/login',
  '/logout',
  '/configuracoes/modulos', // Página de configuração de módulos sempre disponível
];

/**
 * Verifica se uma rota está sempre disponível
 */
function isAlwaysAvailableRoute(pathname: string): boolean {
  return ALWAYS_AVAILABLE_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

/**
 * Obtém o nome do módulo baseado na rota
 */
function getModuleNameFromRoute(pathname: string): string | null {
  // Verificar correspondência exata primeiro
  if (ROUTE_MODULE_MAP[pathname]) {
    return ROUTE_MODULE_MAP[pathname];
  }

  // Verificar correspondência por prefixo
  for (const [route, moduleName] of Object.entries(ROUTE_MODULE_MAP)) {
    if (pathname.startsWith(route + '/')) {
      return moduleName;
    }
  }

  return null;
}

/**
 * Verifica se um módulo está ativo
 */
async function isModuleActive(moduleName: string): Promise<boolean> {
  try {
    const modulo = await prisma.moduloSistema.findFirst({
      where: {
        nome: moduleName,
        ativo: true,
      },
    });

    return !!modulo;
  } catch (error) {
    console.error('Erro ao verificar módulo ativo:', error);
    return false;
  }
}

/**
 * Middleware para verificar módulos ativos
 */
export async function moduleMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Pular verificação para rotas sempre disponíveis
  if (isAlwaysAvailableRoute(pathname)) {
    return null; // Continuar para o próximo middleware
  }

  // Pular verificação para APIs (exceto algumas específicas)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/modulos/')) {
    return null;
  }

  // Verificar se o usuário está autenticado
  const session = await getServerSession(authOptions);
  if (!session) {
    return null; // Deixar o middleware de auth lidar com isso
  }

  // Obter o nome do módulo da rota
  const moduleName = getModuleNameFromRoute(pathname);
  if (!moduleName) {
    return null; // Rota não mapeada para módulo, permitir acesso
  }

  // Verificar se o módulo está ativo
  const moduleIsActive = await isModuleActive(moduleName);
  if (!moduleIsActive) {
    // Redirecionar para página de erro ou dashboard
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('error', 'module_inactive');
    url.searchParams.set('module', moduleName);
    
    return NextResponse.redirect(url);
  }

  return null; // Módulo ativo, continuar
}

/**
 * Função utilitária para verificar módulo ativo (para uso em componentes server-side)
 */
export async function checkModuleActive(moduleName: string): Promise<boolean> {
  return await isModuleActive(moduleName);
}

/**
 * Função para obter todos os módulos ativos
 */
export async function getActiveModules(): Promise<Array<{ nome: string; titulo: string; ativo: boolean }>> {
  try {
    const modulos = await prisma.moduloSistema.findMany({
      where: {
        ativo: true,
      },
      select: {
        nome: true,
        titulo: true,
        ativo: true,
      },
      orderBy: {
        ordem: 'asc',
      },
    });

    return modulos;
  } catch (error) {
    console.error('Erro ao buscar módulos ativos:', error);
    return [];
  }
}
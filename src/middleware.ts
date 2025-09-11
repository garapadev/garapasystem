import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Verificar se o usuário tem permissão para acessar a rota
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Rotas públicas que não precisam de autenticação
    const publicRoutes = ['/auth/login', '/auth/error', '/api/auth', '/swagger', '/api/docs']
    
    // Rotas de API que não precisam de autenticação (não usam ApiMiddleware)
    const publicApiRoutes = ['/api/clientes', '/api/negocios', '/api/webhooks', '/api/grupos-hierarquicos', '/api/configuracoes', '/api/helpdesk/tickets/stats', '/api/helpdesk/tickets']
    
    // Se é uma rota pública, permitir acesso
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }
    
    // Se é uma rota de API pública, permitir acesso
    if (publicApiRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Se não há token e não é rota pública ou de API, redirecionar para login
    if (!token && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
    
    // Se é uma rota de API sem token, permitir acesso (será validado pelo ApiMiddleware)
    if (!token && pathname.startsWith('/api/')) {
      return NextResponse.next()
    }

    // Se há token e é uma rota da API (exceto /api/auth), permitir acesso
    if (token && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      return NextResponse.next()
    }

    // Verificar permissões específicas baseadas na rota
    const colaborador = token?.colaborador
    
    // Se o usuário não tem colaborador associado, negar acesso a rotas administrativas
    if (!colaborador && pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/auth/error?error=AccessDenied', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Permitir acesso a rotas públicas
        const publicRoutes = ['/auth/login', '/auth/error', '/api/auth']
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Permitir acesso a rotas de API públicas
        const publicApiRoutes = ['/api/clientes', '/api/negocios', '/api/api-keys', '/api/webhooks', '/api/grupos-hierarquicos', '/api/configuracoes', '/api/helpdesk/tickets/stats', '/api/helpdesk/tickets']
        if (publicApiRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // Para outras rotas, verificar se há token
        return !!token
      }
    }
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|api/docs|swagger|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    // Verificar se o usuário tem permissão para acessar a rota
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Rotas públicas que não precisam de autenticação
    const publicRoutes = ['/auth/login', '/auth/error', '/api/auth']
    
    // Se é uma rota pública, permitir acesso
    if (publicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }

    // Se não há token e não é rota pública, redirecionar para login
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
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
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
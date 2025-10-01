import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Páginas públicas que não precisam de autenticação
  const publicPages = ['/auth/login', '/auth/register', '/auth/error']
  const isPublicPage = publicPages.some(page => pathname.startsWith(page))
  
  // Páginas de API que não precisam de verificação de autenticação
  const apiAuthPages = ['/api/auth']
  const isApiAuthPage = apiAuthPages.some(page => pathname.startsWith(page))
  
  // Recursos estáticos
  const isStaticResource = pathname.startsWith('/_next') || 
                          pathname.startsWith('/favicon.ico') ||
                          pathname.startsWith('/public')
  
  // Se é uma página pública, recurso estático ou API de auth, continuar
  if (isPublicPage || isApiAuthPage || isStaticResource) {
    const response = NextResponse.next()
    addSecurityHeaders(response)
    return response
  }
  
  // Verificar se o usuário está autenticado
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // Validação mais rigorosa do token
  const isValidToken = token && 
                      token.id && 
                      token.email && 
                      typeof token.exp === 'number' && 
                      token.exp > Date.now() / 1000
  
  // Se não está autenticado e não está em página pública, redirecionar para login
  if (!isValidToken && !isPublicPage) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    const response = NextResponse.redirect(loginUrl)
    
    // Limpar cookies de sessão inválidos
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.session-token')
    response.cookies.delete('next-auth.csrf-token')
    response.cookies.delete('__Host-next-auth.csrf-token')
    
    return response
  }
  
  // Se está autenticado e tentando acessar página de login, redirecionar para home
  if (isValidToken && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Continuar com a requisição e adicionar headers de segurança
  const response = NextResponse.next()
  addSecurityHeaders(response)
  return response
}

function addSecurityHeaders(response: NextResponse) {
  // Headers de segurança
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // CSP básico para prevenir XSS
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  )
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
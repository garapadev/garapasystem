import { NextRequest, NextResponse } from 'next/server';
import { moduleMiddleware } from '@/middleware/moduleMiddleware';

export async function middleware(request: NextRequest) {
  // Executar middleware de módulos
  const moduleResponse = await moduleMiddleware(request);
  if (moduleResponse) {
    return moduleResponse;
  }

  // Se chegou até aqui, continuar com a requisição normal
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
import { signOut } from 'next-auth/react'

export interface LogoutOptions {
  callbackUrl?: string
  redirect?: boolean
}

/**
 * Função utilitária para logout completo
 * Limpa todas as informações de sessão e redireciona o usuário
 */
export async function performLogout(options: LogoutOptions = {}) {
  const { callbackUrl = '/auth/login', redirect = true } = options

  try {
    // Limpar localStorage e sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      
      // Limpar cookies manualmente (fallback)
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname
      })
    }

    // Usar o signOut do NextAuth
    await signOut({
      callbackUrl,
      redirect
    })
  } catch (error) {
    console.error('Erro durante logout:', error)
    
    // Fallback: redirecionar manualmente se o signOut falhar
    if (typeof window !== 'undefined' && redirect) {
      window.location.href = callbackUrl
    }
  }
}

/**
 * Função para verificar se o usuário está realmente deslogado
 * Útil para validações adicionais
 */
export function isUserLoggedOut(): boolean {
  if (typeof window === 'undefined') return true
  
  // Verificar se não há tokens no localStorage
  const hasLocalStorageTokens = Object.keys(localStorage).some(key => 
    key.includes('token') || key.includes('auth') || key.includes('session')
  )
  
  // Verificar se não há cookies de sessão
  const hasSessionCookies = document.cookie.includes('next-auth') || 
                           document.cookie.includes('session')
  
  return !hasLocalStorageTokens && !hasSessionCookies
}
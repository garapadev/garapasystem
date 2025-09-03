import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      colaborador?: {
        id: string
        nome: string
        email: string
        cargo?: string | null
        perfil?: {
          id: string
          nome: string
          descricao?: string | null
          permissoes: {
            permissao: {
              id: string
              nome: string
              recurso: string
              acao: string
            }
          }[]
        } | null
        grupoHierarquico?: {
          id: string
          nome: string
          descricao?: string | null
        } | null
      } | null
    }
  }

  interface User {
    id: string
    email: string
    name: string
    colaborador?: {
      id: string
      nome: string
      email: string
      cargo?: string | null
      perfil?: {
        id: string
        nome: string
        descricao?: string | null
        permissoes: {
          permissao: {
            id: string
            nome: string
            recurso: string
            acao: string
          }
        }[]
      } | null
      grupoHierarquico?: {
        id: string
        nome: string
        descricao?: string | null
      } | null
    } | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    colaborador?: {
      id: string
      nome: string
      email: string
      cargo?: string | null
      perfil?: {
        id: string
        nome: string
        descricao?: string | null
        permissoes: {
          permissao: {
            id: string
            nome: string
            recurso: string
            acao: string
          }
        }[]
      } | null
      grupoHierarquico?: {
        id: string
        nome: string
        descricao?: string | null
      } | null
    } | null
  }
}
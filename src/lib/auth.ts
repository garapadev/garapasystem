import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Trust the incoming host header to avoid 403 due to host mismatch
  trustHost: true,
  debug: false,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.warn('[auth] authorize: missing email or password')
          return null
        }

        // Buscar usuário com carga mínima necessária para reduzir tamanho do JWT/cookie
        const usuario = await db.usuario.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            colaborador: {
              include: {
                perfil: {
                  select: {
                    id: true,
                    nome: true
                  }
                },
                grupoHierarquico: {
                  select: {
                    id: true,
                    nome: true
                  }
                }
              }
            }
          }
        })

        if (!usuario) {
          console.warn('[auth] authorize: user not found for', credentials.email)
          return null
        }

        if (!usuario.ativo) {
          console.warn('[auth] authorize: user inactive', credentials.email)
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          usuario.senha
        )

        if (!isPasswordValid) {
          console.warn('[auth] authorize: invalid password for', credentials.email)
          return null
        }

        // Montar objeto compacto para armazenar no token
        const compactColaborador = usuario.colaborador ? {
          id: usuario.colaborador.id,
          nome: usuario.colaborador.nome,
          perfil: usuario.colaborador.perfil ? {
            id: usuario.colaborador.perfil.id,
            nome: usuario.colaborador.perfil.nome
          } : null,
          grupoHierarquico: usuario.colaborador.grupoHierarquico ? {
            id: usuario.colaborador.grupoHierarquico.id,
            nome: usuario.colaborador.grupoHierarquico.nome
          } : null
        } : null

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          colaborador: compactColaborador
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Armazenar apenas dados compactos do colaborador para evitar exceder limite de header
        token.colaborador = user.colaborador
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id
      }
      if (token.colaborador) {
        session.user.colaborador = token.colaborador
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
    signOut: '/auth/login'
  },
  events: {
    async signOut() {
      // Log do logout para auditoria
      console.log('Usuário fez logout')
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}

export { authOptions as default }
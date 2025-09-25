import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const usuario = await db.usuario.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            colaborador: {
              include: {
                perfil: {
                  include: {
                    permissoes: {
                      include: {
                        permissao: true
                      }
                    }
                  }
                },
                grupoHierarquico: true
              }
            }
          }
        })

        if (!usuario || !usuario.ativo) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          usuario.senha
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          colaborador: usuario.colaborador
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
    error: '/auth/error'
  },
  secret: process.env.NEXTAUTH_SECRET
}

export { authOptions as default }
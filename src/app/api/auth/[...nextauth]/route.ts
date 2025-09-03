import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

const handler = NextAuth({
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

        try {
          const user = await db.usuario.findUnique({
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

          if (!user || !user.ativo) {
            return null
          }

          // Verificar senha (em produção, usar bcrypt.compare)
          const isPasswordValid = await bcrypt.compare(credentials.password, user.senha)
          
          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.nome,
            colaborador: user.colaborador
          }
        } catch (error) {
          console.error('Erro na autenticação:', error)
          return null
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
        token.colaborador = user.colaborador
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string
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
})

export { handler as GET, handler as POST }
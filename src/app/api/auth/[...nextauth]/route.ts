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
        console.log('🔐 Tentativa de login:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciais ausentes')
          return null
        }

        try {
          console.log('🔍 Buscando usuário no banco...')
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

          console.log('👤 Usuário encontrado:', user ? 'Sim' : 'Não')
          console.log('✅ Usuário ativo:', user?.ativo)

          if (!user || !user.ativo) {
            console.log('❌ Usuário não encontrado ou inativo')
            return null
          }

          // Verificar senha (em produção, usar bcrypt.compare)
          console.log('🔑 Verificando senha...')
          const isPasswordValid = await bcrypt.compare(credentials.password, user.senha)
          console.log('🔑 Senha válida:', isPasswordValid)
          
          if (!isPasswordValid) {
            console.log('❌ Senha inválida')
            return null
          }

          console.log('✅ Login bem-sucedido para:', user.email)
          return {
            id: user.id,
            email: user.email,
            name: user.nome,
            colaborador: user.colaborador
          }
        } catch (error) {
          console.error('💥 Erro na autenticação:', error)
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
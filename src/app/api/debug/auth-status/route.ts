import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({
        authenticated: false,
        error: 'Usuário não autenticado'
      })
    }

    // Buscar colaborador e configuração de email
    const colaborador = await db.colaborador.findUnique({
      where: { email: session.user.email },
      include: {
        emailConfig: true
      }
    })

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.user.email,
        name: session.user.name
      },
      colaborador: colaborador ? {
        id: colaborador.id,
        nome: colaborador.nome,
        email: colaborador.email
      } : null,
      emailConfig: colaborador?.emailConfig ? {
        id: colaborador.emailConfig.id,
        email: colaborador.emailConfig.email,
        imapHost: colaborador.emailConfig.imapHost,
        smtpHost: colaborador.emailConfig.smtpHost,
        ativo: colaborador.emailConfig.ativo
      } : null
    })

  } catch (error) {
    console.error('Erro ao verificar status de autenticação:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
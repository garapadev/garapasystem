import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import authOptions from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const usuario = await db.usuario.findUnique({
      where: { id: session.user.id },
      include: {
        colaborador: {
          include: {
            perfil: {
              include: {
                permissoes: {
                  include: {
                    permissao: {
                      select: { id: true, nome: true, recurso: true, acao: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const basePermissions = usuario.colaborador?.perfil?.permissoes
      ? usuario.colaborador.perfil.permissoes.map(p => p.permissao)
      : []

    const permissions = [...basePermissions]

    // Garante permissão de administrador se usuário for admin
    if ((usuario as any).admin === true && !permissions.some(p => p.recurso === 'sistema' && p.acao === 'administrar')) {
      permissions.push({ id: 'admin', nome: 'administrador', recurso: 'sistema', acao: 'administrar' })
    }

    return NextResponse.json({
      permissions,
      isAdmin: (usuario as any).admin === true
    })
  } catch (error) {
    console.error('GET /api/auth/permissions error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
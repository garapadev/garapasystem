import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

async function seed() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
    }

    const email = 'admin@local.test'
    const password = 'admin123'

    const senha = await bcrypt.hash(password, 10)

    const usuario = await db.usuario.upsert({
      where: { email },
      update: {
        senha,
        ativo: true,
        admin: true,
        nome: 'Admin Dev'
      },
      create: {
        email,
        senha,
        ativo: true,
        admin: true,
        nome: 'Admin Dev'
      }
    })

    return NextResponse.json({
      ok: true,
      message: 'Usuário admin de desenvolvimento disponível.',
      credentials: { email, password },
      usuario: { id: usuario.id, email: usuario.email, admin: (usuario as any).admin === true }
    })
  } catch (error) {
    console.error('seed-admin error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST() {
  return seed()
}

export async function GET() {
  return seed()
}
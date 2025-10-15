import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Not allowed in production')
    process.exit(1)
  }

  const email = 'admin@local.test'
  const password = 'admin123'
  const nome = 'Admin Demo Colaborador'

  // Upsert collaborator by email
  const colaborador = await prisma.colaborador.upsert({
    where: { email },
    update: {
      nome,
      ativo: true,
    },
    create: {
      email,
      nome,
      ativo: true,
    },
  })

  const senha = await bcrypt.hash(password, 10)

  // Upsert user and link to collaborator
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: {
      senha,
      ativo: true,
      nome,
      colaboradorId: colaborador.id,
    },
    create: {
      email,
      senha,
      ativo: true,
      nome,
      colaboradorId: colaborador.id,
    },
  })

  console.log(
    JSON.stringify(
      {
        ok: true,
        colaborador: { id: colaborador.id, email: colaborador.email },
        usuario: { id: usuario.id, email: usuario.email },
        credentials: { email, password },
      },
      null,
      2,
    ),
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
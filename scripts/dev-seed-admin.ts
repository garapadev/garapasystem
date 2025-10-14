import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Not allowed in production')
    process.exit(1)
  }
  const email = 'admin@local.test'
  const password = 'admin123'
  const senha = await bcrypt.hash(password, 10)
  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { senha, ativo: true, nome: 'Admin Dev' },
    create: { email, senha, ativo: true, nome: 'Admin Dev' },
  })
  console.log(JSON.stringify({
    ok: true,
    usuario: { id: usuario.id, email: usuario.email },
    credentials: { email, password }
  }, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
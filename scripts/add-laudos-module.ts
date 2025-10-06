import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addLaudosModule() {
  console.log('🔧 Adicionando módulo de Laudos Técnicos...')

  try {
    // Verificar se o módulo já existe
    const existingModule = await prisma.moduloSistema.findUnique({
      where: { nome: 'laudos-tecnicos' }
    })

    if (existingModule) {
      console.log('📋 Módulo de Laudos Técnicos já existe!')
      return
    }

    // Criar o módulo de laudos técnicos
    const laudosModule = await prisma.moduloSistema.create({
      data: {
        nome: 'laudos-tecnicos',
        titulo: 'Laudos Técnicos',
        descricao: 'Sistema de gerenciamento de laudos técnicos para ordens de serviço',
        ativo: true,
        core: false,
        icone: 'FileCheck',
        ordem: 6, // Posicionar após ordens de serviço
        permissao: 'laudos.ler',
        rota: '/laudos-tecnicos',
        categoria: 'OPERACIONAL'
      }
    })

    console.log('✅ Módulo de Laudos Técnicos criado com sucesso!')
    console.log(`📋 ID: ${laudosModule.id}`)
    console.log(`📋 Nome: ${laudosModule.nome}`)
    console.log(`📋 Título: ${laudosModule.titulo}`)

  } catch (error) {
    console.error('❌ Erro ao criar módulo de Laudos Técnicos:', error)
    throw error
  }
}

addLaudosModule()
  .catch((e) => {
    console.error('❌ Erro durante a execução:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
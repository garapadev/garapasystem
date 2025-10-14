import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function registerNewModules() {
  console.log('🔧 Registrando novos módulos no sistema...')

  const newModules = [
    {
      nome: 'compras',
      titulo: 'Compras',
      rota: '/compras',
      icone: 'ShoppingCart',
      descricao: 'Gestão de solicitações e pedidos de compra',
      ativo: true,
      core: false,
      categoria: 'operacional',
      ordem: 60,
      permissao: 'compras.ler'
    },
    {
      nome: 'estoque',
      titulo: 'Estoque',
      rota: '/estoque',
      icone: 'Package',
      descricao: 'Controle de estoque e movimentações',
      ativo: true,
      core: false,
      categoria: 'operacional',
      ordem: 61,
      permissao: 'estoque.ler'
    },
    {
      nome: 'tombamento',
      titulo: 'Tombamento',
      rota: '/tombamento',
      icone: 'Archive',
      descricao: 'Gestão de patrimônio e ativos',
      ativo: true,
      core: false,
      categoria: 'operacional',
      ordem: 62,
      permissao: 'tombamento.ler'
    },
    {
      nome: 'financeiro',
      titulo: 'Financeiro',
      rota: '/financeiro',
      icone: 'DollarSign',
      descricao: 'Gestão financeira: contas, fluxo e relatórios',
      ativo: true,
      core: false,
      categoria: 'financeiro',
      ordem: 55,
      permissao: 'financeiro_ler'
    }
  ]

  for (const moduleData of newModules) {
    try {
      const existingModule = await prisma.moduloSistema.findFirst({
        where: { rota: moduleData.rota }
      })

      if (existingModule) {
        console.log(`⚠️  Módulo ${moduleData.titulo} já existe, atualizando...`)
        await prisma.moduloSistema.update({
          where: { id: existingModule.id },
          data: moduleData
        })
        console.log(`✅ Módulo ${moduleData.titulo} atualizado!`)
      } else {
        await prisma.moduloSistema.create({
          data: moduleData
        })
        console.log(`✅ Módulo ${moduleData.titulo} criado!`)
      }
    } catch (error) {
      console.error(`❌ Erro ao processar módulo ${moduleData.titulo}:`, error)
    }
  }

  console.log('🎉 Registro de módulos concluído!')
}

registerNewModules()
  .catch((e) => {
    console.error('❌ Erro durante o registro dos módulos:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
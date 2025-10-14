const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Criando módulos faltantes...')
  
  const modulosParaCriar = [
    {
      nome: 'compras',
      titulo: 'Compras',
      descricao: 'Módulo de gestão de compras e fornecedores',
      icone: 'ShoppingCart',
      rota: '/compras',
      ordem: 13,
      ativo: true,
      versaoMinima: '0.3.38.23'
    },
    {
      nome: 'estoque',
      titulo: 'Estoque',
      descricao: 'Módulo de controle de estoque e movimentações',
      icone: 'Package',
      rota: '/estoque',
      ordem: 14,
      ativo: true,
      versaoMinima: '0.3.38.23'
    },
    {
      nome: 'tombamento',
      titulo: 'Tombamento',
      descricao: 'Módulo de tombamento de bens patrimoniais',
      icone: 'Archive',
      rota: '/tombamento',
      ordem: 15,
      ativo: true,
      versaoMinima: '0.3.38.23'
    }
  ]

  for (const modulo of modulosParaCriar) {
    try {
      const moduloExistente = await prisma.moduloSistema.findUnique({
        where: { nome: modulo.nome }
      })
      
      if (!moduloExistente) {
        await prisma.moduloSistema.create({
          data: modulo
        })
        console.log(`✅ Módulo ${modulo.nome} criado com sucesso!`)
      } else {
        console.log(`📦 Módulo ${modulo.nome} já existe`)
      }
    } catch (error) {
      console.error(`❌ Erro ao criar módulo ${modulo.nome}:`, error)
    }
  }

  // Verificar total de módulos
  const totalModulos = await prisma.moduloSistema.count()
  console.log(`📊 Total de módulos: ${totalModulos}`)
  
  console.log('✅ Processo concluído!')
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
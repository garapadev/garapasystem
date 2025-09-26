const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkPermissions() {
  try {
    console.log('🔍 Verificando permissões criadas no banco de dados...\n')
    
    // Buscar todas as permissões agrupadas por recurso
    const permissoes = await prisma.permissao.findMany({
      orderBy: [
        { recurso: 'asc' },
        { acao: 'asc' }
      ]
    })
    
    // Agrupar por recurso
    const permissoesPorRecurso = permissoes.reduce((acc, perm) => {
      if (!acc[perm.recurso]) {
        acc[perm.recurso] = []
      }
      acc[perm.recurso].push(perm)
      return acc
    }, {})
    
    console.log(`📊 Total de permissões encontradas: ${permissoes.length}\n`)
    
    // Exibir permissões por recurso
    Object.keys(permissoesPorRecurso).forEach(recurso => {
      console.log(`🔐 ${recurso.toUpperCase()}:`)
      permissoesPorRecurso[recurso].forEach(perm => {
        console.log(`   ✅ ${perm.nome} - ${perm.descricao}`)
      })
      console.log('')
    })
    
    // Verificar recursos esperados
    const recursosEsperados = [
      'dashboard',
      'clientes', 
      'colaboradores',
      'grupos',
      'perfis',
      'permissoes',
      'usuarios',
      'ordens_servico',
      'orcamentos',
      'webmail',
      'sistema'
    ]
    
    const recursosEncontrados = Object.keys(permissoesPorRecurso)
    const recursosFaltando = recursosEsperados.filter(r => !recursosEncontrados.includes(r))
    
    if (recursosFaltando.length === 0) {
      console.log('✅ Todos os recursos esperados foram encontrados!')
    } else {
      console.log('❌ Recursos faltando:', recursosFaltando)
    }
    
    // Verificar se há usuário administrador
    const adminUser = await prisma.usuario.findFirst({
      where: {
        colaborador: {
          email: 'admin@garapasystem.com'
        }
      },
      include: {
        colaborador: {
          include: {
            perfil: {
              include: {
                permissoes: true
              }
            }
          }
        }
      }
    })
    
    if (adminUser) {
      console.log(`\n👤 Usuário administrador encontrado:`)
      console.log(`   Email: ${adminUser.colaborador.email}`)
      console.log(`   Perfil: ${adminUser.colaborador.perfil?.nome || 'Não definido'}`)
      console.log(`   Permissões: ${adminUser.colaborador.perfil?.permissoes?.length || 0}`)
    } else {
      console.log('\n❌ Usuário administrador não encontrado!')
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkPermissions()
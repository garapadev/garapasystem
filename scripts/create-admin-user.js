const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdminUser() {
  try {
    console.log('🚀 Criando usuário administrador...')

    // 1. Criar permissões básicas do sistema
    const permissoes = [
      // Clientes
      { nome: 'Criar Cliente', recurso: 'clientes', acao: 'criar', descricao: 'Permite criar novos clientes' },
      { nome: 'Ler Cliente', recurso: 'clientes', acao: 'ler', descricao: 'Permite visualizar clientes' },
      { nome: 'Editar Cliente', recurso: 'clientes', acao: 'editar', descricao: 'Permite editar clientes' },
      { nome: 'Excluir Cliente', recurso: 'clientes', acao: 'excluir', descricao: 'Permite excluir clientes' },
      
      // Colaboradores
      { nome: 'Criar Colaborador', recurso: 'colaboradores', acao: 'criar', descricao: 'Permite criar novos colaboradores' },
      { nome: 'Ler Colaborador', recurso: 'colaboradores', acao: 'ler', descricao: 'Permite visualizar colaboradores' },
      { nome: 'Editar Colaborador', recurso: 'colaboradores', acao: 'editar', descricao: 'Permite editar colaboradores' },
      { nome: 'Excluir Colaborador', recurso: 'colaboradores', acao: 'excluir', descricao: 'Permite excluir colaboradores' },
      
      // Grupos Hierárquicos
      { nome: 'Criar Grupo', recurso: 'grupos', acao: 'criar', descricao: 'Permite criar novos grupos hierárquicos' },
      { nome: 'Ler Grupo', recurso: 'grupos', acao: 'ler', descricao: 'Permite visualizar grupos hierárquicos' },
      { nome: 'Editar Grupo', recurso: 'grupos', acao: 'editar', descricao: 'Permite editar grupos hierárquicos' },
      { nome: 'Excluir Grupo', recurso: 'grupos', acao: 'excluir', descricao: 'Permite excluir grupos hierárquicos' },
      
      // Perfis
      { nome: 'Criar Perfil', recurso: 'perfis', acao: 'criar', descricao: 'Permite criar novos perfis' },
      { nome: 'Ler Perfil', recurso: 'perfis', acao: 'ler', descricao: 'Permite visualizar perfis' },
      { nome: 'Editar Perfil', recurso: 'perfis', acao: 'editar', descricao: 'Permite editar perfis' },
      { nome: 'Excluir Perfil', recurso: 'perfis', acao: 'excluir', descricao: 'Permite excluir perfis' },
      
      // Permissões
      { nome: 'Criar Permissão', recurso: 'permissoes', acao: 'criar', descricao: 'Permite criar novas permissões' },
      { nome: 'Ler Permissão', recurso: 'permissoes', acao: 'ler', descricao: 'Permite visualizar permissões' },
      { nome: 'Editar Permissão', recurso: 'permissoes', acao: 'editar', descricao: 'Permite editar permissões' },
      { nome: 'Excluir Permissão', recurso: 'permissoes', acao: 'excluir', descricao: 'Permite excluir permissões' },
      
      // Usuários
      { nome: 'Criar Usuário', recurso: 'usuarios', acao: 'criar', descricao: 'Permite criar novos usuários' },
      { nome: 'Ler Usuário', recurso: 'usuarios', acao: 'ler', descricao: 'Permite visualizar usuários' },
      { nome: 'Editar Usuário', recurso: 'usuarios', acao: 'editar', descricao: 'Permite editar usuários' },
      { nome: 'Excluir Usuário', recurso: 'usuarios', acao: 'excluir', descricao: 'Permite excluir usuários' },
      
      // Sistema
      { nome: 'Administrar Sistema', recurso: 'sistema', acao: 'administrar', descricao: 'Acesso total ao sistema' },
    ]

    console.log('📝 Criando permissões...')
    const permissoesCriadas = []
    
    for (const permissao of permissoes) {
      const existingPermissao = await prisma.permissao.findFirst({
        where: {
          recurso: permissao.recurso,
          acao: permissao.acao
        }
      })
      
      if (!existingPermissao) {
        const novaPermissao = await prisma.permissao.create({
          data: permissao
        })
        permissoesCriadas.push(novaPermissao)
        console.log(`✅ Permissão criada: ${permissao.nome}`)
      } else {
        permissoesCriadas.push(existingPermissao)
        console.log(`⚠️  Permissão já existe: ${permissao.nome}`)
      }
    }

    // 2. Criar perfil de Administrador
    console.log('👑 Criando perfil de Administrador...')
    let perfilAdmin = await prisma.perfil.findUnique({
      where: { nome: 'Administrador' }
    })

    if (!perfilAdmin) {
      perfilAdmin = await prisma.perfil.create({
        data: {
          nome: 'Administrador',
          descricao: 'Perfil com acesso total ao sistema',
          ativo: true
        }
      })
      console.log('✅ Perfil Administrador criado')
    } else {
      console.log('⚠️  Perfil Administrador já existe')
    }

    // 3. Associar todas as permissões ao perfil de Administrador
    console.log('🔗 Associando permissões ao perfil Administrador...')
    
    // Remover associações existentes
    await prisma.perfilPermissao.deleteMany({
      where: { perfilId: perfilAdmin.id }
    })

    // Criar novas associações
    for (const permissao of permissoesCriadas) {
      await prisma.perfilPermissao.create({
        data: {
          perfilId: perfilAdmin.id,
          permissaoId: permissao.id
        }
      })
    }
    console.log(`✅ ${permissoesCriadas.length} permissões associadas ao perfil Administrador`)

    // 4. Criar grupo hierárquico principal
    console.log('🏢 Criando grupo hierárquico principal...')
    let grupoAdmin = await prisma.grupoHierarquico.findFirst({
      where: { nome: 'Administração' }
    })

    if (!grupoAdmin) {
      grupoAdmin = await prisma.grupoHierarquico.create({
        data: {
          nome: 'Administração',
          descricao: 'Grupo administrativo principal',
          ativo: true
        }
      })
      console.log('✅ Grupo Administração criado')
    } else {
      console.log('⚠️  Grupo Administração já existe')
    }

    // 5. Criar colaborador administrador
    console.log('👤 Criando colaborador administrador...')
    let colaboradorAdmin = await prisma.colaborador.findUnique({
      where: { email: 'admin@sistema.com' }
    })

    if (!colaboradorAdmin) {
      colaboradorAdmin = await prisma.colaborador.create({
        data: {
          nome: 'Administrador do Sistema',
          email: 'admin@sistema.com',
          telefone: '(11) 99999-9999',
          documento: '000.000.000-00',
          cargo: 'Administrador',
          dataAdmissao: new Date(),
          ativo: true,
          perfilId: perfilAdmin.id,
          grupoHierarquicoId: grupoAdmin.id
        }
      })
      console.log('✅ Colaborador administrador criado')
    } else {
      console.log('⚠️  Colaborador administrador já existe')
    }

    // 6. Criar usuário administrador
    console.log('🔐 Criando usuário administrador...')
    let usuarioAdmin = await prisma.usuario.findUnique({
      where: { email: 'admin@sistema.com' }
    })

    if (!usuarioAdmin) {
      const senhaHash = await bcrypt.hash('admin123', 10)
      
      usuarioAdmin = await prisma.usuario.create({
        data: {
          email: 'admin@sistema.com',
          senha: senhaHash,
          nome: 'Administrador',
          ativo: true,
          colaboradorId: colaboradorAdmin.id
        }
      })
      console.log('✅ Usuário administrador criado')
      console.log('📧 Email: admin@sistema.com')
      console.log('🔑 Senha: admin123')
    } else {
      console.log('⚠️  Usuário administrador já existe')
    }

    console.log('\n🎉 Usuário administrador configurado com sucesso!')
    console.log('\n📋 Resumo:')
    console.log(`   • ${permissoesCriadas.length} permissões criadas/verificadas`)
    console.log(`   • Perfil: ${perfilAdmin.nome}`)
    console.log(`   • Grupo: ${grupoAdmin.nome}`)
    console.log(`   • Colaborador: ${colaboradorAdmin.nome}`)
    console.log(`   • Usuário: ${usuarioAdmin.email}`)
    console.log('\n🚀 Agora você pode fazer login no sistema!')

  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdminUser()
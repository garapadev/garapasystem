import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar permissões básicas
  console.log('📋 Criando permissões...')
  const permissoes = await Promise.all([
    // Dashboard
    prisma.permissao.upsert({
      where: { nome: 'dashboard_ler' },
      update: {},
      create: {
        nome: 'dashboard_ler',
        descricao: 'Visualizar dashboard',
        recurso: 'dashboard',
        acao: 'ler'
      }
    }),
    // Clientes
    prisma.permissao.upsert({
      where: { nome: 'clientes_ler' },
      update: {},
      create: {
        nome: 'clientes_ler',
        descricao: 'Visualizar clientes',
        recurso: 'clientes',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'clientes_criar' },
      update: {},
      create: {
        nome: 'clientes_criar',
        descricao: 'Criar clientes',
        recurso: 'clientes',
        acao: 'criar'
      }
    }),
    // Colaboradores
    prisma.permissao.upsert({
      where: { nome: 'colaboradores_ler' },
      update: {},
      create: {
        nome: 'colaboradores_ler',
        descricao: 'Visualizar colaboradores',
        recurso: 'colaboradores',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'colaboradores_criar' },
      update: {},
      create: {
        nome: 'colaboradores_criar',
        descricao: 'Criar colaboradores',
        recurso: 'colaboradores',
        acao: 'criar'
      }
    }),
    // Grupos
    prisma.permissao.upsert({
      where: { nome: 'grupos_ler' },
      update: {},
      create: {
        nome: 'grupos_ler',
        descricao: 'Visualizar grupos hierárquicos',
        recurso: 'grupos',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'grupos_criar' },
      update: {},
      create: {
        nome: 'grupos_criar',
        descricao: 'Criar grupos hierárquicos',
        recurso: 'grupos',
        acao: 'criar'
      }
    }),
    // Perfis
    prisma.permissao.upsert({
      where: { nome: 'perfis_ler' },
      update: {},
      create: {
        nome: 'perfis_ler',
        descricao: 'Visualizar perfis',
        recurso: 'perfis',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'perfis_criar' },
      update: {},
      create: {
        nome: 'perfis_criar',
        descricao: 'Criar perfis',
        recurso: 'perfis',
        acao: 'criar'
      }
    }),
    // Permissões
    prisma.permissao.upsert({
      where: { nome: 'permissoes_ler' },
      update: {},
      create: {
        nome: 'permissoes_ler',
        descricao: 'Visualizar permissões',
        recurso: 'permissoes',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'permissoes_criar' },
      update: {},
      create: {
        nome: 'permissoes_criar',
        descricao: 'Criar permissões',
        recurso: 'permissoes',
        acao: 'criar'
      }
    }),
    // Usuários
    prisma.permissao.upsert({
      where: { nome: 'usuarios_ler' },
      update: {},
      create: {
        nome: 'usuarios_ler',
        descricao: 'Visualizar usuários',
        recurso: 'usuarios',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'usuarios_criar' },
      update: {},
      create: {
        nome: 'usuarios_criar',
        descricao: 'Criar usuários',
        recurso: 'usuarios',
        acao: 'criar'
      }
    }),
    // Sistema (admin)
    prisma.permissao.upsert({
      where: { nome: 'sistema_administrar' },
      update: {},
      create: {
        nome: 'sistema_administrar',
        descricao: 'Administrar sistema',
        recurso: 'sistema',
        acao: 'administrar'
      }
    })
  ])

  // Criar perfil administrador
  console.log('👤 Criando perfil administrador...')
  const perfilAdmin = await prisma.perfil.upsert({
    where: { nome: 'Administrador' },
    update: {},
    create: {
      nome: 'Administrador',
      descricao: 'Acesso total ao sistema',
      ativo: true
    }
  })

  // Associar todas as permissões ao perfil administrador
  console.log('🔗 Associando permissões ao perfil administrador...')
  for (const permissao of permissoes) {
    await prisma.perfilPermissao.upsert({
      where: {
        perfilId_permissaoId: {
          perfilId: perfilAdmin.id,
          permissaoId: permissao.id
        }
      },
      update: {},
      create: {
        perfilId: perfilAdmin.id,
        permissaoId: permissao.id
      }
    })
  }

  // Criar grupo hierárquico
  console.log('🏢 Criando grupo hierárquico...')
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
  }

  // Criar colaborador administrador
  console.log('👨‍💼 Criando colaborador administrador...')
  const colaboradorAdmin = await prisma.colaborador.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
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

  // Criar usuário administrador
  console.log('🔐 Criando usuário administrador...')
  const senhaHash = await bcrypt.hash('admin123', 10)
  const usuarioAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      senha: senhaHash,
      nome: 'Administrador do Sistema',
      ativo: true,
      colaboradorId: colaboradorAdmin.id
    }
  })

  // Criar alguns clientes de exemplo
  console.log('👥 Criando clientes de exemplo...')
  await prisma.cliente.upsert({
    where: { email: 'cliente1@exemplo.com' },
    update: {},
    create: {
      nome: 'João Silva',
      email: 'cliente1@exemplo.com',
      telefone: '(11) 98888-8888',
      documento: '123.456.789-00',
      tipo: 'PESSOA_FISICA',
      status: 'CLIENTE',
      endereco: 'Rua das Flores, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
      valorPotencial: 50000,
      grupoHierarquicoId: grupoAdmin.id
    }
  })

  await prisma.cliente.upsert({
    where: { email: 'empresa@exemplo.com' },
    update: {},
    create: {
      nome: 'Empresa Exemplo Ltda',
      email: 'empresa@exemplo.com',
      telefone: '(11) 3333-3333',
      documento: '12.345.678/0001-90',
      tipo: 'PESSOA_JURIDICA',
      status: 'PROSPECT',
      endereco: 'Av. Paulista, 1000',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01310-100',
      valorPotencial: 200000,
      grupoHierarquicoId: grupoAdmin.id
    }
  })

  console.log('✅ Seed concluído com sucesso!')
  console.log('📧 Email: admin@sistema.com')
  console.log('🔑 Senha: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
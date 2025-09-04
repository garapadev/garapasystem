import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar permissões básicas
  console.log('📋 Criando permissões...')
  const permissoes = await Promise.all([
    prisma.permissao.upsert({
      where: { nome: 'dashboard_view' },
      update: {},
      create: {
        nome: 'dashboard_view',
        descricao: 'Visualizar dashboard',
        recurso: 'dashboard',
        acao: 'view'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'usuarios_view' },
      update: {},
      create: {
        nome: 'usuarios_view',
        descricao: 'Visualizar usuários',
        recurso: 'usuarios',
        acao: 'view'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'usuarios_create' },
      update: {},
      create: {
        nome: 'usuarios_create',
        descricao: 'Criar usuários',
        recurso: 'usuarios',
        acao: 'create'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'usuarios_edit' },
      update: {},
      create: {
        nome: 'usuarios_edit',
        descricao: 'Editar usuários',
        recurso: 'usuarios',
        acao: 'edit'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'usuarios_delete' },
      update: {},
      create: {
        nome: 'usuarios_delete',
        descricao: 'Deletar usuários',
        recurso: 'usuarios',
        acao: 'delete'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'clientes_view' },
      update: {},
      create: {
        nome: 'clientes_view',
        descricao: 'Visualizar clientes',
        recurso: 'clientes',
        acao: 'view'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'colaboradores_view' },
      update: {},
      create: {
        nome: 'colaboradores_view',
        descricao: 'Visualizar colaboradores',
        recurso: 'colaboradores',
        acao: 'view'
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
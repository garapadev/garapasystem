import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Verificar se o banco já tem usuários
  console.log('🔍 Verificando se o banco de dados já contém usuários...')
  const userCount = await prisma.usuario.count()
  
  if (userCount > 0) {
    console.log(`📊 Banco já contém ${userCount} usuário(s). Pulando seed inicial.`)
    return
  }

  console.log('✅ Banco vazio detectado. Executando seed inicial completo...')

  // Criar permissões completas para todos os módulos
  console.log('📋 Criando permissões completas...')
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
    
    // Clientes - CRUD completo
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
      where: { nome: 'clientes_editar' },
      update: {},
      create: {
        nome: 'clientes_editar',
        descricao: 'Editar clientes',
        recurso: 'clientes',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'clientes_excluir' },
      update: {},
      create: {
        nome: 'clientes_excluir',
        descricao: 'Excluir clientes',
        recurso: 'clientes',
        acao: 'excluir'
      }
    }),

    // Colaboradores - CRUD completo
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
      where: { nome: 'colaboradores_editar' },
      update: {},
      create: {
        nome: 'colaboradores_editar',
        descricao: 'Editar colaboradores',
        recurso: 'colaboradores',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'colaboradores_excluir' },
      update: {},
      create: {
        nome: 'colaboradores_excluir',
        descricao: 'Excluir colaboradores',
        recurso: 'colaboradores',
        acao: 'excluir'
      }
    }),

    // Grupos Hierárquicos - CRUD completo
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
      where: { nome: 'grupos_editar' },
      update: {},
      create: {
        nome: 'grupos_editar',
        descricao: 'Editar grupos hierárquicos',
        recurso: 'grupos',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'grupos_excluir' },
      update: {},
      create: {
        nome: 'grupos_excluir',
        descricao: 'Excluir grupos hierárquicos',
        recurso: 'grupos',
        acao: 'excluir'
      }
    }),

    // Perfis - CRUD completo
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
      where: { nome: 'perfis_editar' },
      update: {},
      create: {
        nome: 'perfis_editar',
        descricao: 'Editar perfis',
        recurso: 'perfis',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'perfis_excluir' },
      update: {},
      create: {
        nome: 'perfis_excluir',
        descricao: 'Excluir perfis',
        recurso: 'perfis',
        acao: 'excluir'
      }
    }),

    // Permissões - CRUD completo
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
      where: { nome: 'permissoes_editar' },
      update: {},
      create: {
        nome: 'permissoes_editar',
        descricao: 'Editar permissões',
        recurso: 'permissoes',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'permissoes_excluir' },
      update: {},
      create: {
        nome: 'permissoes_excluir',
        descricao: 'Excluir permissões',
        recurso: 'permissoes',
        acao: 'excluir'
      }
    }),

    // Usuários - CRUD completo
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
      where: { nome: 'usuarios_editar' },
      update: {},
      create: {
        nome: 'usuarios_editar',
        descricao: 'Editar usuários',
        recurso: 'usuarios',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'usuarios_excluir' },
      update: {},
      create: {
        nome: 'usuarios_excluir',
        descricao: 'Excluir usuários',
        recurso: 'usuarios',
        acao: 'excluir'
      }
    }),

    // Ordens de Serviço - CRUD + Aprovação + Gerenciamento
    prisma.permissao.upsert({
      where: { nome: 'ordens_servico_criar' },
      update: {},
      create: {
        nome: 'ordens_servico_criar',
        descricao: 'Criar ordens de serviço',
        recurso: 'ordens_servico',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'ordens_servico_ler' },
      update: {},
      create: {
        nome: 'ordens_servico_ler',
        descricao: 'Visualizar ordens de serviço',
        recurso: 'ordens_servico',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'ordens_servico_editar' },
      update: {},
      create: {
        nome: 'ordens_servico_editar',
        descricao: 'Editar ordens de serviço',
        recurso: 'ordens_servico',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'ordens_servico_excluir' },
      update: {},
      create: {
        nome: 'ordens_servico_excluir',
        descricao: 'Excluir ordens de serviço',
        recurso: 'ordens_servico',
        acao: 'excluir'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'ordens_servico_aprovar' },
      update: {},
      create: {
        nome: 'ordens_servico_aprovar',
        descricao: 'Aprovar ordens de serviço',
        recurso: 'ordens_servico',
        acao: 'aprovar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'ordens_servico_gerenciar' },
      update: {},
      create: {
        nome: 'ordens_servico_gerenciar',
        descricao: 'Gerenciar ordens de serviço',
        recurso: 'ordens_servico',
        acao: 'gerenciar'
      }
    }),

    // Orçamentos - CRUD + Aprovação + Geração
    prisma.permissao.upsert({
      where: { nome: 'orcamentos_criar' },
      update: {},
      create: {
        nome: 'orcamentos_criar',
        descricao: 'Criar orçamentos',
        recurso: 'orcamentos',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'orcamentos_ler' },
      update: {},
      create: {
        nome: 'orcamentos_ler',
        descricao: 'Visualizar orçamentos',
        recurso: 'orcamentos',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'orcamentos_editar' },
      update: {},
      create: {
        nome: 'orcamentos_editar',
        descricao: 'Editar orçamentos',
        recurso: 'orcamentos',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'orcamentos_excluir' },
      update: {},
      create: {
        nome: 'orcamentos_excluir',
        descricao: 'Excluir orçamentos',
        recurso: 'orcamentos',
        acao: 'excluir'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'orcamentos_aprovar' },
      update: {},
      create: {
        nome: 'orcamentos_aprovar',
        descricao: 'Aprovar orçamentos',
        recurso: 'orcamentos',
        acao: 'aprovar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'orcamentos_gerar' },
      update: {},
      create: {
        nome: 'orcamentos_gerar',
        descricao: 'Gerar orçamentos automaticamente',
        recurso: 'orcamentos',
        acao: 'gerar'
      }
    }),

    // Webmail - Permissões específicas
    prisma.permissao.upsert({
      where: { nome: 'webmail_email_read' },
      update: {},
      create: {
        nome: 'webmail_email_read',
        descricao: 'Ler emails no webmail',
        recurso: 'webmail',
        acao: 'email_read'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_email_send' },
      update: {},
      create: {
        nome: 'webmail_email_send',
        descricao: 'Enviar emails no webmail',
        recurso: 'webmail',
        acao: 'email_send'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_email_delete' },
      update: {},
      create: {
        nome: 'webmail_email_delete',
        descricao: 'Excluir emails no webmail',
        recurso: 'webmail',
        acao: 'email_delete'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_config_read' },
      update: {},
      create: {
        nome: 'webmail_config_read',
        descricao: 'Visualizar configurações do webmail',
        recurso: 'webmail',
        acao: 'config_read'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_config_write' },
      update: {},
      create: {
        nome: 'webmail_config_write',
        descricao: 'Gerenciar configurações do webmail',
        recurso: 'webmail',
        acao: 'config_write'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_folder_read' },
      update: {},
      create: {
        nome: 'webmail_folder_read',
        descricao: 'Visualizar pastas do webmail',
        recurso: 'webmail',
        acao: 'folder_read'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_folder_manage' },
      update: {},
      create: {
        nome: 'webmail_folder_manage',
        descricao: 'Gerenciar pastas do webmail',
        recurso: 'webmail',
        acao: 'folder_manage'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_attachment_upload' },
      update: {},
      create: {
        nome: 'webmail_attachment_upload',
        descricao: 'Fazer upload de anexos no webmail',
        recurso: 'webmail',
        acao: 'attachment_upload'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_attachment_download' },
      update: {},
      create: {
        nome: 'webmail_attachment_download',
        descricao: 'Fazer download de anexos no webmail',
        recurso: 'webmail',
        acao: 'attachment_download'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_admin_logs' },
      update: {},
      create: {
        nome: 'webmail_admin_logs',
        descricao: 'Visualizar logs de auditoria do webmail',
        recurso: 'webmail',
        acao: 'admin_logs'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'webmail_admin_manage_users' },
      update: {},
      create: {
        nome: 'webmail_admin_manage_users',
        descricao: 'Gerenciar usuários do webmail',
        recurso: 'webmail',
        acao: 'admin_manage_users'
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
    where: { email: 'admin@garapasystem.com' },
    update: {},
    create: {
      nome: 'Administrador do Sistema',
      email: 'admin@garapasystem.com',
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
  const senhaHash = await bcrypt.hash('password', 10)
  const usuarioAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@garapasystem.com' },
    update: {},
    create: {
      email: 'admin@garapasystem.com',
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
      valorPotencial: 50000,
      grupoHierarquicoId: grupoAdmin.id,
      enderecos: {
        create: {
          logradouro: 'Rua das Flores',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567',
          tipo: 'RESIDENCIAL',
          principal: true
        }
      }
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
      valorPotencial: 200000,
      grupoHierarquicoId: grupoAdmin.id,
      enderecos: {
        create: [
          {
            logradouro: 'Av. Paulista',
            numero: '1000',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01310-100',
            tipo: 'COMERCIAL',
            principal: true
          },
          {
            logradouro: 'Rua das Entregas',
            numero: '500',
            bairro: 'Vila Madalena',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '05433-000',
            tipo: 'ENTREGA',
            principal: false
          }
        ]
      }
    }
  })

  // Verificar e criar módulos do sistema
  console.log('🔧 Verificando módulos do sistema...')
  const modulosCount = await prisma.moduloSistema.count()
  
  if (modulosCount === 0) {
    console.log('📦 Criando módulos do sistema...')
    // Executar o script de seed de módulos
    const { execSync } = require('child_process')
    try {
      execSync('tsx /app/scripts/seed-modulos.ts', { stdio: 'inherit' })
      console.log('✅ Módulos criados com sucesso!')
    } catch (error) {
      console.error('❌ Erro ao criar módulos:', error)
    }
  } else {
    console.log(`📊 Módulos já existem (${modulosCount} encontrados)`)
  }

  console.log('✅ Seed concluído com sucesso!')
  console.log('📧 Email: admin@garapasystem.com')
  console.log('🔑 Senha: password')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
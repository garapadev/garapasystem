import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedNewModulesPermissions() {
  console.log('🔐 Criando permissões para os novos módulos...')

  const permissoes = await Promise.all([
    // COMPRAS - CRUD + Aprovação
    prisma.permissao.upsert({
      where: { nome: 'compras_criar' },
      update: {},
      create: {
        nome: 'compras_criar',
        descricao: 'Criar solicitações de compra',
        recurso: 'compras',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'compras_ler' },
      update: {},
      create: {
        nome: 'compras_ler',
        descricao: 'Visualizar solicitações de compra',
        recurso: 'compras',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'compras_editar' },
      update: {},
      create: {
        nome: 'compras_editar',
        descricao: 'Editar solicitações de compra',
        recurso: 'compras',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'compras_excluir' },
      update: {},
      create: {
        nome: 'compras_excluir',
        descricao: 'Excluir solicitações de compra',
        recurso: 'compras',
        acao: 'excluir'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'compras_aprovar' },
      update: {},
      create: {
        nome: 'compras_aprovar',
        descricao: 'Aprovar/rejeitar solicitações de compra',
        recurso: 'compras',
        acao: 'aprovar'
      }
    }),

    // ESTOQUE - CRUD + Movimentação + Relatórios
    prisma.permissao.upsert({
      where: { nome: 'estoque_criar' },
      update: {},
      create: {
        nome: 'estoque_criar',
        descricao: 'Criar movimentações de estoque',
        recurso: 'estoque',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'estoque_ler' },
      update: {},
      create: {
        nome: 'estoque_ler',
        descricao: 'Visualizar estoque e movimentações',
        recurso: 'estoque',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'estoque_editar' },
      update: {},
      create: {
        nome: 'estoque_editar',
        descricao: 'Editar movimentações de estoque',
        recurso: 'estoque',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'estoque_excluir' },
      update: {},
      create: {
        nome: 'estoque_excluir',
        descricao: 'Excluir movimentações de estoque',
        recurso: 'estoque',
        acao: 'excluir'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'estoque_movimentar' },
      update: {},
      create: {
        nome: 'estoque_movimentar',
        descricao: 'Realizar movimentações de estoque',
        recurso: 'estoque',
        acao: 'movimentar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'estoque_relatorios' },
      update: {},
      create: {
        nome: 'estoque_relatorios',
        descricao: 'Gerar relatórios de estoque',
        recurso: 'estoque',
        acao: 'relatorios'
      }
    }),

    // TOMBAMENTO - CRUD + Movimentação + Relatórios
    prisma.permissao.upsert({
      where: { nome: 'tombamento_criar' },
      update: {},
      create: {
        nome: 'tombamento_criar',
        descricao: 'Criar itens de tombamento',
        recurso: 'tombamento',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'tombamento_ler' },
      update: {},
      create: {
        nome: 'tombamento_ler',
        descricao: 'Visualizar itens de tombamento',
        recurso: 'tombamento',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'tombamento_editar' },
      update: {},
      create: {
        nome: 'tombamento_editar',
        descricao: 'Editar itens de tombamento',
        recurso: 'tombamento',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'tombamento_excluir' },
      update: {},
      create: {
        nome: 'tombamento_excluir',
        descricao: 'Excluir itens de tombamento',
        recurso: 'tombamento',
        acao: 'excluir'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'tombamento_movimentar' },
      update: {},
      create: {
        nome: 'tombamento_movimentar',
        descricao: 'Realizar movimentações de tombamento',
        recurso: 'tombamento',
        acao: 'movimentar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'tombamento_relatorios' },
      update: {},
      create: {
        nome: 'tombamento_relatorios',
        descricao: 'Gerar relatórios de tombamento',
        recurso: 'tombamento',
        acao: 'relatorios'
      }
    }),

    // PRODUTOS - CRUD (para gerenciar catálogo)
    prisma.permissao.upsert({
      where: { nome: 'produtos_criar' },
      update: {},
      create: {
        nome: 'produtos_criar',
        descricao: 'Criar produtos',
        recurso: 'produtos',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'produtos_ler' },
      update: {},
      create: {
        nome: 'produtos_ler',
        descricao: 'Visualizar produtos',
        recurso: 'produtos',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'produtos_editar' },
      update: {},
      create: {
        nome: 'produtos_editar',
        descricao: 'Editar produtos',
        recurso: 'produtos',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'produtos_excluir' },
      update: {},
      create: {
        nome: 'produtos_excluir',
        descricao: 'Excluir produtos',
        recurso: 'produtos',
        acao: 'excluir'
      }
    }),

    // FORNECEDORES - CRUD
    prisma.permissao.upsert({
      where: { nome: 'fornecedores_criar' },
      update: {},
      create: {
        nome: 'fornecedores_criar',
        descricao: 'Criar fornecedores',
        recurso: 'fornecedores',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'fornecedores_ler' },
      update: {},
      create: {
        nome: 'fornecedores_ler',
        descricao: 'Visualizar fornecedores',
        recurso: 'fornecedores',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'fornecedores_editar' },
      update: {},
      create: {
        nome: 'fornecedores_editar',
        descricao: 'Editar fornecedores',
        recurso: 'fornecedores',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'fornecedores_excluir' },
      update: {},
      create: {
        nome: 'fornecedores_excluir',
        descricao: 'Excluir fornecedores',
        recurso: 'fornecedores',
        acao: 'excluir'
      }
    }),

    // CENTROS DE CUSTO - CRUD
    prisma.permissao.upsert({
      where: { nome: 'centros_custo_criar' },
      update: {},
      create: {
        nome: 'centros_custo_criar',
        descricao: 'Criar centros de custo',
        recurso: 'centros_custo',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'centros_custo_ler' },
      update: {},
      create: {
        nome: 'centros_custo_ler',
        descricao: 'Visualizar centros de custo',
        recurso: 'centros_custo',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'centros_custo_editar' },
      update: {},
      create: {
        nome: 'centros_custo_editar',
        descricao: 'Editar centros de custo',
        recurso: 'centros_custo',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'centros_custo_excluir' },
      update: {},
      create: {
        nome: 'centros_custo_excluir',
        descricao: 'Excluir centros de custo',
        recurso: 'centros_custo',
        acao: 'excluir'
      }
    }),

    // CATEGORIAS DE PRODUTO - CRUD
    prisma.permissao.upsert({
      where: { nome: 'categorias_produto_criar' },
      update: {},
      create: {
        nome: 'categorias_produto_criar',
        descricao: 'Criar categorias de produto',
        recurso: 'categorias_produto',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'categorias_produto_ler' },
      update: {},
      create: {
        nome: 'categorias_produto_ler',
        descricao: 'Visualizar categorias de produto',
        recurso: 'categorias_produto',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'categorias_produto_editar' },
      update: {},
      create: {
        nome: 'categorias_produto_editar',
        descricao: 'Editar categorias de produto',
        recurso: 'categorias_produto',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'categorias_produto_excluir' },
      update: {},
      create: {
        nome: 'categorias_produto_excluir',
        descricao: 'Excluir categorias de produto',
        recurso: 'categorias_produto',
        acao: 'excluir'
      }
    }),

    // FINANCEIRO - CRUD básico
    prisma.permissao.upsert({
      where: { nome: 'financeiro_criar' },
      update: {},
      create: {
        nome: 'financeiro_criar',
        descricao: 'Criar registros financeiros',
        recurso: 'financeiro',
        acao: 'criar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'financeiro_ler' },
      update: {},
      create: {
        nome: 'financeiro_ler',
        descricao: 'Visualizar registros financeiros',
        recurso: 'financeiro',
        acao: 'ler'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'financeiro_editar' },
      update: {},
      create: {
        nome: 'financeiro_editar',
        descricao: 'Editar registros financeiros',
        recurso: 'financeiro',
        acao: 'editar'
      }
    }),
    prisma.permissao.upsert({
      where: { nome: 'financeiro_excluir' },
      update: {},
      create: {
        nome: 'financeiro_excluir',
        descricao: 'Excluir registros financeiros',
        recurso: 'financeiro',
        acao: 'excluir'
      }
    }),

    // Permissão de administrador do sistema
    prisma.permissao.upsert({
      where: { nome: 'sistema_administrar' },
      update: {},
      create: {
        nome: 'sistema_administrar',
        descricao: 'Administrar sistema completo',
        recurso: 'sistema',
        acao: 'administrar'
      }
    })
  ])

  console.log(`✅ ${permissoes.length} permissões dos novos módulos criadas/atualizadas!`)
  return permissoes
}

// Executar se chamado diretamente
if (require.main === module) {
  seedNewModulesPermissions()
    .catch((e) => {
      console.error('❌ Erro ao criar permissões dos novos módulos:', e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
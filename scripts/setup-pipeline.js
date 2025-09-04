const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupPipeline() {
  try {
    console.log('🚀 Configurando pipeline de negócios...');

    // Criar etapas padrão do pipeline
    const etapas = [
      {
        nome: 'Prospecção',
        descricao: 'Identificação e qualificação de leads',
        ordem: 1,
        cor: '#3B82F6' // Azul
      },
      {
        nome: 'Contato Inicial',
        descricao: 'Primeiro contato com o prospect',
        ordem: 2,
        cor: '#8B5CF6' // Roxo
      },
      {
        nome: 'Apresentação',
        descricao: 'Apresentação da proposta/produto',
        ordem: 3,
        cor: '#F59E0B' // Amarelo
      },
      {
        nome: 'Negociação',
        descricao: 'Negociação de termos e condições',
        ordem: 4,
        cor: '#EF4444' // Vermelho
      },
      {
        nome: 'Fechamento',
        descricao: 'Finalização da venda',
        ordem: 5,
        cor: '#10B981' // Verde
      },
      {
        nome: 'Perdido',
        descricao: 'Oportunidade perdida',
        ordem: 6,
        cor: '#6B7280' // Cinza
      }
    ];

    // Verificar se já existem etapas
    const etapasExistentes = await prisma.etapaPipeline.count();
    
    if (etapasExistentes > 0) {
      console.log('⚠️  Etapas do pipeline já existem. Pulando criação...');
    } else {
      // Criar etapas
      for (const etapa of etapas) {
        await prisma.etapaPipeline.create({
          data: etapa
        });
        console.log(`✅ Etapa criada: ${etapa.nome}`);
      }
    }

    // Criar permissões para o módulo de negócios
    const permissoes = [
      {
        nome: 'negocios.ler',
        descricao: 'Visualizar oportunidades de negócio',
        recurso: 'negocios',
        acao: 'ler'
      },
      {
        nome: 'negocios.criar',
        descricao: 'Criar novas oportunidades',
        recurso: 'negocios',
        acao: 'criar'
      },
      {
        nome: 'negocios.editar',
        descricao: 'Editar oportunidades existentes',
        recurso: 'negocios',
        acao: 'editar'
      },
      {
        nome: 'negocios.excluir',
        descricao: 'Excluir oportunidades',
        recurso: 'negocios',
        acao: 'excluir'
      },
      {
        nome: 'pipeline.configurar',
        descricao: 'Configurar etapas do pipeline',
        recurso: 'pipeline',
        acao: 'configurar'
      }
    ];

    // Verificar e criar permissões
    for (const permissao of permissoes) {
      const existe = await prisma.permissao.findUnique({
        where: { nome: permissao.nome }
      });

      if (!existe) {
        await prisma.permissao.create({
          data: permissao
        });
        console.log(`✅ Permissão criada: ${permissao.nome}`);
      } else {
        console.log(`⚠️  Permissão já existe: ${permissao.nome}`);
      }
    }

    // Adicionar permissões ao perfil de administrador
    const perfilAdmin = await prisma.perfil.findFirst({
      where: {
        nome: {
          contains: 'admin',
          mode: 'insensitive'
        }
      }
    });

    if (perfilAdmin) {
      for (const permissao of permissoes) {
        const permissaoDb = await prisma.permissao.findUnique({
          where: { nome: permissao.nome }
        });

        if (permissaoDb) {
          const relacaoExiste = await prisma.perfilPermissao.findUnique({
            where: {
              perfilId_permissaoId: {
                perfilId: perfilAdmin.id,
                permissaoId: permissaoDb.id
              }
            }
          });

          if (!relacaoExiste) {
            await prisma.perfilPermissao.create({
              data: {
                perfilId: perfilAdmin.id,
                permissaoId: permissaoDb.id
              }
            });
            console.log(`✅ Permissão ${permissao.nome} adicionada ao perfil admin`);
          }
        }
      }
    }

    console.log('🎉 Pipeline de negócios configurado com sucesso!');
    
    // Mostrar resumo
    const totalEtapas = await prisma.etapaPipeline.count();
    const totalPermissoes = await prisma.permissao.count({
      where: {
        recurso: {
          in: ['negocios', 'pipeline']
        }
      }
    });
    
    console.log(`📊 Resumo:`);
    console.log(`   - Etapas do pipeline: ${totalEtapas}`);
    console.log(`   - Permissões de negócios: ${totalPermissoes}`);

  } catch (error) {
    console.error('❌ Erro ao configurar pipeline:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupPipeline();
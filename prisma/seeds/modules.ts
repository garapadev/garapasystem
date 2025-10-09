import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedModules() {
  console.log('🌱 Seeding modules...');

  // Módulos Core (sempre ativos)
  const coreModules = [
    {
      nome: 'dashboard',
      titulo: 'Dashboard',
      ativo: true,
      core: true,
      icone: 'LayoutDashboard',
      ordem: 1,
      rota: '/dashboard',
      categoria: 'core',
    },
    {
      nome: 'clientes',
      titulo: 'Clientes',
      ativo: true,
      core: true,
      icone: 'Users',
      ordem: 2,
      rota: '/clientes',
      categoria: 'core',
    },
    {
      nome: 'colaboradores',
      titulo: 'Colaboradores',
      ativo: true,
      core: true,
      icone: 'UserCheck',
      ordem: 3,
      rota: '/colaboradores',
      categoria: 'core',
    },
    {
      nome: 'configuracoes',
      titulo: 'Configurações',
      ativo: true,
      core: true,
      icone: 'Settings',
      ordem: 99,
      rota: '/configuracoes',
      categoria: 'core',
    },
  ];

  // Módulos Opcionais
  const optionalModules = [
    {
      nome: 'webmail',
      titulo: 'Webmail',
      ativo: true,
      core: false,
      icone: 'Mail',
      ordem: 10,
      rota: '/webmail',
      categoria: 'comunicacao',
      permissao: 'webmail.view',
    },
    {
      nome: 'helpdesk',
      titulo: 'Helpdesk',
      ativo: true,
      core: false,
      icone: 'HeadphonesIcon',
      ordem: 11,
      rota: '/helpdesk',
      categoria: 'atendimento',
      permissao: 'helpdesk.view',
    },
    {
      nome: 'whatsapp-chat',
      titulo: 'WhatsApp Chat',
      ativo: true,
      core: false,
      icone: 'MessageCircle',
      ordem: 12,
      rota: '/whatsapp-chat',
      categoria: 'comunicacao',
      permissao: 'whatsapp.view',
    },
    {
      nome: 'tarefas',
      titulo: 'Tarefas',
      ativo: true,
      core: false,
      icone: 'CheckSquare',
      ordem: 20,
      rota: '/tarefas',
      categoria: 'operacional',
      permissao: 'tasks.view',
    },
    {
      nome: 'orcamentos',
      titulo: 'Orçamentos',
      ativo: true,
      core: false,
      icone: 'FileText',
      ordem: 30,
      rota: '/orcamentos',
      categoria: 'vendas',
      permissao: 'orcamentos.view',
    },
    {
      nome: 'ordens-servico',
      titulo: 'Ordens de Serviço',
      ativo: true,
      core: false,
      icone: 'Wrench',
      ordem: 31,
      rota: '/ordens-servico',
      categoria: 'operacional',
      permissao: 'ordens_servico.view',
    },
    {
      nome: 'negocios',
      titulo: 'Negócios',
      ativo: true,
      core: false,
      icone: 'TrendingUp',
      ordem: 40,
      rota: '/negocios',
      categoria: 'vendas',
      permissao: 'negocios.view',
    },
    {
      nome: 'laudos-tecnicos',
      titulo: 'Laudos Técnicos',
      ativo: false,
      core: false,
      icone: 'FileCheck',
      ordem: 50,
      rota: '/laudos-tecnicos',
      categoria: 'operacional',
      permissao: 'laudos.view',
    },
  ];

  const allModules = [...coreModules, ...optionalModules];

  for (const moduleData of allModules) {
    try {
      const existingModule = await prisma.moduloSistema.findUnique({
        where: { nome: moduleData.nome },
      });

      if (!existingModule) {
        await prisma.moduloSistema.create({
          data: moduleData,
        });
        console.log(`✅ Módulo '${moduleData.titulo}' criado`);
      } else {
        // Atualiza apenas campos que podem ter mudado
        await prisma.moduloSistema.update({
          where: { nome: moduleData.nome },
          data: {
            titulo: moduleData.titulo,
            icone: moduleData.icone,
            ordem: moduleData.ordem,
            rota: moduleData.rota,
            categoria: moduleData.categoria,
            permissao: moduleData.permissao,
          },
        });
        console.log(`🔄 Módulo '${moduleData.titulo}' atualizado`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar módulo '${moduleData.titulo}':`, error);
    }
  }

  console.log('✅ Seed de módulos concluído!');
}

if (require.main === module) {
  seedModules()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
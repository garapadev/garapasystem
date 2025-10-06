import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ModuloData {
  nome: string;
  titulo: string;
  descricao?: string;
  ativo: boolean;
  core: boolean;
  icone?: string;
  ordem: number;
  categoria?: string;
  rota?: string;
  permissao?: string;
}

async function seedModulos() {
  console.log('🌱 Criando módulos de exemplo...');

  const modulos: ModuloData[] = [
    {
      nome: 'dashboard',
      titulo: 'Dashboard',
      descricao: 'Painel principal do sistema',
      ativo: true,
      core: true,
      icone: 'Home',
      ordem: 1,
      categoria: 'core',
      rota: '/',
    },
    {
      nome: 'webmail',
      titulo: 'Webmail',
      descricao: 'Sistema de e-mail integrado',
      ativo: true,
      core: false,
      icone: 'Mail',
      ordem: 2,
      categoria: 'comunicacao',
      rota: '/webmail',
      permissao: 'webmail.read',
    },
    {
      nome: 'helpdesk',
      titulo: 'Helpdesk',
      descricao: 'Sistema de atendimento ao cliente',
      ativo: true,
      core: false,
      icone: 'Headphones',
      ordem: 3,
      categoria: 'atendimento',
      rota: '/helpdesk',
      permissao: 'helpdesk.visualizar',
    },
    {
      nome: 'whatsapp-chat',
      titulo: 'WhatsApp Chat',
      descricao: 'Chat integrado com WhatsApp',
      ativo: true,
      core: false,
      icone: 'MessageCircle',
      ordem: 4,
      categoria: 'comunicacao',
      rota: '/whatsappchat',
      permissao: 'whatsapp.usar',
    },
    {
      nome: 'tarefas',
      titulo: 'Tarefas',
      descricao: 'Gerenciamento de tarefas e projetos',
      ativo: true,
      core: false,
      icone: 'CheckSquare',
      ordem: 5,
      categoria: 'produtividade',
      rota: '/tasks',
      permissao: 'tasks.ler',
    },
    {
      nome: 'clientes',
      titulo: 'Clientes',
      descricao: 'Gerenciamento de clientes',
      ativo: true,
      core: false,
      icone: 'Users',
      ordem: 6,
      categoria: 'crm',
      rota: '/clientes',
      permissao: 'clientes.ler',
    },
    {
      nome: 'orcamentos',
      titulo: 'Orçamentos',
      descricao: 'Sistema de orçamentos',
      ativo: true,
      core: false,
      icone: 'FileText',
      ordem: 7,
      categoria: 'vendas',
      rota: '/orcamentos',
      permissao: 'orcamentos.ler',
    },
    {
      nome: 'ordens-servico',
      titulo: 'Ordens de Serviço',
      descricao: 'Gerenciamento de ordens de serviço',
      ativo: false,
      core: false,
      icone: 'ClipboardList',
      ordem: 8,
      categoria: 'operacoes',
      rota: '/ordens-servico',
      permissao: 'ordens_servico.ler',
    },
    {
      nome: 'configuracoes',
      titulo: 'Configurações',
      descricao: 'Configurações do sistema',
      ativo: true,
      core: true,
      icone: 'Settings',
      ordem: 99,
      categoria: 'sistema',
      rota: '/configuracoes',
    },
  ];

  for (const modulo of modulos) {
    try {
      console.log(`🔄 Processando módulo: ${modulo.titulo}`);
      
      // Primeiro, verifica se o módulo já existe
      const existingModule = await prisma.$queryRaw<Array<{id: string}>>`
        SELECT id FROM modulos_sistema WHERE nome = ${modulo.nome}
      `;

      if (existingModule.length > 0) {
        // Atualiza módulo existente
        await prisma.$executeRaw`
          UPDATE modulos_sistema 
          SET titulo = ${modulo.titulo},
              descricao = ${modulo.descricao || null},
              ativo = ${modulo.ativo},
              core = ${modulo.core},
              icone = ${modulo.icone || null},
              ordem = ${modulo.ordem},
              categoria = ${modulo.categoria || null},
              rota = ${modulo.rota || null},
              permissao = ${modulo.permissao || null},
              "updatedAt" = NOW()
          WHERE nome = ${modulo.nome}
        `;
      } else {
        // Cria novo módulo usando uuid_generate_v4() ou alternativa
        await prisma.$executeRaw`
          INSERT INTO modulos_sistema (nome, titulo, descricao, ativo, core, icone, ordem, categoria, rota, permissao, "createdAt", "updatedAt")
          VALUES (${modulo.nome}, ${modulo.titulo}, ${modulo.descricao || null}, ${modulo.ativo}, ${modulo.core}, ${modulo.icone || null}, ${modulo.ordem}, ${modulo.categoria || null}, ${modulo.rota || null}, ${modulo.permissao || null}, NOW(), NOW())
        `;
      }
      
      console.log(`✅ Módulo processado: ${modulo.titulo}`);
    } catch (error) {
      console.error(`❌ Erro ao processar módulo ${modulo.titulo}:`, error);
    }
  }

  console.log('✅ Módulos criados/atualizados com sucesso!');
}

async function main() {
  try {
    await seedModulos();
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
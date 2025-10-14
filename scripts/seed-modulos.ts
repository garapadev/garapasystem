import { Client } from 'pg';

// Configuração do cliente PostgreSQL direto
// Parse da DATABASE_URL se disponível
let dbConfig;
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbConfig = {
    host: url.hostname,
    port: parseInt(url.port || '5432'),
    database: url.pathname.slice(1), // Remove a barra inicial
    user: url.username,
    password: url.password,
  };
} else {
  dbConfig = {
    host: process.env.DATABASE_HOST || 'garapasystem-postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'crm_erp',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
  };
}

const pgClient = new Client(dbConfig);

interface ModuloData {
  id: string;
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
  console.log('🌱 Iniciando seed dos módulos do sistema (v2)...');

  // Conectar ao PostgreSQL
  await pgClient.connect();

  const modulos: ModuloData[] = [
    {
      id: '01JDQHQHQHQHQHQHQHQHQH',
      nome: 'dashboard',
      titulo: 'Dashboard',
      descricao: 'Painel principal do sistema',
      ativo: true,
      core: true,
      icone: 'LayoutDashboard',
      ordem: 1,
      categoria: 'core',
      rota: '/dashboard',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQI',
      nome: 'clientes',
      titulo: 'Clientes',
      descricao: 'Gerenciamento de clientes',
      ativo: true,
      core: false,
      icone: 'Users',
      ordem: 2,
      categoria: 'core',
      rota: '/clientes',
      permissao: 'clientes.ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQJ',
      nome: 'colaboradores',
      titulo: 'Colaboradores',
      descricao: '',
      ativo: true,
      core: true,
      icone: 'UserCheck',
      ordem: 3,
      categoria: 'core',
      rota: '/colaboradores',
      permissao: 'colaboradores.ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQK',
      nome: 'webmail',
      titulo: 'Webmail',
      descricao: '',
      ativo: true,
      core: false,
      icone: 'Mail',
      ordem: 4,
      categoria: 'comunicacao',
      rota: '/webmail',
      permissao: 'webmail.ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQL',
      nome: 'helpdesk',
      titulo: 'Atendimento ao cliente',
      descricao: 'Sistema de atendimento ao cliente',
      ativo: true,
      core: false,
      icone: 'Headphones',
      ordem: 5,
      categoria: 'atendimento',
      rota: '/helpdesk',
      permissao: 'helpdesk.ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQM',
      nome: 'whatsapp-chat',
      titulo: 'WhatsApp Chat',
      descricao: 'Integração com WhatsApp',
      ativo: true,
      core: false,
      icone: 'MessageCircle',
      ordem: 6,
      categoria: 'comunicacao',
      rota: '/whatsapp-chat',
      permissao: 'whatsapp.ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQN',
      nome: 'tarefas',
      titulo: 'Tarefas',
      descricao: 'Gerenciamento de tarefas',
      ativo: true,
      core: false,
      icone: 'CheckSquare',
      ordem: 7,
      categoria: 'produtividade',
      rota: '/tarefas',
      permissao: 'tarefas.ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQO',
      nome: 'orcamentos',
      titulo: 'Orçamentos',
      descricao: 'Gerenciamento de orçamentos',
      ativo: true,
      core: false,
      icone: 'Calculator',
      ordem: 8,
      categoria: 'vendas',
      rota: '/orcamentos',
      permissao: 'orcamentos.ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQP',
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
      id: '01JDQHQHQHQHQHQHQHQHQQ',
      nome: 'negocios',
      titulo: 'Negócios',
      descricao: 'Gerenciamento de negócios',
      ativo: true,
      core: false,
      icone: 'Briefcase',
      ordem: 9,
      categoria: 'vendas',
      rota: '/negocios',
      permissao: 'negocios.ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQR',
      nome: 'laudos-tecnicos',
      titulo: 'Laudos Técnicos',
      descricao: '',
      ativo: true,
      core: false,
      icone: 'FileCheck',
      ordem: 50,
      categoria: 'operacional',
      rota: '/laudos-tecnicos',
      permissao: 'laudos.view',
    },
    {
      id: '01JDFINANC0000000000001',
      nome: 'financeiro',
      titulo: 'Financeiro',
      descricao: 'Gestão financeira: contas, fluxo e relatórios',
      ativo: true,
      core: false,
      icone: 'DollarSign',
      ordem: 55,
      categoria: 'financeiro',
      rota: '/financeiro',
      permissao: 'financeiro_ler',
    },
    {
      id: '01JDQHQHQHQHQHQHQHQHQS',
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

      // Verificar se o módulo já existe
      const existingModulo = await pgClient.query(
        'SELECT id FROM modulos_sistema WHERE nome = $1',
        [modulo.nome]
      );

      if (existingModulo.rows.length > 0) {
        // Atualizar módulo existente
        await pgClient.query(`
          UPDATE modulos_sistema 
          SET titulo = $1, 
              descricao = $2, 
              ativo = $3, 
              core = $4, 
              icone = $5, 
              ordem = $6, 
              categoria = $7, 
              rota = $8, 
              permissao = $9,
              "updatedAt" = NOW()
          WHERE nome = $10
        `, [
          modulo.titulo,
          modulo.descricao,
          modulo.ativo,
          modulo.core,
          modulo.icone,
          modulo.ordem,
          modulo.categoria,
          modulo.rota,
          modulo.permissao,
          modulo.nome
        ]);
        console.log(`✅ Módulo ${modulo.titulo} atualizado com sucesso!`);
      } else {
        // Criar novo módulo
        await pgClient.query(`
          INSERT INTO modulos_sistema (id, nome, titulo, descricao, ativo, core, icone, ordem, categoria, rota, permissao, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        `, [
          modulo.id,
          modulo.nome,
          modulo.titulo,
          modulo.descricao,
          modulo.ativo,
          modulo.core,
          modulo.icone,
          modulo.ordem,
          modulo.categoria,
          modulo.rota,
          modulo.permissao
        ]);
        console.log(`✅ Módulo ${modulo.titulo} criado com sucesso!`);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar módulo ${modulo.titulo}:`, error);
    }
  }

  // Desconectar do PostgreSQL
  await pgClient.end();

  console.log('✅ Módulos criados/atualizados com sucesso!');
}

async function main() {
  try {
    await seedModulos();
  } catch (error) {
    console.error('❌ Erro ao executar seed:', error);
    process.exit(1);
  }
}

main();
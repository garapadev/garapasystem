#!/usr/bin/env node
/**
 * ensure-core-permissions-and-modules.js
 * 1) Garante permissões e módulos essenciais.
 * 2) Se o banco estiver vazio, semeia TODOS os módulos (inclui Financeiro) e cria todas as permissões necessárias.
 * 3) Vincula todas as permissões ao perfil Administrador.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function titleCaseAction(action) {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

// Cria permissões em dois formatos: dot e underscore (ex.: clientes.ler e clientes_ler)
async function upsertPermissions(resource, actions) {
  const results = [];
  for (const action of actions) {
    const nomes = [
      `${resource}.${action}`,
      `${resource}_${action}`,
    ];
    for (const nome of nomes) {
      const descricao = `${titleCaseAction(action)} ${resource}`;
      const perm = await prisma.permissao.upsert({
        where: { nome },
        update: { descricao, recurso: resource, acao: action },
        create: { nome, descricao, recurso: resource, acao: action },
      });
      results.push(perm);
    }
  }
  return results;
}

async function upsertModule(mod) {
  const existing = await prisma.moduloSistema.findFirst({ where: { nome: mod.nome } });
  if (existing) {
    return prisma.moduloSistema.update({
      where: { id: existing.id },
      data: {
        titulo: mod.titulo,
        descricao: mod.descricao,
        ativo: mod.ativo,
        core: mod.core,
        icone: mod.icone,
        ordem: mod.ordem,
        categoria: mod.categoria,
        rota: mod.rota,
        permissao: mod.permissao,
      },
    });
  }
  return prisma.moduloSistema.create({
    data: {
      nome: mod.nome,
      titulo: mod.titulo,
      descricao: mod.descricao,
      ativo: mod.ativo,
      core: mod.core,
      icone: mod.icone,
      ordem: mod.ordem,
      categoria: mod.categoria,
      rota: mod.rota,
      permissao: mod.permissao,
    },
  });
}

async function ensureAdminHas(perms) {
  let admin = await prisma.perfil.findFirst({ where: { nome: 'Administrador' } });
  if (!admin) {
    console.log('⚠️  Perfil Administrador não encontrado, criando...');
    admin = await prisma.perfil.create({
      data: { nome: 'Administrador', descricao: 'Acesso total ao sistema', ativo: true },
    });
  }

  // Como a relação é explícita (PerfilPermissao), vinculamos criando/upsertando os registros na tabela de junção
  for (const perm of perms) {
    try {
      await prisma.perfilPermissao.upsert({
        where: {
          perfilId_permissaoId: {
            perfilId: admin.id,
            permissaoId: perm.id,
          },
        },
        update: {},
        create: {
          perfilId: admin.id,
          permissaoId: perm.id,
        },
      });
    } catch (e) {
      console.warn('Não foi possível vincular permissão ao Administrador:', perm?.nome, e?.message || e);
    }
  }

  return admin;
}

function getResourceFromPermName(permName) {
  if (!permName) return null;
  if (permName.includes('.')) return permName.split('.')[0];
  if (permName.includes('_')) return permName.split('_')[0];
  return permName;
}

async function seedAllModulesIfEmpty() {
  const count = await prisma.moduloSistema.count();
  const actions = ['ler', 'criar', 'editar', 'excluir', 'view'];

  const allModules = [
    { id: '01JDQHQHQHQHQHQHQHQHQH', nome: 'dashboard', titulo: 'Dashboard', descricao: 'Painel principal do sistema', ativo: true, core: true, icone: 'LayoutDashboard', ordem: 1, categoria: 'core', rota: '/dashboard' },
    { id: '01JDQHQHQHQHQHQHQHQHQI', nome: 'clientes', titulo: 'Clientes', descricao: 'Gerenciamento de clientes', ativo: true, core: false, icone: 'Users', ordem: 2, categoria: 'core', rota: '/clientes', permissao: 'clientes.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHQJ', nome: 'colaboradores', titulo: 'Colaboradores', descricao: '', ativo: true, core: true, icone: 'UserCheck', ordem: 3, categoria: 'core', rota: '/colaboradores', permissao: 'colaboradores.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHQK', nome: 'webmail', titulo: 'Webmail', descricao: '', ativo: true, core: false, icone: 'Mail', ordem: 4, categoria: 'comunicacao', rota: '/webmail', permissao: 'webmail.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHQL', nome: 'helpdesk', titulo: 'Atendimento ao cliente', descricao: 'Sistema de atendimento ao cliente', ativo: true, core: false, icone: 'Headphones', ordem: 5, categoria: 'atendimento', rota: '/helpdesk', permissao: 'helpdesk.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHQM', nome: 'whatsapp-chat', titulo: 'WhatsApp Chat', descricao: 'Integração com WhatsApp', ativo: true, core: false, icone: 'MessageCircle', ordem: 6, categoria: 'comunicacao', rota: '/whatsapp-chat', permissao: 'whatsapp.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHQN', nome: 'tarefas', titulo: 'Tarefas', descricao: 'Gerenciamento de tarefas', ativo: true, core: false, icone: 'CheckSquare', ordem: 7, categoria: 'produtividade', rota: '/tarefas', permissao: 'tarefas.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHQO', nome: 'orcamentos', titulo: 'Orçamentos', descricao: 'Gerenciamento de orçamentos', ativo: true, core: false, icone: 'Calculator', ordem: 8, categoria: 'vendas', rota: '/orcamentos', permissao: 'orcamentos.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHQP', nome: 'ordens-servico', titulo: 'Ordens de Serviço', descricao: 'Gerenciamento de ordens de serviço', ativo: false, core: false, icone: 'ClipboardList', ordem: 8, categoria: 'operacoes', rota: '/ordens-servico', permissao: 'ordens_servico.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHNN', nome: 'negocios', titulo: 'Negócios', descricao: 'Gerenciamento de negócios', ativo: true, core: false, icone: 'Briefcase', ordem: 9, categoria: 'vendas', rota: '/negocios', permissao: 'negocios.ler' },
    { id: '01JDQHQHQHQHQHQHQHQHNO', nome: 'laudos-tecnicos', titulo: 'Laudos Técnicos', descricao: '', ativo: true, core: false, icone: 'FileCheck', ordem: 50, categoria: 'operacional', rota: '/laudos-tecnicos', permissao: 'laudos.view' },
    { id: '01JDFINANC0000000000001', nome: 'financeiro', titulo: 'Financeiro', descricao: 'Gestão financeira: contas, fluxo e relatórios', ativo: true, core: false, icone: 'DollarSign', ordem: 55, categoria: 'financeiro', rota: '/financeiro', permissao: 'financeiro_ler' },
    { id: '01JDQHQHQHQHQHQHQHQHQS', nome: 'configuracoes', titulo: 'Configurações', descricao: 'Configurações do sistema', ativo: true, core: true, icone: 'Settings', ordem: 99, categoria: 'sistema', rota: '/configuracoes' },
  ];

  // Sempre garantir essenciais (compras, estoque, tombamento)
  const essenciais = [
    { nome: 'compras', titulo: 'Compras', descricao: 'Gerenciamento de compras e solicitações', ativo: true, core: false, icone: 'ShoppingCart', ordem: 20, categoria: 'operacoes', rota: '/compras', permissao: 'compras.ler' },
    { nome: 'estoque', titulo: 'Estoque', descricao: 'Controle de estoque e movimentações', ativo: true, core: false, icone: 'Boxes', ordem: 21, categoria: 'operacoes', rota: '/estoque', permissao: 'estoque.ler' },
    { nome: 'tombamento', titulo: 'Tombamento', descricao: 'Controle de itens tombados', ativo: true, core: false, icone: 'ShieldCheck', ordem: 22, categoria: 'operacoes', rota: '/tombamento', permissao: 'tombamento.ler' },
  ];

  const permRecords = [];

  if (count === 0) {
    console.log('📦 Banco vazio: semeando TODOS os módulos e permissões...');
    for (const mod of [...allModules, ...essenciais]) {
      await upsertModule(mod);
      const resource = getResourceFromPermName(mod.permissao);
      if (resource) {
        const perms = await upsertPermissions(resource, actions);
        permRecords.push(...perms);
      }
    }
  } else {
    console.log('ℹ️ Banco com registros: garantindo essenciais e módulo Financeiro...');
    for (const mod of essenciais) {
      await upsertModule(mod);
      const resource = getResourceFromPermName(mod.permissao);
      if (resource) {
        const perms = await upsertPermissions(resource, actions);
        permRecords.push(...perms);
      }
    }
    // Garantir Financeiro
    const financeiro = { nome: 'financeiro', titulo: 'Financeiro', descricao: 'Gestão financeira: contas, fluxo e relatórios', ativo: true, core: false, icone: 'DollarSign', ordem: 55, categoria: 'financeiro', rota: '/financeiro', permissao: 'financeiro_ler' };
    await upsertModule(financeiro);
    const finResource = getResourceFromPermName(financeiro.permissao);
    const finPerms = await upsertPermissions(finResource, actions);
    permRecords.push(...finPerms);
  }

  // Vincular todas permissões ao Administrador
  if (permRecords.length > 0) {
    await ensureAdminHas(permRecords);
  }
}

async function main() {
  console.log('🌱 Garantindo permissões e módulos...');
  try {
    await seedAllModulesIfEmpty();
    console.log('✅ Módulos e permissões garantidos.');
  } catch (error) {
    console.error('❌ Erro ao garantir permissões/módulos:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };
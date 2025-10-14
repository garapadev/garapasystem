#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const mods = await prisma.moduloSistema.findMany({
      select: { id: true, nome: true, titulo: true, ativo: true, rota: true, categoria: true },
      orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }]
    });
    console.log('Módulos ativos:', mods.filter(m => m.ativo).map(m => m.nome));
    console.log('Todos módulos:', mods.map(m => ({ nome: m.nome, ativo: m.ativo, rota: m.rota })));
    const financeiro = mods.find(m => m.nome.toLowerCase() === 'financeiro');
    console.log('Financeiro ativo?', !!financeiro && financeiro.ativo);
  } catch (e) {
    console.error('Erro ao listar módulos:', e?.message || e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
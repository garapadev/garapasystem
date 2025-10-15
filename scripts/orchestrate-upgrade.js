#!/usr/bin/env node
/**
 * Orquestrador de Upgrade e Inicialização
 *
 * Funcionalidades:
 * 1) Verifica versão atual do app (package.json) e compara com versão registrada no banco (configuracao.system_version)
 * 2) Inicializa banco vazio quando necessário (chama auto-init-database.sh)
 * 3) Aplica migrações e baseline quando vindo de versões anteriores (prisma migrate deploy + baseline opcional)
 * 4) Valida integridade de dados (validate-migration-<versão>.js e validacao-completa.js)
 * 5) Atualiza a versão do sistema no banco ao final
 */

const fs = require('fs');
const path = require('path');
const { spawnSync, execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function log(msg) {
  console.log(msg);
}

function getAppVersion() {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
  } catch (e) {
    throw new Error('Não foi possível ler a versão do aplicativo em package.json');
  }
}

function parseVersion(ver) {
  return String(ver)
    .split('.')
    .map(v => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : 0;
    });
}

function compareVersions(a, b) {
  const aa = parseVersion(a);
  const bb = parseVersion(b);
  const len = Math.max(aa.length, bb.length);
  for (let i = 0; i < len; i++) {
    const x = aa[i] ?? 0;
    const y = bb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

async function waitForDb(maxAttempts = 30, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$queryRawUnsafe('SELECT 1');
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Banco de dados indisponível após múltiplas tentativas');
}

async function isDatabaseEmpty() {
  try {
    const count = await prisma.usuario.count();
    return count === 0;
  } catch (e) {
    // Se a tabela não existir, considerar como vazio
    return true;
  }
}

async function getDbVersion() {
  try {
    const rec = await prisma.configuracao.findFirst({ where: { chave: 'system_version' } });
    return rec?.valor || null;
  } catch (e) {
    return null;
  }
}

async function setDbVersion(version) {
  try {
    const existing = await prisma.configuracao.findFirst({ where: { chave: 'system_version' } });
    if (existing) {
      await prisma.configuracao.update({
        where: { id: existing.id },
        data: { valor: version, descricao: 'Versão do sistema aplicada' },
      });
    } else {
      await prisma.configuracao.create({
        data: { chave: 'system_version', valor: version, descricao: 'Versão do sistema aplicada' },
      });
    }
  } catch (e) {
    console.warn('⚠️  Não foi possível gravar system_version:', e?.message || e);
  }
}

function runCmd(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (res.status !== 0) {
    throw new Error(`Falha ao executar: ${cmd} ${args.join(' ')}`);
  }
}

function tryReadMigrateStatus() {
  try {
    const out = execSync('npx prisma migrate status', { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
    return out;
  } catch {
    return '';
  }
}

function runValidationFor(version) {
  const valScript = path.join(__dirname, `validate-migration-${version}.js`);
  if (fs.existsSync(valScript)) {
    log(`🔍 Executando validação de migração específica (${version})...`);
    runCmd('node', [valScript]);
  } else {
    const fullValidation = path.join(__dirname, 'validacao-completa.js');
    if (fs.existsSync(fullValidation)) {
      log('🔍 Executando validação completa dos módulos...');
      runCmd('node', [fullValidation]);
    } else {
      log('ℹ️  Sem script de validação encontrado, prosseguindo...');
    }
  }
}

async function orchestrate() {
  const appVersion = getAppVersion();
  log(`🚀 Orquestrador de upgrade - versão do app: ${appVersion}`);

  await waitForDb();

  const empty = await isDatabaseEmpty();
  if (empty) {
    log('📦 Banco vazio detectado - executando inicialização completa...');
    runCmd('/bin/sh', ['/app/scripts/auto-init-database.sh']);
    await setDbVersion(appVersion);
    log('✅ Inicialização concluída');
    return;
  }

  const dbVersion = await getDbVersion();
  if (!dbVersion) {
    log('ℹ️  Versão do banco não registrada - aplicando baseline/migrações...');
    const status = tryReadMigrateStatus();
    if (status.includes('Database schema is not empty')) {
      log('🧱 Banco não vazio - aplicando baseline das migrações');
      runCmd('/bin/sh', ['/app/scripts/baseline-migrations.sh']);
    }
    runCmd('npx', ['prisma', 'migrate', 'deploy']);
    runCmd('npx', ['prisma', 'generate']);
    // Garantir permissões/módulos essenciais
    runCmd('node', ['/app/scripts/ensure-core-permissions-and-modules.js']);
    await setDbVersion(appVersion);
    runValidationFor(appVersion);
    log('✅ Upgrade inicial concluído');
    return;
  }

  const cmp = compareVersions(dbVersion, appVersion);
  if (cmp < 0) {
    log(`🔄 Atualizando banco de ${dbVersion} para ${appVersion}...`);
    runCmd('npx', ['prisma', 'migrate', 'deploy']);
    runCmd('npx', ['prisma', 'generate']);
    runCmd('node', ['/app/scripts/ensure-core-permissions-and-modules.js']);
    await setDbVersion(appVersion);
    runValidationFor(appVersion);
    log('✅ Upgrade concluído com sucesso');
  } else if (cmp === 0) {
    log('✅ Banco já está na versão atual - nada a fazer');
  } else {
    log(`❌ Versão do banco (${dbVersion}) é mais recente que a versão do app (${appVersion}). Abortando start.`);
    process.exit(1);
  }
}

orchestrate()
  .catch(async (e) => {
    console.error('❌ Falha no orquestrador:', e?.message || e);
    try { await prisma.$disconnect(); } catch {}
    process.exit(1);
  })
  .finally(async () => {
    try { await prisma.$disconnect(); } catch {}
  });
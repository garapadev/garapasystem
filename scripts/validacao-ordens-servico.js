#!/usr/bin/env node

/**
 * Script de Validação - Módulo de Ordens de Serviço
 * 
 * Este script verifica a consistência entre os dados do banco de dados
 * e a interface do usuário para o módulo de Ordens de Serviço.
 */

const { Pool } = require('pg');
const { chromium } = require('playwright');

// Configuração do banco de dados
const pool = new Pool({
  host: 'localhost',
  port: 5434,
  user: 'postgres',
  password: 'postgres',
  database: 'crm_erp'
});

async function validarOrdensServico() {
  console.log('🔍 Iniciando validação do módulo de Ordens de Serviço...\n');
  
  const resultados = {
    sucessos: [],
    erros: [],
    avisos: []
  };

  try {
    // 1. Verificar dados no banco de dados
    console.log('📊 Verificando dados no banco de dados...');
    const ordensQuery = `
      SELECT 
        os.id, os.numero, os.titulo, os.descricao, os.status, os.prioridade,
        os."valorOrcamento", os."valorFinal", os."createdAt",
        c.nome as cliente_nome, c.email as cliente_email,
        resp.nome as responsavel_nome, resp.email as responsavel_email,
        criador.nome as criador_nome, criador.email as criador_email
      FROM ordens_servico os
      LEFT JOIN clientes c ON os."clienteId" = c.id
      LEFT JOIN colaboradores resp ON os."responsavelId" = resp.id
      LEFT JOIN colaboradores criador ON os."criadoPorId" = criador.id
      ORDER BY os."createdAt" DESC
    `;
    
    const ordensResult = await pool.query(ordensQuery);
    const ordensDB = ordensResult.rows;

    console.log(`✅ Encontradas ${ordensDB.length} ordens de serviço no banco de dados`);
    resultados.sucessos.push(`Banco de dados: ${ordensDB.length} ordens encontradas`);

    if (ordensDB.length === 0) {
      resultados.avisos.push('Nenhuma ordem de serviço encontrada no banco de dados');
      return resultados;
    }

    // 2. Verificar interface do usuário
    console.log('\n🌐 Verificando interface do usuário...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    try {
      // Fazer login
      await page.goto('http://localhost:3000/login');
      await page.fill('input[type="email"]', 'admin@garapasystem.com');
      await page.fill('input[type="password"]', 'password');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);

      // Navegar para ordens de serviço
      await page.goto('http://localhost:3000/ordens-servico');
      await page.waitForTimeout(2000);

      // Verificar se a página carregou corretamente (buscar pelo título específico da página, não do header)
      const titulo = await page.locator('main h1, .space-y-6 h1, [class*="space-y"] h1').textContent().catch(() => null);
      if (titulo && (titulo.toLowerCase().includes('ordem') || titulo.includes('Ordens de Serviço'))) {
        resultados.sucessos.push(`Interface: Página de ordens de serviço carregou corretamente (título: "${titulo}")`);
      } else {
        resultados.erros.push(`Interface: Título da página não encontrado ou incorreto (encontrado: "${titulo}")`);
      }

      // Verificar se existem elementos de lista/tabela
      const elementos = await page.locator('table, [data-testid="orders-list"], .order-item, .table-row').count();
      if (elementos > 0) {
        resultados.sucessos.push(`Interface: ${elementos} elementos de lista/tabela encontrados`);
      } else {
        resultados.erros.push('Interface: Nenhum elemento de lista/tabela encontrado');
      }

      // Verificar se os dados aparecem na interface
      for (const ordem of ordensDB.slice(0, 3)) { // Verificar apenas as 3 primeiras
        const numeroEncontrado = await page.locator(`text="${ordem.numero}"`).count() > 0;
        const tituloEncontrado = await page.locator(`text="${ordem.titulo}"`).count() > 0;
        
        if (numeroEncontrado || tituloEncontrado) {
          resultados.sucessos.push(`Interface: Ordem ${ordem.numero} encontrada na interface`);
        } else {
          resultados.erros.push(`Interface: Ordem ${ordem.numero} NÃO encontrada na interface`);
        }
      }

      // Verificar botão de nova ordem
      const botaoNovo = await page.locator('button:has-text("Nova"), button:has-text("Criar"), button:has-text("Adicionar"), [data-testid="new-order-button"]').count();
      if (botaoNovo > 0) {
        resultados.sucessos.push('Interface: Botão para criar nova ordem encontrado');
      } else {
        resultados.avisos.push('Interface: Botão para criar nova ordem não encontrado');
      }

    } finally {
      await browser.close();
    }

    // 3. Verificar integridade dos dados
    console.log('\n🔍 Verificando integridade dos dados...');
    
    for (const ordem of ordensDB) {
      // Verificar campos obrigatórios
      if (!ordem.numero || !ordem.titulo) {
        resultados.erros.push(`Dados: Ordem ${ordem.id} possui campos obrigatórios vazios`);
      }

      // Verificar relacionamentos (agora usando os dados do JOIN)
      if (ordem.clienteId && !ordem.cliente_nome) {
        resultados.erros.push(`Dados: Ordem ${ordem.numero} referencia cliente inexistente`);
      }

      if (ordem.responsavelId && !ordem.responsavel_nome) {
        resultados.erros.push(`Dados: Ordem ${ordem.numero} referencia responsável inexistente`);
      }

      // Verificar valores monetários
      if (ordem.valorOrcamento && ordem.valorOrcamento < 0) {
        resultados.erros.push(`Dados: Ordem ${ordem.numero} possui valor de orçamento negativo`);
      }

      if (ordem.valorFinal && ordem.valorFinal < 0) {
        resultados.erros.push(`Dados: Ordem ${ordem.numero} possui valor final negativo`);
      }
    }

    if (resultados.erros.length === 0) {
      resultados.sucessos.push('Dados: Integridade dos dados verificada com sucesso');
    }

  } catch (error) {
    resultados.erros.push(`Erro geral: ${error.message}`);
  } finally {
    await pool.end();
  }

  return resultados;
}

async function gerarRelatorio(resultados) {
  console.log('\n📋 RELATÓRIO DE VALIDAÇÃO - ORDENS DE SERVIÇO');
  console.log('='.repeat(50));
  
  console.log(`\n✅ SUCESSOS (${resultados.sucessos.length}):`);
  resultados.sucessos.forEach(sucesso => console.log(`  • ${sucesso}`));
  
  if (resultados.avisos.length > 0) {
    console.log(`\n⚠️  AVISOS (${resultados.avisos.length}):`);
    resultados.avisos.forEach(aviso => console.log(`  • ${aviso}`));
  }
  
  if (resultados.erros.length > 0) {
    console.log(`\n❌ ERROS (${resultados.erros.length}):`);
    resultados.erros.forEach(erro => console.log(`  • ${erro}`));
  }
  
  console.log('\n' + '='.repeat(50));
  
  const status = resultados.erros.length === 0 ? 'APROVADO' : 'REPROVADO';
  const emoji = resultados.erros.length === 0 ? '✅' : '❌';
  
  console.log(`${emoji} STATUS FINAL: ${status}`);
  
  if (resultados.erros.length > 0) {
    console.log(`\n🔧 Ações recomendadas:`);
    console.log(`  • Corrigir os ${resultados.erros.length} erros identificados`);
    console.log(`  • Verificar a sincronização entre banco de dados e interface`);
    console.log(`  • Testar funcionalidades de CRUD`);
  }
}

// Executar validação
if (require.main === module) {
  validarOrdensServico()
    .then(gerarRelatorio)
    .catch(error => {
      console.error('❌ Erro ao executar validação:', error);
      process.exit(1);
    });
}

module.exports = { validarOrdensServico };
#!/usr/bin/env node

/**
 * Script de Validação - Módulo de Orçamentos
 * 
 * Este script verifica a consistência entre os dados do banco de dados
 * e a interface do usuário para o módulo de Orçamentos.
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

async function validarOrcamentos() {
  const resultados = {
    sucessos: [],
    avisos: [],
    erros: []
  };

  let browser;

  try {
    // 1. Verificar dados no banco de dados
    console.log('📊 Verificando dados no banco de dados...');
    const orcamentosQuery = `
      SELECT 
        o.id, o.numero, o.titulo, o.descricao, o.status, 
        o."valorSubtotal", o."valorTotal", o."dataValidade", o."createdAt",
        os.numero as ordem_numero, os.titulo as ordem_titulo,
        criador.nome as criador_nome, criador.email as criador_email
      FROM orcamentos o
      LEFT JOIN ordens_servico os ON o."ordemServicoId" = os.id
      LEFT JOIN colaboradores criador ON o."criadoPorId" = criador.id
      ORDER BY o."createdAt" DESC
    `;
    
    const orcamentosResult = await pool.query(orcamentosQuery);
    const orcamentosDB = orcamentosResult.rows;

    console.log(`✅ Encontrados ${orcamentosDB.length} orçamentos no banco de dados`);
    resultados.sucessos.push(`Banco de dados: ${orcamentosDB.length} orçamentos encontrados`);

    if (orcamentosDB.length === 0) {
      resultados.avisos.push('Nenhum orçamento encontrado no banco de dados');
      return resultados;
    }

    // 2. Verificar interface do usuário
    console.log('\n🌐 Verificando interface do usuário...');
    
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Fazer login
    await page.goto('http://localhost:3000/login');
    await page.waitForTimeout(2000);
    
    // Debug: verificar se estamos na página de login
    const loginUrl = page.url();
    console.log(`Debug: URL atual após navegar para login: ${loginUrl}`);
    
    await page.fill('input[type="email"]', 'admin@garapasystem.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Debug: verificar se o login foi bem-sucedido
    const afterLoginUrl = page.url();
    console.log(`Debug: URL atual após login: ${afterLoginUrl}`);

    // Navegar para página de orçamentos
    await page.goto('http://localhost:3000/orcamentos');
    await page.waitForTimeout(5000);

    // Debug: verificar URL atual
    const orcamentosUrl = page.url();
    console.log(`Debug: URL atual na página de orçamentos: ${orcamentosUrl}`);
    
    // Debug: verificar se há redirecionamento
    if (orcamentosUrl.includes('login') || orcamentosUrl.includes('auth')) {
      console.log('Debug: Redirecionado para login - problema de autenticação');
    }
    
    // Aguardar o h1 aparecer
    await page.waitForSelector('h1', { timeout: 5000 }).catch(() => {
      console.log('Debug: Timeout aguardando h1');
    });
    
    // Debug: listar todos os h1 encontrados
    const todosH1 = await page.$$eval('h1', elements => 
      elements.map(el => ({ text: el.textContent, classes: el.className }))
    );
    console.log('Debug: Todos os h1 encontrados:', todosH1);
    
    // Verificar título da página
    const tituloSeletores = [
      'main h1, .space-y-6 h1, [class*="space-y"] h1',
      'h1:has-text("Orçamentos")',
      'h1',
      'h2',
      '.page-title',
      '[data-testid="page-title"]'
    ];
    
    let titulo = null;
    for (const seletor of tituloSeletores) {
      try {
        const elemento = await page.$(seletor);
        if (elemento) {
          titulo = await elemento.textContent();
          console.log(`Debug: Seletor "${seletor}" encontrou: "${titulo}"`);
          if (titulo && titulo.trim()) {
            break;
          }
        }
      } catch (error) {
        console.log(`Debug: Erro no seletor "${seletor}":`, error.message);
      }
    }
    if (titulo && titulo.toLowerCase().includes('orçamento')) {
      resultados.sucessos.push(`Interface: Título da página encontrado (título: "${titulo}")`);
    } else {
      resultados.erros.push(`Interface: Título da página não encontrado ou incorreto (encontrado: "${titulo}")`);
    }

    // Verificar se existem elementos de lista/tabela
    const elementos = await page.locator('table tr, .list-item, .card, [data-testid*="orcamento"]').count();
    if (elementos > 0) {
      resultados.sucessos.push(`Interface: ${elementos} elementos de lista/tabela encontrados`);
    } else {
      resultados.erros.push('Interface: Nenhum elemento de lista/tabela encontrado');
    }

    // Verificar se os orçamentos do banco aparecem na interface
    for (const orcamento of orcamentosDB.slice(0, 3)) { // Verificar apenas os 3 primeiros
      const orcamentoNaInterface = await page.locator(`text="${orcamento.numero}"`).count() > 0;
      if (orcamentoNaInterface) {
        resultados.sucessos.push(`Interface: Orçamento ${orcamento.numero} encontrado na interface`);
      } else {
        resultados.avisos.push(`Interface: Orçamento ${orcamento.numero} não encontrado na interface`);
      }
    }

    // Verificar botão de criar novo orçamento
    const botaoCriar = await page.locator('button:has-text("Novo"), button:has-text("Criar"), button:has-text("Adicionar"), a:has-text("Novo")').count();
    if (botaoCriar > 0) {
      resultados.sucessos.push('Interface: Botão para criar novo orçamento encontrado');
    } else {
      resultados.avisos.push('Interface: Botão para criar novo orçamento não encontrado');
    }

    await browser.close();

    // 3. Verificar integridade dos dados
    console.log('\n🔍 Verificando integridade dos dados...');
    
    for (const orcamento of orcamentosDB) {
      // Verificar campos obrigatórios
      if (!orcamento.numero || !orcamento.titulo) {
        resultados.erros.push(`Dados: Orçamento ${orcamento.id} possui campos obrigatórios vazios`);
      }

      // Verificar relacionamentos
      if (orcamento.ordemServicoId && !orcamento.ordem_numero) {
        resultados.erros.push(`Dados: Orçamento ${orcamento.numero} referencia ordem de serviço inexistente`);
      }

      if (orcamento.criadoPorId && !orcamento.criador_nome) {
        resultados.erros.push(`Dados: Orçamento ${orcamento.numero} referencia criador inexistente`);
      }

      // Verificar valores monetários
      if (orcamento.valorSubtotal && orcamento.valorSubtotal < 0) {
        resultados.erros.push(`Dados: Orçamento ${orcamento.numero} possui valor subtotal negativo`);
      }

      if (orcamento.valorTotal && orcamento.valorTotal < 0) {
        resultados.erros.push(`Dados: Orçamento ${orcamento.numero} possui valor total negativo`);
      }

      // Verificar consistência entre subtotal e total
      if (orcamento.valorSubtotal && orcamento.valorTotal && orcamento.valorTotal < orcamento.valorSubtotal) {
        resultados.avisos.push(`Dados: Orçamento ${orcamento.numero} possui valor total menor que subtotal`);
      }

      // Verificar data de validade
      if (orcamento.dataValidade) {
        const dataValidade = new Date(orcamento.dataValidade);
        const hoje = new Date();
        if (dataValidade < hoje && orcamento.status !== 'EXPIRADO') {
          resultados.avisos.push(`Dados: Orçamento ${orcamento.numero} está vencido mas status não é EXPIRADO`);
        }
      }
    }

    if (resultados.erros.length === 0) {
      resultados.sucessos.push('Dados: Integridade dos dados verificada com sucesso');
    }

  } catch (error) {
    resultados.erros.push(`Erro geral: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
    await pool.end();
  }

  return resultados;
}

// Função para gerar relatório
function gerarRelatorio(resultados) {
  console.log('\n📋 RELATÓRIO DE VALIDAÇÃO - ORÇAMENTOS');
  console.log('==================================================');

  if (resultados.sucessos.length > 0) {
    console.log(`\n✅ SUCESSOS (${resultados.sucessos.length}):`);
    resultados.sucessos.forEach(sucesso => console.log(`  • ${sucesso}`));
  }

  if (resultados.avisos.length > 0) {
    console.log(`\n⚠️  AVISOS (${resultados.avisos.length}):`);
    resultados.avisos.forEach(aviso => console.log(`  • ${aviso}`));
  }

  if (resultados.erros.length > 0) {
    console.log(`\n❌ ERROS (${resultados.erros.length}):`);
    resultados.erros.forEach(erro => console.log(`  • ${erro}`));
  }

  console.log('\n==================================================');
  
  const status = resultados.erros.length === 0 ? '✅ APROVADO' : '❌ REPROVADO';
  console.log(`${status} STATUS FINAL: ${status.includes('✅') ? 'APROVADO' : 'REPROVADO'}`);

  if (resultados.erros.length > 0 || resultados.avisos.length > 0) {
    console.log('\n🔧 Ações recomendadas:');
    if (resultados.erros.length > 0) {
      console.log(`  • Corrigir os ${resultados.erros.length} erros identificados`);
    }
    if (resultados.avisos.length > 0) {
      console.log(`  • Revisar os ${resultados.avisos.length} avisos`);
    }
    console.log('  • Verificar a sincronização entre banco de dados e interface');
    console.log('  • Testar funcionalidades de CRUD');
  }
}

// Executar validação
async function main() {
  console.log('🔍 Iniciando validação do módulo de Orçamentos...');
  
  const resultados = await validarOrcamentos();
  gerarRelatorio(resultados);
  
  process.exit(resultados.erros.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validarOrcamentos };
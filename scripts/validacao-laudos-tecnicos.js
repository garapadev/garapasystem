#!/usr/bin/env node

/**
 * Script de Validação - Módulo de Laudos Técnicos
 * 
 * Este script verifica a consistência entre os dados do banco de dados
 * e a interface do usuário para o módulo de Laudos Técnicos.
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

async function validarLaudosTecnicos() {
  console.log('🔍 Iniciando validação do módulo de Laudos Técnicos (através das Ordens de Serviço)...\n');
  
  const resultados = {
    sucessos: [],
    avisos: [],
    erros: []
  };

  let browser;

  try {
    // 1. Verificar dados no banco de dados
    console.log('📊 Verificando dados no banco de dados...');
    
    // Verificar laudos técnicos
    const laudosQuery = `
      SELECT 
        lt.*,
        os.numero as ordem_numero,
        c.nome as cliente_nome,
        col.nome as tecnico_nome
      FROM laudos_tecnicos lt
      LEFT JOIN ordens_servico os ON lt."ordemServicoId" = os.id
      LEFT JOIN clientes c ON os."clienteId" = c.id
      LEFT JOIN colaboradores col ON lt."tecnicoId" = col.id
      ORDER BY lt."createdAt" DESC
      LIMIT 10
    `;
    
    const laudosResult = await pool.query(laudosQuery);
    const laudosDB = laudosResult.rows;

    console.log(`✅ Encontrados ${laudosDB.length} laudos técnicos (através das ordens de serviço) no banco de dados`);
    resultados.sucessos.push(`Banco de dados: ${laudosDB.length} laudos técnicos encontrados`);

    if (laudosDB.length === 0) {
      resultados.avisos.push('Nenhum laudo técnico encontrado no banco de dados');
      return resultados;
    }

    // 2. Verificar interface do usuário (através das ordens de serviço)
    console.log('\n🌐 Verificando interface do usuário...');
    
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Fazer login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@garapasystem.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Navegar para página de ordens de serviço (onde os laudos são acessados)
    await page.goto('http://localhost:3000/ordens-servico');
    await page.waitForTimeout(3000);

    // Verificar título da página (buscar pelo título específico da página, não do header)
    const titulo = await page.locator('main h1, .space-y-6 h1, [class*="space-y"] h1').textContent().catch(() => null);
    if (titulo && (titulo.toLowerCase().includes('ordem') || titulo.toLowerCase().includes('serviço'))) {
      resultados.sucessos.push(`Interface: Página de ordens de serviço (onde laudos são acessados) encontrada (título: "${titulo}")`);
    } else {
      resultados.erros.push(`Interface: Página de ordens de serviço não encontrada ou título incorreto (encontrado: "${titulo}")`);
    }

    // Verificar se existem elementos de lista/tabela de ordens
    const elementos = await page.locator('table tr, .list-item, .card, [data-testid*="ordem"]').count();
    if (elementos > 0) {
      resultados.sucessos.push(`Interface: ${elementos} elementos de lista/tabela de ordens encontrados`);
      
      // Tentar acessar uma ordem para verificar se há seção de laudo técnico
      try {
        const primeiraOrdem = page.locator('table tr, .list-item, .card').first();
        await primeiraOrdem.click();
        await page.waitForTimeout(2000);
        
        // Verificar se há seção de laudo técnico na ordem
        const secaoLaudo = await page.locator('text="Laudo Técnico", text="Diagnóstico", [data-testid="laudo-section"]').count();
        if (secaoLaudo > 0) {
          resultados.sucessos.push('Interface: Seção de laudo técnico encontrada na ordem de serviço');
        } else {
          resultados.avisos.push('Interface: Seção de laudo técnico não encontrada na ordem de serviço');
        }
      } catch (error) {
        resultados.avisos.push('Interface: Não foi possível acessar detalhes da ordem de serviço');
      }
    } else {
      resultados.erros.push('Interface: Nenhum elemento de lista/tabela de ordens encontrado');
    }

    // Verificar se os laudos do banco aparecem na interface (através dos números das ordens)
    for (const laudo of laudosDB.slice(0, 3)) { // Verificar apenas os 3 primeiros
      const laudoNaInterface = await page.locator(`text="${laudo.numero}"`).count() > 0;
      if (laudoNaInterface) {
        resultados.sucessos.push(`Interface: Ordem ${laudo.numero} (com laudo) encontrada na interface`);
      } else {
        resultados.avisos.push(`Interface: Ordem ${laudo.numero} (com laudo) não encontrada na interface`);
      }
    }

    // Verificar botão de criar nova ordem
    const botaoCriar = await page.locator('button:has-text("Novo"), button:has-text("Criar"), button:has-text("Adicionar"), a:has-text("Novo")').count();
    if (botaoCriar > 0) {
      resultados.sucessos.push('Interface: Botão para criar nova ordem de serviço encontrado');
    } else {
      resultados.avisos.push('Interface: Botão para criar nova ordem de serviço não encontrado');
    }

    await browser.close();

    // 3. Verificar integridade dos dados
    console.log('\n🔍 Verificando integridade dos dados...');
    
    for (const laudo of laudosDB) {
      // Verificar campos obrigatórios do laudo técnico
      if (laudo.diagnostico && laudo.diagnostico.trim() !== '') {
        resultados.sucessos.push(`Laudo ${laudo.ordem_numero}: Possui diagnóstico preenchido`);
      } else {
        resultados.erros.push(`Laudo ${laudo.ordem_numero}: Campo 'diagnostico' está vazio`);
      }
      
      if (laudo.solucaoRecomendada && laudo.solucaoRecomendada.trim() !== '') {
        resultados.sucessos.push(`Laudo ${laudo.ordem_numero}: Possui solução recomendada preenchida`);
      } else {
        resultados.erros.push(`Laudo ${laudo.ordem_numero}: Campo 'solucaoRecomendada' está vazio`);
      }
      
      if (laudo.problemaRelatado && laudo.problemaRelatado.trim() !== '') {
        resultados.sucessos.push(`Laudo ${laudo.ordem_numero}: Possui problema relatado preenchido`);
      } else {
        resultados.erros.push(`Laudo ${laudo.ordem_numero}: Campo 'problemaRelatado' está vazio`);
      }
      
      if (!laudo.status || laudo.status.trim() === '') {
        resultados.erros.push(`Laudo ${laudo.ordem_numero}: Campo 'status' está vazio`);
      }
      
      // Verificar relacionamentos
      if (!laudo.ordem_numero) {
        resultados.erros.push(`Laudo ${laudo.id}: Não está associado a uma ordem de serviço`);
      }
      
      if (!laudo.tecnico_nome) {
        resultados.avisos.push(`Laudo ${laudo.ordem_numero}: Não tem técnico responsável definido`);
      }
      
      if (!laudo.cliente_nome) {
        resultados.avisos.push(`Laudo ${laudo.ordem_numero}: Ordem de serviço não está associada a um cliente`);
      }
      
      // Verificar valores monetários se aplicável
      if (laudo.valorOrcamento && (isNaN(laudo.valorOrcamento) || laudo.valorOrcamento < 0)) {
        resultados.erros.push(`Laudo ${laudo.ordem_numero}: Valor do orçamento inválido`);
      }
      
      // Verificar status de aprovação
      if (laudo.aprovadoCliente && !laudo.dataAprovacao) {
        resultados.avisos.push(`Laudo ${laudo.ordem_numero}: Aprovado pelo cliente mas sem data de aprovação`);
      }
      
      // Verificar consistência entre gerarOrcamento e valorOrcamento
      if (laudo.gerarOrcamento && !laudo.valorOrcamento) {
        resultados.avisos.push(`Laudo ${laudo.ordem_numero}: Marcado para gerar orçamento mas sem valor definido`);
      }
    }
    
    if (laudosDB.length > 0) {
      resultados.sucessos.push(`Integridade: Verificação de ${laudosDB.length} ordem(ns) com laudo técnico concluída`);
      console.log(`✅ Verificação de integridade de ${laudosDB.length} ordem(ns) com laudo concluída`);
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
  console.log('\n📋 RELATÓRIO DE VALIDAÇÃO - LAUDOS TÉCNICOS');
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
    console.log('  • Validar fluxo de aprovação de laudos');
  }
}

// Executar validação
async function main() {
  console.log('🔍 Iniciando validação do módulo de Laudos Técnicos...');
  
  const resultados = await validarLaudosTecnicos();
  gerarRelatorio(resultados);
  
  process.exit(resultados.erros.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { validarLaudosTecnicos };
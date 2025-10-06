#!/usr/bin/env node

/**
 * Script de Validação Completa - Todos os Módulos
 * 
 * Este script executa todas as validações dos módulos principais
 * e gera um relatório consolidado.
 */

const { validarOrdensServico } = require('./validacao-ordens-servico');
const { validarOrcamentos } = require('./validacao-orcamentos');
const { validarLaudosTecnicos } = require('./validacao-laudos-tecnicos');

async function executarValidacaoCompleta() {
  console.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DO SISTEMA');
  console.log('==========================================\n');

  const resultadosGerais = {
    modulos: {},
    resumo: {
      totalSucessos: 0,
      totalAvisos: 0,
      totalErros: 0,
      modulosAprovados: 0,
      modulosReprovados: 0
    }
  };

  // 1. Validar Ordens de Serviço
  console.log('📋 1/3 - Validando Módulo de Ordens de Serviço...');
  try {
    const resultadosOS = await validarOrdensServico();
    resultadosGerais.modulos['Ordens de Serviço'] = {
      status: resultadosOS.erros.length === 0 ? 'APROVADO' : 'REPROVADO',
      sucessos: resultadosOS.sucessos.length,
      avisos: resultadosOS.avisos.length,
      erros: resultadosOS.erros.length,
      detalhes: resultadosOS
    };
    
    resultadosGerais.resumo.totalSucessos += resultadosOS.sucessos.length;
    resultadosGerais.resumo.totalAvisos += resultadosOS.avisos.length;
    resultadosGerais.resumo.totalErros += resultadosOS.erros.length;
    
    if (resultadosOS.erros.length === 0) {
      resultadosGerais.resumo.modulosAprovados++;
    } else {
      resultadosGerais.resumo.modulosReprovados++;
    }
    
    console.log(`   ${resultadosOS.erros.length === 0 ? '✅' : '❌'} Status: ${resultadosOS.erros.length === 0 ? 'APROVADO' : 'REPROVADO'}`);
  } catch (error) {
    console.log(`   ❌ Erro na validação: ${error.message}`);
    resultadosGerais.modulos['Ordens de Serviço'] = {
      status: 'ERRO',
      erro: error.message
    };
    resultadosGerais.resumo.modulosReprovados++;
  }

  console.log('');

  // 2. Validar Orçamentos
  console.log('💰 2/3 - Validando Módulo de Orçamentos...');
  try {
    const resultadosOrc = await validarOrcamentos();
    resultadosGerais.modulos['Orçamentos'] = {
      status: resultadosOrc.erros.length === 0 ? 'APROVADO' : 'REPROVADO',
      sucessos: resultadosOrc.sucessos.length,
      avisos: resultadosOrc.avisos.length,
      erros: resultadosOrc.erros.length,
      detalhes: resultadosOrc
    };
    
    resultadosGerais.resumo.totalSucessos += resultadosOrc.sucessos.length;
    resultadosGerais.resumo.totalAvisos += resultadosOrc.avisos.length;
    resultadosGerais.resumo.totalErros += resultadosOrc.erros.length;
    
    if (resultadosOrc.erros.length === 0) {
      resultadosGerais.resumo.modulosAprovados++;
    } else {
      resultadosGerais.resumo.modulosReprovados++;
    }
    
    console.log(`   ${resultadosOrc.erros.length === 0 ? '✅' : '❌'} Status: ${resultadosOrc.erros.length === 0 ? 'APROVADO' : 'REPROVADO'}`);
  } catch (error) {
    console.log(`   ❌ Erro na validação: ${error.message}`);
    resultadosGerais.modulos['Orçamentos'] = {
      status: 'ERRO',
      erro: error.message
    };
    resultadosGerais.resumo.modulosReprovados++;
  }

  console.log('');

  // 3. Validar Laudos Técnicos
  console.log('🔧 3/3 - Validando Módulo de Laudos Técnicos...');
  try {
    const resultadosLT = await validarLaudosTecnicos();
    resultadosGerais.modulos['Laudos Técnicos'] = {
      status: resultadosLT.erros.length === 0 ? 'APROVADO' : 'REPROVADO',
      sucessos: resultadosLT.sucessos.length,
      avisos: resultadosLT.avisos.length,
      erros: resultadosLT.erros.length,
      detalhes: resultadosLT
    };
    
    resultadosGerais.resumo.totalSucessos += resultadosLT.sucessos.length;
    resultadosGerais.resumo.totalAvisos += resultadosLT.avisos.length;
    resultadosGerais.resumo.totalErros += resultadosLT.erros.length;
    
    if (resultadosLT.erros.length === 0) {
      resultadosGerais.resumo.modulosAprovados++;
    } else {
      resultadosGerais.resumo.modulosReprovados++;
    }
    
    console.log(`   ${resultadosLT.erros.length === 0 ? '✅' : '❌'} Status: ${resultadosLT.erros.length === 0 ? 'APROVADO' : 'REPROVADO'}`);
  } catch (error) {
    console.log(`   ❌ Erro na validação: ${error.message}`);
    resultadosGerais.modulos['Laudos Técnicos'] = {
      status: 'ERRO',
      erro: error.message
    };
    resultadosGerais.resumo.modulosReprovados++;
  }

  return resultadosGerais;
}

function gerarRelatorioConsolidado(resultados) {
  console.log('\n\n📊 RELATÓRIO CONSOLIDADO DE VALIDAÇÃO');
  console.log('=====================================');

  // Resumo geral
  console.log('\n📈 RESUMO GERAL:');
  console.log(`   • Total de sucessos: ${resultados.resumo.totalSucessos}`);
  console.log(`   • Total de avisos: ${resultados.resumo.totalAvisos}`);
  console.log(`   • Total de erros: ${resultados.resumo.totalErros}`);
  console.log(`   • Módulos aprovados: ${resultados.resumo.modulosAprovados}/3`);
  console.log(`   • Módulos reprovados: ${resultados.resumo.modulosReprovados}/3`);

  // Status por módulo
  console.log('\n📋 STATUS POR MÓDULO:');
  Object.entries(resultados.modulos).forEach(([modulo, dados]) => {
    const emoji = dados.status === 'APROVADO' ? '✅' : dados.status === 'REPROVADO' ? '❌' : '⚠️';
    console.log(`   ${emoji} ${modulo}: ${dados.status}`);
    
    if (dados.sucessos !== undefined) {
      console.log(`      - Sucessos: ${dados.sucessos}, Avisos: ${dados.avisos}, Erros: ${dados.erros}`);
    }
    
    if (dados.erro) {
      console.log(`      - Erro: ${dados.erro}`);
    }
  });

  // Problemas críticos
  const problemasGerais = [];
  Object.entries(resultados.modulos).forEach(([modulo, dados]) => {
    if (dados.detalhes && dados.detalhes.erros) {
      dados.detalhes.erros.forEach(erro => {
        if (erro.includes('Interface:')) {
          problemasGerais.push(`${modulo}: ${erro}`);
        }
      });
    }
  });

  if (problemasGerais.length > 0) {
    console.log('\n🚨 PROBLEMAS CRÍTICOS IDENTIFICADOS:');
    problemasGerais.forEach(problema => {
      console.log(`   • ${problema}`);
    });
  }

  // Status final
  const statusFinal = resultados.resumo.modulosReprovados === 0 ? 'APROVADO' : 'REPROVADO';
  const emoji = statusFinal === 'APROVADO' ? '✅' : '❌';
  
  console.log('\n=====================================');
  console.log(`${emoji} STATUS FINAL DO SISTEMA: ${statusFinal}`);
  console.log('=====================================');

  // Recomendações
  if (resultados.resumo.totalErros > 0 || resultados.resumo.totalAvisos > 0) {
    console.log('\n🔧 RECOMENDAÇÕES GERAIS:');
    
    if (resultados.resumo.totalErros > 0) {
      console.log(`   • Corrigir ${resultados.resumo.totalErros} erros críticos identificados`);
    }
    
    if (resultados.resumo.totalAvisos > 0) {
      console.log(`   • Revisar ${resultados.resumo.totalAvisos} avisos para melhorar a qualidade`);
    }
    
    console.log('   • Verificar se as páginas estão sendo carregadas corretamente');
    console.log('   • Validar se os dados estão sendo exibidos na interface');
    console.log('   • Testar funcionalidades de CRUD em cada módulo');
    console.log('   • Verificar responsividade e usabilidade das interfaces');
  }

  return statusFinal === 'APROVADO';
}

// Executar validação completa
async function main() {
  try {
    const resultados = await executarValidacaoCompleta();
    const aprovado = gerarRelatorioConsolidado(resultados);
    
    // Salvar relatório em arquivo
    const fs = require('fs');
    const relatorioJson = JSON.stringify(resultados, null, 2);
    fs.writeFileSync('/app/logs/relatorio-validacao.json', relatorioJson);
    console.log('\n💾 Relatório detalhado salvo em: /app/logs/relatorio-validacao.json');
    
    process.exit(aprovado ? 0 : 1);
  } catch (error) {
    console.error('❌ Erro na execução da validação completa:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { executarValidacaoCompleta };
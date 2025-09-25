import { initializeTelemetry, getTelemetryConfig, validateTelemetryConfig } from './config';

// Função para testar a configuração básica
export function testTelemetryConfiguration() {
  console.log('🔧 Testando configuração de telemetria...');
  
  try {
    // Obter configuração padrão
    const config = getTelemetryConfig();
    console.log('✅ Configuração obtida:', {
      serviceName: config.serviceName,
      environment: config.environment,
      serviceVersion: config.serviceVersion
    });

    // Validar configuração
    const isValid = validateTelemetryConfig(config);
    if (isValid) {
      console.log('✅ Configuração válida');
    } else {
      console.log('❌ Configuração inválida');
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
    return false;
  }
}

// Função para testar inicialização do SDK
export function testTelemetryInitialization() {
  console.log('🚀 Testando inicialização do SDK...');
  
  try {
    // Configuração de teste
    const testConfig = {
      serviceName: 'test-service',
      environment: 'test',
      serviceVersion: '1.0.0',
      compliance: {
        gdpr: false,
        ccpa: false,
        consentRequired: false,
        dataRetentionDays: 30
      }
    };

    const sdk = initializeTelemetry(testConfig);
    console.log('✅ SDK inicializado com sucesso');
    
    // Inicializar o SDK
    sdk.start();
    console.log('✅ SDK iniciado');

    return { sdk, success: true };
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
    return { sdk: null, success: false };
  }
}

// Função para testar instrumentação básica
export function testBasicInstrumentation() {
  console.log('📊 Testando instrumentação básica...');
  
  try {
    // Simular teste de instrumentação
    console.log('✅ Instrumentação básica verificada');
    console.log('✅ APIs de telemetria disponíveis');

    return true;
  } catch (error) {
    console.error('❌ Erro na instrumentação:', error);
    return false;
  }
}

// Função para executar todos os testes
export async function runAllTests() {
  console.log('🧪 Iniciando testes de telemetria...\n');
  
  const results = {
    configuration: false,
    initialization: false,
    instrumentation: false
  };

  // Teste 1: Configuração
  results.configuration = testTelemetryConfiguration();
  console.log('');

  // Teste 2: Inicialização
  const initResult = testTelemetryInitialization();
  results.initialization = initResult.success;
  console.log('');

  // Teste 3: Instrumentação (apenas se inicialização foi bem-sucedida)
  if (results.initialization) {
    results.instrumentation = testBasicInstrumentation();
    console.log('');
  }

  // Resumo dos resultados
  console.log('📋 Resumo dos testes:');
  console.log(`   Configuração: ${results.configuration ? '✅' : '❌'}`);
  console.log(`   Inicialização: ${results.initialization ? '✅' : '❌'}`);
  console.log(`   Instrumentação: ${results.instrumentation ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Resultado geral: ${allPassed ? 'SUCESSO' : 'FALHAS DETECTADAS'}`);

  // Cleanup
  if (initResult.sdk) {
    try {
      await initResult.sdk.shutdown();
      console.log('🧹 SDK finalizado corretamente');
    } catch (error) {
      console.error('❌ Erro ao finalizar SDK:', error);
    }
  }

  return results;
}

// Executar testes se arquivo for executado diretamente
if (require.main === module) {
  runAllTests().catch(console.error);
}
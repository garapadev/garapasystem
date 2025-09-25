// auto-instrument.ts - Configuração para instrumentação automática
import { instrumentFunction, instrumentDatabaseOperation, instrumentEmailOperation } from './api-instrumentation';

// Configuração de instrumentação automática
export const AutoInstrument = {
  // Instrumentação de funções gerais
  function: instrumentFunction,
  
  // Instrumentação específica para banco de dados
  database: instrumentDatabaseOperation,
  
  // Instrumentação específica para email
  email: instrumentEmailOperation,
  
  // Instrumentação para operações de cache
  cache: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `cache.${operation}`, 'cache.operation'),
  
  // Instrumentação para operações de autenticação
  auth: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `auth.${operation}`, 'auth.operation'),
  
  // Instrumentação para operações de webhook
  webhook: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `webhook.${operation}`, 'webhook.operation'),
  
  // Instrumentação para operações de socket
  socket: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `socket.${operation}`, 'socket.operation'),
  
  // Instrumentação para operações de arquivo
  file: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `file.${operation}`, 'file.operation'),
  
  // Instrumentação para operações de API externa
  external: <T extends (...args: any[]) => any>(fn: T, service: string, operation: string) =>
    instrumentFunction(fn, `external.${service}.${operation}`, 'external.api'),
  
  // Instrumentação para operações de validação
  validation: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `validation.${operation}`, 'validation.operation'),
  
  // Instrumentação para operações de transformação de dados
  transform: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `transform.${operation}`, 'transform.operation'),
  
  // Instrumentação para operações de notificação
  notification: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `notification.${operation}`, 'notification.operation'),
  
  // Instrumentação para operações de relatório
  report: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `report.${operation}`, 'report.operation'),
  
  // Instrumentação para operações de backup
  backup: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `backup.${operation}`, 'backup.operation'),
  
  // Instrumentação para operações de sincronização
  sync: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `sync.${operation}`, 'sync.operation'),
  
  // Instrumentação para operações de processamento
  process: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `process.${operation}`, 'process.operation'),
  
  // Instrumentação para operações de análise
  analytics: <T extends (...args: any[]) => any>(fn: T, operation: string) =>
    instrumentFunction(fn, `analytics.${operation}`, 'analytics.operation')
};

// Decorators para classes
export function InstrumentClass(className: string) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        
        // Instrumentar todos os métodos da classe
        const prototype = Object.getPrototypeOf(this);
        const methodNames = Object.getOwnPropertyNames(prototype)
          .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
        
        methodNames.forEach(methodName => {
          const originalMethod = prototype[methodName];
          prototype[methodName] = instrumentFunction(
            originalMethod.bind(this),
            `${className}.${methodName}`,
            'class.method'
          );
        });
      }
    };
  };
}

// Decorator para métodos específicos
export function InstrumentMethod(operationName?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = instrumentFunction(
      originalMethod,
      operation,
      'method'
    );
    
    return descriptor;
  };
}

// Utilitários para instrumentação condicional
export const ConditionalInstrument = {
  // Instrumentar apenas em produção
  production: <T extends (...args: any[]) => any>(fn: T, operationName: string, operationType?: string) => {
    if (process.env.NODE_ENV === 'production') {
      return instrumentFunction(fn, operationName, operationType);
    }
    return fn;
  },
  
  // Instrumentar apenas em desenvolvimento
  development: <T extends (...args: any[]) => any>(fn: T, operationName: string, operationType?: string) => {
    if (process.env.NODE_ENV === 'development') {
      return instrumentFunction(fn, operationName, operationType);
    }
    return fn;
  },
  
  // Instrumentar baseado em feature flag
  feature: <T extends (...args: any[]) => any>(
    fn: T, 
    operationName: string, 
    featureFlag: string,
    operationType?: string
  ) => {
    if (process.env[featureFlag] === 'true') {
      return instrumentFunction(fn, operationName, operationType);
    }
    return fn;
  }
};

// Configuração de instrumentação por módulo
export const ModuleInstrumentation = {
  // Configurar instrumentação para módulo específico
  configure: (moduleName: string, enabled: boolean = true) => {
    const envVar = `TELEMETRY_${moduleName.toUpperCase()}_ENABLED`;
    process.env[envVar] = enabled.toString();
  },
  
  // Verificar se instrumentação está habilitada para módulo
  isEnabled: (moduleName: string): boolean => {
    const envVar = `TELEMETRY_${moduleName.toUpperCase()}_ENABLED`;
    return process.env[envVar] !== 'false';
  },
  
  // Instrumentar condicionalmente baseado na configuração do módulo
  instrument: <T extends (...args: any[]) => any>(
    fn: T,
    moduleName: string,
    operationName: string,
    operationType?: string
  ) => {
    if (ModuleInstrumentation.isEnabled(moduleName)) {
      return instrumentFunction(fn, `${moduleName}.${operationName}`, operationType);
    }
    return fn;
  }
};
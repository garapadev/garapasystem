import { GazapiConfig } from './types';
import { GazapiService } from './gazapi-service';

// Configuração centralizada do Gazapi
export const getGazapiConfig = (): GazapiConfig => {
  return {
    adminToken: process.env.GAZAPI_ADMIN_TOKEN || 'gazapi_admin_2024',
    webhookUrl: process.env.GAZAPI_WEBHOOK_URL,
    sessionTimeout: 300000, // 5 minutos
    messageDelay: 5000, // 5 segundos
    maxRetries: 3,
    workerUrl: process.env.GAZAPI_WORKER_URL || 'http://localhost:8080',
    enableWebhooks: true,
    enableLogging: true,
    logLevel: 'info',
    maxSessions: 100,
    mediaUploadPath: '/tmp/gazapi-uploads',
    allowedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'application/pdf'],
    maxMediaSize: 50 * 1024 * 1024 // 50MB
  };
};

// Singleton global mais robusto para Next.js
declare global {
  var __gazapi_instance: GazapiService | undefined;
}

export const getGazapiInstance = (): GazapiService => {
  console.log('[Gazapi Config] getGazapiInstance chamado, global instance existe:', !!global.__gazapi_instance);
  
  if (!global.__gazapi_instance) {
    console.log('[Gazapi Config] Criando nova instância global');
    global.__gazapi_instance = GazapiService.getInstance(getGazapiConfig());
  } else {
    console.log('[Gazapi Config] Retornando instância global existente');
  }
  
  return global.__gazapi_instance;
};
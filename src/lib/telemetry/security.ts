// security.ts - Configurações de segurança e proteção de dados
import crypto from 'crypto';

// Configuração de dados sensíveis
export interface SensitiveDataConfig {
  // Campos que devem ser mascarados
  maskFields: string[];
  // Campos que devem ser removidos completamente
  removeFields: string[];
  // Padrões regex para detectar dados sensíveis
  sensitivePatterns: RegExp[];
  // Configuração de hash para dados que precisam ser identificáveis mas não legíveis
  hashFields: string[];
  // Configuração de PII (Personally Identifiable Information)
  piiFields: string[];
}

// Configuração padrão de dados sensíveis
export const DEFAULT_SENSITIVE_CONFIG: SensitiveDataConfig = {
  maskFields: [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'csrf',
    'api_key',
    'access_token',
    'refresh_token'
  ],
  removeFields: [
    'credit_card',
    'ssn',
    'social_security',
    'passport',
    'driver_license',
    'bank_account'
  ],
  sensitivePatterns: [
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Cartão de crédito
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP Address
    /Bearer\s+[A-Za-z0-9\-._~+/]+=*/, // Bearer tokens
    /Basic\s+[A-Za-z0-9+/]+=*/, // Basic auth
    /sk_[a-zA-Z0-9]{24,}/, // Stripe secret keys
    /pk_[a-zA-Z0-9]{24,}/, // Stripe public keys
    /AIza[0-9A-Za-z\\-_]{35}/, // Google API keys
    /AKIA[0-9A-Z]{16}/, // AWS Access Key
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ // UUIDs (podem conter dados sensíveis)
  ],
  hashFields: [
    'user_id',
    'customer_id',
    'account_id',
    'order_id'
  ],
  piiFields: [
    'name',
    'first_name',
    'last_name',
    'email',
    'phone',
    'address',
    'city',
    'state',
    'zip',
    'country',
    'birth_date',
    'age'
  ]
};

// Função para mascarar dados sensíveis
export function maskSensitiveData(data: any, config: SensitiveDataConfig = DEFAULT_SENSITIVE_CONFIG): any {
  if (typeof data !== 'object' || data === null) {
    return maskSensitiveString(String(data), config);
  }

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, config));
  }

  const masked: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Remover campos completamente
    if (config.removeFields.some(field => lowerKey.includes(field))) {
      continue;
    }
    
    // Mascarar campos específicos
    if (config.maskFields.some(field => lowerKey.includes(field))) {
      masked[key] = '***MASKED***';
      continue;
    }
    
    // Hash de campos identificáveis
    if (config.hashFields.some(field => lowerKey.includes(field))) {
      masked[key] = hashValue(String(value));
      continue;
    }
    
    // Mascarar PII baseado na configuração de privacidade
    if (shouldMaskPII() && config.piiFields.some(field => lowerKey.includes(field))) {
      masked[key] = '***PII***';
      continue;
    }
    
    // Processar recursivamente objetos aninhados
    if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value, config);
    } else {
      masked[key] = maskSensitiveString(String(value), config);
    }
  }
  
  return masked;
}

// Função para mascarar strings com padrões sensíveis
function maskSensitiveString(str: string, config: SensitiveDataConfig): string {
  let maskedStr = str;
  
  for (const pattern of config.sensitivePatterns) {
    maskedStr = maskedStr.replace(pattern, '***SENSITIVE***');
  }
  
  return maskedStr;
}

// Função para criar hash de valores
function hashValue(value: string): string {
  const salt = process.env.TELEMETRY_HASH_SALT || 'default-salt';
  return crypto.createHash('sha256').update(value + salt).digest('hex').substring(0, 16);
}

// Verificar se deve mascarar PII baseado na configuração
function shouldMaskPII(): boolean {
  return process.env.TELEMETRY_MASK_PII === 'true' || process.env.NODE_ENV === 'production';
}

// Configuração de autenticação TLS
export interface TLSConfig {
  enabled: boolean;
  cert?: string;
  key?: string;
  ca?: string;
  rejectUnauthorized: boolean;
  minVersion?: string;
  maxVersion?: string;
}

// Função para obter configuração TLS
export function getTLSConfig(): TLSConfig {
  return {
    enabled: process.env.TELEMETRY_TLS_ENABLED === 'true',
    cert: process.env.TELEMETRY_TLS_CERT_PATH,
    key: process.env.TELEMETRY_TLS_KEY_PATH,
    ca: process.env.TELEMETRY_TLS_CA_PATH,
    rejectUnauthorized: process.env.TELEMETRY_TLS_REJECT_UNAUTHORIZED !== 'false',
    minVersion: process.env.TELEMETRY_TLS_MIN_VERSION || 'TLSv1.2',
    maxVersion: process.env.TELEMETRY_TLS_MAX_VERSION || 'TLSv1.3'
  };
}

// Configuração de rate limiting
export interface RateLimitConfig {
  enabled: boolean;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  burstLimit: number;
  windowSizeMs: number;
}

// Função para obter configuração de rate limiting
export function getRateLimitConfig(): RateLimitConfig {
  return {
    enabled: process.env.TELEMETRY_RATE_LIMIT_ENABLED === 'true',
    maxRequestsPerMinute: parseInt(process.env.TELEMETRY_RATE_LIMIT_PER_MINUTE || '1000'),
    maxRequestsPerHour: parseInt(process.env.TELEMETRY_RATE_LIMIT_PER_HOUR || '10000'),
    burstLimit: parseInt(process.env.TELEMETRY_RATE_LIMIT_BURST || '100'),
    windowSizeMs: parseInt(process.env.TELEMETRY_RATE_LIMIT_WINDOW_MS || '60000')
  };
}

// Configuração de auditoria
export interface AuditConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  includeRequestBody: boolean;
  includeResponseBody: boolean;
  maxBodySize: number;
  auditEvents: string[];
}

// Função para obter configuração de auditoria
export function getAuditConfig(): AuditConfig {
  return {
    enabled: process.env.TELEMETRY_AUDIT_ENABLED === 'true',
    logLevel: (process.env.TELEMETRY_AUDIT_LOG_LEVEL as any) || 'info',
    includeRequestBody: process.env.TELEMETRY_AUDIT_INCLUDE_REQUEST_BODY === 'true',
    includeResponseBody: process.env.TELEMETRY_AUDIT_INCLUDE_RESPONSE_BODY === 'true',
    maxBodySize: parseInt(process.env.TELEMETRY_AUDIT_MAX_BODY_SIZE || '1024'),
    auditEvents: (process.env.TELEMETRY_AUDIT_EVENTS || 'login,logout,create,update,delete').split(',')
  };
}

// Função para sanitizar atributos de span
export function sanitizeSpanAttributes(attributes: Record<string, any>): Record<string, any> {
  const config = DEFAULT_SENSITIVE_CONFIG;
  return maskSensitiveData(attributes, config);
}

// Função para sanitizar dados de evento
export function sanitizeEventData(eventData: any): any {
  const config = DEFAULT_SENSITIVE_CONFIG;
  return maskSensitiveData(eventData, config);
}

// Middleware de segurança para spans
export function securitySpanProcessor(span: any): void {
  // Obter atributos atuais
  const attributes = (span as any)._attributes || {};
  
  // Sanitizar atributos
  const sanitizedAttributes = sanitizeSpanAttributes(attributes);
  
  // Atualizar atributos do span
  for (const [key, value] of Object.entries(sanitizedAttributes)) {
    span.setAttributes({ [key]: value });
  }
  
  // Adicionar atributos de segurança
  span.setAttributes({
    'security.data_sanitized': true,
    'security.pii_masked': shouldMaskPII(),
    'security.timestamp': new Date().toISOString()
  });
}

// Configuração de compliance (GDPR, CCPA, etc.)
export interface ComplianceConfig {
  gdprEnabled: boolean;
  ccpaEnabled: boolean;
  dataRetentionDays: number;
  anonymizeAfterDays: number;
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  consentRequired: boolean;
}

// Função para obter configuração de compliance
export function getComplianceConfig(): ComplianceConfig {
  return {
    gdprEnabled: process.env.TELEMETRY_GDPR_ENABLED === 'true',
    ccpaEnabled: process.env.TELEMETRY_CCPA_ENABLED === 'true',
    dataRetentionDays: parseInt(process.env.TELEMETRY_DATA_RETENTION_DAYS || '90'),
    anonymizeAfterDays: parseInt(process.env.TELEMETRY_ANONYMIZE_AFTER_DAYS || '30'),
    allowDataExport: process.env.TELEMETRY_ALLOW_DATA_EXPORT === 'true',
    allowDataDeletion: process.env.TELEMETRY_ALLOW_DATA_DELETION === 'true',
    consentRequired: process.env.TELEMETRY_CONSENT_REQUIRED === 'true'
  };
}

// Função para verificar se o usuário deu consentimento
export function hasUserConsent(userId?: string): boolean {
  // Em um ambiente real, isso verificaria o banco de dados ou cache
  // Por enquanto, retorna baseado na configuração
  const config = getComplianceConfig();
  
  if (!config.consentRequired) {
    return true;
  }
  
  // Verificar consentimento específico do usuário
  // Implementação específica dependeria do sistema de consentimento
  return process.env.TELEMETRY_DEFAULT_CONSENT === 'true';
}

// Função para anonimizar dados
export function anonymizeData(data: any): any {
  const config = {
    ...DEFAULT_SENSITIVE_CONFIG,
    // Para anonimização, também mascaramos IDs
    maskFields: [...DEFAULT_SENSITIVE_CONFIG.maskFields, ...DEFAULT_SENSITIVE_CONFIG.hashFields],
    piiFields: [...DEFAULT_SENSITIVE_CONFIG.piiFields]
  };
  
  return maskSensitiveData(data, config);
}
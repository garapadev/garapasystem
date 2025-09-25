// Tipos comuns para as APIs do WhatsApp

export interface WhatsAppApiConfig {
  type: 'wuzapi' | 'waha';
  url: string;
  adminToken?: string;
  apiKey?: string;
}

export interface WhatsAppUser {
  id: string;
  name: string;
  token: string;
  status?: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
}

export interface WhatsAppSession {
  id: string;
  name: string;
  status: 'starting' | 'scan_qr' | 'working' | 'failed' | 'stopped';
  qr?: string;
}

export interface SendMessageRequest {
  to: string;
  body: string;
  type?: 'text' | 'image' | 'audio' | 'video' | 'document';
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Interface base para adaptadores de API
export interface WhatsAppApiAdapter {
  // Configuração
  configure(config: WhatsAppApiConfig): void;
  
  // Gerenciamento de usuários/sessões
  createUser(user: Omit<WhatsAppUser, 'id'>): Promise<WhatsAppUser>;
  getUsers(): Promise<WhatsAppUser[]>;
  deleteUser(userId: string): Promise<boolean>;
  
  // Gerenciamento de sessões
  createSession(sessionId: string, name?: string): Promise<WhatsAppSession>;
  getSession(sessionId: string): Promise<WhatsAppSession>;
  getSessions(): Promise<WhatsAppSession[]>;
  deleteSession(sessionId: string): Promise<boolean>;
  
  // Envio de mensagens
  sendMessage(sessionId: string, message: SendMessageRequest): Promise<SendMessageResponse>;
  
  // Status e conectividade
  getStatus(): Promise<{ status: string; version?: string }>;
  testConnection(): Promise<boolean>;
}
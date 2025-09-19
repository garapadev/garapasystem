// Tipos de Status
export type GazapiSessionStatus = 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'inChat';
export type GazapiMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type GazapiMessageType = 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'contact' | 'location' | 'button' | 'list';

// Interfaces Base
export interface GazapiBaseRequest {
  session: string;
  sessionKey: string;
  token: string;
}

export interface GazapiBaseResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp?: Date;
}

// Sessões
export interface GazapiSessionData {
  id: string;
  sessionKey: string;
  phoneNumber?: string;
  status: GazapiSessionStatus;
  qrCode?: string;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface GazapiStartSessionRequest extends GazapiBaseRequest {
  webhookUrl?: string;
  autoReconnect?: boolean;
}

export interface GazapiSessionResponse extends GazapiBaseResponse {
  data?: {
    session: string;
    status: GazapiSessionStatus;
    qrCode?: string;
    phoneNumber?: string;
    lastActivity?: Date;
  };
}

// Mensagens
export interface GazapiMessageData {
  id: string;
  sessionId: string;
  chatId: string;
  fromMe: boolean;
  messageType: GazapiMessageType;
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  filename?: string;
  caption?: string;
  timestamp: Date;
  status: GazapiMessageStatus;
  quotedMessageId?: string;
  metadata?: Record<string, any>;
}

export interface GazapiSendTextRequest extends GazapiBaseRequest {
  chatId: string;
  message: string;
  quotedMessageId?: string;
  linkPreview?: boolean;
}

export interface GazapiSendMediaRequest extends GazapiBaseRequest {
  chatId: string;
  mediaUrl?: string;
  mediaBase64?: string;
  mediaType?: string;
  filename?: string;
  caption?: string;
  quotedMessageId?: string;
}

export interface GazapiSendContactRequest extends GazapiBaseRequest {
  chatId: string;
  contactName: string;
  contactPhone: string;
  contactOrganization?: string;
}

export interface GazapiSendLocationRequest extends GazapiBaseRequest {
  chatId: string;
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface GazapiMessageResponse extends GazapiBaseResponse {
  data?: {
    messageId: string;
    chatId: string;
    timestamp: Date;
    status: GazapiMessageStatus;
  };
}

// Contatos
export interface GazapiContactData {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isGroup: boolean;
  isBlocked: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  metadata?: Record<string, any>;
}

export interface GazapiGetContactsRequest extends GazapiBaseRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface GazapiContactsResponse extends GazapiBaseResponse {
  data?: {
    contacts: GazapiContactData[];
    total: number;
    hasMore: boolean;
  };
}

// Grupos
export interface GazapiGroupData {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  participants: GazapiGroupParticipant[];
  admins: string[];
  createdBy: string;
  createdAt: Date;
  inviteLink?: string;
  isAnnouncement: boolean;
  metadata?: Record<string, any>;
}

export interface GazapiGroupParticipant {
  id: string;
  phone: string;
  name?: string;
  isAdmin: boolean;
  joinedAt: Date;
}

export interface GazapiCreateGroupRequest extends GazapiBaseRequest {
  groupName: string;
  description?: string;
  participants: string[];
}

export interface GazapiUpdateGroupRequest extends GazapiBaseRequest {
  groupId: string;
  groupName?: string;
  description?: string;
  avatar?: string;
}

export interface GazapiGroupMembersRequest extends GazapiBaseRequest {
  groupId: string;
  participants: string[];
  action: 'add' | 'remove' | 'promote' | 'demote';
}

export interface GazapiGroupResponse extends GazapiBaseResponse {
  data?: GazapiGroupData;
}

export interface GazapiGroupsResponse extends GazapiBaseResponse {
  data?: {
    groups: GazapiGroupData[];
    total: number;
  };
}

// Webhooks
export interface GazapiWebhookEvent {
  type: 'message' | 'session' | 'group' | 'contact';
  sessionId: string;
  timestamp: Date;
  data: any;
}

export interface GazapiMessageWebhook extends GazapiWebhookEvent {
  type: 'message';
  data: {
    messageId: string;
    chatId: string;
    fromMe: boolean;
    messageType: GazapiMessageType;
    content?: string;
    mediaUrl?: string;
    sender: {
      id: string;
      name?: string;
      phone: string;
    };
  };
}

export interface GazapiSessionWebhook extends GazapiWebhookEvent {
  type: 'session';
  data: {
    status: GazapiSessionStatus;
    phoneNumber?: string;
    qrCode?: string;
  };
}

// Configurações
export interface GazapiConfig {
  adminToken: string;
  webhookUrl?: string;
  sessionTimeout: number;
  messageDelay: number;
  maxRetries: number;
  workerUrl: string;
  enableWebhooks: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxSessions: number;
  mediaUploadPath: string;
  allowedMediaTypes: string[];
  maxMediaSize: number;
}

// Estatísticas
export interface GazapiStats {
  totalSessions: number;
  activeSessions: number;
  messagesSent: number;
  messagesReceived: number;
  uptime: number;
  lastActivity: Date;
}

// Erros
export interface GazapiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export const GAZAPI_ERROR_CODES = {
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  SESSION_NOT_CONNECTED: 'SESSION_NOT_CONNECTED',
  WEBSOCKET_NOT_FOUND: 'WEBSOCKET_NOT_FOUND',
  INVALID_CHAT_ID: 'INVALID_CHAT_ID',
  INVALID_MESSAGE_TYPE: 'INVALID_MESSAGE_TYPE',
  MEDIA_UPLOAD_FAILED: 'MEDIA_UPLOAD_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
  CONTACT_NOT_FOUND: 'CONTACT_NOT_FOUND',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  WORKER_CONNECTION_FAILED: 'WORKER_CONNECTION_FAILED',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS'
} as const;

export type GazapiErrorCode = typeof GAZAPI_ERROR_CODES[keyof typeof GAZAPI_ERROR_CODES];

// Utilitários de validação
export interface GazapiValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface GazapiPhoneValidation {
  isValid: boolean;
  formatted: string;
  country?: string;
  type?: 'mobile' | 'landline';
}

// Rate Limiting
export interface GazapiRateLimit {
  sessionId: string;
  endpoint: string;
  requests: number;
  windowStart: Date;
  windowSize: number;
  maxRequests: number;
}

// Logs
export interface GazapiLogEntry {
  id: string;
  sessionId?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
}

// Exportação dos códigos de erro como default
export default GAZAPI_ERROR_CODES;
import { EventEmitter } from 'events';
import WebSocket from 'ws';

// Interfaces do Gazapi
export interface GazapiSession {
  id: string;
  sessionKey: string;
  phoneNumber?: string;
  status: 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'inChat';
  qrCode?: string;
  lastActivity?: Date;
  createdAt: Date;
  updatedAt: Date;
  webhook?: {
    url: string;
    events: string[];
    enabled: boolean;
  };
}

export interface GazapiMessage {
  id: string;
  sessionId: string;
  chatId: string;
  fromMe: boolean;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'contact' | 'location';
  content?: string;
  mediaUrl?: string;
  mediaType?: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
}

export interface GazapiContact {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
}

export interface GazapiGroup {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  participants: string[];
  admins: string[];
  createdBy: string;
  createdAt: Date;
}

// Tipos de requisição
export interface SessionRequest {
  session: string;
  sessionKey: string;
  token: string;
  webhookUrl?: string;
  autoReconnect?: boolean;
}

export interface MessageRequest extends SessionRequest {
  chatId: string;
  message?: string;
  mediaUrl?: string;
  mediaType?: string;
  filename?: string;
  caption?: string;
}

export interface GroupRequest extends SessionRequest {
  groupId?: string;
  groupName?: string;
  description?: string;
  participants?: string[];
}

// Tipos de resposta
export interface GazapiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface SessionResponse extends GazapiResponse {
  data?: {
    session: string;
    status: 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'inChat';
    qrCode?: string;
    phoneNumber?: string;
    lastActivity?: Date;
  };
}

export interface MessageResponse extends GazapiResponse {
  data?: {
    messageId: string;
    chatId: string;
    timestamp: Date;
    status: string;
  };
}

// Configurações do Gazapi
export interface GazapiConfig {
  adminToken: string;
  webhookUrl?: string;
  sessionTimeout: number;
  messageDelay: number;
  maxRetries: number;
  workerUrl: string;
}

export class GazapiService extends EventEmitter {
  private static instance: GazapiService;
  private sessions: Map<string, GazapiSession> = new Map();
  private websockets: Map<string, WebSocket> = new Map();
  private config: GazapiConfig;

  private constructor(config: GazapiConfig) {
    super();
    this.config = config;
    this.setupEventHandlers();
  }

  public static getInstance(config?: GazapiConfig): GazapiService {
    console.log('[Gazapi Debug] getInstance chamado, instance existe:', !!GazapiService.instance);
    if (!GazapiService.instance) {
      if (!config) {
        throw new Error('Configuração é obrigatória para criar a primeira instância do Gazapi');
      }
      console.log('[Gazapi Debug] Criando nova instância do GazapiService');
      GazapiService.instance = new GazapiService(config);
    } else {
      console.log('[Gazapi Debug] Retornando instância existente, sessões ativas:', GazapiService.instance.sessions.size);
    }
    return GazapiService.instance;
  }

  private setupEventHandlers(): void {
    this.on('session:connected', (sessionId: string) => {
      console.log(`[Gazapi] Sessão ${sessionId} conectada`);
    });

    this.on('session:disconnected', (sessionId: string) => {
      console.log(`[Gazapi] Sessão ${sessionId} desconectada`);
    });

    this.on('message:received', (message: GazapiMessage) => {
      console.log(`[Gazapi] Mensagem recebida: ${message.id}`);
    });
  }

  // Gerenciamento de Sessões
  public async startSession(request: SessionRequest): Promise<SessionResponse> {
    try {
      const { session, sessionKey, token } = request;
      
      console.log('[Gazapi Debug] startSession chamado para:', session);
      console.log('[Gazapi Debug] Sessões ativas antes:', this.sessions.size);

      // Validar token administrativo
      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      // Verificar se a sessão já existe
      if (this.sessions.has(session)) {
        const existingSession = this.sessions.get(session)!;
        console.log('[Gazapi Debug] Sessão já existe:', session, 'status:', existingSession.status);
        return {
          success: true,
          message: 'Sessão já existe',
          data: {
            session: existingSession.id,
            status: existingSession.status,
            qrCode: existingSession.qrCode,
            phoneNumber: existingSession.phoneNumber
          }
        };
      }

      // Criar nova sessão
      const newSession: GazapiSession = {
        id: session,
        sessionKey,
        status: 'connecting',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.sessions.set(session, newSession);
      console.log('[Gazapi Debug] Nova sessão criada:', session);
      console.log('[Gazapi Debug] Sessões ativas após criação:', this.sessions.size);

      // Iniciar sessão no worker WhatsApp
      const workerResult = await this.startWorkerSession(session);
      
      // Aguardar um pouco para o QR code ser gerado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Consultar status para obter o QR code
      const statusResult = await this.getWorkerSessionStatus(session);
      
      // Atualizar status da sessão baseado na resposta do worker
      if (statusResult.status === 'qr_required') {
        newSession.status = 'qr_required';
        newSession.qrCode = statusResult.qrCode;
      } else if (statusResult.status === 'connected') {
        newSession.status = 'connected';
      } else {
        newSession.status = 'connecting';
      }
      
      newSession.updatedAt = new Date();

      // Conectar WebSocket para eventos em tempo real
      try {
        await this.connectToWorker(session);
      } catch (error) {
        console.warn(`[Gazapi] Falha ao conectar WebSocket para sessão ${session}:`, error);
        // Continuar mesmo sem WebSocket - a sessão HTTP ainda funciona
      }

      return {
        success: true,
        message: 'Sessão iniciada com sucesso',
        data: {
          session: newSession.id,
          status: newSession.status,
          qrCode: newSession.qrCode
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao iniciar sessão',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async getQrCode(request: SessionRequest): Promise<SessionResponse> {
    try {
      const { session, token } = request;
      
      console.log('[Gazapi Debug] getQrCode chamado para:', session);
      console.log('[Gazapi Debug] Sessões ativas:', this.sessions.size);
      console.log('[Gazapi Debug] Sessões existentes:', Array.from(this.sessions.keys()));

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData) {
        console.log('[Gazapi Debug] Sessão não encontrada:', session);
        return {
          success: false,
          message: 'Sessão não encontrada',
          error: 'SESSION_NOT_FOUND'
        };
      }

      console.log('[Gazapi Debug] Sessão encontrada:', session, 'status:', sessionData.status);
      return {
        success: true,
        message: 'QR Code obtido com sucesso',
        data: {
          session: sessionData.id,
          status: sessionData.status,
          qrCode: sessionData.qrCode
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao obter QR Code',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async getSessionStatus(request: SessionRequest): Promise<SessionResponse> {
    try {
      const { session, token } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      let sessionData = this.sessions.get(session);
      if (!sessionData) {
        return {
          success: false,
          message: 'Sessão não encontrada',
          error: 'SESSION_NOT_FOUND'
        };
      }

      // Sincronizar status com o worker
      try {
        const workerStatus = await this.getWorkerSessionStatus(session);
        
        // Atualizar status local baseado na resposta do worker
        if (workerStatus.status === 'qr_required') {
          sessionData.status = 'qr_required';
          sessionData.qrCode = workerStatus.qrCode;
        } else if (workerStatus.status === 'connected') {
          sessionData.status = 'connected';
        } else if (workerStatus.status === 'not_found') {
          sessionData.status = 'disconnected';
        } else {
          sessionData.status = workerStatus.status as any;
        }
        
        sessionData.updatedAt = new Date();
      } catch (error) {
        console.warn(`[Gazapi] Falha ao sincronizar status com worker para sessão ${session}:`, error);
        // Continuar com status local se worker não responder
      }

      return {
        success: true,
        message: 'Status da sessão obtido com sucesso',
        data: {
          session: sessionData.id,
          status: sessionData.status,
          qrCode: sessionData.qrCode,
          phoneNumber: sessionData.phoneNumber
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao obter status da sessão',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async closeSession(request: SessionRequest): Promise<SessionResponse> {
    try {
      const { session, token } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData) {
        return {
          success: false,
          message: 'Sessão não encontrada',
          error: 'SESSION_NOT_FOUND'
        };
      }

      // Parar sessão no worker primeiro
      try {
        await this.stopWorkerSession(session);
      } catch (error) {
        console.warn(`[Gazapi] Falha ao parar sessão no worker ${session}:`, error);
        // Continuar com limpeza local mesmo se worker falhar
      }

      // Fechar WebSocket se existir
      const ws = this.websockets.get(session);
      if (ws) {
        ws.close();
        this.websockets.delete(session);
      }

      // Remover sessão
      this.sessions.delete(session);
      this.websockets.delete(session);

      return {
        success: true,
        message: 'Sessão encerrada com sucesso',
        data: {
          session: session,
          status: 'disconnected',
          lastActivity: new Date()
        }
      };    } catch (error) {
      return {
        success: false,
        message: 'Erro ao encerrar sessão',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Validação de autenticação
  private validateAuth(token: string, sessionKey: string): boolean {
    return token === this.config.adminToken;
  }

  // Envio de Mensagens

  public async sendText(request: MessageRequest): Promise<MessageResponse> {
    try {
      // Validar autenticação
      if (!this.validateAuth(request.token, request.sessionKey)) {
        return {
          success: false,
          message: 'Token ou sessionKey inválido',
          error: 'INVALID_AUTH'
        };
      }

      const session = this.sessions.get(request.session);
      if (!session) {
        return {
          success: false,
          message: 'Sessão não encontrada',
          error: 'SESSION_NOT_FOUND'
        };
      }

      if (session.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não está conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Simular envio de mensagem de texto
      const messageId = `txt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Atualizar última atividade
      session.lastActivity = new Date();

      return {
        success: true,
        message: 'Mensagem de texto enviada com sucesso',
        data: {
          messageId,
          chatId: request.chatId,
          timestamp: new Date(),
          status: 'sent'
        }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao enviar texto:', error);
      return {
        success: false,
        message: 'Erro interno ao enviar texto',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async sendImage(request: MessageRequest): Promise<MessageResponse> {
    try {
      // Validar autenticação
      if (!this.validateAuth(request.token, request.sessionKey)) {
        return {
          success: false,
          message: 'Token ou sessionKey inválido',
          error: 'INVALID_AUTH'
        };
      }

      const session = this.sessions.get(request.session);
      if (!session) {
        return {
          success: false,
          message: 'Sessão não encontrada',
          error: 'SESSION_NOT_FOUND'
        };
      }

      if (session.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não está conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Simular envio de imagem
      const messageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Atualizar última atividade
      session.lastActivity = new Date();

      return {
        success: true,
        message: 'Imagem enviada com sucesso',
        data: {
          messageId,
          chatId: request.chatId,
          timestamp: new Date(),
          status: 'sent'
        }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao enviar imagem:', error);
      return {
        success: false,
        message: 'Erro interno ao enviar imagem',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async sendAudio(request: MessageRequest): Promise<MessageResponse> {
    return this.sendMessage({
      ...request,
      messageType: 'audio'
    });
  }

  public async sendVideo(request: MessageRequest): Promise<MessageResponse> {
    return this.sendMessage({
      ...request,
      messageType: 'video'
    });
  }

  public async sendDocument(request: MessageRequest): Promise<MessageResponse> {
    return this.sendMessage({
      ...request,
      messageType: 'document'
    });
  }

  public async sendContact(request: MessageRequest): Promise<MessageResponse> {
    return this.sendMessage({
      ...request,
      messageType: 'contact'
    });
  }

  public async sendLocation(request: MessageRequest): Promise<MessageResponse> {
    return this.sendMessage({
      ...request,
      messageType: 'location'
    });
  }

  public async sendSticker(request: MessageRequest): Promise<MessageResponse> {
    return this.sendMessage({
      ...request,
      messageType: 'sticker'
    });
  }

  // Métodos de gerenciamento de grupos
  public async createGroup(request: GroupRequest): Promise<GazapiResponse> {
    try {
      const { session, token, groupName, description, participants } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData || sessionData.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Simular criação de grupo
      const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        success: true,
        message: 'Grupo criado com sucesso',
        data: {
          groupId,
          groupName,
          participants,
          createdAt: new Date()
        }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao criar grupo:', error);
      return {
        success: false,
        message: 'Erro interno ao criar grupo',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async getGroups(request: SessionRequest): Promise<GazapiResponse> {
    try {
      const { session, token } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData || sessionData.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Simular lista de grupos
      const groups = [
        {
          id: 'group_1',
          name: 'Grupo Exemplo 1',
          description: 'Descrição do grupo 1',
          participants: ['5511999999999', '5511888888888'],
          admins: ['5511999999999'],
          createdAt: new Date()
        }
      ];
      
      return {
        success: true,
        message: 'Grupos obtidos com sucesso',
        data: { groups }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao obter grupos:', error);
      return {
        success: false,
        message: 'Erro interno ao obter grupos',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async getContacts(request: SessionRequest): Promise<GazapiResponse> {
    try {
      const { session, token } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData || sessionData.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Simular lista de contatos
      const contacts = [
        {
          id: '5511999999999',
          name: 'Contato Exemplo',
          phone: '5511999999999',
          avatar: null,
          isGroup: false,
          lastMessage: 'Última mensagem',
          lastMessageTime: new Date(),
          unreadCount: 0
        }
      ];
      
      return {
        success: true,
        message: 'Contatos obtidos com sucesso',
        data: { contacts }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao obter contatos:', error);
      return {
        success: false,
        message: 'Erro interno ao obter contatos',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async getMessages(request: any): Promise<GazapiResponse> {
    try {
      const { session, token, chatId, limit = 50, offset = 0 } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData || sessionData.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Simular lista de mensagens
      const messages = [
        {
          id: 'msg_1',
          chatId,
          fromMe: false,
          messageType: 'text',
          content: 'Olá! Como posso ajudar?',
          timestamp: new Date(Date.now() - 3600000),
          status: 'read'
        },
        {
          id: 'msg_2',
          chatId,
          fromMe: true,
          messageType: 'text',
          content: 'Oi! Tudo bem?',
          timestamp: new Date(Date.now() - 1800000),
          status: 'delivered'
        }
      ].slice(offset, offset + limit);
      
      return {
        success: true,
        message: 'Mensagens obtidas com sucesso',
        data: { 
          messages,
          total: 2
        }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao obter mensagens:', error);
      return {
        success: false,
        message: 'Erro interno ao obter mensagens',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async checkNumber(request: any): Promise<GazapiResponse> {
    try {
      const { session, token, phoneNumber } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData || sessionData.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Simular verificação de número
      const exists = Math.random() > 0.3; // 70% de chance de existir
      const jid = exists ? `${phoneNumber}@s.whatsapp.net` : undefined;
      
      return {
        success: true,
        message: 'Verificação de número concluída',
        data: {
          phoneNumber,
          exists,
          jid,
          businessName: exists && Math.random() > 0.7 ? 'Empresa Exemplo' : undefined
        }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao verificar número:', error);
      return {
        success: false,
        message: 'Erro interno ao verificar número',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async markAsRead(request: any): Promise<GazapiResponse> {
    try {
      const { session, token, chatId, messageId } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData || sessionData.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Simular marcação como lida
      const markedAt = new Date();
      
      return {
        success: true,
        message: messageId ? 'Mensagem marcada como lida' : 'Chat marcado como lido',
        data: {
          chatId,
          messageId,
          markedAt
        }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao marcar como lida:', error);
      return {
        success: false,
        message: 'Erro interno ao marcar como lida',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async setWebhook(request: any): Promise<GazapiResponse> {
    try {
      const { session, token, webhookUrl, events, enabled } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData) {
        return {
          success: false,
          message: 'Sessão não encontrada',
          error: 'SESSION_NOT_FOUND'
        };
      }

      // Configurar webhook na sessão
      sessionData.webhook = {
        url: webhookUrl,
        events: events || ['message', 'status', 'connection'],
        enabled: enabled !== false
      };

      const configuredAt = new Date();
      
      return {
        success: true,
        message: 'Webhook configurado com sucesso',
        data: {
          webhookUrl,
          events: sessionData.webhook.events,
          enabled: sessionData.webhook.enabled,
          configuredAt
        }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao configurar webhook:', error);
      return {
        success: false,
        message: 'Erro interno ao configurar webhook',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  public async getWebhook(request: any): Promise<GazapiResponse> {
    try {
      const { session, token } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData) {
        return {
          success: false,
          message: 'Sessão não encontrada',
          error: 'SESSION_NOT_FOUND'
        };
      }

      if (!sessionData.webhook) {
        return {
          success: true,
          message: 'Nenhum webhook configurado',
          data: {
            webhookUrl: undefined,
            events: undefined,
            enabled: false
          }
        };
      }
      
      return {
        success: true,
        message: 'Informações do webhook obtidas',
        data: {
          webhookUrl: sessionData.webhook.url,
          events: sessionData.webhook.events,
          enabled: sessionData.webhook.enabled
        }
      };

    } catch (error) {
      console.error('[Gazapi] Erro ao obter webhook:', error);
      return {
        success: false,
        message: 'Erro interno ao obter webhook',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  private async sendMessage(request: MessageRequest & { messageType: string }): Promise<MessageResponse> {
    try {
      const { session, token, chatId, message, mediaUrl, messageType } = request;

      if (token !== this.config.adminToken) {
        return {
          success: false,
          message: 'Token administrativo inválido',
          error: 'INVALID_TOKEN'
        };
      }

      const sessionData = this.sessions.get(session);
      if (!sessionData || sessionData.status !== 'connected') {
        return {
          success: false,
          message: 'Sessão não conectada',
          error: 'SESSION_NOT_CONNECTED'
        };
      }

      // Enviar mensagem via WebSocket para o worker
      const ws = this.websockets.get(session);
      if (!ws) {
        return {
          success: false,
          message: 'Conexão WebSocket não encontrada',
          error: 'WEBSOCKET_NOT_FOUND'
        };
      }

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageData = {
        type: 'sendMessage',
        messageId,
        chatId,
        messageType,
        content: message,
        mediaUrl,
        timestamp: new Date()
      };

      ws.send(JSON.stringify(messageData));

      // Aplicar delay entre mensagens
      await new Promise(resolve => setTimeout(resolve, this.config.messageDelay));

      return {
        success: true,
        message: 'Mensagem enviada com sucesso',
        data: {
          messageId,
          chatId,
          timestamp: new Date(),
          status: 'sent'
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao enviar mensagem',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Iniciar sessão no worker
  private async startWorkerSession(sessionId: string): Promise<{ status: string; qrCode?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout

    try {
      const response = await fetch(`${this.config.workerUrl}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          sessionKey: `key_${sessionId}`,
          token: this.config.adminToken
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Worker request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        status: result.data?.status || 'disconnected',
        qrCode: result.data?.qrCode
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Worker request timeout after 30 seconds');
      }
      throw error;
    }
  }

  // Parar sessão no worker
  private async stopWorkerSession(sessionId: string): Promise<{ status: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    try {
      const response = await fetch(`${this.config.workerUrl}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          sessionKey: `key_${sessionId}`,
          token: this.config.adminToken
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Worker request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        status: result.data?.status || 'disconnected'
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Worker request timeout after 10 seconds');
      }
      throw error;
    }
  }

  // Verificar status da sessão no worker
  private async getWorkerSessionStatus(sessionId: string): Promise<{ status: string; qrCode?: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    try {
      const response = await fetch(`${this.config.workerUrl}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: sessionId,
          sessionKey: `key_${sessionId}`,
          token: this.config.adminToken
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Worker request failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        status: result.data?.status || 'disconnected',
        qrCode: result.data?.qrCode
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Worker request timeout after 10 seconds');
      }
      throw error;
    }
  }

  // Conexão com Worker via WebSocket
  private async connectToWorker(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = this.config.workerUrl.replace('http', 'ws') + `/ws?collaboratorId=${sessionId}`;
      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        console.log(`[Gazapi] WebSocket conectado para sessão ${sessionId}`);
        this.websockets.set(sessionId, ws);
        resolve();
      });

      ws.on('message', (data: string) => {
        try {
          const message = JSON.parse(data);
          this.handleWorkerMessage(sessionId, message);
        } catch (error) {
          console.error('[Gazapi] Erro ao processar mensagem do worker:', error);
        }
      });

      ws.on('error', (error) => {
        console.error(`[Gazapi] Erro WebSocket para sessão ${sessionId}:`, error);
        reject(error);
      });

      ws.on('close', () => {
        console.log(`[Gazapi] WebSocket fechado para sessão ${sessionId}`);
        this.websockets.delete(sessionId);
        
        const session = this.sessions.get(sessionId);
        if (session) {
          session.status = 'disconnected';
          session.updatedAt = new Date();
          this.emit('session:disconnected', sessionId);
        }
      });
    });
  }

  private handleWorkerMessage(sessionId: string, message: any): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    switch (message.type) {
      case 'qrCode':
        session.qrCode = message.qrCode;
        session.status = 'qr_required';
        session.updatedAt = new Date();
        break;

      case 'connected':
        session.status = 'connected';
        session.phoneNumber = message.phoneNumber;
        session.updatedAt = new Date();
        this.emit('session:connected', sessionId);
        break;

      case 'disconnected':
        session.status = 'disconnected';
        session.updatedAt = new Date();
        this.emit('session:disconnected', sessionId);
        break;

      case 'messageReceived':
        const gazapiMessage: GazapiMessage = {
          id: message.messageId,
          sessionId,
          chatId: message.chatId,
          fromMe: false,
          messageType: message.messageType,
          content: message.content,
          mediaUrl: message.mediaUrl,
          timestamp: new Date(message.timestamp),
          status: 'delivered'
        };
        this.emit('message:received', gazapiMessage);
        break;
    }
  }

  // Métodos utilitários
  public getAllSessions(): GazapiSession[] {
    return Array.from(this.sessions.values());
  }

  public getSession(sessionId: string): GazapiSession | undefined {
    return this.sessions.get(sessionId);
  }

  public isSessionConnected(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.status === 'connected' || session?.status === 'inChat';
  }
}

export default GazapiService;
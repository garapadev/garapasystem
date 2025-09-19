import { EventEmitter } from 'events';

export interface WhatsAppSession {
  id: string;
  isReady: boolean;
  qrCode?: string;
  status: 'disconnected' | 'connecting' | 'qr_required' | 'qr_code' | 'connected' | 'not_connected';
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  type: 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT';
}

export interface WhatsAppContact {
  id: string;
  name: string;
  number: string;
  profilePicUrl?: string;
  isGroup: boolean;
  lastMessage?: {
    body: string;
    timestamp: number;
  };
}

interface SessionRequest {
  collaboratorId: string;
  action: 'start' | 'stop' | 'status';
}

interface SessionResponse {
  collaboratorId: string;
  status: string;
  qrCode?: string;
  error?: string;
}

interface MessageRequest {
  collaboratorId: string;
  to: string;
  message: string;
}

class WhatsAppService extends EventEmitter {
  private sessions: Map<string, WhatsAppSession> = new Map();
  private static instance: WhatsAppService;
  private workerUrl: string;
  private wsConnections: Map<string, WebSocket> = new Map();

  private constructor() {
    super();
    this.workerUrl = process.env.GO_WORKER_URL || 'http://localhost:8080';
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  public async createSession(collaboratorId: string): Promise<WhatsAppSession> {
    if (this.sessions.has(collaboratorId)) {
      throw new Error('Sessão já existe para este colaborador');
    }

    const session: WhatsAppSession = {
      id: collaboratorId,
      isReady: false,
      status: 'disconnected'
    };

    this.sessions.set(collaboratorId, session);

    try {
      const response = await this.makeWorkerRequest('/session', {
        collaboratorId,
        action: 'start'
      });

      if (response.error) {
        throw new Error(response.error);
      }

      // Mapear o status do worker para o status do frontend
      if (response.status === 'qr_required') {
        session.status = 'qr_code';
      } else {
        session.status = response.status as any;
      }
      
      if (response.qrCode) {
        session.qrCode = response.qrCode;
        this.emit('qr', { collaboratorId, qrCode: response.qrCode });
      }

      if (response.status === 'connected') {
        session.isReady = true;
        this.emit('ready', { collaboratorId });
      }

      // Estabelecer conexão WebSocket para eventos em tempo real
      this.setupWebSocketConnection(collaboratorId);

    } catch (error) {
      this.sessions.delete(collaboratorId);
      throw error;
    }

    return session;
  }

  private setupWebSocketConnection(collaboratorId: string): void {
    const wsUrl = this.workerUrl.replace('http', 'ws') + '/ws';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`WebSocket conectado para ${collaboratorId}`);
      this.wsConnections.set(collaboratorId, ws);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(collaboratorId, data);
      } catch (error) {
        console.error('Erro ao processar mensagem WebSocket:', error);
      }
    };

    ws.onclose = () => {
      console.log(`WebSocket desconectado para ${collaboratorId}`);
      this.wsConnections.delete(collaboratorId);
    };

    ws.onerror = (error) => {
      console.error(`Erro WebSocket para ${collaboratorId}:`, error);
    };
  }

  private handleWebSocketMessage(collaboratorId: string, data: any): void {
    switch (data.type) {
      case 'message':
        this.emit('message', { collaboratorId, message: data.message });
        break;
      case 'status_change':
        const session = this.sessions.get(collaboratorId);
        if (session) {
          // Mapear o status do worker para o status do frontend
          if (data.status === 'qr_required') {
            session.status = 'qr_code';
          } else {
            session.status = data.status;
          }
          session.isReady = data.status === 'connected';
          this.emit('status_change', { collaboratorId, status: session.status });
        }
        break;
      case 'qr_code':
        const qrSession = this.sessions.get(collaboratorId);
        if (qrSession) {
          qrSession.qrCode = data.qrCode;
          this.emit('qr', { collaboratorId, qrCode: data.qrCode });
        }
        break;
    }
  }

  private async makeWorkerRequest(endpoint: string, data: any): Promise<SessionResponse> {
    const response = await fetch(`${this.workerUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Worker request failed: ${response.statusText}`);
    }

    return response.json();
  }

  public async startSession(collaboratorId: string): Promise<{ status: string; qrCode?: string }> {
    let session = this.sessions.get(collaboratorId);
    
    // Se não existe sessão, criar uma nova
    if (!session) {
      session = await this.createSession(collaboratorId);
    }

    if (session.status === 'connected') {
      return { status: 'connected' };
    }

    const response = await this.makeWorkerRequest('/session', {
      collaboratorId,
      action: 'start'
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Mapear o status do worker para o status do frontend
    if (response.status === 'qr_required') {
      session.status = 'qr_code';
    } else {
      session.status = response.status as any;
    }
    
    if (response.qrCode) {
      session.qrCode = response.qrCode;
      this.emit('qr', { collaboratorId, qrCode: response.qrCode });
    }

    return {
      status: response.status,
      qrCode: response.qrCode
    };
  }

  public async stopSession(collaboratorId: string): Promise<void> {
    const session = this.sessions.get(collaboratorId);
    if (!session) {
      throw new Error('Sessão não encontrada');
    }

    const response = await this.makeWorkerRequest('/session', {
      collaboratorId,
      action: 'stop'
    });

    if (response.error) {
      throw new Error(response.error);
    }

    // Fechar conexão WebSocket
    const ws = this.wsConnections.get(collaboratorId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(collaboratorId);
    }

    this.sessions.delete(collaboratorId);
  }

  public async destroySession(collaboratorId: string): Promise<void> {
    const session = this.sessions.get(collaboratorId);
    if (!session) {
      return;
    }

    try {
      await this.stopSession(collaboratorId);
    } catch (error) {
      console.error('Erro ao destruir sessão:', error);
    } finally {
      this.sessions.delete(collaboratorId);
    }
  }

  public getSession(collaboratorId: string): WhatsAppSession | undefined {
    return this.sessions.get(collaboratorId);
  }

  public getAllSessions(): WhatsAppSession[] {
    return Array.from(this.sessions.values());
  }

  public async getSessionStatus(collaboratorId: string): Promise<string> {
    try {
      const response = await this.makeWorkerRequest('/session', {
        collaboratorId,
        action: 'status'
      });
      
      // Mapear o status do worker para o status do frontend
      if (response.status === 'qr_required') {
        return 'qr_code';
      } else if (response.status === 'not_found') {
        return 'not_connected';
      } else {
        return response.status;
      }
    } catch (error) {
      return 'not_connected';
    }
  }

  public async getContacts(collaboratorId: string): Promise<WhatsAppContact[]> {
    const session = this.sessions.get(collaboratorId);
    if (!session || !session.isReady) {
      throw new Error('Sessão não está pronta');
    }

    // Por enquanto, retornar lista vazia - implementar busca no banco de dados
    return [];
  }

  public async sendMessage(
    collaboratorId: string,
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const session = this.sessions.get(collaboratorId);
      if (!session || session.status !== 'connected') {
        return { success: false, error: 'Sessão não conectada' };
      }

      // Fazer requisição para o worker Go
      const response = await fetch(`${this.workerUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaboratorId,
          to,
          message
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData.error || `Worker request failed: ${response.statusText}` 
        };
      }

      const result = await response.json();
      
      if (result.error) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        messageId: result.messageId || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return { success: false, error: 'Erro de comunicação com o worker' };
    }
  }

  public async getChatMessages(collaboratorId: string, chatId: string, limit: number = 50): Promise<WhatsAppMessage[]> {
    const session = this.sessions.get(collaboratorId);
    if (!session || !session.isReady) {
      throw new Error('Sessão não está pronta');
    }

    // Por enquanto, retornar lista vazia - implementar busca no banco de dados
    return [];
  }

  public async getQRCode(collaboratorId: string): Promise<{ success: boolean; qrCode?: string; error?: string }> {
    try {
      const response = await this.makeWorkerRequest('/qr', {
        collaboratorId,
        action: 'get'
      });

      if (response.error) {
        return { success: false, error: response.error };
      }

      return {
        success: true,
        qrCode: response.qrCode
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao obter QR Code' };
    }
  }

  public async getSessionInfo(collaboratorId: string): Promise<{ success: boolean; phone?: string; name?: string; avatar?: string; error?: string }> {
    try {
      const response = await fetch(`${this.workerUrl}/session/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collaboratorId
        }),
      });

      if (!response.ok) {
        return { success: false, error: `Erro ao obter informações da sessão: ${response.statusText}` };
      }

      const result = await response.json();
      return {
        success: true,
        phone: result.phone,
        name: result.name,
        avatar: result.avatar
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Erro ao obter informações da sessão' };
    }
  }
}

export const whatsappService = WhatsAppService.getInstance();
export default whatsappService;
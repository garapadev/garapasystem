import { 
  WhatsAppApiAdapter, 
  WhatsAppApiConfig, 
  WhatsAppUser, 
  WhatsAppSession, 
  SendMessageRequest, 
  SendMessageResponse 
} from '../types';

export class WahaAdapter implements WhatsAppApiAdapter {
  private config: WhatsAppApiConfig | null = null;

  configure(config: WhatsAppApiConfig): void {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    if (!this.config) {
      throw new Error('WAHA não configurada');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['X-Api-Key'] = this.config.apiKey;
    }

    return headers;
  }

  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    if (!this.config) {
      throw new Error('WAHA não configurada');
    }

    const url = `${this.config.url}${endpoint}`;
    const headers = this.getHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na WAHA: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  // Na WAHA, usuários são equivalentes a sessões
  async createUser(user: Omit<WhatsAppUser, 'id'>): Promise<WhatsAppUser> {
    const session = await this.createSession(user.token, user.name);
    
    return {
      id: session.id,
      name: session.name,
      token: user.token,
      status: session.status,
    };
  }

  async getUsers(): Promise<WhatsAppUser[]> {
    const sessions = await this.getSessions();
    
    return sessions.map(session => ({
      id: session.id,
      name: session.name,
      token: session.id,
      status: session.status,
    }));
  }

  async deleteUser(userId: string): Promise<boolean> {
    return this.deleteSession(userId);
  }

  async createSession(sessionId: string, name?: string): Promise<WhatsAppSession> {
    try {
      const response = await this.makeRequest('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: sessionId,
          config: {
            webhooks: [
              {
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/whatsapp`,
                events: ['message', 'session.status'],
              },
            ],
          },
        }),
      });

      return {
        id: sessionId,
        name: name || sessionId,
        status: 'starting',
      };
    } catch (error) {
      throw new Error(`Erro ao criar sessão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  async getSession(sessionId: string): Promise<WhatsAppSession> {
    try {
      const response = await this.makeRequest(`/api/sessions/${sessionId}`);
      
      return {
        id: sessionId,
        name: response.name || sessionId,
        status: this.mapWahaStatus(response.status),
        qr: response.qr,
      };
    } catch (error) {
      return {
        id: sessionId,
        name: sessionId,
        status: 'failed',
      };
    }
  }

  async getSessions(): Promise<WhatsAppSession[]> {
    try {
      const response = await this.makeRequest('/api/sessions');
      
      if (Array.isArray(response)) {
        return response.map(session => ({
          id: session.name,
          name: session.name,
          status: this.mapWahaStatus(session.status),
          qr: session.qr,
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar sessões:', error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar sessão:', error);
      return false;
    }
  }

  async sendMessage(sessionId: string, message: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await this.makeRequest(`/api/sendText`, {
        method: 'POST',
        body: JSON.stringify({
          session: sessionId,
          chatId: message.to,
          text: message.body,
        }),
      });

      return {
        success: true,
        messageId: response.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  async getStatus(): Promise<{ status: string; version?: string }> {
    try {
      const response = await this.makeRequest('/api/server/status');
      return {
        status: 'online',
        version: response.version,
      };
    } catch (error) {
      return {
        status: 'offline',
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getStatus();
      return true;
    } catch (error) {
      return false;
    }
  }

  private mapWahaStatus(status: string): WhatsAppSession['status'] {
    switch (status?.toLowerCase()) {
      case 'working':
      case 'authenticated':
        return 'working';
      case 'scan_qr':
      case 'qr':
        return 'scan_qr';
      case 'starting':
      case 'initializing':
        return 'starting';
      case 'failed':
      case 'stopped':
        return 'failed';
      default:
        return 'stopped';
    }
  }
}
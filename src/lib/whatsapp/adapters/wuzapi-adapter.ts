import { 
  WhatsAppApiAdapter, 
  WhatsAppApiConfig, 
  WhatsAppUser, 
  WhatsAppSession, 
  SendMessageRequest, 
  SendMessageResponse 
} from '../types';

export class WuzApiAdapter implements WhatsAppApiAdapter {
  private config: WhatsAppApiConfig | null = null;

  configure(config: WhatsAppApiConfig): void {
    this.config = config;
  }

  private getHeaders(isAdmin: boolean = false): Record<string, string> {
    if (!this.config) {
      throw new Error('WuzAPI não configurada');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (isAdmin && this.config.adminToken) {
      headers['Authorization'] = this.config.adminToken;
    }

    return headers;
  }

  private async makeRequest(
    endpoint: string, 
    options: RequestInit = {}, 
    isAdmin: boolean = false
  ): Promise<any> {
    if (!this.config) {
      throw new Error('WuzAPI não configurada');
    }

    const url = `${this.config.url}${endpoint}`;
    const headers = this.getHeaders(isAdmin);

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro na WuzAPI: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }

    return response.text();
  }

  async createUser(user: Omit<WhatsAppUser, 'id'>): Promise<WhatsAppUser> {
    const response = await this.makeRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        name: user.name,
        token: user.token,
      }),
    }, true);

    return {
      id: response.id || user.token,
      name: user.name,
      token: user.token,
      status: response.status || 'created',
    };
  }

  async getUsers(): Promise<WhatsAppUser[]> {
    const response = await this.makeRequest('/admin/users', {}, true);
    
    if (Array.isArray(response)) {
      return response.map(user => ({
        id: user.id || user.token,
        name: user.name,
        token: user.token,
        status: user.status,
      }));
    }

    return [];
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/admin/users/${userId}`, {
        method: 'DELETE',
      }, true);
      return true;
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      return false;
    }
  }

  async createSession(sessionId: string, name?: string): Promise<WhatsAppSession> {
    // Na WuzAPI, criar sessão é equivalente a criar usuário
    const user = await this.createUser({
      name: name || sessionId,
      token: sessionId,
    });

    return {
      id: sessionId,
      name: user.name,
      status: 'starting',
    };
  }

  async getSession(sessionId: string): Promise<WhatsAppSession> {
    try {
      const response = await this.makeRequest(`/${sessionId}/status`, {
        headers: { token: sessionId },
      });

      return {
        id: sessionId,
        name: sessionId,
        status: this.mapWuzApiStatus(response.status),
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
    const users = await this.getUsers();
    const sessions: WhatsAppSession[] = [];

    for (const user of users) {
      try {
        const session = await this.getSession(user.token);
        sessions.push(session);
      } catch (error) {
        sessions.push({
          id: user.token,
          name: user.name,
          status: 'failed',
        });
      }
    }

    return sessions;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.deleteUser(sessionId);
  }

  async sendMessage(sessionId: string, message: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const response = await this.makeRequest(`/${sessionId}/send-message`, {
        method: 'POST',
        headers: { token: sessionId },
        body: JSON.stringify({
          phone: message.to,
          message: message.body,
        }),
      });

      return {
        success: true,
        messageId: response.id || response.messageId,
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
      const response = await this.makeRequest('/status');
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

  private mapWuzApiStatus(status: string): WhatsAppSession['status'] {
    switch (status?.toLowerCase()) {
      case 'connected':
      case 'authenticated':
        return 'working';
      case 'qr':
      case 'qr_code':
        return 'scan_qr';
      case 'connecting':
      case 'initializing':
        return 'starting';
      case 'disconnected':
      case 'failed':
        return 'failed';
      default:
        return 'stopped';
    }
  }
}
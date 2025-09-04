import { db } from '@/lib/db';
import crypto from 'crypto';

interface WebhookPayload {
  evento: string;
  dados: any;
  timestamp: string;
  id: string;
}

interface WebhookConfig {
  id: string;
  nome: string;
  url: string;
  eventos: string[];
  ativo: boolean;
  secret?: string;
  headers?: Record<string, string>;
}

export class WebhookService {
  /**
   * Dispara webhooks para um evento específico
   */
  static async triggerWebhooks(evento: string, dados: any): Promise<void> {
    try {
      // Busca todas as configurações de webhook ativas para este evento
      const webhookConfigs = await db.webhookConfig.findMany({
        where: {
          ativo: true,
          eventos: {
            has: evento
          }
        }
      });

      if (webhookConfigs.length === 0) {
        console.log(`Nenhum webhook configurado para o evento: ${evento}`);
        return;
      }

      // Cria o payload base
      const payload: WebhookPayload = {
        evento,
        dados,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      };

      // Dispara todos os webhooks em paralelo
      const promises = webhookConfigs.map(config => 
        this.sendWebhook(config, payload, false)
      );

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Erro ao disparar webhooks:', error);
    }
  }

  /**
   * Envia um webhook para uma configuração específica
   */
  static async sendWebhook(
    config: WebhookConfig, 
    payload: WebhookPayload, 
    teste: boolean = false
  ): Promise<{ sucesso: boolean; status?: number; responseTime: number; erro?: string }> {
    const startTime = Date.now();
    let sucesso = false;
    let status: number | undefined;
    let erro: string | undefined;

    try {
      // Prepara os headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'CRM-Webhook/1.0',
        'X-Webhook-Event': payload.evento,
        'X-Webhook-ID': payload.id,
        'X-Webhook-Timestamp': payload.timestamp,
        ...(config.headers || {})
      };

      // Adiciona assinatura se secret estiver configurado
      if (config.secret) {
        const signature = this.generateSignature(JSON.stringify(payload), config.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      // Envia a requisição
      const response = await fetch(config.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 segundos de timeout
      });

      status = response.status;
      sucesso = response.ok;

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erro desconhecido');
        erro = `HTTP ${status}: ${errorText}`;
      }
    } catch (error: any) {
      sucesso = false;
      if (error.name === 'AbortError') {
        erro = 'Timeout na requisição (30s)';
      } else if (error.code === 'ENOTFOUND') {
        erro = 'URL não encontrada';
      } else if (error.code === 'ECONNREFUSED') {
        erro = 'Conexão recusada';
      } else {
        erro = error.message || 'Erro desconhecido';
      }
    }

    const responseTime = Date.now() - startTime;

    // Registra o log do webhook
    try {
      await db.webhookLog.create({
        data: {
          webhookConfigId: config.id,
          evento: payload.evento,
          sucesso,
          status,
          responseTime,
          erro,
          teste
        }
      });

      // Atualiza a data do último envio na configuração
      if (!teste) {
        await db.webhookConfig.update({
          where: { id: config.id },
          data: { ultimoEnvio: new Date() }
        });
      }
    } catch (logError) {
      console.error('Erro ao registrar log do webhook:', logError);
    }

    return { sucesso, status, responseTime, erro };
  }

  /**
   * Gera assinatura HMAC-SHA256 para o payload
   */
  private static generateSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verifica se uma assinatura é válida
   */
  static verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Testa uma configuração de webhook
   */
  static async testWebhook(webhookId: string): Promise<{
    sucesso: boolean;
    status?: number;
    responseTime: number;
    erro?: string;
  }> {
    const config = await db.webhookConfig.findUnique({
      where: { id: webhookId }
    });

    if (!config) {
      throw new Error('Configuração de webhook não encontrada');
    }

    // Cria um payload de teste
    const testPayload: WebhookPayload = {
      evento: 'teste',
      dados: {
        mensagem: 'Este é um webhook de teste',
        webhook: {
          id: config.id,
          nome: config.nome
        },
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    };

    return this.sendWebhook(config, testPayload, true);
  }
}

// Eventos disponíveis no sistema
export const WEBHOOK_EVENTS = {
  // Clientes
  CLIENTE_CRIADO: 'cliente.criado',
  CLIENTE_ATUALIZADO: 'cliente.atualizado',
  CLIENTE_EXCLUIDO: 'cliente.excluido',
  
  // Oportunidades
  OPORTUNIDADE_CRIADA: 'oportunidade.criada',
  OPORTUNIDADE_ATUALIZADA: 'oportunidade.atualizada',
  OPORTUNIDADE_EXCLUIDA: 'oportunidade.excluida',
  OPORTUNIDADE_STATUS_ALTERADO: 'oportunidade.status_alterado',
  
  // Colaboradores
  COLABORADOR_CRIADO: 'colaborador.criado',
  COLABORADOR_ATUALIZADO: 'colaborador.atualizado',
  COLABORADOR_EXCLUIDO: 'colaborador.excluido',
  
  // Usuários
  USUARIO_CRIADO: 'usuario.criado',
  USUARIO_ATUALIZADO: 'usuario.atualizado',
  USUARIO_EXCLUIDO: 'usuario.excluido',
  
  // Sistema
  SISTEMA_BACKUP_CRIADO: 'sistema.backup_criado',
  SISTEMA_ERRO: 'sistema.erro'
} as const;

export type WebhookEvent = typeof WEBHOOK_EVENTS[keyof typeof WEBHOOK_EVENTS];

// Helper para disparar webhooks de forma mais simples
export const triggerWebhook = WebhookService.triggerWebhooks;
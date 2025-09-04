import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface WebhookConfig {
  id: string;
  nome: string;
  url: string;
  evento: string;
  ativo: boolean;
  secret?: string;
  headers?: string;
  ultimoEnvio?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebhookData {
  nome: string;
  url: string;
  evento: string;
  secret?: string;
  headers?: object;
  ativo?: boolean;
}

export interface UpdateWebhookData {
  nome?: string;
  url?: string;
  evento?: string;
  ativo?: boolean;
  secret?: string;
  headers?: object;
}

export interface WebhookTestResult {
  success: boolean;
  status?: number;
  response?: string;
  error?: string;
  timestamp: string;
  responseTime?: number;
}

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/webhooks');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações de webhook');
      }
      
      const data = await response.json();
      setWebhooks(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createWebhook = async (data: CreateWebhookData): Promise<WebhookConfig | null> => {
    try {
      const response = await fetch('/api/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar configuração de webhook');
      }

      const newWebhook = await response.json();
      setWebhooks(prev => [newWebhook, ...prev]);
      toast.success('Configuração de webhook criada com sucesso!');
      return newWebhook;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return null;
    }
  };

  const updateWebhook = async (id: string, data: UpdateWebhookData): Promise<boolean> => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar configuração de webhook');
      }

      const updatedWebhook = await response.json();
      setWebhooks(prev => 
        prev.map(webhook => webhook.id === id ? updatedWebhook : webhook)
      );
      toast.success('Configuração de webhook atualizada com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return false;
    }
  };

  const deleteWebhook = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir configuração de webhook');
      }

      setWebhooks(prev => prev.filter(webhook => webhook.id !== id));
      toast.success('Configuração de webhook excluída com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return false;
    }
  };

  const testWebhook = async (id: string, payload?: object): Promise<WebhookTestResult | null> => {
    try {
      const response = await fetch(`/api/webhooks/${id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ payload }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Webhook testado com sucesso!');
      } else {
        toast.error(`Erro no teste do webhook: ${result.error || 'Erro desconhecido'}`);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return null;
    }
  };

  const toggleWebhookStatus = async (id: string, ativo: boolean): Promise<boolean> => {
    return updateWebhook(id, { ativo });
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  return {
    webhooks,
    loading,
    error,
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    toggleWebhookStatus,
  };
}
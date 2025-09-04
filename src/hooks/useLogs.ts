import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface ApiLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  apiKey?: {
    nome: string;
  };
}

export interface WebhookLog {
  id: string;
  webhookConfigId: string;
  evento: string;
  sucesso: boolean;
  statusCode?: number;
  responseTime?: number;
  errorMessage?: string;
  teste: boolean;
  createdAt: string;
  webhookConfig?: {
    nome: string;
    url: string;
  };
}

export interface LogFilters {
  dateRange?: string;
  endpoint?: string;
  method?: string;
  status?: string;
  evento?: string;
  sucesso?: string;
  teste?: string;
  webhookConfigId?: string;
  page?: number;
  limit?: number;
}

export interface LogsResponse<T> {
  logs: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function useLogs() {
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApiLogs = async (filters: LogFilters = {}): Promise<LogsResponse<ApiLog> | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.endpoint) params.append('endpoint', filters.endpoint);
      if (filters.method) params.append('method', filters.method);
      if (filters.status) params.append('status', filters.status);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/logs/api?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar logs da API');
      }
      
      const data: LogsResponse<ApiLog> = await response.json();
      setApiLogs(data.logs);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async (filters: LogFilters = {}): Promise<LogsResponse<WebhookLog> | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.evento) params.append('evento', filters.evento);
      if (filters.sucesso) params.append('sucesso', filters.sucesso);
      if (filters.teste) params.append('teste', filters.teste);
      if (filters.webhookConfigId) params.append('webhookConfigId', filters.webhookConfigId);
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/logs/webhooks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar logs de webhook');
      }
      
      const data: LogsResponse<WebhookLog> = await response.json();
      setWebhookLogs(data.logs);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async (type: 'api' | 'webhooks', filters: LogFilters = {}) => {
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      
      if (type === 'api') {
        if (filters.dateRange) params.append('dateRange', filters.dateRange);
        if (filters.endpoint) params.append('endpoint', filters.endpoint);
        if (filters.method) params.append('method', filters.method);
        if (filters.status) params.append('status', filters.status);
      } else {
        if (filters.dateRange) params.append('dateRange', filters.dateRange);
        if (filters.evento) params.append('evento', filters.evento);
        if (filters.sucesso) params.append('sucesso', filters.sucesso);
        if (filters.teste) params.append('teste', filters.teste);
      }
      
      const response = await fetch(`/api/logs/${type}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao exportar logs de ${type}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `logs-${type}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Logs de ${type} exportados com sucesso!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
    }
  };

  const clearLogs = async (type: 'api' | 'webhooks', olderThanDays?: number) => {
    try {
      const params = new URLSearchParams();
      if (olderThanDays) {
        params.append('olderThanDays', olderThanDays.toString());
      }
      
      const response = await fetch(`/api/logs/${type}?${params.toString()}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao limpar logs de ${type}`);
      }
      
      // Recarregar logs após limpeza
      if (type === 'api') {
        await fetchApiLogs();
      } else {
        await fetchWebhookLogs();
      }
      
      toast.success(`Logs de ${type} limpos com sucesso!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
    }
  };

  return {
    apiLogs,
    webhookLogs,
    loading,
    error,
    fetchApiLogs,
    fetchWebhookLogs,
    exportLogs,
    clearLogs,
  };
}

export default useLogs;
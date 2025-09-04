import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface ApiKey {
  id: string;
  nome: string;
  chave: string;
  ativo: boolean;
  ultimoUso?: Date;
  expiresAt?: Date;
  permissoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyData {
  nome: string;
  expiresAt?: string;
  permissoes?: object;
}

export interface UpdateApiKeyData {
  nome?: string;
  ativo?: boolean;
  expiresAt?: string;
  permissoes?: object;
}

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/api-keys');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar chaves de API');
      }
      
      const data = await response.json();
      setApiKeys(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (data: CreateApiKeyData): Promise<ApiKey | null> => {
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar chave de API');
      }

      const newApiKey = await response.json();
      setApiKeys(prev => [newApiKey, ...prev]);
      toast.success('Chave de API criada com sucesso!');
      return newApiKey;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return null;
    }
  };

  const updateApiKey = async (id: string, data: UpdateApiKeyData): Promise<boolean> => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar chave de API');
      }

      const updatedApiKey = await response.json();
      setApiKeys(prev => 
        prev.map(key => key.id === id ? updatedApiKey : key)
      );
      toast.success('Chave de API atualizada com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return false;
    }
  };

  const deleteApiKey = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir chave de API');
      }

      setApiKeys(prev => prev.filter(key => key.id !== id));
      toast.success('Chave de API excluída com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(errorMessage);
      return false;
    }
  };

  const toggleApiKeyStatus = async (id: string, ativo: boolean): Promise<boolean> => {
    return updateApiKey(id, { ativo });
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  return {
    apiKeys,
    loading,
    error,
    fetchApiKeys,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    toggleApiKeyStatus,
  };
}
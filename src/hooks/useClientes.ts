'use client';

import { useState, useEffect } from 'react';

interface Endereco {
  cep?: string;
  endereco?: string;
  complemento?: string;
  cidade?: string;
  estado?: string;
  tipo: 'CASA' | 'TRABALHO' | 'OUTRO';
  informacoesAdicionais?: string;
  principal: boolean;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  documento?: string;
  tipo: 'PESSOA_FISICA' | 'PESSOA_JURIDICA';
  status: 'LEAD' | 'PROSPECT' | 'CLIENTE';
  enderecos: Endereco[];
  observacoes?: string;
  valorPotencial?: number;
  grupoHierarquicoId?: string;
  grupoHierarquico?: {
    id: string;
    nome: string;
    descricao?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ClientesResponse {
  data: Cliente[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseClientesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  grupoId?: string;
}

export function useClientes(params: UseClientesParams = {}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);
      if (params.grupoId) searchParams.set('grupoId', params.grupoId);

      const response = await fetch(`/api/clientes?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }

      const data: ClientesResponse = await response.json();
      setClientes(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [params.page, params.limit, params.search, params.status, params.grupoId]);

  const refetch = () => {
    fetchClientes();
  };

  return {
    clientes,
    loading,
    error,
    meta,
    refetch
  };
}

export function useCliente(id: string) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCliente = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/clientes/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Cliente não encontrado');
        }
        throw new Error('Erro ao buscar cliente');
      }

      const data: Cliente = await response.json();
      setCliente(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCliente();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      fetchCliente();
    }
  };

  return {
    cliente,
    loading,
    error,
    refetch
  };
}

export async function createCliente(clienteData: Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>, emitUpdate?: (data: any) => void) {
  const response = await fetch('/api/clientes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clienteData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao criar cliente');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'cliente',
      action: 'created',
      entityId: result.id,
      entityName: result.nome,
    });
  }

  return result;
}

export async function updateCliente(id: string, clienteData: Partial<Cliente>, emitUpdate?: (data: any) => void) {
  const response = await fetch(`/api/clientes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(clienteData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao atualizar cliente');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'cliente',
      action: 'updated',
      entityId: result.id,
      entityName: result.nome,
    });
  }

  return result;
}

export async function deleteCliente(id: string, clienteName?: string, emitUpdate?: (data: any) => void) {
  const response = await fetch(`/api/clientes/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao excluir cliente');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'cliente',
      action: 'deleted',
      entityId: id,
      entityName: clienteName,
    });
  }

  return result;
}
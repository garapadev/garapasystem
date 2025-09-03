'use client';

import { useState, useEffect } from 'react';

interface Permissao {
  id: string;
  nome: string;
  descricao?: string;
  recurso: string;
  acao: string;
  ativo: boolean;
  perfis?: {
    perfil: {
      id: string;
      nome: string;
      descricao?: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

interface PermissoesResponse {
  data: Permissao[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UsePermissoesParams {
  page?: number;
  limit?: number;
  search?: string;
  recurso?: string;
  acao?: string;
}

export function usePermissoes(params: UsePermissoesParams = {}) {
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchPermissoes = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.recurso) searchParams.set('recurso', params.recurso);
      if (params.acao) searchParams.set('acao', params.acao);

      const response = await fetch(`/api/permissoes?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar permissões');
      }

      const data: PermissoesResponse = await response.json();
      setPermissoes(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissoes();
  }, [params.page, params.limit, params.search, params.recurso, params.acao]);

  const refetch = () => {
    fetchPermissoes();
  };

  const deletePermissao = async (id: string) => {
    const response = await fetch(`/api/permissoes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir permissão');
    }

    return response.json();
  };

  return {
    permissoes,
    loading,
    error,
    meta,
    refetch,
    deletePermissao
  };
}

export function usePermissao(id: string) {
  const [permissao, setPermissao] = useState<Permissao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissao = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/permissoes/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Permissão não encontrada');
        }
        throw new Error('Erro ao buscar permissão');
      }

      const data: Permissao = await response.json();
      setPermissao(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPermissao();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      fetchPermissao();
    }
  };

  return {
    permissao,
    loading,
    error,
    refetch
  };
}

// Hook para buscar todas as permissões (sem paginação) - útil para selects
export function useAllPermissoes() {
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPermissoes = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/permissoes?limit=1000');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar permissões');
      }

      const data: PermissoesResponse = await response.json();
      setPermissoes(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPermissoes();
  }, []);

  const refetch = () => {
    fetchAllPermissoes();
  };

  return {
    permissoes,
    loading,
    error,
    refetch
  };
}

export async function createPermissao(permissaoData: Omit<Permissao, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/permissoes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(permissaoData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar permissão');
  }

  return response.json();
}

export async function updatePermissao(id: string, permissaoData: Partial<Permissao>) {
  const response = await fetch(`/api/permissoes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(permissaoData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar permissão');
  }

  return response.json();
}

export async function deletePermissao(id: string) {
  const response = await fetch(`/api/permissoes/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao excluir permissão');
  }

  return response.json();
}
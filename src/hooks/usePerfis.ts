'use client';

import { useState, useEffect } from 'react';

interface Perfil {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  permissoes?: {
    permissao: {
      id: string;
      nome: string;
      descricao?: string;
      recurso: string;
      acao: string;
    };
  }[];
  colaboradores?: {
    id: string;
    nome: string;
    email: string;
    cargo: string;
    ativo: boolean;
  }[];
  _count?: {
    colaboradores: number;
    permissoes: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface PerfisResponse {
  data: Perfil[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UsePerfisParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function usePerfis(params: UsePerfisParams = {}) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchPerfis = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);

      const response = await fetch(`/api/perfis?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar perfis');
      }

      const data: PerfisResponse = await response.json();
      setPerfis(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerfis();
  }, [params.page, params.limit, params.search]);

  const refetch = () => {
    fetchPerfis();
  };

  const handleDeletePerfil = async (id: string) => {
    await deletePerfil(id);
    refetch();
  };

  return {
    perfis,
    loading,
    error,
    meta,
    refetch,
    deletePerfil: handleDeletePerfil
  };
}

export function usePerfil(id: string) {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPerfil = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/perfis/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Perfil não encontrado');
        }
        throw new Error('Erro ao buscar perfil');
      }

      const data: Perfil = await response.json();
      setPerfil(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPerfil();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      fetchPerfil();
    }
  };

  return {
    perfil,
    loading,
    error,
    refetch
  };
}

// Hook para buscar todos os perfis (sem paginação) - útil para selects
export function useAllPerfis() {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPerfis = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/perfis?limit=1000');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar perfis');
      }

      const data: PerfisResponse = await response.json();
      setPerfis(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPerfis();
  }, []);

  const refetch = () => {
    fetchAllPerfis();
  };

  return {
    perfis,
    loading,
    error,
    refetch
  };
}

export async function createPerfil(perfilData: Omit<Perfil, 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch('/api/perfis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(perfilData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar perfil');
  }

  return response.json();
}

export async function updatePerfil(id: string, perfilData: Partial<Perfil>) {
  const response = await fetch(`/api/perfis/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(perfilData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao atualizar perfil');
  }

  return response.json();
}

export async function deletePerfil(id: string) {
  const response = await fetch(`/api/perfis/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao excluir perfil');
  }

  return response.json();
}

// Função para associar permissões a um perfil
export async function associatePermissoes(perfilId: string, permissaoIds: string[]) {
  const response = await fetch(`/api/perfis/${perfilId}/permissoes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissaoIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao associar permissões');
  }

  return response.json();
}

// Função para remover permissões de um perfil
export async function removePermissoes(perfilId: string, permissaoIds: string[]) {
  const response = await fetch(`/api/perfis/${perfilId}/permissoes`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ permissaoIds }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao remover permissões');
  }

  return response.json();
}
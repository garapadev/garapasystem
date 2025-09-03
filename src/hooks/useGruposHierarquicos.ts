'use client';

import { useState, useEffect } from 'react';

interface GrupoHierarquico {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  parentId?: string;
  parent?: {
    id: string;
    nome: string;
    descricao?: string;
  };
  children?: {
    id: string;
    nome: string;
    descricao?: string;
    ativo: boolean;
  }[];
  clientes?: {
    id: string;
    nome: string;
    email: string;
    status: string;
  }[];
  colaboradores?: {
    id: string;
    nome: string;
    email: string;
    cargo: string;
    ativo: boolean;
  }[];
  _count?: {
    clientes: number;
    colaboradores: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface GruposHierarquicosResponse {
  data: GrupoHierarquico[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseGruposHierarquicosParams {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
}

export function useGruposHierarquicos(params: UseGruposHierarquicosParams = {}) {
  const [grupos, setGrupos] = useState<GrupoHierarquico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchGrupos = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.parentId) searchParams.set('parentId', params.parentId);

      const response = await fetch(`/api/grupos-hierarquicos?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar grupos hierárquicos');
      }

      const data: GruposHierarquicosResponse = await response.json();
      setGrupos(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrupos();
  }, [params.page, params.limit, params.search, params.parentId]);

  const refetch = () => {
    fetchGrupos();
  };

  return {
    grupos,
    loading,
    error,
    meta,
    refetch
  };
}

export function useGrupoHierarquico(id: string) {
  const [grupo, setGrupo] = useState<GrupoHierarquico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGrupo = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/grupos-hierarquicos/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Grupo hierárquico não encontrado');
        }
        throw new Error('Erro ao buscar grupo hierárquico');
      }

      const data: GrupoHierarquico = await response.json();
      setGrupo(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchGrupo();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      fetchGrupo();
    }
  };

  return {
    grupo,
    loading,
    error,
    refetch
  };
}

// Hook para buscar todos os grupos (sem paginação) - útil para selects
export function useAllGruposHierarquicos() {
  const [grupos, setGrupos] = useState<GrupoHierarquico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllGrupos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/grupos-hierarquicos?limit=1000');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar grupos hierárquicos');
      }

      const data: GruposHierarquicosResponse = await response.json();
      setGrupos(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllGrupos();
  }, []);

  const refetch = () => {
    fetchAllGrupos();
  };

  return {
    grupos,
    loading,
    error,
    refetch
  };
}

export async function createGrupoHierarquico(grupoData: Omit<GrupoHierarquico, 'id' | 'createdAt' | 'updatedAt'>, emitUpdate?: (data: any) => void) {
  const response = await fetch('/api/grupos-hierarquicos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(grupoData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao criar grupo hierárquico');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'grupo',
      action: 'created',
      entityId: result.id,
      entityName: result.nome,
    });
  }

  return result;
}

export async function updateGrupoHierarquico(id: string, grupoData: Partial<GrupoHierarquico>, emitUpdate?: (data: any) => void) {
  const response = await fetch(`/api/grupos-hierarquicos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(grupoData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao atualizar grupo hierárquico');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'grupo',
      action: 'updated',
      entityId: result.id,
      entityName: result.nome,
    });
  }

  return result;
}

export async function deleteGrupoHierarquico(id: string, grupoName?: string, emitUpdate?: (data: any) => void) {
  const response = await fetch(`/api/grupos-hierarquicos/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao excluir grupo hierárquico');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'grupo',
      action: 'deleted',
      entityId: id,
      entityName: grupoName,
    });
  }

  return result;
}
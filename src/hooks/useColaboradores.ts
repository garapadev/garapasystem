'use client';

import { useState, useEffect } from 'react';

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  documento?: string;
  cargo: string;
  dataAdmissao: string;
  ativo: boolean;
  perfilId?: string;
  grupoHierarquicoId?: string;
  perfil?: {
    id: string;
    nome: string;
    descricao?: string;
  };
  grupoHierarquico?: {
    id: string;
    nome: string;
    descricao?: string;
  };
  usuarios?: {
    id: string;
    email: string;
    ativo: boolean;
  }[];
  clientes?: {
    id: string;
    nome: string;
    email: string;
    status: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface ColaboradoresResponse {
  data: Colaborador[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseColaboradoresParams {
  page?: number;
  limit?: number;
  search?: string;
  ativo?: string;
  grupoId?: string;
  perfilId?: string;
}

export function useColaboradores(params: UseColaboradoresParams = {}) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchColaboradores = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.ativo) searchParams.set('ativo', params.ativo);
      if (params.grupoId) searchParams.set('grupoId', params.grupoId);
      if (params.perfilId) searchParams.set('perfilId', params.perfilId);

      const response = await fetch(`/api/colaboradores?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar colaboradores');
      }

      const data: ColaboradoresResponse = await response.json();
      setColaboradores(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColaboradores();
  }, [params.page, params.limit, params.search, params.ativo, params.grupoId, params.perfilId]);

  const refetch = () => {
    fetchColaboradores();
  };

  return {
    colaboradores,
    loading,
    error,
    meta,
    refetch
  };
}

export function useColaborador(id: string) {
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchColaborador = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/colaboradores/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Colaborador não encontrado');
        }
        throw new Error('Erro ao buscar colaborador');
      }

      const data: Colaborador = await response.json();
      setColaborador(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchColaborador();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      fetchColaborador();
    }
  };

  return {
    colaborador,
    loading,
    error,
    refetch
  };
}

export async function createColaborador(colaboradorData: Omit<Colaborador, 'id' | 'createdAt' | 'updatedAt'>, emitUpdate?: (data: any) => void) {
  const response = await fetch('/api/colaboradores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(colaboradorData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao criar colaborador');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'colaborador',
      action: 'created',
      entityId: result.id,
      entityName: result.nome,
    });
  }

  return result;
}

export async function updateColaborador(id: string, colaboradorData: Partial<Colaborador>, emitUpdate?: (data: any) => void) {
  const response = await fetch(`/api/colaboradores/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(colaboradorData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao atualizar colaborador');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'colaborador',
      action: 'updated',
      entityId: result.id,
      entityName: result.nome,
    });
  }

  return result;
}

export async function deleteColaborador(id: string, colaboradorName?: string, emitUpdate?: (data: any) => void) {
  const response = await fetch(`/api/colaboradores/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao excluir colaborador');
  }

  const result = await response.json();
  
  // Emit real-time notification
  if (emitUpdate) {
    emitUpdate({
      entityType: 'colaborador',
      action: 'deleted',
      entityId: id,
      entityName: colaboradorName,
    });
  }

  return result;
}
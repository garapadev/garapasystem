'use client';

import { useState, useEffect } from 'react';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
}

interface Colaborador {
  id: string;
  nome: string;
  email: string;
}

interface ItemOrdemServico {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  observacoes?: string;
}

interface ItemChecklistOS {
  id: string;
  descricao: string;
  concluido: boolean;
  ordem: number;
  observacoes?: string;
}

interface ChecklistOrdemServico {
  id: string;
  nome: string;
  descricao?: string;
  itens: ItemChecklistOS[];
}

interface OrdemServico {
  id: string;
  numero: string;
  titulo: string;
  descricao?: string;
  status: 'RASCUNHO' | 'AGUARDANDO_APROVACAO' | 'APROVADA' | 'EM_ANDAMENTO' | 'PAUSADA' | 'CONCLUIDA' | 'CANCELADA';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  valorTotal: number;
  dataInicio?: string;
  dataFim?: string;
  dataPrevistaConclusao?: string;
  observacoes?: string;
  clienteId: string;
  cliente: Cliente;
  responsavelId?: string;
  responsavel?: Colaborador;
  criadorId: string;
  criador: Colaborador;
  oportunidadeId?: string;
  itens: ItemOrdemServico[];
  checklists: ChecklistOrdemServico[];
  createdAt: string;
  updatedAt: string;
}

interface OrdensServicoResponse {
  data: OrdemServico[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseOrdensServicoParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  prioridade?: string;
  clienteId?: string;
  responsavelId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export function useOrdensServico(params: UseOrdensServicoParams = {}) {
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchOrdensServico = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);
      if (params.prioridade) searchParams.set('prioridade', params.prioridade);
      if (params.clienteId) searchParams.set('clienteId', params.clienteId);
      if (params.responsavelId) searchParams.set('responsavelId', params.responsavelId);
      if (params.dataInicio) searchParams.set('dataInicio', params.dataInicio);
      if (params.dataFim) searchParams.set('dataFim', params.dataFim);

      const response = await fetch(`/api/ordens-servico?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar ordens de serviço');
      }

      const data: OrdensServicoResponse = await response.json();
      setOrdensServico(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdensServico();
  }, [
    params.page, 
    params.limit, 
    params.search, 
    params.status, 
    params.prioridade,
    params.clienteId,
    params.responsavelId,
    params.dataInicio,
    params.dataFim
  ]);

  const refetch = () => {
    fetchOrdensServico();
  };

  return {
    ordensServico,
    loading,
    error,
    meta,
    refetch
  };
}

export function useOrdemServico(id: string) {
  const [ordemServico, setOrdemServico] = useState<OrdemServico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrdemServico = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ordens-servico/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ordem de serviço não encontrada');
        }
        throw new Error('Erro ao buscar ordem de serviço');
      }

      const data: OrdemServico = await response.json();
      setOrdemServico(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrdemServico();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      fetchOrdemServico();
    }
  };

  return {
    ordemServico,
    loading,
    error,
    refetch
  };
}

// Hook para templates de checklist
interface TemplateChecklist {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  itens: {
    id: string;
    descricao: string;
    ordem: number;
    obrigatorio: boolean;
  }[];
  criadorId: string;
  criador: Colaborador;
  createdAt: string;
  updatedAt: string;
}

interface TemplatesChecklistResponse {
  data: TemplateChecklist[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseTemplatesChecklistParams {
  page?: number;
  limit?: number;
  search?: string;
  ativo?: boolean;
}

export function useTemplatesChecklist(params: UseTemplatesChecklistParams = {}) {
  const [templates, setTemplates] = useState<TemplateChecklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.ativo !== undefined) searchParams.set('ativo', params.ativo.toString());

      const response = await fetch(`/api/templates-checklist?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar templates de checklist');
      }

      const data: TemplatesChecklistResponse = await response.json();
      setTemplates(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [params.page, params.limit, params.search, params.ativo]);

  const refetch = () => {
    fetchTemplates();
  };

  return {
    templates,
    loading,
    error,
    meta,
    refetch
  };
}
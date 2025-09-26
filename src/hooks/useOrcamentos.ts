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

interface OrdemServico {
  id: string;
  numero: string;
  titulo: string;
  cliente: Cliente;
}

interface LaudoTecnico {
  id: string;
  numero: string;
  titulo: string;
}

interface ItemOrcamento {
  id: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  observacoes?: string;
}

interface AnexoOrcamento {
  id: string;
  nome: string;
  arquivo: string;
  tamanho: number;
  tipo: string;
  colaboradorId: string;
  colaborador: Colaborador;
  createdAt: string;
}

interface HistoricoOrcamento {
  id: string;
  acao: string;
  descricao: string;
  colaboradorId: string;
  colaborador: Colaborador;
  createdAt: string;
}

interface Orcamento {
  id: string;
  numero: string;
  titulo: string;
  descricao?: string;
  status: 'RASCUNHO' | 'ENVIADO' | 'APROVADO' | 'REJEITADO' | 'EXPIRADO' | 'CANCELADO';
  valorTotal: number;
  dataValidade: string;
  observacoes?: string;
  geradoAutomaticamente: boolean;
  ordemServicoId: string;
  ordemServico: OrdemServico;
  laudoTecnicoId?: string;
  laudoTecnico?: LaudoTecnico;
  clienteId: string;
  cliente: Cliente;
  criadorId: string;
  criador: Colaborador;
  itens: ItemOrcamento[];
  anexos: AnexoOrcamento[];
  historico: HistoricoOrcamento[];
  createdAt: string;
  updatedAt: string;
}

interface OrcamentosResponse {
  data: Orcamento[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UseOrcamentosParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  clienteId?: string;
  ordemServicoId?: string;
  laudoTecnicoId?: string;
  dataInicio?: string;
  dataFim?: string;
  geradoAutomaticamente?: boolean;
}

export function useOrcamentos(params: UseOrcamentosParams = {}) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0
  });

  const fetchOrcamentos = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);
      if (params.clienteId) searchParams.set('clienteId', params.clienteId);
      if (params.ordemServicoId) searchParams.set('ordemServicoId', params.ordemServicoId);
      if (params.laudoTecnicoId) searchParams.set('laudoTecnicoId', params.laudoTecnicoId);
      if (params.dataInicio) searchParams.set('dataInicio', params.dataInicio);
      if (params.dataFim) searchParams.set('dataFim', params.dataFim);
      if (params.geradoAutomaticamente !== undefined) {
        searchParams.set('geradoAutomaticamente', params.geradoAutomaticamente.toString());
      }

      const response = await fetch(`/api/orcamentos?${searchParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar orçamentos');
      }

      const data: OrcamentosResponse = await response.json();
      setOrcamentos(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrcamentos();
  }, [
    params.page, 
    params.limit, 
    params.search, 
    params.status, 
    params.clienteId,
    params.ordemServicoId,
    params.laudoTecnicoId,
    params.dataInicio,
    params.dataFim,
    params.geradoAutomaticamente
  ]);

  const refetch = () => {
    fetchOrcamentos();
  };

  return {
    orcamentos,
    loading,
    error,
    meta,
    refetch
  };
}

export function useOrcamento(id: string) {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrcamento = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orcamentos/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Orçamento não encontrado');
        }
        throw new Error('Erro ao buscar orçamento');
      }

      const data: Orcamento = await response.json();
      setOrcamento(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrcamento();
    }
  }, [id]);

  const refetch = () => {
    if (id) {
      fetchOrcamento();
    }
  };

  return {
    orcamento,
    loading,
    error,
    refetch
  };
}

// Hook para gerar orçamento automaticamente
export function useGerarOrcamentoAutomatico() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gerarOrcamento = async (ordemServicoId: string, laudoTecnicoId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/orcamentos/gerar-automatico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ordemServicoId,
          laudoTecnicoId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar orçamento');
      }

      const data: Orcamento = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    gerarOrcamento,
    loading,
    error
  };
}

// Hook para aprovação de orçamento pelo cliente
export function useAprovacaoOrcamento() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processarAprovacao = async (id: string, aprovado: boolean, observacoes?: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/orcamentos/aprovacao/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aprovado,
          observacoes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar aprovação');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    processarAprovacao,
    loading,
    error
  };
}
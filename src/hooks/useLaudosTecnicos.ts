import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface LaudoTecnicoListItem {
  id: string;
  numero: string;
  titulo: string;
  ordemServicoId: string;
  tecnicoId: string;
  status: 'RASCUNHO' | 'EM_ANALISE' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REJEITADO';
  createdAt: string;
  updatedAt: string;
  ordemServico?: {
    id: string;
    numero: string;
    titulo: string;
  };
  tecnico?: {
    id: string;
    nome: string;
    email: string;
  };
}

interface UseLaudosTecnicosParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  tecnicoId?: string;
}

interface UseLaudosTecnicosReturn {
  laudos: LaudoTecnicoListItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  totalPages: number;
  currentPage: number;
  fetchLaudos: () => Promise<void>;
  deleteLaudo: (laudoId: string) => Promise<void>;
  refreshLaudos: () => Promise<void>;
}

export function useLaudosTecnicos({
  page = 1,
  pageSize = 10,
  search = '',
  status = '',
  tecnicoId = ''
}: UseLaudosTecnicosParams = {}): UseLaudosTecnicosReturn {
  const [laudos, setLaudos] = useState<LaudoTecnicoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const { toast } = useToast();

  const fetchLaudos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(tecnicoId && { tecnicoId })
      });

      const response = await fetch(`/api/laudos-tecnicos?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar laudos técnicos');
      }

      const data = await response.json();
      
      setLaudos(data.laudos || []);
      setTotalCount(data.totalCount || 0);
      setTotalPages(data.totalPages || 0);
      setCurrentPage(data.currentPage || page);
    } catch (error) {
      console.error('Erro ao buscar laudos técnicos:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setLaudos([]);
      setTotalCount(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, status, tecnicoId]);

  const deleteLaudo = useCallback(async (laudoId: string) => {
    try {
      const response = await fetch(`/api/laudos-tecnicos/${laudoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir laudo técnico');
      }

      // Remove o laudo da lista local
      setLaudos(prev => prev.filter(laudo => laudo.id !== laudoId));
      setTotalCount(prev => prev - 1);

      toast({
        title: 'Sucesso',
        description: 'Laudo técnico excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir laudo técnico:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir laudo técnico',
        variant: 'destructive'
      });
      throw error;
    }
  }, [toast]);

  const refreshLaudos = useCallback(async () => {
    await fetchLaudos();
  }, [fetchLaudos]);

  useEffect(() => {
    fetchLaudos();
  }, [fetchLaudos]);

  return {
    laudos,
    loading,
    error,
    totalCount,
    totalPages,
    currentPage,
    fetchLaudos,
    deleteLaudo,
    refreshLaudos
  };
}
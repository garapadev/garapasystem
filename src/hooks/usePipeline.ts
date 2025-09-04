'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useToast } from './use-toast';

interface EtapaPipeline {
  id: string;
  nome: string;
  descricao?: string;
  ordem: number;
  cor: string;
  criadoEm: string;
  atualizadoEm: string;
  _count?: {
    oportunidades: number;
  };
}

interface UsePipelineReturn {
  etapas: EtapaPipeline[];
  loading: boolean;
  error: string | null;
  refreshEtapas: () => Promise<void>;
  createEtapa: (data: Partial<EtapaPipeline>) => Promise<void>;
  updateEtapa: (id: string, data: Partial<EtapaPipeline>) => Promise<void>;
  deleteEtapa: (id: string) => Promise<void>;
  reorderEtapas: (etapas: EtapaPipeline[]) => Promise<void>;
}

export function usePipeline(): UsePipelineReturn {
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { toast } = useToast();

  // Fetch etapas
  const fetchEtapas = useCallback(async () => {
    try {
      const response = await fetch('/api/negocios/etapas');
      if (!response.ok) throw new Error('Erro ao carregar etapas');
      const data = await response.json();
      setEtapas(data.etapas || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchEtapas();
      setLoading(false);
    };
    loadData();
  }, [fetchEtapas]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleEtapaUpdate = (data: any) => {
      switch (data.action) {
        case 'created':
          toast({
            title: 'Nova Etapa',
            description: `Etapa "${data.etapaNome}" foi criada`,
          });
          fetchEtapas();
          break;
        case 'updated':
          toast({
            title: 'Etapa Atualizada',
            description: `Etapa "${data.etapaNome}" foi atualizada`,
          });
          fetchEtapas();
          break;
        case 'deleted':
          toast({
            title: 'Etapa Removida',
            description: `Etapa "${data.etapaNome}" foi removida`,
            variant: 'destructive',
          });
          fetchEtapas();
          break;
        case 'reordered':
          toast({
            title: 'Pipeline Reorganizado',
            description: 'A ordem das etapas foi atualizada',
          });
          fetchEtapas();
          break;
      }
    };

    socket.on('etapa-notification', handleEtapaUpdate);

    return () => {
      socket.off('etapa-notification', handleEtapaUpdate);
    };
  }, [socket, toast, fetchEtapas]);

  // CRUD operations
  const createEtapa = useCallback(async (data: Partial<EtapaPipeline>) => {
    try {
      const response = await fetch('/api/negocios/etapas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar etapa');
      }
      
      const result = await response.json();
      
      // Emit socket event
      if (socket) {
        socket.emit('etapa-updated', {
          action: 'created',
          etapaId: result.etapa.id,
          etapaNome: result.etapa.nome,
          userId: 'current-user', // TODO: Get from auth context
        });
      }
      
      await fetchEtapas();
      
      toast({
        title: 'Sucesso',
        description: 'Etapa criada com sucesso',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar etapa';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  }, [socket, fetchEtapas, toast]);

  const updateEtapa = useCallback(async (id: string, data: Partial<EtapaPipeline>) => {
    try {
      const response = await fetch(`/api/negocios/etapas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar etapa');
      }
      
      const result = await response.json();
      
      // Emit socket event
      if (socket) {
        socket.emit('etapa-updated', {
          action: 'updated',
          etapaId: id,
          etapaNome: result.etapa.nome,
          userId: 'current-user', // TODO: Get from auth context
        });
      }
      
      await fetchEtapas();
      
      toast({
        title: 'Sucesso',
        description: 'Etapa atualizada com sucesso',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar etapa';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  }, [socket, fetchEtapas, toast]);

  const deleteEtapa = useCallback(async (id: string) => {
    try {
      const etapa = etapas.find(e => e.id === id);
      
      const response = await fetch(`/api/negocios/etapas/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir etapa');
      }
      
      // Emit socket event
      if (socket && etapa) {
        socket.emit('etapa-updated', {
          action: 'deleted',
          etapaId: id,
          etapaNome: etapa.nome,
          userId: 'current-user', // TODO: Get from auth context
        });
      }
      
      await fetchEtapas();
      
      toast({
        title: 'Sucesso',
        description: 'Etapa excluída com sucesso',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir etapa';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  }, [socket, etapas, fetchEtapas, toast]);

  const reorderEtapas = useCallback(async (novasEtapas: EtapaPipeline[]) => {
    try {
      // Update local state optimistically
      setEtapas(novasEtapas);
      
      const response = await fetch('/api/negocios/etapas/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etapas: novasEtapas.map((etapa, index) => ({
            id: etapa.id,
            ordem: index + 1,
          })),
        }),
      });
      
      if (!response.ok) {
        // Revert optimistic update on error
        await fetchEtapas();
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao reordenar etapas');
      }
      
      // Emit socket event
      if (socket) {
        socket.emit('etapa-updated', {
          action: 'reordered',
          userId: 'current-user', // TODO: Get from auth context
        });
      }
      
      toast({
        title: 'Sucesso',
        description: 'Ordem das etapas atualizada',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reordenar etapas';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  }, [socket, fetchEtapas, toast]);

  return {
    etapas,
    loading,
    error,
    refreshEtapas: fetchEtapas,
    createEtapa,
    updateEtapa,
    deleteEtapa,
    reorderEtapas,
  };
}
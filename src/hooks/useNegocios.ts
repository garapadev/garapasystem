'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useToast } from './use-toast';

interface Oportunidade {
  id: string;
  titulo: string;
  descricao?: string;
  valor: number;
  dataFechamento?: string;
  probabilidade: number;
  status: 'ATIVA' | 'GANHA' | 'PERDIDA';
  clienteId: string;
  responsavelId: string;
  etapaId: string;
  criadoEm: string;
  atualizadoEm: string;
  cliente?: {
    id: string;
    nome: string;
  };
  responsavel?: {
    id: string;
    nome: string;
  };
  etapa?: {
    id: string;
    nome: string;
    ordem: number;
  };
}

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

interface UseNegociosReturn {
  oportunidades: Oportunidade[];
  etapas: EtapaPipeline[];
  loading: boolean;
  error: string | null;
  refreshOportunidades: () => Promise<void>;
  refreshEtapas: () => Promise<void>;
  createOportunidade: (data: Partial<Oportunidade>) => Promise<void>;
  updateOportunidade: (id: string, data: Partial<Oportunidade>) => Promise<void>;
  deleteOportunidade: (id: string) => Promise<void>;
  moveOportunidade: (id: string, etapaId: string) => Promise<void>;
}

export function useNegocios(): UseNegociosReturn {
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [etapas, setEtapas] = useState<EtapaPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();
  const { toast } = useToast();

  // Fetch oportunidades
  const fetchOportunidades = useCallback(async () => {
    try {
      const response = await fetch('/api/negocios/oportunidades');
      if (!response.ok) throw new Error('Erro ao carregar oportunidades');
      const data = await response.json();
      setOportunidades(data.oportunidades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }, []);

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
      await Promise.all([fetchOportunidades(), fetchEtapas()]);
      setLoading(false);
    };
    loadData();
  }, [fetchOportunidades, fetchEtapas]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for oportunidade updates
    const handleOportunidadeUpdate = (data: any) => {
      switch (data.action) {
        case 'created':
          toast({
            title: 'Nova Oportunidade',
            description: `${data.oportunidadeTitulo} foi criada`,
          });
          fetchOportunidades();
          break;
        case 'updated':
          toast({
            title: 'Oportunidade Atualizada',
            description: `${data.oportunidadeTitulo} foi atualizada`,
          });
          fetchOportunidades();
          break;
        case 'deleted':
          toast({
            title: 'Oportunidade Removida',
            description: `${data.oportunidadeTitulo} foi removida`,
            variant: 'destructive',
          });
          fetchOportunidades();
          break;
        case 'moved':
          toast({
            title: 'Oportunidade Movida',
            description: `${data.oportunidadeTitulo} foi movida para ${data.etapaNova}`,
          });
          fetchOportunidades();
          break;
      }
    };

    // Listen for etapa updates
    const handleEtapaUpdate = (data: any) => {
      switch (data.action) {
        case 'created':
        case 'updated':
        case 'deleted':
        case 'reordered':
          toast({
            title: 'Pipeline Atualizado',
            description: 'As etapas do pipeline foram atualizadas',
          });
          fetchEtapas();
          break;
      }
    };

    socket.on('oportunidade-notification', handleOportunidadeUpdate);
    socket.on('etapa-notification', handleEtapaUpdate);

    return () => {
      socket.off('oportunidade-notification', handleOportunidadeUpdate);
      socket.off('etapa-notification', handleEtapaUpdate);
    };
  }, [socket, toast, fetchOportunidades, fetchEtapas]);

  // CRUD operations
  const createOportunidade = useCallback(async (data: Partial<Oportunidade>) => {
    try {
      const response = await fetch('/api/negocios/oportunidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar oportunidade');
      }
      
      const result = await response.json();
      
      // Emit socket event
      if (socket) {
        socket.emit('oportunidade-updated', {
          action: 'created',
          oportunidadeId: result.oportunidade.id,
          oportunidadeTitulo: result.oportunidade.titulo,
          userId: 'current-user', // TODO: Get from auth context
        });
      }
      
      await fetchOportunidades();
      
      toast({
        title: 'Sucesso',
        description: 'Oportunidade criada com sucesso',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar oportunidade';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  }, [socket, fetchOportunidades, toast]);

  const updateOportunidade = useCallback(async (id: string, data: Partial<Oportunidade>) => {
    try {
      const response = await fetch(`/api/negocios/oportunidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar oportunidade');
      }
      
      const result = await response.json();
      
      // Emit socket event
      if (socket) {
        socket.emit('oportunidade-updated', {
          action: 'updated',
          oportunidadeId: id,
          oportunidadeTitulo: result.oportunidade.titulo,
          userId: 'current-user', // TODO: Get from auth context
        });
      }
      
      await fetchOportunidades();
      
      toast({
        title: 'Sucesso',
        description: 'Oportunidade atualizada com sucesso',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar oportunidade';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  }, [socket, fetchOportunidades, toast]);

  const deleteOportunidade = useCallback(async (id: string) => {
    try {
      const oportunidade = oportunidades.find(o => o.id === id);
      
      const response = await fetch(`/api/negocios/oportunidades/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir oportunidade');
      }
      
      // Emit socket event
      if (socket && oportunidade) {
        socket.emit('oportunidade-updated', {
          action: 'deleted',
          oportunidadeId: id,
          oportunidadeTitulo: oportunidade.titulo,
          userId: 'current-user', // TODO: Get from auth context
        });
      }
      
      await fetchOportunidades();
      
      toast({
        title: 'Sucesso',
        description: 'Oportunidade excluída com sucesso',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao excluir oportunidade';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  }, [socket, oportunidades, fetchOportunidades, toast]);

  const moveOportunidade = useCallback(async (id: string, etapaId: string) => {
    try {
      const oportunidade = oportunidades.find(o => o.id === id);
      const etapaAnterior = oportunidade?.etapa?.nome;
      const etapaNova = etapas.find(e => e.id === etapaId)?.nome;
      
      const response = await fetch(`/api/negocios/oportunidades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapaId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao mover oportunidade');
      }
      
      // Emit socket event
      if (socket && oportunidade) {
        socket.emit('oportunidade-updated', {
          action: 'moved',
          oportunidadeId: id,
          oportunidadeTitulo: oportunidade.titulo,
          etapaAnterior,
          etapaNova,
          userId: 'current-user', // TODO: Get from auth context
        });
      }
      
      await fetchOportunidades();
      
      toast({
        title: 'Sucesso',
        description: `Oportunidade movida para ${etapaNova}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao mover oportunidade';
      setError(message);
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  }, [socket, oportunidades, etapas, fetchOportunidades, toast]);

  return {
    oportunidades,
    etapas,
    loading,
    error,
    refreshOportunidades: fetchOportunidades,
    refreshEtapas: fetchEtapas,
    createOportunidade,
    updateOportunidade,
    deleteOportunidade,
    moveOportunidade,
  };
}
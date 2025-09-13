'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

// Tipos para os dados dos tickets
interface HelpdeskTicket {
  id: number;
  numero: string;
  assunto: string;
  descricao: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO';
  solicitanteNome: string;
  solicitanteEmail: string;
  departamentoId: number;
  departamento?: {
    id: number;
    nome: string;
  };
  categoria?: string;
  tags?: string;
  dataAbertura: Date;
  dataFechamento?: Date;
  dataUltimaResposta?: Date;
  createdAt: Date;
  updatedAt: Date;
  responsavelId?: number;
  responsavel?: {
    id: number;
    nome: string;
  };
}

interface UseTicketsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  initialFilters?: Record<string, any>;
}

interface UseTicketsReturn {
  tickets: HelpdeskTicket[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refresh: () => Promise<void>;
  createTicket: (data: Partial<HelpdeskTicket>) => Promise<HelpdeskTicket | null>;
  updateTicket: (id: number, data: Partial<HelpdeskTicket>) => Promise<HelpdeskTicket | null>;
  deleteTicket: (id: number) => Promise<boolean>;
  exportTickets: (tickets: HelpdeskTicket[], format?: 'csv' | 'excel') => void;
}

export function useTickets(options: UseTicketsOptions = {}): UseTicketsReturn {
  const { autoRefresh = false, refreshInterval = 30000, initialFilters = {} } = options;
  
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Estabilizar os filtros para evitar recriações desnecessárias
  const stableFilters = useMemo(() => initialFilters, [JSON.stringify(initialFilters)]);

  // Função para buscar tickets
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      // Adicionar filtros à query
      Object.entries(stableFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/helpdesk/tickets?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar tickets: ${response.status}`);
      }

      const data = await response.json();
      
      // Converter strings de data para objetos Date
      const ticketsWithDates = data.tickets.map((ticket: any) => ({
        ...ticket,
        dataAbertura: new Date(ticket.dataAbertura),
        dataFechamento: ticket.dataFechamento ? new Date(ticket.dataFechamento) : undefined,
        dataUltimaResposta: ticket.dataUltimaResposta ? new Date(ticket.dataUltimaResposta) : undefined,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
      }));

      setTickets(ticketsWithDates);
      setTotalCount(data.totalCount || ticketsWithDates.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error('Erro ao carregar tickets', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [stableFilters]);

  // Função para criar ticket
  const createTicket = useCallback(async (data: Partial<HelpdeskTicket>): Promise<HelpdeskTicket | null> => {
    try {
      const response = await fetch('/api/helpdesk/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar ticket: ${response.status}`);
      }

      const newTicket = await response.json();
      
      // Converter datas
      const ticketWithDates = {
        ...newTicket,
        dataAbertura: new Date(newTicket.dataAbertura),
        dataFechamento: newTicket.dataFechamento ? new Date(newTicket.dataFechamento) : undefined,
        dataUltimaResposta: newTicket.dataUltimaResposta ? new Date(newTicket.dataUltimaResposta) : undefined,
        createdAt: new Date(newTicket.createdAt),
        updatedAt: new Date(newTicket.updatedAt),
      };

      // Atualizar lista local
      setTickets(prev => [ticketWithDates, ...prev]);
      setTotalCount(prev => prev + 1);

      toast.success('Ticket criado com sucesso', {
        description: `Ticket #${newTicket.numero} foi criado`,
      });

      return ticketWithDates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao criar ticket', {
        description: errorMessage,
      });
      return null;
    }
  }, []);

  // Função para atualizar ticket
  const updateTicket = useCallback(async (id: number, data: Partial<HelpdeskTicket>): Promise<HelpdeskTicket | null> => {
    try {
      const response = await fetch(`/api/helpdesk/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar ticket: ${response.status}`);
      }

      const updatedTicket = await response.json();
      
      // Converter datas
      const ticketWithDates = {
        ...updatedTicket,
        dataAbertura: new Date(updatedTicket.dataAbertura),
        dataFechamento: updatedTicket.dataFechamento ? new Date(updatedTicket.dataFechamento) : undefined,
        dataUltimaResposta: updatedTicket.dataUltimaResposta ? new Date(updatedTicket.dataUltimaResposta) : undefined,
        createdAt: new Date(updatedTicket.createdAt),
        updatedAt: new Date(updatedTicket.updatedAt),
      };

      // Atualizar lista local
      setTickets(prev => prev.map(ticket => 
        ticket.id === id ? ticketWithDates : ticket
      ));

      toast.success('Ticket atualizado com sucesso', {
        description: `Ticket #${updatedTicket.numero} foi atualizado`,
      });

      return ticketWithDates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar ticket', {
        description: errorMessage,
      });
      return null;
    }
  }, []);

  // Função para deletar ticket
  const deleteTicket = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/helpdesk/tickets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Erro ao deletar ticket: ${response.status}`);
      }

      // Remover da lista local
      setTickets(prev => prev.filter(ticket => ticket.id !== id));
      setTotalCount(prev => prev - 1);

      toast.success('Ticket removido com sucesso');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao remover ticket', {
        description: errorMessage,
      });
      return false;
    }
  }, []);

  // Função para exportar tickets
  const exportTickets = useCallback((tickets: HelpdeskTicket[], format: 'csv' | 'excel' = 'csv') => {
    try {
      if (format === 'csv') {
        // Gerar CSV
        const headers = [
          'Número',
          'Assunto',
          'Solicitante',
          'Email',
          'Departamento',
          'Categoria',
          'Prioridade',
          'Status',
          'Data Abertura',
          'Data Fechamento',
          'Última Resposta',
          'Criado em',
          'Atualizado em',
          'Responsável',
          'Tags'
        ];

        const csvContent = [
          headers.join(','),
          ...tickets.map(ticket => [
            `"${ticket.numero}"`,
            `"${ticket.assunto.replace(/"/g, '""')}"`,
            `"${ticket.solicitanteNome}"`,
            `"${ticket.solicitanteEmail}"`,
            `"${ticket.departamento?.nome || ''}"`,
            `"${ticket.categoria || ''}"`,
            `"${ticket.prioridade}"`,
            `"${ticket.status}"`,
            `"${ticket.dataAbertura.toLocaleDateString('pt-BR')}"`,
            `"${ticket.dataFechamento?.toLocaleDateString('pt-BR') || ''}"`,
            `"${ticket.dataUltimaResposta?.toLocaleDateString('pt-BR') || ''}"`,
            `"${ticket.createdAt.toLocaleDateString('pt-BR')}"`,
            `"${ticket.updatedAt.toLocaleDateString('pt-BR')}"`,
            `"${ticket.responsavel?.nome || ''}"`,
            `"${ticket.tags || ''}"`
          ].join(','))
        ].join('\n');

        // Download do arquivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tickets_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Arquivo CSV exportado com sucesso');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao exportar dados', {
        description: errorMessage,
      });
    }
  }, []);

  // Função de refresh
  const refresh = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Efeito para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTickets();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  return {
    tickets,
    loading,
    error,
    totalCount,
    refresh,
    createTicket,
    updateTicket,
    deleteTicket,
    exportTickets,
  };
}

// Hook para estatísticas de tickets
export function useTicketStats() {
  const [stats, setStats] = useState({
    total: 0,
    abertos: 0,
    emAndamento: 0,
    resolvidos: 0,
    fechados: 0,
    porPrioridade: {
      BAIXA: 0,
      MEDIA: 0,
      ALTA: 0,
      URGENTE: 0,
    },
    porDepartamento: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/tickets/stats');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refresh: fetchStats,
  };
}
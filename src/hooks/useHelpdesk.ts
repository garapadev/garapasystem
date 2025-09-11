'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Tipos
export interface HelpdeskTicket {
  id: string;
  numero: number;
  assunto: string;
  descricao?: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDO' | 'FECHADO';
  solicitanteNome: string;
  solicitanteEmail: string;
  solicitanteTelefone?: string;
  dataAbertura: string;
  dataFechamento?: string;
  dataUltimaResposta?: string;
  createdAt: string;
  updatedAt: string;
  cliente?: {
    id: string;
    nome: string;
    email: string;
    telefone?: string;
  };
  departamento: {
    id: string;
    nome: string;
    descricao?: string;
  };
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
  mensagens?: HelpdeskMensagem[];
  _count?: {
    mensagens: number;
  };
}

export interface HelpdeskMensagem {
  id: string;
  conteudo: string;
  tipoConteudo: 'TEXTO' | 'HTML' | 'MARKDOWN';
  remetenteNome: string;
  remetenteEmail: string;
  isInterno: boolean;
  createdAt: string;
  autor?: {
    id: string;
    nome: string;
    email: string;
  };
  anexos?: HelpdeskAnexo[];
}

export interface HelpdeskAnexo {
  id: string;
  nomeArquivo: string;
  tipoConteudo: string;
  tamanho: number;
  createdAt: string;
}

export interface HelpdeskDepartamento {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  syncEnabled: boolean;
  syncInterval: number;
  lastSync?: Date;
  hasImapPassword: boolean;
  hasSmtpPassword: boolean;
  grupoHierarquico?: {
    id: string;
    nome: string;
  };
  _count?: {
    helpdeskTickets: number;
  };
}

export interface CreateTicketData {
  assunto: string;
  descricao: string;
  solicitanteNome: string;
  solicitanteEmail: string;
  solicitanteTelefone?: string;
  departamentoId: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  responsavelId?: string;
  clienteId?: string;
}

export interface UpdateTicketData {
  assunto?: string;
  descricao?: string;
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  status?: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDO' | 'FECHADO';
  responsavelId?: string;
  solicitanteNome?: string;
  solicitanteEmail?: string;
  solicitanteTelefone?: string;
}

export interface CreateMensagemData {
  conteudo: string;
  tipoConteudo?: 'TEXTO' | 'HTML' | 'MARKDOWN';
  remetenteNome: string;
  remetenteEmail: string;
  isInterno?: boolean;
}

export interface TicketFilters {
  search?: string;
  status?: string;
  prioridade?: string;
  departamentoId?: string;
  responsavelId?: string;
  clienteId?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Hook para gerenciar tickets
export function useTickets() {
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchTickets = useCallback(async (filters: TicketFilters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/helpdesk/tickets?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar tickets');
      }

      const data = await response.json();
      setTickets(data.tickets);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast.error('Erro ao carregar tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (data: CreateTicketData): Promise<HelpdeskTicket | null> => {
    try {
      const response = await fetch('/api/helpdesk/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar ticket');
      }

      const ticket = await response.json();
      toast.success('Ticket criado com sucesso!');
      
      // Atualizar lista de tickets
      await fetchTickets();
      
      return ticket;
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar ticket');
      return null;
    }
  }, [fetchTickets]);

  const updateTicket = useCallback(async (id: string, data: UpdateTicketData): Promise<HelpdeskTicket | null> => {
    try {
      const response = await fetch(`/api/helpdesk/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar ticket');
      }

      const ticket = await response.json();
      toast.success('Ticket atualizado com sucesso!');
      
      // Atualizar ticket na lista
      setTickets(prev => prev.map(t => t.id === id ? ticket : t));
      
      return ticket;
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar ticket');
      return null;
    }
  }, []);

  const deleteTicket = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/helpdesk/tickets/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir ticket');
      }

      toast.success('Ticket excluído com sucesso!');
      
      // Remover ticket da lista
      setTickets(prev => prev.filter(t => t.id !== id));
      
      return true;
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir ticket');
      return false;
    }
  }, []);

  return {
    tickets,
    loading,
    pagination,
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
  };
}

// Hook para gerenciar um ticket específico
export function useTicket(id: string) {
  const [ticket, setTicket] = useState<HelpdeskTicket | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/helpdesk/tickets/${id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar ticket');
      }

      const data = await response.json();
      setTicket(data);
    } catch (error) {
      console.error('Erro ao buscar ticket:', error);
      toast.error('Erro ao carregar ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const updateTicket = useCallback(async (data: UpdateTicketData): Promise<HelpdeskTicket | null> => {
    if (!id) return null;
    
    try {
      const response = await fetch(`/api/helpdesk/tickets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar ticket');
      }

      const updatedTicket = await response.json();
      setTicket(updatedTicket);
      toast.success('Ticket atualizado com sucesso!');
      
      return updatedTicket;
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar ticket');
      return null;
    }
  }, [id]);

  const addMensagem = useCallback(async (data: CreateMensagemData): Promise<HelpdeskMensagem | null> => {
    if (!id) return null;
    
    try {
      const response = await fetch(`/api/helpdesk/tickets/${id}/mensagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar mensagem');
      }

      const mensagem = await response.json();
      toast.success('Mensagem enviada com sucesso!');
      
      // Atualizar ticket com nova mensagem
      await fetchTicket();
      
      return mensagem;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem');
      return null;
    }
  }, [id, fetchTicket]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return {
    ticket,
    loading,
    fetchTicket,
    updateTicket,
    addMensagem,
  };
}

// Hook para gerenciar departamentos
export function useDepartamentos() {
  const [departamentos, setDepartamentos] = useState<HelpdeskDepartamento[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartamentos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/helpdesk/departamentos');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar departamentos');
      }

      const data = await response.json();
      setDepartamentos(data.departamentos);
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      toast.error('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartamentos();
  }, [fetchDepartamentos]);

  return {
    departamentos,
    loading,
    fetchDepartamentos,
  };
}

// Hook para estatísticas do Helpdesk
export function useHelpdeskStats() {
  const [stats, setStats] = useState({
    totalTickets: 0,
    ticketsAbertos: 0,
    ticketsEmAndamento: 0,
    ticketsResolvidos: 0,
    ticketsFechados: 0,
    tempoMedioResposta: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Por enquanto, calcular estatísticas do lado do cliente
      // TODO: Implementar endpoint específico para estatísticas
      const response = await fetch('/api/helpdesk/tickets?limit=1000');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas');
      }

      const data = await response.json();
      const tickets: HelpdeskTicket[] = data.tickets;

      const stats = {
        totalTickets: tickets.length,
        ticketsAbertos: tickets.filter(t => t.status === 'ABERTO').length,
        ticketsEmAndamento: tickets.filter(t => t.status === 'EM_ANDAMENTO').length,
        ticketsResolvidos: tickets.filter(t => t.status === 'RESOLVIDO').length,
        ticketsFechados: tickets.filter(t => t.status === 'FECHADO').length,
        tempoMedioResposta: 0, // TODO: Calcular tempo médio de resposta
      };

      setStats(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
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
    fetchStats,
  };
}
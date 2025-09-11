'use client';

import { useState, useEffect, useCallback } from 'react';
import { HelpdeskTicket, HelpdeskMensagem, UpdateTicketData, CreateMensagemData } from './useHelpdesk';
import { toast } from 'sonner';
import { TicketNotificationService } from '@/lib/helpdesk/notification-service';

interface UseHelpdeskTicketReturn {
  ticket: HelpdeskTicket | null;
  loading: boolean;
  error: string | null;
  updateTicket: (data: UpdateTicketData) => Promise<void>;
  addMessage: (data: CreateMensagemData) => Promise<void>;
  refreshTicket: () => Promise<void>;
}

export function useHelpdeskTicket(ticketId: string): UseHelpdeskTicketReturn {
  const [ticket, setTicket] = useState<HelpdeskTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/helpdesk/tickets/${ticketId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Ticket não encontrado');
        }
        throw new Error('Erro ao carregar ticket');
      }
      
      const data = await response.json();
      setTicket(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('Erro ao buscar ticket:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const updateTicket = useCallback(async (data: UpdateTicketData, notifyObservers: boolean = true) => {
    if (!ticketId) return;
    
    try {
      const response = await fetch(`/api/helpdesk/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar ticket');
      }
      
      const updatedTicket = await response.json();
      
      // Enviar notificações se solicitado
      if (notifyObservers && ticket && ticket.observadores) {
        await sendUpdateNotifications(ticket, data);
      }
      
      setTicket(updatedTicket);
    } catch (err) {
      console.error('Erro ao atualizar ticket:', err);
      throw err;
    }
  }, [ticketId, ticket]);

  const addMessage = useCallback(async (data: CreateMensagemData, notifyObservers: boolean = true) => {
    if (!ticketId) return;
    
    try {
      const response = await fetch(`/api/helpdesk/tickets/${ticketId}/mensagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar mensagem');
      }
      
      // Enviar notificações se solicitado
      if (notifyObservers && ticket && ticket.observadores) {
        await TicketNotificationService.notifyObservers(
          ticket.id,
          ticket.observadores,
          {
            ticketId: ticket.id,
            type: 'new_message',
            authorName: 'Usuário Atual', // Em produção, pegar do contexto de autenticação
            authorEmail: 'usuario@exemplo.com', // Em produção, pegar do contexto de autenticação
            message: data.conteudo
          }
        );
      }
      
      // Recarregar o ticket para obter as mensagens atualizadas
      await fetchTicket();
    } catch (err) {
      console.error('Erro ao adicionar mensagem:', err);
      throw err;
    }
  }, [ticketId, fetchTicket, ticket]);

  const refreshTicket = useCallback(async () => {
    await fetchTicket();
  }, [fetchTicket]);

  // Função auxiliar para enviar notificações de atualização
  const sendUpdateNotifications = useCallback(async (originalTicket: HelpdeskTicket, updates: UpdateTicketData) => {
    try {
      // Detectar tipo de alteração e enviar notificação apropriada
      if (updates.status && updates.status !== originalTicket.status) {
        await TicketNotificationService.notifyObservers(
          originalTicket.id,
          originalTicket.observadores || [],
          {
            ticketId: originalTicket.id,
            type: 'status_change',
            authorName: 'Usuário Atual', // Em produção, pegar do contexto de autenticação
            authorEmail: 'usuario@exemplo.com', // Em produção, pegar do contexto de autenticação
            oldValue: originalTicket.status,
            newValue: updates.status
          }
        );
      }
      
      if (updates.prioridade && updates.prioridade !== originalTicket.prioridade) {
        await TicketNotificationService.notifyObservers(
          originalTicket.id,
          originalTicket.observadores || [],
          {
            ticketId: originalTicket.id,
            type: 'priority_change',
            authorName: 'Usuário Atual',
            authorEmail: 'usuario@exemplo.com',
            oldValue: originalTicket.prioridade,
            newValue: updates.prioridade
          }
        );
      }
      
      if (updates.responsavelId !== undefined && updates.responsavelId !== originalTicket.responsavelId) {
        await TicketNotificationService.notifyObservers(
          originalTicket.id,
          originalTicket.observadores || [],
          {
            ticketId: originalTicket.id,
            type: 'assigned',
            authorName: 'Usuário Atual',
            authorEmail: 'usuario@exemplo.com',
            oldValue: originalTicket.responsavel?.nome || 'Não atribuído',
            newValue: updates.responsavelId ? 'Novo responsável' : 'Não atribuído'
          }
        );
      }
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
      // Não interromper o fluxo principal por erro de notificação
    }
  }, []);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return {
    ticket,
    loading,
    error,
    updateTicket,
    addMessage,
    refreshTicket,
  };
}
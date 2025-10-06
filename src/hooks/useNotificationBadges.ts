'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/hooks/useSocket';

export interface NotificationBadge {
  id: string;
  module: string;
  count: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'info' | 'warning' | 'error' | 'success';
  lastUpdated: Date;
  details?: {
    title: string;
    description?: string;
    href?: string;
  };
}

interface NotificationBadgesState {
  badges: Record<string, NotificationBadge>;
  totalCount: number;
  highPriorityCount: number;
}

export function useNotificationBadges() {
  const [state, setState] = useState<NotificationBadgesState>({
    badges: {},
    totalCount: 0,
    highPriorityCount: 0
  });
  
  const { socket, isConnected } = useSocket();

  // Calcular totais
  const calculateTotals = useCallback((badges: Record<string, NotificationBadge>) => {
    const badgeArray = Object.values(badges);
    const totalCount = badgeArray.reduce((sum, badge) => sum + badge.count, 0);
    const highPriorityCount = badgeArray
      .filter(badge => badge.priority === 'high' || badge.priority === 'urgent')
      .reduce((sum, badge) => sum + badge.count, 0);
    
    return { totalCount, highPriorityCount };
  }, []);

  // Atualizar badge específico
  const updateBadge = useCallback((badge: NotificationBadge) => {
    setState(prevState => {
      const newBadges = {
        ...prevState.badges,
        [badge.id]: {
          ...badge,
          lastUpdated: new Date()
        }
      };
      
      const totals = calculateTotals(newBadges);
      
      return {
        badges: newBadges,
        ...totals
      };
    });
  }, [calculateTotals]);

  // Remover badge
  const removeBadge = useCallback((badgeId: string) => {
    setState(prevState => {
      const newBadges = { ...prevState.badges };
      delete newBadges[badgeId];
      
      const totals = calculateTotals(newBadges);
      
      return {
        badges: newBadges,
        ...totals
      };
    });
  }, [calculateTotals]);

  // Limpar badge (zerar contador)
  const clearBadge = useCallback((badgeId: string) => {
    setState(prevState => {
      const badge = prevState.badges[badgeId];
      if (!badge) return prevState;
      
      const newBadges = {
        ...prevState.badges,
        [badgeId]: {
          ...badge,
          count: 0,
          lastUpdated: new Date()
        }
      };
      
      const totals = calculateTotals(newBadges);
      
      return {
        badges: newBadges,
        ...totals
      };
    });
  }, [calculateTotals]);

  // Incrementar contador de badge
  const incrementBadge = useCallback((badgeId: string, increment: number = 1) => {
    setState(prevState => {
      const badge = prevState.badges[badgeId];
      if (!badge) return prevState;
      
      const newBadges = {
        ...prevState.badges,
        [badgeId]: {
          ...badge,
          count: badge.count + increment,
          lastUpdated: new Date()
        }
      };
      
      const totals = calculateTotals(newBadges);
      
      return {
        badges: newBadges,
        ...totals
      };
    });
  }, [calculateTotals]);

  // Carregar badges iniciais (simulado - conectar com API real)
  const loadInitialBadges = useCallback(async () => {
    try {
      // Simular dados iniciais - substituir por chamada real à API
      const initialBadges: NotificationBadge[] = [
        {
          id: 'helpdesk-pending',
          module: 'helpdesk',
          count: 5,
          priority: 'high',
          type: 'warning',
          lastUpdated: new Date(),
          details: {
            title: 'Tickets Pendentes',
            description: '5 tickets aguardando atendimento',
            href: '/helpdesk?status=pending'
          }
        },
        {
          id: 'whatsapp-unread',
          module: 'whatsapp',
          count: 12,
          priority: 'medium',
          type: 'info',
          lastUpdated: new Date(),
          details: {
            title: 'Mensagens não lidas',
            description: '12 conversas com mensagens não lidas',
            href: '/whatsapp?filter=unread'
          }
        },
        {
          id: 'orcamentos-expiring',
          module: 'orcamentos',
          count: 3,
          priority: 'urgent',
          type: 'error',
          lastUpdated: new Date(),
          details: {
            title: 'Orçamentos Expirando',
            description: '3 orçamentos expiram hoje',
            href: '/orcamentos?status=expiring'
          }
        },
        {
          id: 'tarefas-overdue',
          module: 'tarefas',
          count: 7,
          priority: 'high',
          type: 'warning',
          lastUpdated: new Date(),
          details: {
            title: 'Tarefas Atrasadas',
            description: '7 tarefas em atraso',
            href: '/tarefas?status=overdue'
          }
        }
      ];

      const badgesMap = initialBadges.reduce((acc, badge) => {
        acc[badge.id] = badge;
        return acc;
      }, {} as Record<string, NotificationBadge>);

      const totals = calculateTotals(badgesMap);

      setState({
        badges: badgesMap,
        ...totals
      });
    } catch (error) {
      console.error('Erro ao carregar badges de notificação:', error);
    }
  }, [calculateTotals]);

  // Configurar listeners do socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listener para atualizações de badges
    const handleBadgeUpdate = (data: NotificationBadge) => {
      updateBadge(data);
    };

    // Listener para remoção de badges
    const handleBadgeRemove = (badgeId: string) => {
      removeBadge(badgeId);
    };

    // Listener para incremento de badges
    const handleBadgeIncrement = (data: { badgeId: string; increment?: number }) => {
      incrementBadge(data.badgeId, data.increment);
    };

    socket.on('notification:badge:update', handleBadgeUpdate);
    socket.on('notification:badge:remove', handleBadgeRemove);
    socket.on('notification:badge:increment', handleBadgeIncrement);

    return () => {
      socket.off('notification:badge:update', handleBadgeUpdate);
      socket.off('notification:badge:remove', handleBadgeRemove);
      socket.off('notification:badge:increment', handleBadgeIncrement);
    };
  }, [socket, isConnected, updateBadge, removeBadge, incrementBadge]);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialBadges();
  }, [loadInitialBadges]);

  // Obter badge por módulo
  const getBadgeByModule = useCallback((module: string) => {
    return Object.values(state.badges).find(badge => badge.module === module);
  }, [state.badges]);

  // Obter badges por prioridade
  const getBadgesByPriority = useCallback((priority: NotificationBadge['priority']) => {
    return Object.values(state.badges).filter(badge => badge.priority === priority);
  }, [state.badges]);

  // Obter cor do badge baseada na prioridade e tipo
  const getBadgeColor = useCallback((badge: NotificationBadge) => {
    if (badge.priority === 'urgent') return 'bg-red-500';
    if (badge.priority === 'high') return 'bg-orange-500';
    if (badge.priority === 'medium') return 'bg-yellow-500';
    return 'bg-blue-500';
  }, []);

  return {
    badges: state.badges,
    totalCount: state.totalCount,
    highPriorityCount: state.highPriorityCount,
    updateBadge,
    removeBadge,
    clearBadge,
    incrementBadge,
    getBadgeByModule,
    getBadgesByPriority,
    getBadgeColor,
    loadInitialBadges
  };
}
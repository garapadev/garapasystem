'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { useNotifications } from '@/components/ui/notification';
// Definindo o tipo localmente baseado no schema
type TaskNotificationType = 
  | 'LEMBRETE_VENCIMENTO'
  | 'TAREFA_ATRASADA'
  | 'TAREFA_ATRIBUIDA'
  | 'STATUS_ALTERADO'
  | 'COMENTARIO_ADICIONADO'
  | 'LEMBRETE_SEM_ATUALIZACAO'
  | 'ALERTA_GESTOR';

interface TaskNotificationData {
  type: TaskNotificationType;
  task: {
    id: string;
    titulo: string;
    descricao?: string;
    dataVencimento?: string;
    prioridade: string;
    status: string;
  };
  destinatario: {
    id: string;
    nome: string;
    email: string;
  };
  timestamp: string;
}

interface TaskNotification {
  id: string;
  tipo: TaskNotificationType;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criadaEm: string;
  taskId: string;
}

const getNotificationConfig = (type: TaskNotificationType) => {
  switch (type) {
    case 'TAREFA_ATRIBUIDA':
      return {
        title: '📋 Nova tarefa atribuída',
        icon: '📋',
        duration: 8000,
        type: 'info' as const,
      };
    case 'STATUS_ALTERADO':
      return {
        title: '🔄 Status da tarefa alterado',
        icon: '🔄',
        duration: 6000,
        type: 'info' as const,
      };
    case 'LEMBRETE_VENCIMENTO':
      return {
        title: '⏰ Lembrete de vencimento',
        icon: '⏰',
        duration: 10000,
        type: 'warning' as const,
      };
    case 'TAREFA_ATRASADA':
      return {
        title: '⚠️ Tarefa atrasada',
        icon: '⚠️',
        duration: 12000,
        type: 'error' as const,
      };
    case 'COMENTARIO_ADICIONADO':
      return {
        title: '💬 Novo comentário',
        icon: '💬',
        duration: 6000,
        type: 'info' as const,
      };
    case 'LEMBRETE_SEM_ATUALIZACAO':
      return {
        title: '📅 Lembrete de atualização',
        icon: '📅',
        duration: 8000,
        type: 'warning' as const,
      };
    case 'ALERTA_GESTOR':
      return {
        title: '👔 Alerta para gestor',
        icon: '👔',
        duration: 10000,
        type: 'warning' as const,
      };
    default:
      return {
        title: '🔔 Notificação de tarefa',
        icon: '🔔',
        duration: 6000,
        type: 'info' as const,
      };
  }
};

const getPriorityColor = (prioridade: string) => {
  switch (prioridade.toUpperCase()) {
    case 'URGENTE':
      return '#dc2626';
    case 'ALTA':
      return '#ef4444';
    case 'MEDIA':
      return '#f59e0b';
    case 'BAIXA':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

const formatTaskMessage = (data: TaskNotificationData) => {
  const { task } = data;
  const priorityColor = getPriorityColor(task.prioridade);
  
  let message = `<div style="font-size: 14px; line-height: 1.4;">`;
  message += `<div style="font-weight: 600; margin-bottom: 4px;">${task.titulo}</div>`;
  
  if (task.descricao) {
    message += `<div style="color: #6b7280; margin-bottom: 6px; font-size: 13px;">${task.descricao.substring(0, 100)}${task.descricao.length > 100 ? '...' : ''}</div>`;
  }
  
  message += `<div style="display: flex; gap: 12px; font-size: 12px; margin-top: 6px;">`;
  message += `<span style="color: ${priorityColor}; font-weight: 500;">📊 ${task.prioridade}</span>`;
  message += `<span style="color: #6b7280;">📈 ${task.status}</span>`;
  
  if (task.dataVencimento) {
    const vencimento = new Date(task.dataVencimento);
    const hoje = new Date();
    const isOverdue = vencimento < hoje;
    const diffDays = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    let vencimentoText = vencimento.toLocaleDateString('pt-BR');
    if (isOverdue) {
      vencimentoText = `⚠️ ${vencimentoText} (atrasada)`;
    } else if (diffDays <= 1) {
      vencimentoText = `⏰ ${vencimentoText} (hoje/amanhã)`;
    }
    
    message += `<span style="color: ${isOverdue ? '#dc2626' : '#6b7280'};">📅 ${vencimentoText}</span>`;
  }
  
  message += `</div></div>`;
  
  return message;
};

export function useTaskNotifications() {
  const { socket } = useSocket();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    const handleTaskNotification = (data: TaskNotificationData) => {
      const config = getNotificationConfig(data.type);
      const message = formatTaskMessage(data);

      // Play notification sound for important notifications
      if (['TAREFA_ATRASADA', 'LEMBRETE_VENCIMENTO', 'TAREFA_ATRIBUIDA'].includes(data.type)) {
        if (typeof window !== 'undefined') {
          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.6;
            audio.play().catch(() => {
              // Fallback to system notification sound or silent
            });
          } catch (error) {
            // Silent fallback
          }
        }
      }

      // Add notification to the UI
      addNotification({
        type: config.type,
        title: config.title,
        message: message,
        duration: config.duration,
        action: {
          label: 'Ver tarefa',
          onClick: () => {
            window.location.href = `/tasks?id=${data.task.id}`;
          }
        }
      });

      // Show browser notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(config.title, {
            body: `${data.task.titulo} - ${data.task.prioridade}`,
            icon: '/favicon.ico',
            tag: `task-${data.task.id}`,
            requireInteraction: ['TAREFA_ATRASADA', 'LEMBRETE_VENCIMENTO'].includes(data.type),
          });
        } catch (error) {
          console.warn('Erro ao mostrar notificação do browser:', error);
        }
      }
    };

    // Listen for task notifications
    socket.on('task-notification', handleTaskNotification);

    return () => {
      socket.off('task-notification', handleTaskNotification);
    };
  }, [socket, addNotification]);

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Permissão de notificação concedida');
        }
      });
    }
  }, []);

  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calcular notificações não lidas
  useEffect(() => {
    const count = notifications.filter(n => !n.lida).length;
    setUnreadCount(count);
  }, [notifications]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      // Atualizar no backend
      await fetch(`/api/task-notifications/${notificationId}/read`, {
        method: 'PATCH'
      });
      
      // Atualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, lida: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/task-notifications/mark-all-read', {
        method: 'PATCH'
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, lida: true }))
      );
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, []);

  // Deletar notificação
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await fetch(`/api/task-notifications/${notificationId}`, {
        method: 'DELETE'
      });
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  }, []);

  // Alternar notificações
  const toggleNotifications = useCallback(async () => {
    if (!notificationsEnabled) {
      await requestPermission();
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('taskNotificationsEnabled', 'false');
    }
  }, [notificationsEnabled]);

  // Solicitar permissão
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      setNotificationsEnabled(enabled);
      localStorage.setItem('taskNotificationsEnabled', enabled.toString());
    }
  }, []);

  return {
    notifications,
    unreadCount,
    notificationsEnabled,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    toggleNotifications,
    requestPermission
  };
}

// Helper function to manually trigger task notifications (for testing)
export function triggerTestTaskNotification() {
  if (typeof window !== 'undefined') {
    const testData: TaskNotificationData = {
      type: 'TAREFA_ATRIBUIDA',
      task: {
        id: 'test-123',
        titulo: 'Tarefa de Teste',
        descricao: 'Esta é uma tarefa de teste para verificar as notificações',
        dataVencimento: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        prioridade: 'ALTA',
        status: 'PENDENTE',
      },
      destinatario: {
        id: 'user-123',
        nome: 'Usuário Teste',
        email: 'teste@exemplo.com',
      },
      timestamp: new Date().toISOString(),
    };

    // Dispatch custom event to trigger notification
    window.dispatchEvent(new CustomEvent('test-task-notification', { detail: testData }));
  }
}
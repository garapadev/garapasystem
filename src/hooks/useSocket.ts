'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

type EntityNotification = {
  entityType: 'cliente' | 'colaborador' | 'grupo' | 'usuario' | 'perfil';
  action: 'created' | 'updated' | 'deleted';
  entityId: string;
  entityName?: string;
  userId: string;
  timestamp: string;
};

type Notification = {
  targetUserId?: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  senderId: string;
  timestamp: string;
};

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const socketInstance = io({
      path: '/api/socketio',
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Join user's personal room
      socketInstance.emit('join-user-room', user.id);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle entity notifications
    socketInstance.on('entity-notification', (notification: EntityNotification) => {
      const actionText = {
        created: 'criado',
        updated: 'atualizado',
        deleted: 'excluído'
      }[notification.action];

      const entityText = {
        cliente: 'Cliente',
        colaborador: 'Colaborador',
        grupo: 'Grupo',
        usuario: 'Usuário',
        perfil: 'Perfil'
      }[notification.entityType];

      toast({
        title: `${entityText} ${actionText}`,
        description: notification.entityName ? 
          `${entityText} "${notification.entityName}" foi ${actionText}` :
          `Um ${entityText.toLowerCase()} foi ${actionText}`,
        variant: notification.action === 'deleted' ? 'destructive' : 'default',
      });
    });

    // Handle general notifications
    socketInstance.on('notification', (notification: Notification) => {
      setNotifications(prev => [...prev, notification]);
      
      toast({
        title: 'Notificação',
        description: notification.message,
        variant: notification.type === 'error' ? 'destructive' : 'default',
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  const emitEntityUpdate = useCallback((data: {
    entityType: 'cliente' | 'colaborador' | 'grupo' | 'usuario' | 'perfil';
    action: 'created' | 'updated' | 'deleted';
    entityId: string;
    entityName?: string;
  }) => {
    if (socket && user) {
      socket.emit('entity-updated', {
        ...data,
        userId: user.id,
      });
    }
  }, [socket, user]);

  const sendNotification = useCallback((data: {
    targetUserId?: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }) => {
    if (socket && user) {
      socket.emit('send-notification', {
        ...data,
        senderId: user.id,
      });
    }
  }, [socket, user]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket,
    isConnected,
    notifications,
    emitEntityUpdate,
    sendNotification,
    clearNotifications,
  };
};
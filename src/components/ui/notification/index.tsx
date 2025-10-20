'use client';

import React, { createContext, useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'email';

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: NotificationAction;
  timestamp?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  addNotification: (item: Omit<NotificationItem, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (item: Omit<NotificationItem, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const fullItem: NotificationItem = { id, timestamp, ...item };
    setNotifications(prev => [fullItem, ...prev]);

    // Render via sonner toast for immediate UX
    const description = item.message;
    const title = item.title || (item.type === 'email' ? 'Novo e-mail' : 'Notificação');

    const variant = item.type === 'error' ? 'destructive' : 'default';

    toast(title, {
      description,
      duration: item.duration || (item.type === 'email' ? 8000 : 5000),
      action: item.action ? {
        label: item.action.label,
        onClick: item.action.onClick,
      } : undefined,
      // sonner uses className/variant differently; keep minimal usage
    });
  };

  const clearNotifications = () => setNotifications([]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    addNotification,
    clearNotifications,
  }), [notifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (ctx) return ctx;

  // Fallback so consumers work even without provider
  return {
    notifications: [],
    addNotification: (item) => {
      const title = item.title || (item.type === 'email' ? 'Novo e-mail' : 'Notificação');
      toast(title, {
        description: item.message,
        duration: item.duration || (item.type === 'email' ? 8000 : 5000),
        action: item.action ? {
          label: item.action.label,
          onClick: item.action.onClick,
        } : undefined,
      });
    },
    clearNotifications: () => {},
  };
}
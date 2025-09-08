'use client';

import { useEffect } from 'react';
import { useSocket } from './useSocket';
import { useNotifications } from '@/components/ui/notification';

interface EmailNotificationData {
  type: 'email' | 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  data?: {
    emailConfigId: string;
    messageId: string;
    folder: string;
  };
}

export function useEmailNotifications() {
  const { socket } = useSocket();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    const handleEmailNotification = (data: EmailNotificationData) => {
      // Play notification sound for new emails
      if (data.type === 'email' && typeof window !== 'undefined') {
        try {
          const audio = new Audio('/sounds/notification.mp3');
          audio.volume = 0.5;
          audio.play().catch(() => {
            // Fallback to system notification sound or silent
          });
        } catch (error) {
          // Silent fallback
        }
      }

      // Add notification to the UI
      addNotification({
        type: data.type,
        title: data.title,
        message: data.message,
        duration: data.duration || (data.type === 'email' ? 8000 : 5000),
        action: data.type === 'email' ? {
          label: 'Ver email',
          onClick: () => {
            window.location.href = '/webmail';
          }
        } : undefined
      });
    };

    // Listen for email notifications
    socket.on('email_notification', handleEmailNotification);

    return () => {
      socket.off('email_notification', handleEmailNotification);
    };
  }, [socket, addNotification]);

  return {
    // This hook doesn't return anything, it just sets up the listeners
  };
}
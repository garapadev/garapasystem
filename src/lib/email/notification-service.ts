import { db } from '@/lib/db';
import { getSocketIO } from '@/lib/socket';

interface EmailNotificationData {
  type: string;
  email?: {
    id: string;
    subject: string;
    from?: string;
    to?: string;
    date: string;
    isRead?: boolean;
  };
  error?: {
    message: string;
    timestamp: string;
  };
  timestamp: string;
}

export class EmailNotificationService {
  static async notifyNewEmail(email: any) {
    try {
      // Buscar configuração de email e colaborador
      const emailConfig = await db.emailConfig.findUnique({
        where: { id: email.emailConfigId },
        include: {
          colaborador: {
            include: {
              usuarios: true
            }
          }
        }
      });

      if (!emailConfig || !emailConfig.colaborador) {
        console.log('Configuração de email ou colaborador não encontrado');
        return;
      }

      const notificationData: EmailNotificationData = {
        type: 'new-email',
        email: {
          id: email.id,
          subject: email.subject || 'Sem assunto',
          from: email.from,
          date: email.date,
          isRead: email.isRead
        },
        timestamp: new Date().toISOString()
      };

      // Enviar notificação via WebSocket
      const socketIO = getSocketIO();
      if (socketIO && emailConfig.colaborador?.usuarios?.[0]) {
        const roomName = `user-${emailConfig.colaborador.usuarios[0].id}`;
        socketIO.to(roomName).emit('email-notification', notificationData);
      }

      console.log(`Notificação de email enviada para colaborador ${emailConfig.colaborador?.nome}`);
    } catch (error) {
      console.error('Erro ao enviar notificação de novo email:', error);
    }
  }

  static async notifyEmailSent(email: any) {
    try {
      // Buscar configuração de email e colaborador
      const emailConfig = await db.emailConfig.findUnique({
        where: { id: email.emailConfigId },
        include: {
          colaborador: {
            include: {
              usuarios: true
            }
          }
        }
      });

      if (!emailConfig || !emailConfig.colaborador) {
        return;
      }

      const notificationData: EmailNotificationData = {
        type: 'email-sent',
        email: {
          id: email.id,
          subject: email.subject,
          to: email.to,
          date: email.date
        },
        timestamp: new Date().toISOString()
      };

      const socketIO = getSocketIO();
      if (socketIO && emailConfig.colaborador?.usuarios?.[0]) {
        const roomName = `user-${emailConfig.colaborador.usuarios[0].id}`;
        socketIO.to(roomName).emit('email-notification', notificationData);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de email enviado:', error);
    }
  }

  static async notifyEmailError(error: string, emailConfigId: string) {
    try {
      // Buscar configuração de email e colaborador
      const emailConfig = await db.emailConfig.findUnique({
        where: { id: emailConfigId },
        include: {
          colaborador: {
            include: {
              usuarios: true
            }
          }
        }
      });

      if (!emailConfig || !emailConfig.colaborador) {
        return;
      }

      const notificationData = {
        type: 'email-error',
        error: {
          message: error,
          timestamp: new Date().toISOString()
        }
      };

      const socketIO = getSocketIO();
      if (socketIO && emailConfig.colaborador?.usuarios?.[0]) {
        const roomName = `user-${emailConfig.colaborador.usuarios[0].id}`;
        socketIO.to(roomName).emit('email-notification', notificationData);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de erro de email:', error);
    }
  }
}
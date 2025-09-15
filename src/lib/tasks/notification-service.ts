import { db } from '@/lib/db';
import { getSocketIO } from '@/lib/socket';
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

interface EmailConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  password?: string;
  from?: string;
}

export class TaskNotificationService {
  private static emailConfig: EmailConfig | null = null;

  /**
   * Configura o serviço de email para notificações
   */
  static setEmailConfig(config: EmailConfig) {
    TaskNotificationService.emailConfig = config;
  }

  /**
   * Cria uma notificação de tarefa no banco de dados
   */
  static async createNotification(
    taskId: string,
    destinatarioId: string,
    tipo: TaskNotificationType,
    titulo: string,
    mensagem: string,
    agendadoPara?: Date
  ) {
    try {
      const notification = await db.taskNotification.create({
        data: {
          taskId,
          destinatarioId,
          tipo,
          titulo,
          mensagem,
          agendadoPara: agendadoPara || new Date(),
        },
        include: {
          task: true,
          destinatario: true,
        },
      });

      return notification;
    } catch (error) {
      console.error('Erro ao criar notificação de tarefa:', error);
      throw error;
    }
  }

  /**
   * Envia notificação em tempo real via WebSocket
   */
  private static async sendRealtimeNotification(notificationData: TaskNotificationData) {
    try {
      const socketIO = getSocketIO();
      if (socketIO) {
        const roomName = `user-${notificationData.destinatario.id}`;
        socketIO.to(roomName).emit('task-notification', notificationData);
        console.log(`Notificação de tarefa enviada via WebSocket para ${notificationData.destinatario.nome}`);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação em tempo real:', error);
    }
  }

  /**
   * Envia notificação por email
   */
  private static async sendEmailNotification(
    destinatarioEmail: string,
    titulo: string,
    mensagem: string,
    taskData: any
  ) {
    if (!this.emailConfig?.enabled) {
      console.warn('Configuração de email não definida ou desabilitada para notificações de tarefas');
      return false;
    }

    try {
      const htmlContent = this.generateEmailTemplate(titulo, mensagem, taskData);

      // In a real implementation, this would call a server-side API
      // For now, we'll just log the email that would be sent
      console.log('Email seria enviado:', {
        to: destinatarioEmail,
        subject: titulo,
        html: htmlContent
      });
      
      console.log(`Email de notificação seria enviado para ${destinatarioEmail}`);
      return true;
    } catch (error) {
      console.error('Erro ao processar email de notificação:', error);
      return false;
    }
  }

  /**
   * Gera template HTML para emails de notificação
   */
  private static generateEmailTemplate(titulo: string, mensagem: string, taskData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .task-info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .priority-alta { border-left: 4px solid #ef4444; }
          .priority-urgente { border-left: 4px solid #dc2626; }
          .priority-media { border-left: 4px solid #f59e0b; }
          .priority-baixa { border-left: 4px solid #10b981; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Notificação de Tarefa</h1>
          </div>
          <div class="content">
            <h2>${titulo}</h2>
            <p>${mensagem}</p>
            
            <div class="task-info priority-${taskData.prioridade?.toLowerCase()}">
              <h3>📋 ${taskData.titulo}</h3>
              <p><strong>Descrição:</strong> ${taskData.descricao || 'Sem descrição'}</p>
              <p><strong>Prioridade:</strong> ${taskData.prioridade}</p>
              <p><strong>Status:</strong> ${taskData.status}</p>
              ${taskData.dataVencimento ? `<p><strong>Vencimento:</strong> ${new Date(taskData.dataVencimento).toLocaleDateString('pt-BR')}</p>` : ''}
            </div>
            
            <p style="text-align: center; margin-top: 20px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/tasks" 
                 style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Ver Tarefa
              </a>
            </p>
          </div>
          <div class="footer">
            <p>Esta é uma notificação automática do sistema GarapaSystem.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Notifica sobre nova tarefa atribuída
   */
  static async notifyTaskAssigned(taskId: string, responsavelId: string) {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          responsavel: true,
          criador: true,
        },
      });

      if (!task || !task.responsavel) return;

      const titulo = 'Nova tarefa atribuída';
      const mensagem = `Uma nova tarefa foi atribuída para você: "${task.titulo}"`;

      // Criar notificação no banco
      await TaskNotificationService.createNotification(
        taskId,
        responsavelId,
        'TAREFA_ATRIBUIDA',
        titulo,
        mensagem
      );

      // Enviar notificação em tempo real
      const notificationData: TaskNotificationData = {
        type: 'TAREFA_ATRIBUIDA',
        task: {
          id: task.id,
          titulo: task.titulo,
          descricao: task.descricao,
          dataVencimento: task.dataVencimento?.toISOString(),
          prioridade: task.prioridade,
          status: task.status,
        },
        destinatario: {
          id: task.responsavel.id,
          nome: task.responsavel.nome,
          email: task.responsavel.email,
        },
        timestamp: new Date().toISOString(),
      };

      await TaskNotificationService.sendRealtimeNotification(notificationData);

      // Enviar email se configurado
      await TaskNotificationService.sendEmailNotification(
        task.responsavel.email,
        titulo,
        mensagem,
        notificationData.task
      );

      console.log(`Notificação de tarefa atribuída enviada para ${task.responsavel.nome}`);
    } catch (error) {
      console.error('Erro ao notificar tarefa atribuída:', error);
    }
  }

  /**
   * Notifica sobre mudança de status da tarefa
   */
  static async notifyStatusChanged(taskId: string, oldStatus: string, newStatus: string) {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          responsavel: true,
          criador: true,
        },
      });

      if (!task) return;

      const titulo = 'Status da tarefa alterado';
      const mensagem = `O status da tarefa "${task.titulo}" foi alterado de ${oldStatus} para ${newStatus}`;

      // Notificar responsável e criador
      const destinatarios = [task.responsavel, task.criador].filter(
        (pessoa, index, self) => pessoa && self.findIndex(p => p?.id === pessoa.id) === index
      );

      for (const destinatario of destinatarios) {
        if (!destinatario) continue;

        await TaskNotificationService.createNotification(
          taskId,
          destinatario.id,
          'STATUS_ALTERADO',
          titulo,
          mensagem
        );

        const notificationData: TaskNotificationData = {
          type: 'STATUS_ALTERADO',
          task: {
            id: task.id,
            titulo: task.titulo,
            descricao: task.descricao,
            dataVencimento: task.dataVencimento?.toISOString(),
            prioridade: task.prioridade,
            status: task.status,
          },
          destinatario: {
            id: destinatario.id,
            nome: destinatario.nome,
            email: destinatario.email,
          },
          timestamp: new Date().toISOString(),
        };

        await TaskNotificationService.sendRealtimeNotification(notificationData);
        await TaskNotificationService.sendEmailNotification(
          destinatario.email,
          titulo,
          mensagem,
          notificationData.task
        );
      }

      console.log(`Notificações de mudança de status enviadas para tarefa ${task.titulo}`);
    } catch (error) {
      console.error('Erro ao notificar mudança de status:', error);
    }
  }

  /**
   * Notifica sobre tarefa próxima do vencimento
   */
  static async notifyDueSoon(taskId: string, horasRestantes: number) {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          responsavel: true,
        },
      });

      if (!task || !task.responsavel) return;

      const titulo = 'Tarefa próxima do vencimento';
      const mensagem = `A tarefa "${task.titulo}" vence em ${horasRestantes} horas`;

      await TaskNotificationService.createNotification(
        taskId,
        task.responsavel.id,
        'LEMBRETE_VENCIMENTO',
        titulo,
        mensagem,
        new Date(Date.now() + horasRestantes * 60 * 60 * 1000)
      );

      const notificationData: TaskNotificationData = {
        type: 'LEMBRETE_VENCIMENTO',
        task: {
          id: task.id,
          titulo: task.titulo,
          descricao: task.descricao,
          dataVencimento: task.dataVencimento?.toISOString(),
          prioridade: task.prioridade,
          status: task.status,
        },
        destinatario: {
          id: task.responsavel.id,
          nome: task.responsavel.nome,
          email: task.responsavel.email,
        },
        timestamp: new Date().toISOString(),
      };

      await TaskNotificationService.sendRealtimeNotification(notificationData);
      await TaskNotificationService.sendEmailNotification(
        task.responsavel.email,
        titulo,
        mensagem,
        notificationData.task
      );

      console.log(`Notificação de vencimento próximo enviada para ${task.responsavel.nome}`);
    } catch (error) {
      console.error('Erro ao notificar vencimento próximo:', error);
    }
  }

  /**
   * Notifica sobre tarefa atrasada
   */
  static async notifyOverdue(taskId: string) {
    try {
      const task = await db.task.findUnique({
        where: { id: taskId },
        include: {
          responsavel: true,
          criador: true,
        },
      });

      if (!task) return;

      const titulo = '⚠️ Tarefa atrasada';
      const mensagem = `A tarefa "${task.titulo}" está atrasada desde ${task.dataVencimento?.toLocaleDateString('pt-BR')}`;

      // Notificar responsável e criador
      const destinatarios = [task.responsavel, task.criador].filter(
        (pessoa, index, self) => pessoa && self.findIndex(p => p?.id === pessoa.id) === index
      );

      for (const destinatario of destinatarios) {
        if (!destinatario) continue;

        await TaskNotificationService.createNotification(
          taskId,
          destinatario.id,
          'TAREFA_ATRASADA',
          titulo,
          mensagem
        );

        const notificationData: TaskNotificationData = {
          type: 'TAREFA_ATRASADA',
          task: {
            id: task.id,
            titulo: task.titulo,
            descricao: task.descricao,
            dataVencimento: task.dataVencimento?.toISOString(),
            prioridade: task.prioridade,
            status: task.status,
          },
          destinatario: {
            id: destinatario.id,
            nome: destinatario.nome,
            email: destinatario.email,
          },
          timestamp: new Date().toISOString(),
        };

        await TaskNotificationService.sendRealtimeNotification(notificationData);
        await TaskNotificationService.sendEmailNotification(
          destinatario.email,
          titulo,
          mensagem,
          notificationData.task
        );
      }

      console.log(`Notificações de tarefa atrasada enviadas para tarefa ${task.titulo}`);
    } catch (error) {
      console.error('Erro ao notificar tarefa atrasada:', error);
    }
  }

  /**
   * Processa notificações pendentes
   */
  static async processePendingNotifications() {
    try {
      const pendingNotifications = await db.taskNotification.findMany({
        where: {
          enviado: false,
          agendadoPara: {
            lte: new Date(),
          },
        },
        include: {
          task: true,
          destinatario: true,
        },
        take: 50, // Processar até 50 notificações por vez
      });

      for (const notification of pendingNotifications) {
        try {
          const notificationData: TaskNotificationData = {
            type: notification.tipo,
            task: {
              id: notification.task.id,
              titulo: notification.task.titulo,
              descricao: notification.task.descricao,
              dataVencimento: notification.task.dataVencimento?.toISOString(),
              prioridade: notification.task.prioridade,
              status: notification.task.status,
            },
            destinatario: {
              id: notification.destinatario.id,
              nome: notification.destinatario.nome,
              email: notification.destinatario.email,
            },
            timestamp: new Date().toISOString(),
          };

          // Enviar notificação em tempo real
          await TaskNotificationService.sendRealtimeNotification(notificationData);

          // Enviar email
          const emailSent = await TaskNotificationService.sendEmailNotification(
            notification.destinatario.email,
            notification.titulo,
            notification.mensagem,
            notificationData.task
          );

          // Marcar como enviado
          await db.taskNotification.update({
            where: { id: notification.id },
            data: {
              enviado: true,
              dataEnvio: new Date(),
              tentativas: notification.tentativas + 1,
            },
          });

          console.log(`Notificação processada: ${notification.titulo} para ${notification.destinatario.nome}`);
        } catch (error) {
          console.error(`Erro ao processar notificação ${notification.id}:`, error);
          
          // Incrementar tentativas
          await db.taskNotification.update({
            where: { id: notification.id },
            data: {
              tentativas: notification.tentativas + 1,
            },
          });
        }
      }

      console.log(`Processadas ${pendingNotifications.length} notificações pendentes`);
    } catch (error) {
      console.error('Erro ao processar notificações pendentes:', error);
    }
  }

  /**
   * Verifica tarefas que precisam de lembretes
   */
  static async checkTaskReminders() {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

      // Tarefas que vencem em 24 horas
      const tasksDueSoon = await db.task.findMany({
        where: {
          dataVencimento: {
            gte: now,
            lte: in24Hours,
          },
          status: {
            notIn: ['CONCLUIDA', 'CANCELADA'],
          },
        },
        include: {
          responsavel: true,
        },
      });

      for (const task of tasksDueSoon) {
        if (!task.responsavel) continue;

        // Verificar se já foi enviado lembrete nas últimas 24h
        const existingNotification = await db.taskNotification.findFirst({
          where: {
            taskId: task.id,
            destinatarioId: task.responsavel.id,
            tipo: 'LEMBRETE_VENCIMENTO',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existingNotification) {
          const horasRestantes = Math.ceil(
            (task.dataVencimento!.getTime() - now.getTime()) / (60 * 60 * 1000)
          );
          await TaskNotificationService.notifyDueSoon(task.id, horasRestantes);
        }
      }

      // Tarefas atrasadas
      const overdueTasks = await db.task.findMany({
        where: {
          dataVencimento: {
            lt: now,
          },
          status: {
            notIn: ['CONCLUIDA', 'CANCELADA'],
          },
        },
        include: {
          responsavel: true,
          criador: true,
        },
      });

      for (const task of overdueTasks) {
        // Verificar se já foi enviado alerta de atraso nas últimas 24h
        const existingNotification = await db.taskNotification.findFirst({
          where: {
            taskId: task.id,
            tipo: 'TAREFA_ATRASADA',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existingNotification) {
          await TaskNotificationService.notifyOverdue(task.id);
        }
      }

      console.log(`Verificação de lembretes concluída: ${tasksDueSoon.length} tarefas próximas do vencimento, ${overdueTasks.length} tarefas atrasadas`);
    } catch (error) {
      console.error('Erro ao verificar lembretes de tarefas:', error);
    }
  }
}

// Instância singleton
export const taskNotificationService = new TaskNotificationService();
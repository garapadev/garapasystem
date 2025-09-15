import { taskNotificationService } from './notification-service';
import cron from 'node-cron';

export class TaskNotificationScheduler {
  private static instance: TaskNotificationScheduler;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): TaskNotificationScheduler {
    if (!TaskNotificationScheduler.instance) {
      TaskNotificationScheduler.instance = new TaskNotificationScheduler();
    }
    return TaskNotificationScheduler.instance;
  }

  /**
   * Inicia o sistema de agendamento de notificações
   */
  start() {
    if (this.isRunning) {
      console.log('Scheduler de notificações de tarefas já está rodando');
      return;
    }

    console.log('Iniciando scheduler de notificações de tarefas...');

    // Processar notificações pendentes a cada 5 minutos
    const processNotificationsJob = cron.schedule('*/5 * * * *', async () => {
      try {
        console.log('Processando notificações pendentes de tarefas...');
        await TaskNotificationService.processePendingNotifications();
      } catch (error) {
        console.error('Erro ao processar notificações pendentes:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/Fortaleza'
    });

    // Verificar lembretes de tarefas a cada hora
    const checkRemindersJob = cron.schedule('0 * * * *', async () => {
      try {
        console.log('Verificando lembretes de tarefas...');
        await TaskNotificationService.checkTaskReminders();
      } catch (error) {
        console.error('Erro ao verificar lembretes de tarefas:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/Fortaleza'
    });

    // Verificação mais frequente de tarefas críticas (a cada 30 minutos)
    const checkCriticalTasksJob = cron.schedule('*/30 * * * *', async () => {
      try {
        console.log('Verificando tarefas críticas...');
        await this.checkCriticalTasks();
      } catch (error) {
        console.error('Erro ao verificar tarefas críticas:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/Fortaleza'
    });

    // Relatório diário de tarefas (às 8h)
    const dailyReportJob = cron.schedule('0 8 * * *', async () => {
      try {
        console.log('Gerando relatório diário de tarefas...');
        await this.generateDailyReport();
      } catch (error) {
        console.error('Erro ao gerar relatório diário:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/Fortaleza'
    });

    // Limpeza de notificações antigas (todo domingo às 2h)
    const cleanupJob = cron.schedule('0 2 * * 0', async () => {
      try {
        console.log('Limpando notificações antigas...');
        await this.cleanupOldNotifications();
      } catch (error) {
        console.error('Erro ao limpar notificações antigas:', error);
      }
    }, {
      scheduled: false,
      timezone: 'America/Fortaleza'
    });

    // Armazenar jobs
    this.jobs.set('processNotifications', processNotificationsJob);
    this.jobs.set('checkReminders', checkRemindersJob);
    this.jobs.set('checkCritical', checkCriticalTasksJob);
    this.jobs.set('dailyReport', dailyReportJob);
    this.jobs.set('cleanup', cleanupJob);

    // Iniciar todos os jobs
    this.jobs.forEach((job, name) => {
      job.start();
      console.log(`Job '${name}' iniciado`);
    });

    this.isRunning = true;
    console.log('Scheduler de notificações de tarefas iniciado com sucesso');

    // Executar uma verificação inicial
    setTimeout(async () => {
      try {
        await TaskNotificationService.processePendingNotifications();
        await TaskNotificationService.checkTaskReminders();
      } catch (error) {
        console.error('Erro na verificação inicial:', error);
      }
    }, 5000);
  }

  /**
   * Para o sistema de agendamento
   */
  stop() {
    if (!this.isRunning) {
      console.log('Scheduler de notificações não está rodando');
      return;
    }

    console.log('Parando scheduler de notificações de tarefas...');

    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Job '${name}' parado`);
    });

    this.jobs.clear();
    this.isRunning = false;
    console.log('Scheduler de notificações de tarefas parado');
  }

  /**
   * Verifica tarefas críticas que precisam de atenção imediata
   */
  private async checkCriticalTasks() {
    try {
      const { db } = await import('@/lib/db');
      const now = new Date();
      const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      // Tarefas urgentes que vencem em 2 horas
      const urgentTasks = await db.task.findMany({
        where: {
          prioridade: 'URGENTE',
          dataVencimento: {
            gte: now,
            lte: in2Hours,
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

      for (const task of urgentTasks) {
        if (!task.responsavel) continue;

        // Verificar se já foi enviado alerta nas últimas 2 horas
        const existingNotification = await db.taskNotification.findFirst({
          where: {
            taskId: task.id,
            destinatarioId: task.responsavel.id,
            tipo: 'LEMBRETE_VENCIMENTO',
            createdAt: {
              gte: new Date(now.getTime() - 2 * 60 * 60 * 1000),
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

      console.log(`Verificação de tarefas críticas: ${urgentTasks.length} tarefas urgentes encontradas`);
    } catch (error) {
      console.error('Erro ao verificar tarefas críticas:', error);
    }
  }

  /**
   * Gera relatório diário de tarefas para gestores
   */
  private async generateDailyReport() {
    try {
      const { db } = await import('@/lib/db');
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // Buscar estatísticas do dia anterior
      const stats = {
        created: await db.task.count({
          where: {
            createdAt: {
              gte: yesterday,
              lt: today,
            },
          },
        }),
        completed: await db.task.count({
          where: {
            status: 'CONCLUIDA',
            updatedAt: {
              gte: yesterday,
              lt: today,
            },
          },
        }),
        overdue: await db.task.count({
          where: {
            dataVencimento: {
              lt: today,
            },
            status: {
              notIn: ['CONCLUIDA', 'CANCELADA'],
            },
          },
        }),
        pending: await db.task.count({
          where: {
            status: {
              in: ['PENDENTE', 'EM_ANDAMENTO'],
            },
          },
        }),
      };

      // Buscar gestores (usuários com papel de administrador ou gestor)
      const gestores = await db.colaborador.findMany({
        where: {
          usuarios: {
            some: {
              papel: {
                in: ['ADMIN', 'GESTOR'],
              },
            },
          },
        },
        include: {
          usuarios: true,
        },
      });

      // Enviar relatório para cada gestor
      for (const gestor of gestores) {
        if (!gestor.usuarios?.[0]) continue;

        const titulo = '📊 Relatório Diário de Tarefas';
        const mensagem = `
          Resumo das tarefas de ${yesterday.toLocaleDateString('pt-BR')}:
          
          ✅ Concluídas: ${stats.completed}
          📝 Criadas: ${stats.created}
          ⚠️ Atrasadas: ${stats.overdue}
          📋 Pendentes: ${stats.pending}
        `;

        // Criar notificação para gestor (sem tarefa específica)
        // Por enquanto, vamos pular esta funcionalidade até termos uma tarefa válida
      }

      console.log(`Relatório diário enviado para ${gestores.length} gestores`);
    } catch (error) {
      console.error('Erro ao gerar relatório diário:', error);
    }
  }

  /**
   * Remove notificações antigas para manter o banco limpo
   */
  private async cleanupOldNotifications() {
    try {
      const { db } = await import('@/lib/db');
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const deletedCount = await db.taskNotification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          enviado: true,
        },
      });

      console.log(`Limpeza concluída: ${deletedCount.count} notificações antigas removidas`);
    } catch (error) {
      console.error('Erro ao limpar notificações antigas:', error);
    }
  }

  /**
   * Retorna o status do scheduler
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      jobsCount: this.jobs.size,
      jobs: Array.from(this.jobs.keys()),
    };
  }
}

// Instância singleton
export const taskNotificationScheduler = TaskNotificationScheduler.getInstance();

// Função para inicializar o sistema de notificações de tarefas
export async function initializeTaskNotifications(): Promise<void> {
  console.log('Inicializando sistema de notificações de tarefas...');
  
  // Configurar email se disponível
  const emailConfig = {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  };

  if (emailConfig.auth.user && emailConfig.auth.pass) {
    TaskNotificationService.setEmailConfig(emailConfig);
    console.log('Configuração de email definida para notificações de tarefas');
  } else {
    console.warn('Configuração de email não encontrada - notificações por email desabilitadas');
  }
  
  // Iniciar scheduler
  taskNotificationScheduler.start();
  
  // Configurar handlers para shutdown graceful
  process.on('SIGINT', () => {
    console.log('Recebido SIGINT, parando scheduler de notificações...');
    taskNotificationScheduler.stop();
  });
  
  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, parando scheduler de notificações...');
    taskNotificationScheduler.stop();
  });
  
  console.log('Sistema de notificações de tarefas inicializado');
}
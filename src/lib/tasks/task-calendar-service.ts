import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  allDay: boolean;
  color?: string;
  extendedProps: {
    taskId: string;
    priority: string;
    status: string;
    responsavel: string;
    cliente?: string;
    type: 'task' | 'deadline';
  };
}

export interface CalendarFilters {
  start: string;
  end: string;
  responsavelId?: string;
  clienteId?: string;
  status?: string[];
  prioridade?: string[];
  showDeadlines?: boolean;
  showStartDates?: boolean;
}

export class TaskCalendarService {
  /**
   * Obter eventos do calendário baseados nas tarefas
   */
  static async getCalendarEvents(filters: CalendarFilters): Promise<CalendarEvent[]> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const startDate = new Date(filters.start);
      const endDate = new Date(filters.end);

      // Construir filtros para as tarefas
      const whereClause: any = {
        OR: []
      };

      // Filtrar por datas de vencimento
      if (filters.showDeadlines !== false) {
        whereClause.OR.push({
          dataVencimento: {
            gte: startDate,
            lte: endDate
          }
        });
      }

      // Filtrar por datas de início
      if (filters.showStartDates) {
        whereClause.OR.push({
          dataInicio: {
            gte: startDate,
            lte: endDate
          }
        });
      }

      // Se nenhuma opção de data foi selecionada, mostrar deadlines por padrão
      if (!filters.showDeadlines && !filters.showStartDates) {
        whereClause.OR = [{
          dataVencimento: {
            gte: startDate,
            lte: endDate
          }
        }];
      }

      // Aplicar filtros adicionais
      if (filters.responsavelId) {
        whereClause.responsavelId = filters.responsavelId;
      }

      if (filters.clienteId) {
        whereClause.clienteId = filters.clienteId;
      }

      if (filters.status && filters.status.length > 0) {
        whereClause.status = { in: filters.status };
      }

      if (filters.prioridade && filters.prioridade.length > 0) {
        whereClause.prioridade = { in: filters.prioridade };
      }

      // Buscar tarefas
      const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
          responsavel: {
            select: {
              id: true,
              nome: true
            }
          },
          cliente: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: {
          dataVencimento: 'asc'
        }
      });

      const events: CalendarEvent[] = [];

      // Converter tarefas em eventos do calendário
      tasks.forEach(task => {
        // Evento de deadline (sempre mostrar se dentro do período)
        if (filters.showDeadlines !== false && 
            task.dataVencimento >= startDate && 
            task.dataVencimento <= endDate) {
          events.push({
            id: `deadline-${task.id}`,
            title: `📅 ${task.titulo}`,
            description: task.descricao || undefined,
            start: task.dataVencimento.toISOString(),
            end: task.dataVencimento.toISOString(),
            allDay: true,
            color: this.getEventColor(task.prioridade, task.status, 'deadline'),
            extendedProps: {
              taskId: task.id,
              priority: task.prioridade,
              status: task.status,
              responsavel: task.responsavel.nome,
              cliente: task.cliente?.nome,
              type: 'deadline'
            }
          });
        }

        // Evento de início (se habilitado e data existe)
        if (filters.showStartDates && 
            task.dataInicio && 
            task.dataInicio >= startDate && 
            task.dataInicio <= endDate) {
          events.push({
            id: `start-${task.id}`,
            title: `🚀 ${task.titulo}`,
            description: task.descricao || undefined,
            start: task.dataInicio.toISOString(),
            end: task.dataInicio.toISOString(),
            allDay: true,
            color: this.getEventColor(task.prioridade, task.status, 'start'),
            extendedProps: {
              taskId: task.id,
              priority: task.prioridade,
              status: task.status,
              responsavel: task.responsavel.nome,
              cliente: task.cliente?.nome,
              type: 'task'
            }
          });
        }
      });

      return events;
    } catch (error) {
      console.error('Erro ao obter eventos do calendário:', error);
      throw new Error('Falha ao carregar eventos do calendário');
    }
  }

  /**
   * Obter cor do evento baseada na prioridade e status
   */
  private static getEventColor(prioridade: string, status: string, type: 'deadline' | 'start'): string {
    // Se a tarefa está concluída, usar cor verde
    if (status === 'CONCLUIDA') {
      return '#10b981'; // green-500
    }

    // Para deadlines, usar cores mais intensas
    if (type === 'deadline') {
      switch (prioridade) {
        case 'URGENTE': return '#dc2626'; // red-600
        case 'ALTA': return '#ea580c'; // orange-600
        case 'MEDIA': return '#d97706'; // amber-600
        case 'BAIXA': return '#65a30d'; // lime-600
        default: return '#6b7280'; // gray-500
      }
    }

    // Para início de tarefas, usar cores mais suaves
    switch (prioridade) {
      case 'URGENTE': return '#f87171'; // red-400
      case 'ALTA': return '#fb923c'; // orange-400
      case 'MEDIA': return '#fbbf24'; // amber-400
      case 'BAIXA': return '#a3e635'; // lime-400
      default: return '#9ca3af'; // gray-400
    }
  }

  /**
   * Obter tarefas de um dia específico
   */
  static async getTasksForDate(date: string): Promise<any[]> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const targetDate = new Date(date);
      const startOfTargetDay = startOfDay(targetDate);
      const endOfTargetDay = endOfDay(targetDate);

      const tasks = await prisma.task.findMany({
        where: {
          OR: [
            {
              dataVencimento: {
                gte: startOfTargetDay,
                lte: endOfTargetDay
              }
            },
            {
              dataInicio: {
                gte: startOfTargetDay,
                lte: endOfTargetDay
              }
            }
          ]
        },
        include: {
          responsavel: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          cliente: {
            select: {
              id: true,
              nome: true,
              email: true
            }
          },
          criadoPor: {
            select: {
              id: true,
              nome: true
            }
          }
        },
        orderBy: [
          { dataVencimento: 'asc' },
          { prioridade: 'desc' }
        ]
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao obter tarefas do dia:', error);
      throw new Error('Falha ao carregar tarefas do dia');
    }
  }

  /**
   * Atualizar data de uma tarefa
   */
  static async updateTaskDate(
    taskId: string, 
    dateType: 'dataVencimento' | 'dataInicio', 
    newDate: string
  ): Promise<void> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se a tarefa existe e se o usuário tem permissão
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          responsavel: true
        }
      });

      if (!task) {
        throw new Error('Tarefa não encontrada');
      }

      // Verificar permissões (responsável)
      if (task.responsavelId !== session.user.id) {
        throw new Error('Sem permissão para editar esta tarefa');
      }

      // Atualizar a data
      const updateData: any = {
        [dateType]: new Date(newDate)
      };

      await prisma.task.update({
        where: { id: taskId },
        data: updateData
      });

      // Registrar no audit trail
      await prisma.taskLog.create({
        data: {
          taskId: taskId,
          tipo: 'EDICAO',
          descricao: `Data ${dateType === 'dataVencimento' ? 'de vencimento' : 'de início'} alterada para ${format(new Date(newDate), 'dd/MM/yyyy')}`,
          autorId: session.user.id
        }
      });
    } catch (error) {
      console.error('Erro ao atualizar data da tarefa:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas do calendário para um período
   */
  static async getCalendarStats(start: string, end: string) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const startDate = new Date(start);
      const endDate = new Date(end);

      // Tarefas com vencimento no período
      const tasksWithDeadlines = await prisma.task.count({
        where: {
          dataVencimento: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Tarefas com início no período
      const tasksWithStartDates = await prisma.task.count({
        where: {
          dataInicio: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Tarefas atrasadas
      const overdueTasks = await prisma.task.count({
        where: {
          dataVencimento: {
            lt: new Date()
          },
          status: {
            not: 'CONCLUIDA'
          }
        }
      });

      // Tarefas concluídas no período
      const completedTasks = await prisma.task.count({
        where: {
          dataConclusao: {
            gte: startDate,
            lte: endDate
          },
          status: 'CONCLUIDA'
        }
      });

      return {
        tasksWithDeadlines,
        tasksWithStartDates,
        overdueTasks,
        completedTasks
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do calendário:', error);
      throw new Error('Falha ao carregar estatísticas');
    }
  }
}
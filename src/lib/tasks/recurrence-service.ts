import { PrismaClient } from '@prisma/client';
import { TaskPrioridade, TaskStatus, TaskRecurrenceType } from '@prisma/client';

const prisma = new PrismaClient();

export interface RecurrencePattern {
  type: TaskRecurrenceType;
  interval: number; // Intervalo entre repetições
  daysOfWeek?: number[]; // Para recorrência semanal (0=domingo, 1=segunda, etc.)
  dayOfMonth?: number; // Para recorrência mensal
  endDate?: Date; // Data limite
  maxOccurrences?: number; // Número máximo de ocorrências
}

export interface TaskTemplate {
  titulo: string;
  descricao?: string;
  prioridade: TaskPrioridade;
  tempoEstimado?: number;
  responsavelId: string;
  clienteId?: string;
  oportunidadeId?: string;
  pattern: RecurrencePattern;
}

export class RecurrenceService {
  /**
   * Criar uma nova recorrência de tarefa
   */
  static async createRecurrence(
    template: TaskTemplate,
    pattern: RecurrencePattern,
    startDate: Date,
    criadoPorId: string
  ) {
    try {
      // Criar registro de recorrência
      const recurrence = await prisma.taskRecurrence.create({
        data: {
          tipo: template.pattern.type,
          intervalo: template.pattern.interval,
          diasSemana: template.pattern.daysOfWeek ? JSON.stringify(template.pattern.daysOfWeek) : null,
          diaMes: template.pattern.dayOfMonth,
          dataFim: template.pattern.endDate,
          maxOcorrencias: template.pattern.maxOccurrences,
          ativo: true,
          proximaExecucao: startDate,
          
          // Template da tarefa
          tituloTemplate: template.titulo,
          descricaoTemplate: template.descricao,
          prioridadeTemplate: template.prioridade,
          tempoEstimadoTemplate: template.tempoEstimado,
          responsavelId: template.responsavelId,
          clienteId: template.clienteId,
          oportunidadeId: template.oportunidadeId,
          criadoPorId
        }
      });

      // Criar primeira tarefa da série
      await this.createTaskFromRecurrence(recurrence.id);

      console.log(`Recorrência criada: ${recurrence.id}`);
      return recurrence;
    } catch (error) {
      console.error('Erro ao criar recorrência:', error);
      throw error;
    }
  }

  /**
   * Processar todas as recorrências pendentes
   */
  static async processRecurrences() {
    try {
      const now = new Date();
      
      // Buscar recorrências ativas que precisam ser executadas
      const pendingRecurrences = await prisma.taskRecurrence.findMany({
        where: {
          ativo: true,
          proximaExecucao: {
            lte: now
          },
          OR: [
            { dataFim: null },
            { dataFim: { gte: now } }
          ]
        }
      });

      console.log(`Processando ${pendingRecurrences.length} recorrências pendentes`);

      for (const recurrence of pendingRecurrences) {
        await this.processRecurrence(recurrence);
      }

      return {
        processed: pendingRecurrences.length,
        timestamp: now
      };
    } catch (error) {
      console.error('Erro ao processar recorrências:', error);
      throw error;
    }
  }

  /**
   * Processar uma recorrência específica
   */
  private static async processRecurrence(recurrence: any) {
    try {
      // Verificar se já atingiu o máximo de ocorrências
      if (recurrence.maxOcorrencias && recurrence.ocorrenciasGeradas >= recurrence.maxOcorrencias) {
        await this.deactivateRecurrence(recurrence.id, 'MAX_OCCURRENCES_REACHED');
        return;
      }

      // Verificar se passou da data fim
      if (recurrence.dataFim && new Date() > recurrence.dataFim) {
        await this.deactivateRecurrence(recurrence.id, 'END_DATE_REACHED');
        return;
      }

      // Criar nova tarefa
      await this.createTaskFromRecurrence(recurrence.id);

      // Calcular próxima execução
      const nextExecution = this.calculateNextExecution(recurrence);

      // Atualizar recorrência
      await prisma.taskRecurrence.update({
        where: { id: recurrence.id },
        data: {
          proximaExecucao: nextExecution,
          ultimaExecucao: new Date(),
          ocorrenciasGeradas: {
            increment: 1
          }
        }
      });

      console.log(`Recorrência processada: ${recurrence.id}, próxima execução: ${nextExecution}`);
    } catch (error) {
      console.error(`Erro ao processar recorrência ${recurrence.id}:`, error);
      
      // Registrar erro na recorrência
      await prisma.taskRecurrence.update({
        where: { id: recurrence.id },
        data: {
          ultimoErro: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      });
    }
  }

  /**
   * Criar tarefa a partir de uma recorrência
   */
  private static async createTaskFromRecurrence(recurrenceId: string) {
    const recurrence = await prisma.taskRecurrence.findUnique({
      where: { id: recurrenceId }
    });

    if (!recurrence) {
      throw new Error(`Recorrência ${recurrenceId} não encontrada`);
    }

    // Calcular data de vencimento (1 dia após criação por padrão)
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 1);

    const task = await prisma.task.create({
      data: {
        titulo: recurrence.tituloTemplate,
        descricao: recurrence.descricaoTemplate,
        prioridade: recurrence.prioridadeTemplate,
        status: 'PENDENTE' as TaskStatus,
        dataVencimento,
        tempoEstimado: recurrence.tempoEstimadoTemplate,
        isRecorrente: true,
        responsavelId: recurrence.responsavelId,
        criadoPorId: recurrence.criadoPorId,
        clienteId: recurrence.clienteId,
        oportunidadeId: recurrence.oportunidadeId,
        recorrenciaId: recurrenceId
      }
    });

    console.log(`Tarefa recorrente criada: ${task.id} (${task.titulo})`);
    return task;
  }

  /**
   * Calcular próxima execução baseada no padrão de recorrência
   */
  private static calculateNextExecution(recurrence: any): Date {
    const current = recurrence.proximaExecucao || new Date();
    const next = new Date(current);

    switch (recurrence.tipo) {
      case 'DIARIA':
        next.setDate(next.getDate() + recurrence.intervalo);
        break;

      case 'SEMANAL':
        if (recurrence.diasSemana) {
          const daysOfWeek = JSON.parse(recurrence.diasSemana);
          const currentDay = next.getDay();
          
          // Encontrar próximo dia da semana
          let nextDay = daysOfWeek.find(day => day > currentDay);
          if (!nextDay) {
            nextDay = daysOfWeek[0];
            next.setDate(next.getDate() + (7 - currentDay + nextDay));
          } else {
            next.setDate(next.getDate() + (nextDay - currentDay));
          }
        } else {
          next.setDate(next.getDate() + (7 * recurrence.intervalo));
        }
        break;

      case 'MENSAL':
        if (recurrence.diaMes) {
          next.setMonth(next.getMonth() + recurrence.intervalo);
          next.setDate(recurrence.diaMes);
        } else {
          next.setMonth(next.getMonth() + recurrence.intervalo);
        }
        break;

      case 'ANUAL':
        next.setFullYear(next.getFullYear() + recurrence.intervalo);
        break;

      default:
        // PERSONALIZADO - usar intervalo em dias
        next.setDate(next.getDate() + recurrence.intervalo);
        break;
    }

    return next;
  }

  /**
   * Desativar uma recorrência
   */
  private static async deactivateRecurrence(recurrenceId: string, reason: string) {
    await prisma.taskRecurrence.update({
      where: { id: recurrenceId },
      data: {
        ativo: false,
        motivoDesativacao: reason
      }
    });

    console.log(`Recorrência ${recurrenceId} desativada: ${reason}`);
  }

  /**
   * Obter estatísticas de recorrências
   */
  static async getRecurrenceStats() {
    const [total, active, inactive, tasksCreated] = await Promise.all([
      prisma.taskRecurrence.count(),
      prisma.taskRecurrence.count({ where: { ativo: true } }),
      prisma.taskRecurrence.count({ where: { ativo: false } }),
      prisma.task.count({ where: { isRecorrente: true } })
    ]);

    return {
      total,
      active,
      inactive,
      tasksCreated,
      successRate: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }

  /**
   * Listar recorrências ativas
   */
  static async getActiveRecurrences() {
    return await prisma.taskRecurrence.findMany({
      where: { ativo: true },
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
            nome: true
          }
        },
        Task: {
          select: {
            id: true,
            titulo: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        }
      },
      orderBy: {
        proximaExecucao: 'asc'
      }
    });
  }

  /**
   * Pausar/retomar uma recorrência
   */
  static async toggleRecurrence(recurrenceId: string, active: boolean) {
    const recurrence = await prisma.taskRecurrence.update({
      where: { id: recurrenceId },
      data: { ativo: active }
    });

    console.log(`Recorrência ${recurrenceId} ${active ? 'ativada' : 'pausada'}`);
    return recurrence;
  }

  /**
   * Excluir uma recorrência e suas tarefas futuras
   */
  static async deleteRecurrence(recurrenceId: string) {
    // Excluir tarefas futuras (pendentes) da recorrência
    await prisma.task.deleteMany({
      where: {
        recorrenciaId: recurrenceId,
        status: 'PENDENTE'
      }
    });

    // Excluir a recorrência
    await prisma.taskRecurrence.delete({
      where: { id: recurrenceId }
    });

    console.log(`Recorrência ${recurrenceId} excluída`);
  }
}
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export interface TaskMetrics {
  total: number;
  pendentes: number;
  emAndamento: number;
  concluidas: number;
  atrasadas: number;
  porPrioridade: {
    baixa: number;
    media: number;
    alta: number;
    urgente: number;
  };
  porResponsavel: Array<{
    responsavel: string;
    total: number;
    concluidas: number;
    pendentes: number;
  }>;
  tendenciaSemanal: Array<{
    semana: string;
    criadas: number;
    concluidas: number;
  }>;
}

export interface TaskFilters {
  dataInicio?: string;
  dataFim?: string;
  responsavelId?: string;
  clienteId?: string;
  status?: string[];
  prioridade?: string[];
}

export class TaskDashboardService {
  /**
   * Obter métricas gerais das tarefas
   */
  static async getTaskMetrics(filters: TaskFilters = {}): Promise<TaskMetrics> {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Construir filtros base
      const whereClause: any = {};
      
      if (filters.dataInicio && filters.dataFim) {
        whereClause.createdAt = {
          gte: new Date(filters.dataInicio),
          lte: new Date(filters.dataFim)
        };
      }
      
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

      // Buscar todas as tarefas com filtros
      const tasks = await prisma.Task.findMany({
        where: whereClause,
        include: {
          responsavel: {
            select: {
              id: true,
              nome: true
            }
          }
        }
      });

      const now = new Date();
      
      // Calcular métricas básicas
      const total = tasks.length;
      const pendentes = tasks.filter(t => t.status === 'PENDENTE').length;
      const emAndamento = tasks.filter(t => t.status === 'EM_ANDAMENTO').length;
      const concluidas = tasks.filter(t => t.status === 'CONCLUIDA').length;
      const atrasadas = tasks.filter(t => 
        t.dataVencimento && 
        new Date(t.dataVencimento) < now && 
        t.status !== 'CONCLUIDA'
      ).length;

      // Métricas por prioridade
      const porPrioridade = {
        baixa: tasks.filter(t => t.prioridade === 'BAIXA').length,
        media: tasks.filter(t => t.prioridade === 'MEDIA').length,
        alta: tasks.filter(t => t.prioridade === 'ALTA').length,
        urgente: tasks.filter(t => t.prioridade === 'URGENTE').length
      };

      // Métricas por responsável
      const responsavelMap = new Map();
      tasks.forEach(task => {
        if (task.responsavel) {
          const key = task.responsavel.id;
          if (!responsavelMap.has(key)) {
            responsavelMap.set(key, {
              responsavel: task.responsavel.nome,
              total: 0,
              concluidas: 0,
              pendentes: 0
            });
          }
          
          const stats = responsavelMap.get(key);
          stats.total++;
          
          if (task.status === 'CONCLUIDA') {
            stats.concluidas++;
          } else {
            stats.pendentes++;
          }
        }
      });
      
      const porResponsavel = Array.from(responsavelMap.values());

      // Tendência semanal (últimas 8 semanas)
      const tendenciaSemanal = await this.getWeeklyTrend(whereClause);

      return {
        total,
        pendentes,
        emAndamento,
        concluidas,
        atrasadas,
        porPrioridade,
        porResponsavel,
        tendenciaSemanal
      };
    } catch (error) {
      console.error('Erro ao obter métricas:', error);
      throw new Error('Falha ao obter métricas das tarefas');
    }
  }

  /**
   * Obter tendência semanal de criação e conclusão de tarefas
   */
  private static async getWeeklyTrend(baseWhere: any) {
    const weeks = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Tarefas criadas na semana
      const criadas = await prisma.Task.count({
        where: {
          ...baseWhere,
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      });

      // Tarefas concluídas na semana
      const concluidas = await prisma.Task.count({
        where: {
          ...baseWhere,
          status: 'CONCLUIDA',
          updatedAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      });

      weeks.push({
        semana: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        criadas,
        concluidas
      });
    }
    
    return weeks;
  }

  /**
   * Obter tarefas com filtros para relatórios
   */
  static async getTasksReport(filters: TaskFilters = {}) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const whereClause: any = {};
      
      if (filters.dataInicio && filters.dataFim) {
        whereClause.createdAt = {
          gte: new Date(filters.dataInicio),
          lte: new Date(filters.dataFim)
        };
      }
      
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

      const tasks = await prisma.Task.findMany({
        where: whereClause,
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
        orderBy: {
          createdAt: 'desc'
        }
      });

      return tasks;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw new Error('Falha ao gerar relatório de tarefas');
    }
  }

  /**
   * Obter lista de responsáveis para filtros
   */
  static async getResponsaveis() {
    try {
      const responsaveis = await prisma.colaborador.findMany({
        where: {
          ativo: true
        },
        select: {
          id: true,
          nome: true,
          email: true
        },
        orderBy: {
          nome: 'asc'
        }
      });

      return responsaveis;
    } catch (error) {
      console.error('Erro ao buscar responsáveis:', error);
      throw new Error('Falha ao buscar responsáveis');
    }
  }

  /**
   * Obter lista de clientes para filtros
   */
  static async getClientes() {
    try {
      const clientes = await prisma.cliente.findMany({
        select: {
          id: true,
          nome: true,
          email: true
        },
        orderBy: {
          nome: 'asc'
        }
      });

      return clientes;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      throw new Error('Falha ao buscar clientes');
    }
  }
}
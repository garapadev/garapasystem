import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  color?: string;
  task: {
    id: string;
    titulo: string;
    descricao?: string;
    status: string;
    prioridade: string;
    dataInicio?: Date;
    dataVencimento?: Date;
    responsavel: {
      id: string;
      nome: string;
    };
    cliente: {
      id: string;
      nome: string;
    };
  };
}

export interface CalendarFilters {
  clienteId?: string;
  responsavelId?: string;
  status?: string;
  prioridade?: string;
}

export interface CalendarStatistics {
  tasksWithDeadlines: number;
  tasksWithStartDates: number;
  overdueTasks: number;
  completedTasks: number;
}

export interface DayTask {
  id: string;
  titulo: string;
  descricao?: string;
  status: string;
  prioridade: string;
  dataInicio?: Date;
  dataVencimento?: Date;
  responsavel: {
    id: string;
    nome: string;
  };
  cliente: {
    id: string;
    nome: string;
  };
  type: 'start' | 'deadline' | 'both';
}

export function useTaskCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [dayTasks, setDayTasks] = useState<DayTask[]>([]);
  const [statistics, setStatistics] = useState<CalendarStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalendarEvents = useCallback(async (
    startDate: Date,
    endDate: Date,
    filters?: CalendarFilters
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'events',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (filters?.clienteId) params.append('clienteId', filters.clienteId);
      if (filters?.responsavelId) params.append('responsavelId', filters.responsavelId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.prioridade) params.append('prioridade', filters.prioridade);

      const response = await fetch(`/api/tasks/calendar?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar eventos do calendário');
      }

      const data = await response.json();
      
      // Converter strings de data para objetos Date
      const processedEvents = data.map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: event.end ? new Date(event.end) : undefined,
        task: {
          ...event.task,
          dataInicio: event.task.dataInicio ? new Date(event.task.dataInicio) : undefined,
          dataVencimento: event.task.dataVencimento ? new Date(event.task.dataVencimento) : undefined,
        }
      }));
      
      setEvents(processedEvents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDayTasks = useCallback(async (
    targetDate: Date,
    filters?: CalendarFilters
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'day-tasks',
        targetDate: targetDate.toISOString(),
      });

      if (filters?.clienteId) params.append('clienteId', filters.clienteId);
      if (filters?.responsavelId) params.append('responsavelId', filters.responsavelId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.prioridade) params.append('prioridade', filters.prioridade);

      const response = await fetch(`/api/tasks/calendar?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar tarefas do dia');
      }

      const data = await response.json();
      
      // Converter strings de data para objetos Date
      const processedTasks = data.map((task: any) => ({
        ...task,
        dataInicio: task.dataInicio ? new Date(task.dataInicio) : undefined,
        dataVencimento: task.dataVencimento ? new Date(task.dataVencimento) : undefined,
      }));
      
      setDayTasks(processedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCalendarStatistics = useCallback(async (
    startDate: Date,
    endDate: Date
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'statistics',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(`/api/tasks/calendar?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar estatísticas do calendário');
      }

      const data = await response.json();
      setStatistics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskDates = useCallback(async (
    taskId: string,
    dataInicio?: Date,
    dataVencimento?: Date
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tasks/calendar', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          dataInicio: dataInicio?.toISOString(),
          dataVencimento: dataVencimento?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar datas da tarefa');
      }

      toast.success('Datas da tarefa atualizadas com sucesso!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    dayTasks,
    statistics,
    loading,
    error,
    loadCalendarEvents,
    loadDayTasks,
    loadCalendarStatistics,
    updateTaskDates,
  };
}
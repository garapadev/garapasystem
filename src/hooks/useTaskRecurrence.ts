import { useState, useEffect } from 'react';

type TaskRecurrenceType = 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'ANUAL';
type TaskPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface RecurrencePattern {
  type: TaskRecurrenceType;
  interval: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  endDate?: Date;
  maxOccurrences?: number;
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

export interface RecurrenceStats {
  totalRecurrences: number;
  activeRecurrences: number;
  totalTasksCreated: number;
  nextExecutions: number;
}

export interface TaskRecurrence {
  id: string;
  tipo: TaskRecurrenceType;
  intervalo: number;
  diasSemana?: string;
  diaMes?: number;
  dataFim?: Date;
  maxOcorrencias?: number;
  ativo: boolean;
  proximaExecucao?: Date;
  createdAt: Date;
  updatedAt: Date;
  tasks: any[];
}

export function useTaskRecurrence() {
  const [recurrences, setRecurrences] = useState<TaskRecurrence[]>([]);
  const [stats, setStats] = useState<RecurrenceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar lista de recorrências
  const loadRecurrences = async (filters?: { active?: boolean; page?: number; limit?: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters?.active !== undefined) params.append('active', filters.active.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/tasks/recurrence?${params}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar recorrências');
      }

      const data = await response.json();
      setRecurrences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    try {
      const response = await fetch('/api/tasks/recurrence/stats');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  // Criar nova recorrência
  const createRecurrence = async (template: TaskTemplate) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks/recurrence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar recorrência');
      }

      const newRecurrence = await response.json();
      setRecurrences(prev => [newRecurrence, ...prev]);
      
      return newRecurrence;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Alternar status da recorrência
  const toggleRecurrence = async (id: string, active: boolean) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/recurrence/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status da recorrência');
      }

      const updatedRecurrence = await response.json();
      setRecurrences(prev => 
        prev.map(rec => rec.id === id ? updatedRecurrence : rec)
      );
      
      return updatedRecurrence;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Excluir recorrência
  const deleteRecurrence = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/recurrence/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir recorrência');
      }

      setRecurrences(prev => prev.filter(rec => rec.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Processar recorrências pendentes
  const processRecurrences = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks/recurrence/process', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Erro ao processar recorrências');
      }

      const result = await response.json();
      
      // Recarregar dados após processamento
      await loadRecurrences();
      await loadStats();
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadRecurrences();
    loadStats();
  }, []);

  return {
    recurrences,
    stats,
    loading,
    error,
    loadRecurrences,
    loadStats,
    createRecurrence,
    toggleRecurrence,
    deleteRecurrence,
    processRecurrences,
  };
}
import { useState, useCallback } from 'react';

export interface EmailTaskData {
  emailId: string;
  titulo?: string;
  descricao?: string;
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataVencimento?: Date;
  responsavelId?: string;
  clienteId?: string;
  oportunidadeId?: string;
}

export interface EmailTaskCheckResult {
  isAlreadyTask: boolean;
  assignees: Array<{
    id: string;
    nome: string;
    email: string;
  }>;
  clients: Array<{
    id: string;
    nome: string;
    email: string;
  }>;
}

export interface EmailTaskResult {
  success: boolean;
  task?: any;
  error?: string;
}

export function useEmailToTask() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se email já foi transformado em tarefa e buscar dados auxiliares
  const checkEmailTask = useCallback(async (emailId: string): Promise<EmailTaskCheckResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tasks/from-email/check?emailId=${emailId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar email');
      }

      return {
        isAlreadyTask: data.isAlreadyTask,
        assignees: data.assignees,
        clients: data.clients
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar tarefa a partir de email
  const createTaskFromEmail = useCallback(async (data: EmailTaskData): Promise<EmailTaskResult | null> => {
    try {
      setLoading(true);
      setError(null);

      const payload = {
        ...data,
        dataVencimento: data.dataVencimento?.toISOString()
      };

      const response = await fetch('/api/tasks/from-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar tarefa');
      }

      return {
        success: result.success,
        task: result.task
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar tarefas criadas a partir de emails
  const getTasksFromEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/tasks/from-email');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar tarefas');
      }

      return data.tasks;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    checkEmailTask,
    createTaskFromEmail,
    getTasksFromEmails
  };
}
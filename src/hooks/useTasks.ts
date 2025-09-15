import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  titulo: string;
  descricao?: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'CONCLUIDA' | 'CANCELADA';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataVencimento?: string;
  dataInicio?: string;
  dataConclusao?: string;
  tempoEstimado?: number;
  tempoGasto?: number;
  createdAt: string;
  updatedAt: string;
  criadoPor: {
    id: string;
    nome: string;
    email: string;
  };
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
  cliente?: {
    id: string;
    nome: string;
    email: string;
  };
  oportunidade?: {
    id: string;
    titulo: string;
  };
  recorrencia?: {
    id: string;
    tipo: string;
    intervalo: number;
    diasSemana?: string[];
    diaMes?: number;
    proximaExecucao?: string;
  };
  comentarios?: TaskComment[];
  anexos?: TaskAttachment[];
  logs?: TaskLog[];
}

export interface TaskComment {
  id: string;
  conteudo: string;
  isInterno: boolean;
  createdAt: string;
  updatedAt: string;
  autor: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface TaskAttachment {
  id: string;
  nomeArquivo: string;
  caminhoArquivo: string;
  tamanho: number;
  tipoConteudo: string;
  createdAt: string;
  uploadPor: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface TaskLog {
  id: string;
  tipo: string;
  descricao: string;
  valorAnterior?: string;
  valorNovo?: string;
  createdAt: string;
  autor: {
    id: string;
    nome: string;
    email: string;
  };
}

export interface CreateTaskData {
  titulo: string;
  descricao?: string;
  status?: 'PENDENTE' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'CONCLUIDA' | 'CANCELADA';
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataVencimento?: string;
  dataInicio?: string;
  tempoEstimado?: number;
  responsavelId?: string;
  clienteId?: string;
  oportunidadeId?: string;
  recorrencia?: {
    tipo: 'DIARIA' | 'SEMANAL' | 'MENSAL' | 'ANUAL';
    intervalo: number;
    diasSemana?: string[];
    diaMes?: number;
  };
}

export interface UpdateTaskData {
  titulo?: string;
  descricao?: string;
  status?: 'PENDENTE' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'CONCLUIDA' | 'CANCELADA';
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  dataVencimento?: string;
  dataInicio?: string;
  dataConclusao?: string;
  tempoEstimado?: number;
  tempoGasto?: number;
  responsavelId?: string;
  clienteId?: string;
  oportunidadeId?: string;
}

export interface TaskFilters {
  status?: string;
  prioridade?: string;
  responsavelId?: string;
  clienteId?: string;
  oportunidadeId?: string;
  dataVencimentoInicio?: string;
  dataVencimentoFim?: string;
  search?: string;
}

export interface TasksResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const { toast } = useToast();

  const fetchTasks = useCallback(async (filters?: TaskFilters, page = 1, limit = 10) => {
    setLoading(true);
    setError(null);

    try {
      const searchParams: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString()
      };

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams[key] = value.toString();
          }
        });
      }

      const params = new URLSearchParams(searchParams);

      const response = await fetch(`/api/tasks?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar tarefas');
      }

      const responseData = await response.json();
      setTasks(responseData.data);
      setPagination({
        page: responseData.meta.page,
        limit: responseData.meta.limit,
        total: responseData.meta.total,
        totalPages: responseData.meta.totalPages
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getTask = useCallback(async (id: string): Promise<Task | null> => {
    try {
      const response = await fetch(`/api/tasks/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar tarefa');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const createTask = useCallback(async (data: CreateTaskData): Promise<Task | null> => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar tarefa');
      }

      const newTask = await response.json();
      setTasks(prev => [newTask, ...prev]);
      
      toast({
        title: 'Sucesso',
        description: 'Tarefa criada com sucesso'
      });

      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const updateTask = useCallback(async (id: string, data: UpdateTaskData): Promise<Task | null> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar tarefa');
      }

      const updatedTask = await response.json();
      setTasks(prev => prev.map(task => task.id === id ? updatedTask : task));
      
      toast({
        title: 'Sucesso',
        description: 'Tarefa atualizada com sucesso'
      });

      return updatedTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir tarefa');
      }

      setTasks(prev => prev.filter(task => task.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Tarefa excluída com sucesso'
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  const addComment = useCallback(async (taskId: string, conteudo: string, isInterno = false): Promise<TaskComment | null> => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conteudo, isInterno })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar comentário');
      }

      const newComment = await response.json();
      
      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado com sucesso'
      });

      return newComment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const uploadAttachment = useCallback(async (taskId: string, file: File): Promise<TaskAttachment | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload do anexo');
      }

      const newAttachment = await response.json();
      
      toast({
        title: 'Sucesso',
        description: 'Anexo enviado com sucesso'
      });

      return newAttachment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return null;
    }
  }, [toast]);

  const downloadAttachment = useCallback(async (taskId: string, attachmentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}/download`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer download do anexo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Download iniciado'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const deleteAttachment = useCallback(async (taskId: string, attachmentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/attachments/${attachmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir anexo');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Anexo excluído com sucesso'
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }
  }, [toast]);

  return {
    tasks,
    loading,
    error,
    pagination,
    fetchTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addComment,
    uploadAttachment,
    downloadAttachment,
    deleteAttachment
  };
}
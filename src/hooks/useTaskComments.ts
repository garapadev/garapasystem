import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

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

export interface TaskAuditLog {
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

export interface CreateCommentData {
  conteudo: string;
  isInterno?: boolean;
}

export function useTaskComments(taskId: string) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [auditLogs, setAuditLogs] = useState<TaskAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar comentários da tarefa
  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar comentários');
      }
      
      const data = await response.json();
      setComments(data.comments || data); // Compatibilidade com diferentes formatos
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
  }, [taskId]);

  // Buscar audit trail da tarefa
  const fetchAuditTrail = useCallback(async () => {
    if (!taskId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/audit-trail`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar histórico');
      }
      
      const data = await response.json();
      setAuditLogs(data.logs || []);
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
  }, [taskId]);

  // Criar novo comentário
  const createComment = useCallback(async (data: CreateCommentData) => {
    if (!taskId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar comentário');
      }
      
      const result = await response.json();
      
      // Atualizar lista de comentários
      await fetchComments();
      
      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado com sucesso'
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [taskId, fetchComments]);

  // Atualizar comentário
  const updateComment = useCallback(async (commentId: string, conteudo: string) => {
    if (!taskId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conteudo })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar comentário');
      }
      
      // Atualizar lista de comentários
      await fetchComments();
      
      toast({
        title: 'Sucesso',
        description: 'Comentário atualizado com sucesso'
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [taskId, fetchComments]);

  // Excluir comentário
  const deleteComment = useCallback(async (commentId: string) => {
    if (!taskId) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/tasks/${taskId}/comments/${commentId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir comentário');
      }
      
      // Atualizar lista de comentários
      await fetchComments();
      
      toast({
        title: 'Sucesso',
        description: 'Comentário excluído com sucesso'
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [taskId, fetchComments]);

  return {
    comments,
    auditLogs,
    loading,
    error,
    fetchComments,
    fetchAuditTrail,
    createComment,
    updateComment,
    deleteComment
  };
}
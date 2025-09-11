import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface HelpdeskDepartamento {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  imapHost?: string;
  imapPort?: number;
  imapSecure: boolean;
  imapEmail?: string;
  imapPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure: boolean;
  smtpEmail?: string;
  smtpPassword?: string;
  syncEnabled: boolean;
  syncInterval: number;
  lastSync?: Date;
  grupoHierarquicoId?: string;
  grupoHierarquico?: {
    id: string;
    nome: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateHelpdeskDepartamentoData {
  nome: string;
  descricao?: string;
  ativo: boolean;
  imapHost?: string;
  imapPort?: number;
  imapSecure: boolean;
  imapEmail?: string;
  imapPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure: boolean;
  smtpEmail?: string;
  smtpPassword?: string;
  syncEnabled: boolean;
  syncInterval: number;
  grupoHierarquicoId?: string;
}

export interface UpdateHelpdeskDepartamentoData extends Partial<CreateHelpdeskDepartamentoData> {
  id: string;
}

export function useHelpdeskDepartamentos() {
  const [departamentos, setDepartamentos] = useState<HelpdeskDepartamento[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDepartamentos = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/departamentos');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar departamentos');
      }
      
      const data = await response.json();
      setDepartamentos(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar departamentos do Helpdesk',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createDepartamento = useCallback(async (data: CreateHelpdeskDepartamentoData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/departamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar departamento');
      }
      
      const newDepartamento = await response.json();
      setDepartamentos(prev => [...prev, newDepartamento]);
      
      toast({
        title: 'Sucesso',
        description: 'Departamento criado com sucesso'
      });
      
      return newDepartamento;
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar departamento',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const updateDepartamento = useCallback(async (id: string, data: Partial<CreateHelpdeskDepartamentoData>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/helpdesk/departamentos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar departamento');
      }
      
      const updatedDepartamento = await response.json();
      setDepartamentos(prev => 
        prev.map(dep => dep.id === id ? updatedDepartamento : dep)
      );
      
      toast({
        title: 'Sucesso',
        description: 'Departamento atualizado com sucesso'
      });
      
      return updatedDepartamento;
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar departamento',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteDepartamento = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/helpdesk/departamentos/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir departamento');
      }
      
      setDepartamentos(prev => prev.filter(dep => dep.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Departamento excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir departamento',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getDepartamentoById = useCallback((id: string) => {
    return departamentos.find(dep => dep.id === id);
  }, [departamentos]);

  return {
    departamentos,
    loading,
    fetchDepartamentos,
    createDepartamento,
    updateDepartamento,
    deleteDepartamento,
    getDepartamentoById
  };
}
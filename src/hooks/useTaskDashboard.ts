import { useState, useEffect } from 'react';
import { toast } from 'sonner';

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

export interface Responsavel {
  id: string;
  nome: string;
  email: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
}

export interface TaskReportItem {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: string;
  status: string;
  dataVencimento: string;
  dataInicio?: string;
  dataConclusao?: string;
  tempoEstimado?: number;
  tempoGasto?: number;
  createdAt: string;
  updatedAt: string;
  responsavel: {
    id: string;
    nome: string;
    email: string;
  };
  cliente?: {
    id: string;
    nome: string;
    email: string;
  };
  criadoPor: {
    id: string;
    nome: string;
  };
}

export function useTaskDashboard() {
  const [metrics, setMetrics] = useState<TaskMetrics | null>(null);
  const [report, setReport] = useState<TaskReportItem[]>([]);
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar métricas
  const loadMetrics = async (filters: TaskFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ type: 'metrics' });
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/tasks/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar métricas');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      setError('Falha ao carregar métricas');
      toast.error('Erro ao carregar métricas do dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Carregar relatório
  const loadReport = async (filters: TaskFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ type: 'report' });
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/tasks/dashboard?${params}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar relatório');
      }

      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setError('Falha ao carregar relatório');
      toast.error('Erro ao carregar relatório de tarefas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar responsáveis
  const loadResponsaveis = async () => {
    try {
      const response = await fetch('/api/tasks/dashboard?type=responsaveis');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar responsáveis');
      }

      const data = await response.json();
      setResponsaveis(data);
    } catch (error) {
      console.error('Erro ao carregar responsáveis:', error);
      toast.error('Erro ao carregar lista de responsáveis');
    }
  };

  // Carregar clientes
  const loadClientes = async () => {
    try {
      const response = await fetch('/api/tasks/dashboard?type=clientes');
      
      if (!response.ok) {
        throw new Error('Falha ao carregar clientes');
      }

      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar lista de clientes');
    }
  };

  // Exportar relatório como CSV
  const exportToCsv = (data: TaskReportItem[], filename: string = 'relatorio-tarefas.csv') => {
    try {
      const headers = [
        'ID',
        'Título',
        'Descrição',
        'Prioridade',
        'Status',
        'Data Vencimento',
        'Data Início',
        'Data Conclusão',
        'Tempo Estimado (min)',
        'Tempo Gasto (min)',
        'Responsável',
        'Cliente',
        'Criado Por',
        'Data Criação',
        'Última Atualização'
      ];

      const csvContent = [
        headers.join(','),
        ...data.map(task => [
          task.id,
          `"${task.titulo.replace(/"/g, '""')}"`,
          `"${(task.descricao || '').replace(/"/g, '""')}"`,
          task.prioridade,
          task.status,
          new Date(task.dataVencimento).toLocaleDateString('pt-BR'),
          task.dataInicio ? new Date(task.dataInicio).toLocaleDateString('pt-BR') : '',
          task.dataConclusao ? new Date(task.dataConclusao).toLocaleDateString('pt-BR') : '',
          task.tempoEstimado || '',
          task.tempoGasto || '',
          `"${task.responsavel.nome}"`,
          task.cliente ? `"${task.cliente.nome}"` : '',
          `"${task.criadoPor.nome}"`,
          new Date(task.createdAt).toLocaleDateString('pt-BR'),
          new Date(task.updatedAt).toLocaleDateString('pt-BR')
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    loadResponsaveis();
    loadClientes();
  }, []);

  return {
    metrics,
    report,
    responsaveis,
    clientes,
    loading,
    error,
    loadMetrics,
    loadReport,
    loadResponsaveis,
    loadClientes,
    exportToCsv
  };
}
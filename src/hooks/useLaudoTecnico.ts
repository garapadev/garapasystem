import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ItemLaudo {
  id?: string;
  descricao: string;
  tipo: 'DIAGNOSTICO' | 'SOLUCAO' | 'RECOMENDACAO' | 'OBSERVACAO';
  valorUnitario?: number;
  quantidade?: number;
  valorTotal?: number;
}

export interface LaudoTecnico {
  id: string;
  ordemServicoId: string;
  tecnicoId: string;
  diagnostico: string;
  solucaoRecomendada: string;
  observacoes?: string;
  status: 'RASCUNHO' | 'CONCLUIDO' | 'APROVADO' | 'REJEITADO';
  valorTotalOrcamento?: number;
  gerarOrcamentoAutomatico: boolean;
  dataFinalizacao?: string;
  createdAt: string;
  updatedAt: string;
  tecnico: {
    id: string;
    nome: string;
    email: string;
  };
  itens: ItemLaudo[];
  anexos: any[];
  historico: any[];
}

export interface LaudoFormData {
  diagnostico: string;
  solucaoRecomendada: string;
  observacoes?: string;
  gerarOrcamentoAutomatico: boolean;
  itens: ItemLaudo[];
}

export function useLaudoTecnico(ordemServicoId: string) {
  const [laudo, setLaudo] = useState<LaudoTecnico | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Buscar laudo existente
  const fetchLaudo = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/ordens-servico/${ordemServicoId}/laudo`);
      
      if (response.ok) {
        const data = await response.json();
        setLaudo(data);
      } else if (response.status === 404) {
        // Laudo não existe ainda
        setLaudo(null);
      } else {
        throw new Error('Erro ao buscar laudo técnico');
      }
    } catch (error) {
      console.error('Erro ao buscar laudo:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar laudo técnico',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [ordemServicoId, toast]);

  // Criar novo laudo
  const createLaudo = useCallback(async (data: LaudoFormData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ordens-servico/${ordemServicoId}/laudo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar laudo técnico');
      }

      const novoLaudo = await response.json();
      setLaudo(novoLaudo);
      
      toast({
        title: 'Sucesso',
        description: 'Laudo técnico criado com sucesso'
      });

      return novoLaudo;
    } catch (error) {
      console.error('Erro ao criar laudo:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar laudo técnico',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [ordemServicoId, toast]);

  // Atualizar laudo existente
  const updateLaudo = useCallback(async (laudoId: string, data: LaudoFormData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ordens-servico/${ordemServicoId}/laudo/${laudoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar laudo técnico');
      }

      const laudoAtualizado = await response.json();
      setLaudo(laudoAtualizado);
      
      toast({
        title: 'Sucesso',
        description: 'Laudo técnico atualizado com sucesso'
      });

      return laudoAtualizado;
    } catch (error) {
      console.error('Erro ao atualizar laudo:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar laudo técnico',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [ordemServicoId, toast]);

  // Concluir laudo
  const concluirLaudo = useCallback(async (laudoId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ordens-servico/${ordemServicoId}/laudo/${laudoId}/concluir`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao concluir laudo técnico');
      }

      const laudoConcluido = await response.json();
      setLaudo(laudoConcluido);
      
      toast({
        title: 'Sucesso',
        description: 'Laudo técnico concluído e enviado para aprovação do cliente'
      });

      return laudoConcluido;
    } catch (error) {
      console.error('Erro ao concluir laudo:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao concluir laudo técnico',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [ordemServicoId, toast]);

  // Gerar orçamento automático
  const gerarOrcamento = useCallback(async (laudoId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ordens-servico/${ordemServicoId}/laudo/${laudoId}/gerar-orcamento`, {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao gerar orçamento');
      }

      const result = await response.json();
      
      toast({
        title: 'Sucesso',
        description: 'Orçamento gerado automaticamente com sucesso'
      });

      return result;
    } catch (error) {
      console.error('Erro ao gerar orçamento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar orçamento',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [ordemServicoId, toast]);

  // Excluir laudo
  const deleteLaudo = useCallback(async (laudoId: string) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/ordens-servico/${ordemServicoId}/laudo/${laudoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir laudo técnico');
      }

      setLaudo(null);
      
      toast({
        title: 'Sucesso',
        description: 'Laudo técnico excluído com sucesso'
      });
    } catch (error) {
      console.error('Erro ao excluir laudo:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir laudo técnico',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setSaving(false);
    }
  }, [ordemServicoId, toast]);

  return {
    laudo,
    loading,
    saving,
    fetchLaudo,
    createLaudo,
    updateLaudo,
    concluirLaudo,
    gerarOrcamento,
    deleteLaudo
  };
}
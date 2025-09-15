import { useState, useEffect, useCallback } from 'react';

interface AutomationStats {
  totalTarefasAutomaticas: number;
  tarefasUltimos30Dias: number;
  regrasAtivas: number;
  totalRegras: number;
}

interface BusinessTaskRule {
  id: string;
  nome: string;
  etapaOrigemId: string;
  etapaDestinoId: string;
  acaoTarefa: 'CRIAR' | 'ATUALIZAR_STATUS' | 'ATRIBUIR' | 'NOTIFICAR';
  templateTarefa?: {
    titulo: string;
    descricao: string;
    prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
    diasVencimento: number;
    responsavelPadrao?: string;
  };
  ativo: boolean;
}

export const useBusinessIntegration = () => {
  const [stats, setStats] = useState<AutomationStats>({
    totalTarefasAutomaticas: 0,
    tarefasUltimos30Dias: 0,
    regrasAtivas: 0,
    totalRegras: 0
  });
  const [rules, setRules] = useState<BusinessTaskRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carregar estatísticas de automação
   */
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Implementar chamada para API do servidor
      const response = await fetch('/api/tasks/automation/stats');
      const automationStats = await response.json();
      setStats(automationStats);
    } catch (err) {
      setError('Erro ao carregar estatísticas de automação');
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar regras de automação
   */
  const loadRules = useCallback(async () => {
    try {
      // Implementar chamada para API do servidor
      const response = await fetch('/api/tasks/automation/rules');
      const automationRules = await response.json();
      setRules(automationRules);
    } catch (err) {
      setError('Erro ao carregar regras de automação');
      console.error('Erro ao carregar regras:', err);
    }
  }, []);

  /**
   * Ativar/desativar regra
   */
  const toggleRule = useCallback(async (ruleId: string, ativo: boolean) => {
    try {
      await fetch('/api/tasks/automation/rules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, ativo })
      });
      await loadRules(); // Recarregar regras
      await loadStats(); // Recarregar estatísticas
    } catch (err) {
      setError('Erro ao alterar status da regra');
      console.error('Erro ao alterar regra:', err);
    }
  }, [loadRules, loadStats]);

  /**
   * Simular movimento de oportunidade (para testes)
   */
  const simulateOportunidadeMovement = useCallback(async (movimento: {
    oportunidadeId: string;
    etapaAnteriorId: string;
    etapaAtualId: string;
    responsavelId?: string;
    clienteId: string;
  }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tasks/automation/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movimento)
      });
      await response.json();
      await loadStats(); // Recarregar estatísticas após processamento
    } catch (err) {
      setError('Erro ao processar movimento de oportunidade');
      console.error('Erro ao processar movimento:', err);
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  /**
   * Obter regras aplicáveis para uma transição específica
   */
  const getApplicableRules = useCallback((etapaOrigemId: string, etapaDestinoId: string) => {
    return rules.filter(rule => 
      rule.ativo && 
      rule.etapaOrigemId === etapaOrigemId &&
      rule.etapaDestinoId === etapaDestinoId
    );
  }, [rules]);

  /**
   * Obter resumo de automação por etapa
   */
  const getAutomationSummary = useCallback(() => {
    const summary = {
      etapasComAutomacao: new Set<string>(),
      regrasPorEtapa: {} as Record<string, number>,
      acoesPorTipo: {
        CRIAR: 0,
        ATUALIZAR_STATUS: 0,
        ATRIBUIR: 0,
        NOTIFICAR: 0
      }
    };

    rules.forEach(rule => {
      if (rule.ativo) {
        summary.etapasComAutomacao.add(rule.etapaOrigemId);
        summary.etapasComAutomacao.add(rule.etapaDestinoId);
        
        const key = `${rule.etapaOrigemId}->${rule.etapaDestinoId}`;
        summary.regrasPorEtapa[key] = (summary.regrasPorEtapa[key] || 0) + 1;
        
        summary.acoesPorTipo[rule.acaoTarefa]++;
      }
    });

    return {
      ...summary,
      etapasComAutomacao: Array.from(summary.etapasComAutomacao)
    };
  }, [rules]);

  // Carregar dados iniciais
  useEffect(() => {
    loadStats();
    loadRules();
  }, [loadStats, loadRules]);

  return {
    // Estados
    stats,
    rules,
    loading,
    error,
    
    // Ações
    loadStats,
    loadRules,
    toggleRule,
    simulateOportunidadeMovement,
    
    // Utilitários
    getApplicableRules,
    getAutomationSummary
  };
};

export default useBusinessIntegration;
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
      
      // Verificar se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Tratamento específico para erro de formato de dados inválido
        if (response.status === 400 && errorData.code === 'INVALID_RULE_DATA') {
          console.error('Formato de dados inválido detectado:', errorData);
          setError(`Formato de dados inválido: ${errorData.details || 'Dados malformados na API'}`);
          setRules([]);
          return;
        }
        
        throw new Error(`Erro HTTP ${response.status}: ${errorData.error || 'Erro desconhecido'}`);
      }
      
      const automationRules = await response.json();
      
      // Validar se os dados retornados são um array
      if (Array.isArray(automationRules)) {
        // Validar estrutura de cada regra
        const validRules = automationRules.filter(rule => {
          if (!rule || typeof rule !== 'object') return false;
          if (!rule.id || !rule.nome) return false;
          return true;
        });
        
        if (validRules.length !== automationRules.length) {
          console.warn(`${automationRules.length - validRules.length} regras com formato inválido foram filtradas`);
        }
        
        setRules(validRules);
      } else {
        console.warn('API retornou dados inválidos para regras de automação:', automationRules);
        setRules([]);
        setError('Formato de dados inválido recebido da API: esperado array de regras');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao carregar regras de automação: ${errorMessage}`);
      console.error('Erro ao carregar regras:', err);
      setRules([]); // Garantir que rules seja sempre um array
    }
  }, []);

  /**
   * Ativar/desativar regra
   */
  const toggleRule = useCallback(async (ruleId: string, ativo: boolean) => {
    try {
      const response = await fetch('/api/tasks/automation/rules/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, ativo })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Tratamento específico para erro de formato de dados inválido
        if (response.status === 400 && errorData.code === 'INVALID_RULE_DATA') {
          setError(`Formato de dados inválido: ${errorData.details || 'Dados da regra malformados'}`);
          return;
        }
        
        throw new Error(`Erro HTTP ${response.status}: ${errorData.error || 'Erro ao alterar regra'}`);
      }
      
      await loadRules(); // Recarregar regras
      await loadStats(); // Recarregar estatísticas
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao alterar status da regra: ${errorMessage}`);
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
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Tratamento específico para erro de formato de dados inválido
        if (response.status === 400 && errorData.code === 'INVALID_RULE_DATA') {
          setError(`Formato de dados inválido: ${errorData.details || 'Dados do movimento malformados'}`);
          return;
        }
        
        throw new Error(`Erro HTTP ${response.status}: ${errorData.error || 'Erro na simulação'}`);
      }
      
      await response.json();
      await loadStats(); // Recarregar estatísticas após processamento
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao processar movimento de oportunidade: ${errorMessage}`);
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

    // Validar se rules é um array antes de usar forEach
    if (!Array.isArray(rules)) {
      console.warn('Rules não é um array:', rules);
      return {
        ...summary,
        etapasComAutomacao: []
      };
    }

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
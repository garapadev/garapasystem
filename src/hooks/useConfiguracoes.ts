'use client';

import { useState, useEffect, useCallback } from 'react';

interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  descricao?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseConfiguracoesReturn {
  configuracoes: Configuracao[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  updateConfiguracao: (chave: string, valor: string, descricao?: string) => Promise<void>;
  getConfiguracao: (chave: string) => Configuracao | undefined;
}

export function useConfiguracoes(): UseConfiguracoesReturn {
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfiguracoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/configuracoes');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }
      
      const data = await response.json();
      setConfiguracoes(prev => {
        // Evitar atualizações desnecessárias comparando o conteúdo
        if (JSON.stringify(prev) === JSON.stringify(data)) {
          return prev;
        }
        return data;
      });
    } catch (err) {
      console.error('Erro ao buscar configurações:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfiguracao = useCallback(async (chave: string, valor: string, descricao?: string) => {
    try {
      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chave, valor, descricao }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar configuração');
      }

      const configuracaoAtualizada = await response.json();
      
      // Atualizar o estado local
      setConfiguracoes(prev => {
        const index = prev.findIndex(config => config.chave === chave);
        if (index >= 0) {
          // Atualizar configuração existente
          const newConfiguracoes = [...prev];
          newConfiguracoes[index] = configuracaoAtualizada;
          return newConfiguracoes;
        } else {
          // Adicionar nova configuração
          return [...prev, configuracaoAtualizada];
        }
      });
    } catch (err) {
      console.error('Erro ao atualizar configuração:', err);
      throw err;
    }
  }, []);

  const getConfiguracao = useCallback((chave: string): Configuracao | undefined => {
    return configuracoes.find(config => config.chave === chave);
  }, [configuracoes]);

  const refetch = useCallback(() => {
    fetchConfiguracoes();
  }, [fetchConfiguracoes]);

  useEffect(() => {
    fetchConfiguracoes();
  }, []); // Removendo fetchConfiguracoes das dependências temporariamente

  return {
    configuracoes,
    loading,
    error,
    refetch,
    updateConfiguracao,
    getConfiguracao
  };
}

// Hook para buscar uma configuração específica
export function useConfiguracao(chave: string) {
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfiguracao = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/configuracoes?chave=${encodeURIComponent(chave)}`);
      
      if (response.status === 404) {
        setConfiguracao(null);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Erro ao carregar configuração');
      }
      
      const data = await response.json();
      setConfiguracao(data);
    } catch (err) {
      console.error('Erro ao buscar configuração:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chave) {
      fetchConfiguracao();
    }
  }, [chave]);

  return {
    configuracao,
    loading,
    error,
    refetch: fetchConfiguracao
  };
}

// Função utilitária para obter valor de configuração com fallback
export async function getConfiguracaoValor(chave: string, valorPadrao: string = ''): Promise<string> {
  try {
    const response = await fetch(`/api/configuracoes?chave=${encodeURIComponent(chave)}`);
    
    if (response.status === 404) {
      return valorPadrao;
    }
    
    if (!response.ok) {
      return valorPadrao;
    }
    
    const configuracao = await response.json();
    return configuracao.valor || valorPadrao;
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    return valorPadrao;
  }
}
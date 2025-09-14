'use client';

import { useState, useEffect } from 'react';

export function useRecursos() {
  const [recursos, setRecursos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecursos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/permissoes/recursos');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar recursos');
        }
        
        const data = await response.json();
        setRecursos(data);
      } catch (err) {
        console.error('Erro ao buscar recursos:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        // Fallback para recursos básicos em caso de erro
        setRecursos([
          'clientes',
          'colaboradores',
          'configuracoes',
          'dashboard',
          'grupos',
          'oportunidades',
          'perfis',
          'permissoes',
          'sistema',
          'usuarios',
          'webmail'
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecursos();
  }, []);

  return { recursos, loading, error };
}
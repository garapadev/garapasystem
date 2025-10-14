'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

interface Modulo {
  id: string;
  nome: string;
  titulo: string;
  ativo: boolean;
  core: boolean;
  icone?: string;
  ordem: number;
  permissao?: string;
  rota?: string;
  categoria?: string;
}

interface UseModulosReturn {
  modulos: Modulo[];
  modulosAtivos: Modulo[];
  loading: boolean;
  error: string | null;
  isModuleActive: (moduleName: string) => boolean;
  getModuleByName: (moduleName: string) => Modulo | undefined;
  getModuleByRoute: (route: string) => Modulo | undefined;
  refetch: () => Promise<void>;
}

export function useModulos(): UseModulosReturn {
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchModulos = useCallback(async () => {
    if (!isAuthenticated) {
      setModulos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/modulos/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar módulos: ${response.status}`);
      }

      const data = await response.json();
      setModulos(data.data || []);
    } catch (err) {
      console.error('Erro ao carregar módulos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setModulos([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchModulos();
  }, [fetchModulos]);

  const normalizeName = (name: string) => name.toLowerCase().trim().replace(/\s+/g, '-');
  const modulosAtivos = modulos.filter(modulo => modulo.ativo);

  const isModuleActive = useCallback((moduleName: string): boolean => {
    const target = normalizeName(moduleName);
    return modulosAtivos.some(modulo => normalizeName(modulo.nome) === target);
  }, [modulosAtivos]);

  const getModuleByName = useCallback((moduleName: string): Modulo | undefined => {
    const target = normalizeName(moduleName);
    return modulos.find(modulo => normalizeName(modulo.nome) === target);
  }, [modulos]);

  const getModuleByRoute = useCallback((route: string): Modulo | undefined => {
    return modulos.find(modulo => modulo.rota === route);
  }, [modulos]);

  const refetch = useCallback(async () => {
    await fetchModulos();
  }, [fetchModulos]);

  return {
    modulos,
    modulosAtivos,
    loading,
    error,
    isModuleActive,
    getModuleByName,
    getModuleByRoute,
    refetch,
  };
}

// Hook específico para verificar se um módulo está ativo
export function useModuleActive(moduleName: string): boolean {
  const { isModuleActive } = useModulos();
  return isModuleActive(moduleName);
}

// Hook para obter informações de um módulo específico
export function useModule(moduleName: string): {
  module: Modulo | undefined;
  isActive: boolean;
  loading: boolean;
} {
  const { getModuleByName, isModuleActive, loading } = useModulos();
  
  const module = getModuleByName(moduleName);
  const isActive = isModuleActive(moduleName);

  return {
    module,
    isActive,
    loading,
  };
}
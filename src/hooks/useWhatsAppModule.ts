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

export function useWhatsAppModule() {
  const [isModuleActive, setIsModuleActive] = useState(false); // Padrão como inativo
  const [isLoading, setIsLoading] = useState(true);
  const [whatsappModule, setWhatsappModule] = useState<Modulo | null>(null);
  const { isAuthenticated } = useAuth();

  // Buscar status atual do módulo WhatsApp na lista de módulos ativos
  const fetchModuleStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setIsModuleActive(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/modulos/active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const modulos: Modulo[] = data.data || [];
        const whatsappMod = modulos.find(modulo => 
          modulo.nome === 'whatsapp-chat' || 
          modulo.nome === 'WhatsApp Chat' ||
          modulo.nome.toLowerCase().replace(/\s+/g, '-') === 'whatsapp-chat'
        );
        
        setWhatsappModule(whatsappMod || null);
        setIsModuleActive(whatsappMod?.ativo || false);
      } else {
        console.warn('Erro ao buscar módulos ativos:', response.status);
        setIsModuleActive(false);
      }
    } catch (error) {
      console.error('Erro ao buscar módulos ativos:', error);
      setIsModuleActive(false);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchModuleStatus();
  }, [fetchModuleStatus]);

  const toggleModule = async (active: boolean) => {
    if (!whatsappModule) {
      console.error('Módulo WhatsApp não encontrado');
      return false;
    }

    try {
      const response = await fetch(`/api/modulos/${whatsappModule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ativo: active
        }),
      });

      if (response.ok) {
        setIsModuleActive(active);
        // Atualizar o módulo local
        setWhatsappModule(prev => prev ? { ...prev, ativo: active } : null);
        return true;
      } else {
        console.error('Erro ao atualizar módulo:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Erro ao atualizar módulo WhatsApp:', error);
      return false;
    }
  };

  return {
    isModuleActive,
    toggleModule,
    isLoading,
    refetch: fetchModuleStatus
  };
}
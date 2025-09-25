'use client';

import { useState, useEffect } from 'react';

export function useWhatsAppModule() {
  const [isModuleActive, setIsModuleActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar configuração atual do módulo WhatsApp
  const fetchModuleStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/configuracoes?chave=whatsapp_module_active');
      if (response.ok) {
        const data = await response.json();
        setIsModuleActive(data.valor === 'true');
      }
    } catch (error) {
      console.error('Erro ao buscar configuração do módulo WhatsApp:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModuleStatus();
  }, []);

  const toggleModule = async (active: boolean) => {
    try {
      const response = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chave: 'whatsapp_module_active',
          valor: active.toString(),
          descricao: 'Controla se o módulo WhatsApp está ativo no sistema'
        }),
      });

      if (response.ok) {
        setIsModuleActive(active);
        return true;
      } else {
        console.error('Erro ao atualizar configuração:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração do módulo WhatsApp:', error);
      return false;
    }
  };

  return {
    isModuleActive,
    toggleModule,
    isLoading
  };
}
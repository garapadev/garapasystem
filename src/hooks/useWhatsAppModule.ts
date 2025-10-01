'use client';

import { useState, useEffect } from 'react';

export function useWhatsAppModule() {
  const [isModuleActive, setIsModuleActive] = useState(true); // Padrão como ativo para evitar problemas
  const [isLoading, setIsLoading] = useState(true);

  // Buscar configuração atual do módulo WhatsApp
  const fetchModuleStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/configuracoes?chave=whatsapp_module_active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsModuleActive(data.valor === 'true');
      } else if (response.status === 404) {
        // Se a configuração não existe, assume como ativo por padrão
        console.log('Configuração whatsapp_module_active não encontrada, usando padrão: ativo');
        setIsModuleActive(true);
      } else {
        console.warn('Erro ao buscar configuração do módulo WhatsApp:', response.status);
        // Em caso de erro, mantém como ativo para não quebrar a interface
        setIsModuleActive(true);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração do módulo WhatsApp:', error);
      // Em caso de erro de rede, mantém como ativo para não quebrar a interface
      setIsModuleActive(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Timeout para evitar carregamento indefinido
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn('Timeout ao carregar configuração do WhatsApp, usando padrão');
        setIsModuleActive(true);
        setIsLoading(false);
      }
    }, 5000); // 5 segundos de timeout

    fetchModuleStatus().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      clearTimeout(timeoutId);
    };
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
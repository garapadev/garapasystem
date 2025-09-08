'use client';

import { useState } from 'react';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface EnderecoData {
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
}

export function useViaCep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscarCep = async (cep: string): Promise<EnderecoData | null> => {
    // Remove caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Valida se o CEP tem 8 dígitos
    if (cepLimpo.length !== 8) {
      setError('CEP deve ter 8 dígitos');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }

      const data: ViaCepResponse = await response.json();
      
      if (data.erro) {
        setError('CEP não encontrado');
        return null;
      }

      // Formata o endereço completo
      const enderecoCompleto = [
        data.logradouro,
        data.bairro
      ].filter(Boolean).join(', ');

      return {
        endereco: enderecoCompleto,
        cidade: data.localidade,
        estado: data.uf,
        cep: formatarCep(cepLimpo)
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar CEP';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const formatarCep = (cep: string): string => {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const validarCep = (cep: string): boolean => {
    const cepLimpo = cep.replace(/\D/g, '');
    return cepLimpo.length === 8;
  };

  return {
    buscarCep,
    formatarCep,
    validarCep,
    loading,
    error
  };
}
import { useState, useCallback } from 'react';
import { ClientIntegrationService, ClientSearchResult, ClientAssociationResult } from '@/lib/helpdesk/client-integration-service';
import { Cliente, HelpdeskTicket } from '@prisma/client';

export interface UseClientIntegrationReturn {
  // Estados
  isLoading: boolean;
  error: string | null;
  searchResults: ClientSearchResult[];
  
  // Funções de busca
  searchClients: (email?: string, telefone?: string, nome?: string) => Promise<ClientSearchResult[]>;
  findClientByEmail: (email: string) => Promise<Cliente | null>;
  findClientByPhone: (telefone: string) => Promise<Cliente | null>;
  
  // Funções de associação
  associateTicketToClient: (ticketId: string, clienteId: string) => Promise<boolean>;
  autoAssociateTicket: (ticketId: string, email?: string, telefone?: string, nome?: string) => Promise<ClientAssociationResult>;
  
  // Funções de criação
  createClientFromTicket: (email: string, nome?: string, telefone?: string) => Promise<ClientAssociationResult>;
  
  // Funções de histórico
  getClientTicketHistory: (clienteId: string) => Promise<HelpdeskTicket[]>;
  getClientTicketStats: (clienteId: string) => Promise<any>;
  
  // Utilitários
  clearResults: () => void;
  clearError: () => void;
}

export function useClientIntegration(): UseClientIntegrationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  const searchClients = useCallback(async (
    email?: string,
    telefone?: string,
    nome?: string
  ): Promise<ClientSearchResult[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await ClientIntegrationService.smartClientSearch(email, telefone, nome);
      setSearchResults(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar clientes';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findClientByEmail = useCallback(async (email: string): Promise<Cliente | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cliente = await ClientIntegrationService.findClientByEmail(email);
      return cliente;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar cliente por email';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const findClientByPhone = useCallback(async (telefone: string): Promise<Cliente | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const cliente = await ClientIntegrationService.findClientByPhone(telefone);
      return cliente;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar cliente por telefone';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const associateTicketToClient = useCallback(async (
    ticketId: string,
    clienteId: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/helpdesk/tickets/${ticketId}/associate-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clienteId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao associar ticket ao cliente');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao associar ticket ao cliente';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const autoAssociateTicket = useCallback(async (
    ticketId: string,
    email?: string,
    telefone?: string,
    nome?: string
  ): Promise<ClientAssociationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ClientIntegrationService.autoAssociateTicketToClient(
        ticketId,
        email,
        telefone,
        nome
      );
      
      if (!result.success && result.message) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na associação automática';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createClientFromTicket = useCallback(async (
    email: string,
    nome?: string,
    telefone?: string
  ): Promise<ClientAssociationResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await ClientIntegrationService.createClientFromTicket(email, nome, telefone);
      
      if (!result.success && result.message) {
        setError(result.message);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente';
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getClientTicketHistory = useCallback(async (clienteId: string): Promise<HelpdeskTicket[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tickets = await ClientIntegrationService.getClientTicketHistory(clienteId);
      return tickets;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar histórico de tickets';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getClientTicketStats = useCallback(async (clienteId: string): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/helpdesk/clients/${clienteId}/stats`);
      if (!response.ok) {
        throw new Error('Erro ao buscar estatísticas do cliente');
      }
      const stats = await response.json();
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar estatísticas de tickets';
      setError(errorMessage);
      return {
        total: 0,
        abertos: 0,
        fechados: 0,
        emAndamento: 0,
        taxaResolucao: 0
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // Estados
    isLoading,
    error,
    searchResults,
    
    // Funções de busca
    searchClients,
    findClientByEmail,
    findClientByPhone,
    
    // Funções de associação
    associateTicketToClient,
    autoAssociateTicket,
    
    // Funções de criação
    createClientFromTicket,
    
    // Funções de histórico
    getClientTicketHistory,
    getClientTicketStats,
    
    // Utilitários
    clearResults,
    clearError
  };
}

// Hook especializado para busca de clientes em tempo real
export function useClientSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Detectar tipo de busca baseado no formato
      const isEmail = searchQuery.includes('@');
      const isPhone = /^[\d\s\-\(\)\+]+$/.test(searchQuery);
      
      let searchResults: ClientSearchResult[] = [];
      
      if (isEmail) {
        searchResults = await ClientIntegrationService.smartClientSearch(searchQuery);
      } else if (isPhone) {
        searchResults = await ClientIntegrationService.smartClientSearch(undefined, searchQuery);
      } else {
        searchResults = await ClientIntegrationService.smartClientSearch(undefined, undefined, searchQuery);
      }
      
      setResults(searchResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na busca';
      setSearchError(errorMessage);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearchError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    isSearching,
    searchError,
    search,
    clearSearch
  };
}
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, User, FileText, Building, Wrench, DollarSign, Filter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'cliente' | 'colaborador' | 'orcamento' | 'ordem-servico' | 'negocio' | 'helpdesk';
  href: string;
  metadata?: Record<string, any>;
}

interface SearchCategory {
  type: SearchResult['type'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const searchCategories: SearchCategory[] = [
  { type: 'cliente', label: 'Clientes', icon: User, color: 'text-blue-600' },
  { type: 'colaborador', label: 'Colaboradores', icon: User, color: 'text-green-600' },
  { type: 'orcamento', label: 'Orçamentos', icon: DollarSign, color: 'text-yellow-600' },
  { type: 'ordem-servico', label: 'Ordens de Serviço', icon: Wrench, color: 'text-purple-600' },
  { type: 'negocio', label: 'Negócios', icon: Building, color: 'text-indigo-600' },
  { type: 'helpdesk', label: 'Helpdesk', icon: FileText, color: 'text-red-600' }
];

interface GlobalSearchProps {
  className?: string;
  placeholder?: string;
}

export function GlobalSearch({ className, placeholder = "Buscar em todo o sistema..." }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SearchResult['type'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const debouncedQuery = useDebounce(query, 300);

  // Carregar buscas recentes do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('garapasystem-recent-searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar buscas recentes:', error);
      }
    }
  }, []);

  // Salvar busca recente
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('garapasystem-recent-searches', JSON.stringify(updated));
  }, [recentSearches]);

  // Função de busca (simulada - deve ser conectada à API real)
  const performSearch = useCallback(async (searchQuery: string, category: string = 'all') => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    try {
      // Simular delay da API
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Resultados simulados - substituir por chamada real à API
      const mockResults: SearchResult[] = [
        {
          id: '1',
          title: `Cliente: ${searchQuery}`,
          subtitle: 'cliente@exemplo.com',
          type: 'cliente',
          href: '/clientes/1',
          metadata: { status: 'ATIVO' }
        },
        {
          id: '2',
          title: `Orçamento #${searchQuery}`,
          subtitle: 'R$ 1.500,00 - Em análise',
          type: 'orcamento',
          href: '/orcamentos/2',
          metadata: { valor: 1500, status: 'EM_ANALISE' }
        },
        {
          id: '3',
          title: `OS #${searchQuery}`,
          subtitle: 'Manutenção preventiva',
          type: 'ordem-servico',
          href: '/ordens-servico/3',
          metadata: { status: 'PENDENTE' }
        }
      ];

      // Filtrar por categoria se não for 'all'
      const filteredResults = category === 'all' 
        ? mockResults 
        : mockResults.filter(result => result.type === category);

      setResults(filteredResults);
    } catch (error) {
      console.error('Erro na busca:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Executar busca quando query ou categoria mudar
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery, selectedCategory);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, selectedCategory, performSearch]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+K ou Cmd+K para abrir busca
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
        inputRef.current?.focus();
      }
      
      // Escape para fechar
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    saveRecentSearch(query);
    setIsOpen(false);
    setQuery('');
    router.push(result.href);
  };

  const handleRecentSearchClick = (recentQuery: string) => {
    setQuery(recentQuery);
    performSearch(recentQuery, selectedCategory);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('garapasystem-recent-searches');
  };

  const getCategoryIcon = (type: SearchResult['type']) => {
    const category = searchCategories.find(cat => cat.type === type);
    return category ? category.icon : FileText;
  };

  const getCategoryColor = (type: SearchResult['type']) => {
    const category = searchCategories.find(cat => cat.type === type);
    return category ? category.color : 'text-gray-600';
  };

  return (
    <div ref={searchRef} className={cn('relative', className)}>
      {/* Campo de busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Filtros de categoria */}
          <div className="border-b border-gray-100 p-3">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap',
                  selectedCategory === 'all'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                Todos
              </button>
              {searchCategories.map((category) => (
                <button
                  key={category.type}
                  onClick={() => setSelectedCategory(category.type)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap flex items-center space-x-1',
                    selectedCategory === category.type
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <category.icon className="h-3 w-3" />
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Buscando...</span>
              </div>
            )}

            {/* Resultados */}
            {!isLoading && results.length > 0 && (
              <div className="py-2">
                {results.map((result) => {
                  const Icon = getCategoryIcon(result.type);
                  const colorClass = getCategoryColor(result.type);
                  
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <Icon className={cn('h-5 w-5 flex-shrink-0', colorClass)} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-gray-500 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Buscas recentes */}
            {!isLoading && !query && recentSearches.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                  <span>Buscas recentes</span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    Limpar
                  </button>
                </div>
                {recentSearches.map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(recentQuery)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                  >
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{recentQuery}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Sem resultados */}
            {!isLoading && query && results.length === 0 && (
              <div className="py-8 text-center">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Nenhum resultado encontrado para "{query}"
                </p>
              </div>
            )}

            {/* Estado inicial */}
            {!isLoading && !query && recentSearches.length === 0 && (
              <div className="py-8 text-center">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Digite para buscar em todo o sistema
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Use ⌘K para abrir rapidamente
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
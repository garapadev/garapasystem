'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useHelpdeskPermissions, filterDepartamentosByPermissions } from '@/hooks/useHelpdeskPermissions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  User,
  Building,
  Tag,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
} from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para os dados dos tickets
interface HelpdeskTicket {
  id: number;
  numero: string;
  assunto: string;
  descricao: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO' | 'RESOLVIDO' | 'FECHADO';
  solicitanteNome: string;
  solicitanteEmail: string;
  departamentoId: number;
  departamento?: {
    id: number;
    nome: string;
  };
  categoria?: string;
  tags?: string;
  dataAbertura: Date;
  dataFechamento?: Date;
  dataUltimaResposta?: Date;
  createdAt: Date;
  updatedAt: Date;
  responsavelId?: number;
  responsavel?: {
    id: number;
    nome: string;
  };
}

interface TicketsTableProps {
  tickets: HelpdeskTicket[];
  loading?: boolean;
  onRefresh?: () => void;
  onViewTicket?: (ticket: HelpdeskTicket) => void;
  onExportData?: (filteredTickets: HelpdeskTicket[]) => void;
}

// Configurações de filtros
interface FilterConfig {
  search: string;
  status: string;
  prioridade: string;
  departamento: string;
  categoria: string;
  responsavel: string;
  dataInicio: string;
  dataFim: string;
  tags: string;
}

// Configurações de ordenação
interface SortConfig {
  key: keyof HelpdeskTicket | 'departamento.nome' | 'responsavel.nome';
  direction: 'asc' | 'desc';
}

const INITIAL_FILTERS: FilterConfig = {
  search: '',
  status: '',
  prioridade: '',
  departamento: '',
  categoria: '',
  responsavel: '',
  dataInicio: '',
  dataFim: '',
  tags: '',
};

const STATUS_CONFIG = {
  ABERTO: { label: 'Aberto', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  AGUARDANDO: { label: 'Aguardando', color: 'bg-orange-100 text-orange-800', icon: Pause },
  RESOLVIDO: { label: 'Resolvido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FECHADO: { label: 'Fechado', color: 'bg-gray-100 text-gray-800', icon: XCircle },
};

const PRIORIDADE_CONFIG = {
  BAIXA: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  MEDIA: { label: 'Média', color: 'bg-blue-100 text-blue-800' },
  ALTA: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  URGENTE: { label: 'Urgente', color: 'bg-red-100 text-red-800' },
};

// Função auxiliar para formatar datas de forma segura
const formatSafeDate = (date: Date | string | null | undefined, formatStr: string): string => {
  if (!date) return '-';
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else {
    dateObj = new Date(date);
  }
  
  if (!isValid(dateObj)) {
    return '-';
  }
  
  return format(dateObj, formatStr, { locale: ptBR });
};

export function TicketsTable({
  tickets,
  loading = false,
  onRefresh,
  onViewTicket,
  onExportData,
}: TicketsTableProps) {
  const permissions = useHelpdeskPermissions();
  const [filters, setFilters] = useState<FilterConfig>(INITIAL_FILTERS);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'dataAbertura',
    direction: 'desc',
  });
  const [showFilters, setShowFilters] = useState(false);

  // Filtrar tickets baseado nas permissões do usuário
  const accessibleTickets = useMemo(() => {
    if (permissions.loading) {
      return [];
    }

    if (!permissions.canViewTickets) {
      return [];
    }

    // Administradores podem ver todos os tickets
    if (permissions.isHelpdeskAdmin) {
      return tickets;
    }

    // Usuários não-admin podem ver todos os tickets (simplificado)
    return tickets;
  }, [tickets, permissions]);

  // Extrair opções únicas para os filtros baseado nos tickets acessíveis
  const filterOptions = useMemo(() => {
    const departamentos = Array.from(
      new Set(accessibleTickets.map(t => t.departamento?.nome).filter((nome): nome is string => Boolean(nome)))
    ).sort();
    
    const categorias = Array.from(
      new Set(accessibleTickets.map(t => t.categoria).filter(Boolean))
    ).sort() as string[];
    
    const responsaveis = Array.from(
      new Set(accessibleTickets.map(t => t.responsavel?.nome).filter(Boolean))
    ).sort() as string[];
    
    const todasTags = accessibleTickets
      .map(t => t.tags?.split(',').map(tag => tag.trim()))
      .flat()
      .filter(Boolean) as string[];
    const tags = Array.from(new Set(todasTags)).sort();

    return { departamentos, categorias, responsaveis, tags };
  }, [accessibleTickets]);

  // Aplicar filtros e ordenação
  const filteredAndSortedTickets = useMemo(() => {
    let filtered = accessibleTickets.filter(ticket => {
      // Filtro de busca textual
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchFields = [
          ticket.numero,
          ticket.assunto,
          ticket.descricao,
          ticket.solicitanteNome,
          ticket.solicitanteEmail,
          ticket.departamento?.nome,
          ticket.categoria,
          ticket.tags,
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (!searchFields.includes(searchLower)) {
          return false;
        }
      }

      // Filtros específicos
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.prioridade && ticket.prioridade !== filters.prioridade) return false;
      if (filters.departamento && ticket.departamento?.nome !== filters.departamento) return false;
      if (filters.categoria && ticket.categoria !== filters.categoria) return false;
      if (filters.responsavel && ticket.responsavel?.nome !== filters.responsavel) return false;
      
      // Filtro de tags
      if (filters.tags) {
        const ticketTags = ticket.tags?.split(',').map(tag => tag.trim()) || [];
        if (!ticketTags.includes(filters.tags)) return false;
      }

      // Filtros de data
      if (filters.dataInicio) {
        const dataInicio = new Date(filters.dataInicio);
        if (ticket.dataAbertura < dataInicio) return false;
      }
      
      if (filters.dataFim) {
        const dataFim = new Date(filters.dataFim);
        dataFim.setHours(23, 59, 59, 999); // Incluir o dia todo
        if (ticket.dataAbertura > dataFim) return false;
      }

      return true;
    });

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Obter valores para comparação
      if (sortConfig.key === 'departamento.nome') {
        aValue = a.departamento?.nome || '';
        bValue = b.departamento?.nome || '';
      } else if (sortConfig.key === 'responsavel.nome') {
        aValue = a.responsavel?.nome || '';
        bValue = b.responsavel?.nome || '';
      } else {
        aValue = a[sortConfig.key as keyof HelpdeskTicket];
        bValue = b[sortConfig.key as keyof HelpdeskTicket];
      }

      // Converter datas para timestamp
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();

      // Comparar valores
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [tickets, filters, sortConfig]);

  // Função para alterar ordenação
  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  // Função para exportar dados
  const handleExport = () => {
    if (onExportData) {
      onExportData(filteredAndSortedTickets);
    }
  };

  // Renderizar badge de status
  const renderStatusBadge = (status: HelpdeskTicket['status']) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Renderizar badge de prioridade
  const renderPrioridadeBadge = (prioridade: HelpdeskTicket['prioridade']) => {
    const config = PRIORIDADE_CONFIG[prioridade];
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tickets de Suporte
            </CardTitle>
            <CardDescription>
              {filteredAndSortedTickets.length} de {tickets.length} tickets
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
            
            {onExportData && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
            
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            )}
          </div>
        </div>

        {/* Painel de Filtros */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* Busca geral */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número, assunto, solicitante..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-sm font-medium mb-1 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div>
              <label className="text-sm font-medium mb-1 block">Prioridade</label>
              <Select
                value={filters.prioridade}
                onValueChange={(value) => setFilters(prev => ({ ...prev, prioridade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {Object.entries(PRIORIDADE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Departamento */}
            <div>
              <label className="text-sm font-medium mb-1 block">Departamento</label>
              <Select
                value={filters.departamento}
                onValueChange={(value) => setFilters(prev => ({ ...prev, departamento: value || '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  {filterOptions.departamentos.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select
                value={filters.categoria}
                onValueChange={(value) => setFilters(prev => ({ ...prev, categoria: value || '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {filterOptions.categorias.map(cat => (
                    <SelectItem key={cat || 'empty'} value={cat || ''}>
                      {cat || 'Sem categoria'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data Início */}
            <div>
              <label className="text-sm font-medium mb-1 block">Data Início</label>
              <Input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters(prev => ({ ...prev, dataInicio: e.target.value }))}
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="text-sm font-medium mb-1 block">Data Fim</label>
              <Input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters(prev => ({ ...prev, dataFim: e.target.value }))}
              />
            </div>

            {/* Botão Limpar */}
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('numero')}
                >
                  <div className="flex items-center gap-1">
                    Número
                    {sortConfig.key === 'numero' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('assunto')}
                >
                  <div className="flex items-center gap-1">
                    Assunto
                    {sortConfig.key === 'assunto' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('solicitanteNome')}
                >
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Solicitante
                    {sortConfig.key === 'solicitanteNome' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('departamento.nome')}
                >
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Departamento
                    {sortConfig.key === 'departamento.nome' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('prioridade')}
                >
                  <div className="flex items-center gap-1">
                    Prioridade
                    {sortConfig.key === 'prioridade' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    Status
                    {sortConfig.key === 'status' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                
                <TableHead 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('dataAbertura')}
                >
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Criado em
                    {sortConfig.key === 'dataAbertura' && (
                      <span className="text-xs">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </TableHead>
                
                <TableHead className="w-[50px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Carregando tickets...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {!permissions.canViewTickets
                      ? 'Você não tem permissão para visualizar tickets'
                      : tickets.length === 0 
                        ? 'Nenhum ticket encontrado'
                        : 'Nenhum ticket corresponde aos filtros aplicados'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedTickets.map((ticket, index) => (
                  <TableRow 
                    key={ticket.id} 
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <TableCell className="font-medium">
                      #{ticket.numero}
                    </TableCell>
                    
                    <TableCell className="max-w-[300px]">
                      <div className="truncate" title={ticket.assunto}>
                        {ticket.assunto}
                      </div>
                      {ticket.categoria && (
                        <div className="text-xs text-gray-500 mt-1">
                          {ticket.categoria}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.solicitanteNome || '-'}</div>
                        <div className="text-sm text-gray-500">{ticket.solicitanteEmail || '-'}</div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {ticket.departamento?.nome || '-'}
                    </TableCell>
                    
                    <TableCell>
                      {renderPrioridadeBadge(ticket.prioridade)}
                    </TableCell>
                    
                    <TableCell>
                      {renderStatusBadge(ticket.status)}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm">
                        {formatSafeDate(ticket.dataAbertura, 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatSafeDate(ticket.dataAbertura, 'HH:mm')}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          {onViewTicket && permissions.canViewTickets && (
                            <DropdownMenuItem onClick={() => onViewTicket(ticket)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Acessar Chamado
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
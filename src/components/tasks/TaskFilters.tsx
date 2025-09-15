'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TaskFilters as TaskFiltersType } from '@/hooks/useTasks';

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  clientes: any[];
  colaboradores: any[];
  negocios: any[];
  onClearFilters: () => void;
}

export function TaskFilters({
  filters,
  onFiltersChange,
  clientes,
  colaboradores,
  negocios,
  onClearFilters
}: TaskFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState<string | null>(null);

  const updateFilter = (key: keyof TaskFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return value && value.trim() !== '';
      return value !== undefined && value !== null && value !== '';
    });
  };

  const getActiveFiltersCount = () => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'search') return value && value.trim() !== '';
      return value !== undefined && value !== null && value !== '';
    }).length;
  };

  const formatDateForDisplay = (date: string | undefined) => {
    if (!date) return 'Selecionar data';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleDateSelect = (field: string, date: Date | undefined) => {
    if (date) {
      updateFilter(field as keyof TaskFiltersType, format(date, 'yyyy-MM-dd'));
    } else {
      updateFilter(field as keyof TaskFiltersType, undefined);
    }
    setDatePickerOpen(null);
  };

  const clearFilter = (key: keyof TaskFiltersType) => {
    updateFilter(key, undefined);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
            {hasActiveFilters() && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Recolher' : 'Expandir'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Busca - sempre visível */}
        <div>
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar por título ou descrição..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
          />
        </div>

        {/* Filtros básicos - sempre visíveis */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status || ''}
              onValueChange={(value) => updateFilter('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            {filters.status && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 mt-1"
                onClick={() => clearFilter('status')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div>
            <Label htmlFor="prioridade">Prioridade</Label>
            <Select
              value={filters.prioridade || ''}
              onValueChange={(value) => updateFilter('prioridade', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
            {filters.prioridade && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 mt-1"
                onClick={() => clearFilter('prioridade')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div>
            <Label htmlFor="responsavelId">Responsável</Label>
            <Select
              value={filters.responsavelId?.toString() || ''}
              onValueChange={(value) => updateFilter('responsavelId', value === 'all' ? undefined : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {colaboradores.map((colaborador) => (
                  <SelectItem key={colaborador.id} value={colaborador.id.toString()}>
                    {colaborador.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.responsavelId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 mt-1"
                onClick={() => clearFilter('responsavelId')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div>
            <Label htmlFor="clienteId">Cliente</Label>
            <Select
              value={filters.clienteId?.toString() || ''}
              onValueChange={(value) => updateFilter('clienteId', value === 'all' ? undefined : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filters.clienteId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 mt-1"
                onClick={() => clearFilter('clienteId')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros avançados - mostrados quando expandido */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="negocioId">Negócio</Label>
                <Select
                  value={filters.negocioId?.toString() || ''}
                  onValueChange={(value) => updateFilter('negocioId', value === 'all' ? undefined : Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {negocios.map((negocio) => (
                      <SelectItem key={negocio.id} value={negocio.id.toString()}>
                        {negocio.titulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filters.negocioId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 mt-1"
                    onClick={() => clearFilter('negocioId')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              <div className="col-span-2">
                {/* Espaço reservado para futuras funcionalidades */}
              </div>
            </div>

            {/* Filtros de data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Data de Vencimento - Início</Label>
                <div className="flex gap-2">
                  <Popover
                    open={datePickerOpen === 'dataVencimentoInicio'}
                    onOpenChange={(open) => setDatePickerOpen(open ? 'dataVencimentoInicio' : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.dataVencimentoInicio && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateForDisplay(filters.dataVencimentoInicio)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dataVencimentoInicio ? new Date(filters.dataVencimentoInicio) : undefined}
                        onSelect={(date) => handleDateSelect('dataVencimentoInicio', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {filters.dataVencimentoInicio && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearFilter('dataVencimentoInicio')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label>Data de Vencimento - Fim</Label>
                <div className="flex gap-2">
                  <Popover
                    open={datePickerOpen === 'dataVencimentoFim'}
                    onOpenChange={(open) => setDatePickerOpen(open ? 'dataVencimentoFim' : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !filters.dataVencimentoFim && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDateForDisplay(filters.dataVencimentoFim)}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dataVencimentoFim ? new Date(filters.dataVencimentoFim) : undefined}
                        onSelect={(date) => handleDateSelect('dataVencimentoFim', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {filters.dataVencimentoFim && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => clearFilter('dataVencimentoFim')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Espaço para futuras funcionalidades de ordenação */}
          </div>
        )}

        {/* Resumo dos filtros ativos */}
        {hasActiveFilters() && (
          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {Object.entries(filters).map(([key, value]) => {
                if (!value || (typeof value === 'string' && value.trim() === '')) return null;
                
                const labels: Record<string, string> = {
                  search: 'Busca',
                  status: 'Status',
                  prioridade: 'Prioridade',
                  responsavelId: 'Responsável',
                  clienteId: 'Cliente',
                  negocioId: 'Negócio',
                  dataVencimentoInicio: 'Vencimento início',
                  dataVencimentoFim: 'Vencimento fim'
                };

                let displayValue = value.toString();
                
                // Formatação especial para alguns campos
                if (key === 'responsavelId') {
                  const colaborador = colaboradores.find(c => c.id === Number(value));
                  displayValue = colaborador?.nome || value.toString();
                } else if (key === 'clienteId') {
                  const cliente = clientes.find(c => c.id === Number(value));
                  displayValue = cliente?.nome || value.toString();
                } else if (key === 'negocioId') {
                  const negocio = negocios.find(n => n.id === Number(value));
                  displayValue = negocio?.titulo || value.toString();
                } else if (key === 'dataVencimentoInicio' || key === 'dataVencimentoFim') {
                  displayValue = formatDateForDisplay(value.toString());
                }

                return (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {labels[key]}: {displayValue}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => clearFilter(key as keyof TaskFiltersType)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
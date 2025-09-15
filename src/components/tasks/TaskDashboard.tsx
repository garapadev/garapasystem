'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTaskDashboard, TaskFilters } from '@/hooks/useTaskDashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description?: string;
}

function MetricCard({ title, value, icon, color, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`h-4 w-4 ${color}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface PriorityChartProps {
  data: {
    baixa: number;
    media: number;
    alta: number;
    urgente: number;
  };
}

function PriorityChart({ data }: PriorityChartProps) {
  const total = data.baixa + data.media + data.alta + data.urgente;
  
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Nenhuma tarefa encontrada
      </div>
    );
  }

  const priorities = [
    { name: 'Baixa', value: data.baixa, color: 'bg-green-500' },
    { name: 'Média', value: data.media, color: 'bg-yellow-500' },
    { name: 'Alta', value: data.alta, color: 'bg-orange-500' },
    { name: 'Urgente', value: data.urgente, color: 'bg-red-500' }
  ];

  return (
    <div className="space-y-3">
      {priorities.map((priority) => {
        const percentage = total > 0 ? (priority.value / total) * 100 : 0;
        return (
          <div key={priority.name} className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 min-w-[80px]">
              <div className={`w-3 h-3 rounded-full ${priority.color}`} />
              <span className="text-sm">{priority.name}</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${priority.color}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm font-medium min-w-[40px] text-right">
              {priority.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface WeeklyTrendProps {
  data: Array<{
    semana: string;
    criadas: number;
    concluidas: number;
  }>;
}

function WeeklyTrend({ data }: WeeklyTrendProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.flatMap(item => [item.criadas, item.concluidas])
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Criadas</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Concluídas</span>
        </div>
      </div>
      
      <div className="grid grid-cols-8 gap-2 h-32">
        {data.map((item, index) => {
          const criadasHeight = maxValue > 0 ? (item.criadas / maxValue) * 100 : 0;
          const concluidasHeight = maxValue > 0 ? (item.concluidas / maxValue) * 100 : 0;
          
          return (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div className="flex-1 flex flex-col justify-end space-y-1 w-full">
                <div
                  className="bg-blue-500 rounded-t"
                  style={{ height: `${criadasHeight}%`, minHeight: item.criadas > 0 ? '2px' : '0' }}
                  title={`Criadas: ${item.criadas}`}
                />
                <div
                  className="bg-green-500 rounded-t"
                  style={{ height: `${concluidasHeight}%`, minHeight: item.concluidas > 0 ? '2px' : '0' }}
                  title={`Concluídas: ${item.concluidas}`}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {item.semana}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TaskDashboard() {
  const {
    metrics,
    report,
    responsaveis,
    clientes,
    loading,
    error,
    loadMetrics,
    loadReport,
    exportToCsv
  } = useTaskDashboard();

  const [filters, setFilters] = useState<TaskFilters>({
    dataInicio: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    dataFim: format(new Date(), 'yyyy-MM-dd')
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadMetrics(filters);
  }, []);

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    loadMetrics(filters);
  };

  const loadReportData = () => {
    loadReport(filters);
  };

  const handleExport = () => {
    if (report.length > 0) {
      const filename = `relatorio-tarefas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      exportToCsv(report, filename);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-yellow-100 text-yellow-800';
      case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-800';
      case 'CONCLUIDA': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'BAIXA': return 'bg-green-100 text-green-800';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800';
      case 'ALTA': return 'bg-orange-100 text-orange-800';
      case 'URGENTE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Tarefas</h1>
          <p className="text-muted-foreground">
            Métricas e relatórios das tarefas do sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={applyFilters}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Configure os filtros para personalizar as métricas e relatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filters.dataInicio || ''}
                  onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataFim">Data Fim</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filters.dataFim || ''}
                  onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Select
                  value={filters.responsavelId || ''}
                  onValueChange={(value) => handleFilterChange('responsavelId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {responsaveis.map((responsavel) => (
                      <SelectItem key={responsavel.id} value={responsavel.id}>
                        {responsavel.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select
                  value={filters.clienteId || ''}
                  onValueChange={(value) => handleFilterChange('clienteId', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button onClick={applyFilters} disabled={loading}>
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principais */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard
            title="Total de Tarefas"
            value={metrics.total}
            icon={<BarChart3 />}
            color="text-blue-600"
          />
          
          <MetricCard
            title="Pendentes"
            value={metrics.pendentes}
            icon={<Clock />}
            color="text-yellow-600"
          />
          
          <MetricCard
            title="Em Andamento"
            value={metrics.emAndamento}
            icon={<TrendingUp />}
            color="text-blue-600"
          />
          
          <MetricCard
            title="Concluídas"
            value={metrics.concluidas}
            icon={<CheckCircle />}
            color="text-green-600"
          />
          
          <MetricCard
            title="Atrasadas"
            value={metrics.atrasadas}
            icon={<AlertTriangle />}
            color="text-red-600"
          />
        </div>
      )}

      {/* Gráficos e tabelas */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="report">Relatório</TabsTrigger>
        </TabsList>
        
        <TabsContent value="charts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de prioridades */}
            <Card>
              <CardHeader>
                <CardTitle>Tarefas por Prioridade</CardTitle>
                <CardDescription>
                  Distribuição das tarefas por nível de prioridade
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <PriorityChart data={metrics.porPrioridade} />
                )}
              </CardContent>
            </Card>
            
            {/* Tendência semanal */}
            <Card>
              <CardHeader>
                <CardTitle>Tendência Semanal</CardTitle>
                <CardDescription>
                  Tarefas criadas vs concluídas nas últimas 8 semanas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {metrics && (
                  <WeeklyTrend data={metrics.tendenciaSemanal} />
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Responsáveis */}
          {metrics && metrics.porResponsavel.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance por Responsável</CardTitle>
                <CardDescription>
                  Estatísticas de tarefas por responsável
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.porResponsavel.map((responsavel, index) => {
                    const completionRate = responsavel.total > 0 
                      ? (responsavel.concluidas / responsavel.total) * 100 
                      : 0;
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{responsavel.responsavel}</p>
                            <p className="text-sm text-muted-foreground">
                              {responsavel.total} tarefas total
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {responsavel.concluidas} concluídas
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {responsavel.pendentes} pendentes
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {completionRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Taxa de conclusão
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Relatório Detalhado</CardTitle>
                  <CardDescription>
                    Lista completa de tarefas com filtros aplicados
                  </CardDescription>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadReportData}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Carregar
                  </Button>
                  
                  {report.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {report.length > 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {report.length} tarefa(s) encontrada(s)
                  </p>
                  
                  <div className="space-y-2">
                    {report.map((task) => (
                      <div key={task.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{task.titulo}</h4>
                            {task.descricao && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {task.descricao}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(task.prioridade)}>
                              {task.prioridade}
                            </Badge>
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Responsável:</span>
                            <p className="font-medium">{task.responsavel.nome}</p>
                          </div>
                          
                          {task.cliente && (
                            <div>
                              <span className="text-muted-foreground">Cliente:</span>
                              <p className="font-medium">{task.cliente.nome}</p>
                            </div>
                          )}
                          
                          <div>
                            <span className="text-muted-foreground">Vencimento:</span>
                            <p className="font-medium">
                              {format(new Date(task.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-muted-foreground">Criado em:</span>
                            <p className="font-medium">
                              {format(new Date(task.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  Clique em "Carregar" para visualizar o relatório
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Filter,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target,
} from 'lucide-react';
import { useTaskCalendar, CalendarEvent, CalendarFilters, DayTask } from '@/hooks/useTaskCalendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import 'react-day-picker/dist/style.css';



interface TaskCalendarProps {
  responsaveis?: Array<{ id: string; nome: string }>;
  clientes?: Array<{ id: string; nome: string }>;
}

const statusColors = {
  PENDENTE: 'secondary',
  EM_ANDAMENTO: 'default',
  CONCLUIDA: 'secondary',
  CANCELADA: 'destructive',
} as const;

const prioridadeColors = {
  BAIXA: 'secondary',
  MEDIA: 'secondary',
  ALTA: 'destructive',
  URGENTE: 'destructive',
} as const;

export default function TaskCalendar({ responsaveis = [], clientes = [] }: TaskCalendarProps) {
  const {
    events,
    dayTasks,
    statistics,
    loading,
    error,
    loadCalendarEvents,
    loadDayTasks,
    loadCalendarStatistics,
    updateTaskDates,
  } = useTaskCalendar();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  // Carregar eventos quando a data ou filtros mudarem
  useEffect(() => {
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    loadCalendarEvents(startDate, endDate, filters);
  }, [currentDate, filters, loadCalendarEvents]);

  // Carregar estatísticas quando solicitado
  useEffect(() => {
    if (showStatistics) {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      loadCalendarStatistics(startDate, endDate);
    }
  }, [showStatistics, currentDate, loadCalendarStatistics]);

  const handleSelectDay = (day: Date) => {
    setSelectedDate(day);
    loadDayTasks(day, filters);
    setIsDayModalOpen(true);
  };

  const handleShowStatistics = () => {
    setShowStatistics(true);
    setIsStatsModalOpen(true);
  };

  // Função para verificar se uma data tem eventos
  const hasEvents = (date: Date) => {
    return events.some(event => isSameDay(event.start, date));
  };

  // Função para obter eventos de uma data específica
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.start, date));
  };



  const getTaskTypeIcon = (type: DayTask['type']) => {
    switch (type) {
      case 'start':
        return <Target className="w-4 h-4" />;
      case 'deadline':
        return <Clock className="w-4 h-4" />;
      case 'both':
        return <CalendarIcon className="w-4 h-4" />;
    }
  };

  const getTaskTypeLabel = (type: DayTask['type']) => {
    switch (type) {
      case 'start':
        return 'Início';
      case 'deadline':
        return 'Vencimento';
      case 'both':
        return 'Início e Vencimento';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            <CardTitle>Calendário de Tarefas</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleShowStatistics}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Estatísticas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <Select
              value={filters.clienteId || ''}
              onValueChange={(value) => {
                setFilters(prev => ({ ...prev, clienteId: value || undefined }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.responsavelId || ''}
              onValueChange={(value) => {
                setFilters(prev => ({ ...prev, responsavelId: value === 'all' ? undefined : value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os responsáveis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {responsaveis.map((responsavel) => (
                  <SelectItem key={responsavel.id} value={responsavel.id}>
                    {responsavel.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.status || ''}
              onValueChange={(value) => {
                setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.prioridade || ''}
              onValueChange={(value) => {
                setFilters(prev => ({ ...prev, prioridade: value === 'all' ? undefined : value }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <DayPicker
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => date && handleSelectDay(date)}
                month={currentDate}
                onMonthChange={setCurrentDate}
                locale={ptBR}
                className="mx-auto"
                modifiers={{
                  hasEvents: (date) => hasEvents(date),
                }}
                modifiersStyles={{
                  hasEvents: {
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '50%',
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Lista de eventos do mês */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Eventos do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  Nenhum evento neste mês.
                </p>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSelectDay(event.start)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <p className="text-xs text-gray-500">
                          {format(event.start, 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-600">
                          {event.task.cliente.nome}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant={statusColors[event.task.status as keyof typeof statusColors]}
                          className="text-xs"
                        >
                          {event.task.status.replace('_', ' ')}
                        </Badge>
                        <Badge
                          variant={prioridadeColors[event.task.prioridade as keyof typeof prioridadeColors]}
                          className="text-xs"
                        >
                          {event.task.prioridade}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Tarefas do Dia */}
      <Dialog open={isDayModalOpen} onOpenChange={setIsDayModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              <span>
                Tarefas de {selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {dayTasks.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma tarefa encontrada para este dia.
              </p>
            ) : (
              <div className="space-y-4">
                {dayTasks.map((task) => (
                  <Card key={task.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTaskTypeIcon(task.type)}
                            <h4 className="font-semibold">{task.titulo}</h4>
                            <Badge variant="outline">
                              {getTaskTypeLabel(task.type)}
                            </Badge>
                          </div>
                          {task.descricao && (
                            <p className="text-sm text-gray-600 mb-2">{task.descricao}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Cliente: {task.cliente.nome}</span>
                            <span>Responsável: {task.responsavel.nome}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge
                            variant={statusColors[task.status as keyof typeof statusColors]}
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant={prioridadeColors[task.prioridade as keyof typeof prioridadeColors]}
                          >
                            {task.prioridade}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Estatísticas */}
      <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Estatísticas do Calendário</span>
            </DialogTitle>
          </DialogHeader>
          {statistics ? (
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="text-center p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <span className="font-semibold">Com Vencimento</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-500">
                    {statistics.tasksWithDeadlines}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <span className="font-semibold">Com Início</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">
                    {statistics.tasksWithStartDates}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold">Atrasadas</span>
                  </div>
                  <p className="text-2xl font-bold text-red-500">
                    {statistics.overdueTasks}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold">Concluídas</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-500">
                    {statistics.completedTasks}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
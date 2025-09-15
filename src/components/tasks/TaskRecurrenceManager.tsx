'use client';

import React, { useState } from 'react';
import { useTaskRecurrence, TaskTemplate, RecurrencePattern } from '@/hooks/useTaskRecurrence';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, ClockIcon, PlayIcon, PauseIcon, TrashIcon, PlusIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskRecurrenceManagerProps {
  colaboradores?: Array<{ id: string; nome: string }>;
  clientes?: Array<{ id: string; nome: string }>;
  oportunidades?: Array<{ id: string; titulo: string }>;
}

export function TaskRecurrenceManager({ 
  colaboradores = [], 
  clientes = [], 
  oportunidades = [] 
}: TaskRecurrenceManagerProps) {
  const {
    recurrences,
    stats,
    loading,
    error,
    createRecurrence,
    toggleRecurrence,
    deleteRecurrence,
    processRecurrences,
  } = useTaskRecurrence();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<Partial<TaskTemplate>>({
    titulo: '',
    descricao: '',
    prioridade: 'MEDIA',
    tempoEstimado: undefined,
    responsavelId: '',
    clienteId: '',
    oportunidadeId: '',
    pattern: {
      type: 'DIARIA',
      interval: 1,
      daysOfWeek: [],
      dayOfMonth: undefined,
      endDate: undefined,
      maxOccurrences: undefined,
    }
  });

  const handleCreateRecurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.responsavelId || !formData.pattern) {
      return;
    }

    try {
      await createRecurrence(formData as TaskTemplate);
      setShowCreateDialog(false);
      setFormData({
        titulo: '',
        descricao: '',
        prioridade: 'MEDIA',
        tempoEstimado: undefined,
        responsavelId: '',
        clienteId: '',
        oportunidadeId: '',
        pattern: {
          type: 'DIARIA',
          interval: 1,
          daysOfWeek: [],
          dayOfMonth: undefined,
          endDate: undefined,
          maxOccurrences: undefined,
        }
      });
    } catch (error) {
      console.error('Erro ao criar recorrência:', error);
    }
  };

  const handleToggleRecurrence = async (id: string, active: boolean) => {
    try {
      await toggleRecurrence(id, active);
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeleteRecurrence = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta recorrência?')) {
      try {
        await deleteRecurrence(id);
      } catch (error) {
        console.error('Erro ao excluir recorrência:', error);
      }
    }
  };

  const handleProcessRecurrences = async () => {
    try {
      const result = await processRecurrences();
      alert(`Processamento concluído! ${result.tasksCreated} tarefas criadas.`);
    } catch (error) {
      console.error('Erro ao processar recorrências:', error);
    }
  };

  const formatRecurrenceType = (type: string) => {
    const types = {
      'DIARIA': 'Diária',
      'SEMANAL': 'Semanal',
      'MENSAL': 'Mensal',
      'ANUAL': 'Anual'
    };
    return types[type as keyof typeof types] || type;
  };

  const formatPriority = (priority: string) => {
    const priorities = {
      'BAIXA': 'Baixa',
      'MEDIA': 'Média',
      'ALTA': 'Alta',
      'URGENTE': 'Urgente'
    };
    return priorities[priority as keyof typeof priorities] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'BAIXA': 'bg-green-100 text-green-800',
      'MEDIA': 'bg-yellow-100 text-yellow-800',
      'ALTA': 'bg-orange-100 text-orange-800',
      'URGENTE': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const weekDays = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' }
  ];

  if (loading && recurrences.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando tarefas recorrentes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tarefas Recorrentes</h2>
          <p className="text-gray-600">Gerencie tarefas que se repetem automaticamente</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleProcessRecurrences} disabled={loading}>
            <PlayIcon className="h-4 w-4 mr-2" />
            Processar Agora
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nova Recorrência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Tarefa Recorrente</DialogTitle>
                <DialogDescription>
                  Configure uma tarefa que será criada automaticamente de acordo com o padrão definido.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateRecurrence} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                      placeholder="Digite o título da tarefa"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição da tarefa"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select
                      value={formData.prioridade}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, prioridade: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAIXA">Baixa</SelectItem>
                        <SelectItem value="MEDIA">Média</SelectItem>
                        <SelectItem value="ALTA">Alta</SelectItem>
                        <SelectItem value="URGENTE">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tempoEstimado">Tempo Estimado (min)</Label>
                    <Input
                      id="tempoEstimado"
                      type="number"
                      value={formData.tempoEstimado || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        tempoEstimado: e.target.value ? parseInt(e.target.value) : undefined 
                      }))}
                      placeholder="60"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="responsavel">Responsável *</Label>
                    <Select
                      value={formData.responsavelId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, responsavelId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        {colaboradores.map((colaborador) => (
                          <SelectItem key={colaborador.id} value={colaborador.id}>
                            {colaborador.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="cliente">Cliente</Label>
                    <Select
                      value={formData.clienteId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, clienteId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Configuração de Recorrência */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Configuração de Recorrência</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recurrenceType">Tipo de Recorrência</Label>
                      <Select
                        value={formData.pattern?.type}
                        onValueChange={(value) => setFormData(prev => ({
                          ...prev,
                          pattern: { ...prev.pattern!, type: value as any }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DIARIA">Diária</SelectItem>
                          <SelectItem value="SEMANAL">Semanal</SelectItem>
                          <SelectItem value="MENSAL">Mensal</SelectItem>
                          <SelectItem value="ANUAL">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="interval">Intervalo</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        value={formData.pattern?.interval || 1}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pattern: { ...prev.pattern!, interval: parseInt(e.target.value) || 1 }
                        }))}
                      />
                    </div>
                  </div>
                  
                  {formData.pattern?.type === 'SEMANAL' && (
                    <div className="mt-4">
                      <Label>Dias da Semana</Label>
                      <div className="flex gap-2 mt-2">
                        {weekDays.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={formData.pattern?.daysOfWeek?.includes(day.value) || false}
                              onCheckedChange={(checked) => {
                                const currentDays = formData.pattern?.daysOfWeek || [];
                                const newDays = checked
                                  ? [...currentDays, day.value]
                                  : currentDays.filter(d => d !== day.value);
                                setFormData(prev => ({
                                  ...prev,
                                  pattern: { ...prev.pattern!, daysOfWeek: newDays }
                                }));
                              }}
                            />
                            <Label htmlFor={`day-${day.value}`} className="text-sm">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {formData.pattern?.type === 'MENSAL' && (
                    <div className="mt-4">
                      <Label htmlFor="dayOfMonth">Dia do Mês</Label>
                      <Input
                        id="dayOfMonth"
                        type="number"
                        min="1"
                        max="31"
                        value={formData.pattern?.dayOfMonth || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pattern: { 
                            ...prev.pattern!, 
                            dayOfMonth: e.target.value ? parseInt(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Dia do mês (1-31)"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="maxOccurrences">Máximo de Ocorrências</Label>
                      <Input
                        id="maxOccurrences"
                        type="number"
                        min="1"
                        value={formData.pattern?.maxOccurrences || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pattern: { 
                            ...prev.pattern!, 
                            maxOccurrences: e.target.value ? parseInt(e.target.value) : undefined 
                          }
                        }))}
                        placeholder="Deixe vazio para ilimitado"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="endDate">Data de Fim</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={formData.pattern?.endDate ? format(formData.pattern.endDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pattern: { 
                            ...prev.pattern!, 
                            endDate: e.target.value ? new Date(e.target.value) : undefined 
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Criar Recorrência
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Recorrências</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecurrences}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeRecurrences}</p>
                </div>
                <PlayIcon className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tarefas Criadas</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.totalTasksCreated}</p>
                </div>
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Próximas Execuções</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.nextExecutions}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Recorrências */}
      <div className="space-y-4">
        {recurrences.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma tarefa recorrente</h3>
              <p className="text-gray-600 mb-4">Crie sua primeira tarefa recorrente para automatizar processos repetitivos.</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Criar Primeira Recorrência
              </Button>
            </CardContent>
          </Card>
        ) : (
          recurrences.map((recurrence) => (
            <Card key={recurrence.id} className={`${!recurrence.ativo ? 'opacity-60' : ''}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <CardTitle className="text-lg">
                        Recorrência {formatRecurrenceType(recurrence.tipo)}
                      </CardTitle>
                      <CardDescription>
                        A cada {recurrence.intervalo} {recurrence.tipo.toLowerCase()}
                        {recurrence.proximaExecucao && (
                          <span className="ml-2">
                            • Próxima: {format(new Date(recurrence.proximaExecucao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={recurrence.ativo ? 'default' : 'secondary'}>
                      {recurrence.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                    
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={recurrence.ativo}
                        onCheckedChange={(checked) => handleToggleRecurrence(recurrence.id, checked)}
                        disabled={loading}
                      />
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecurrence(recurrence.id)}
                        disabled={loading}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Configuração</p>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Tipo:</span> {formatRecurrenceType(recurrence.tipo)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Intervalo:</span> {recurrence.intervalo}
                      </p>
                      {recurrence.diasSemana && (
                        <p className="text-sm">
                          <span className="font-medium">Dias:</span> {JSON.parse(recurrence.diasSemana).join(', ')}
                        </p>
                      )}
                      {recurrence.diaMes && (
                        <p className="text-sm">
                          <span className="font-medium">Dia do mês:</span> {recurrence.diaMes}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Limites</p>
                    <div className="space-y-1">
                      {recurrence.maxOcorrencias && (
                        <p className="text-sm">
                          <span className="font-medium">Máx. ocorrências:</span> {recurrence.maxOcorrencias}
                        </p>
                      )}
                      {recurrence.dataFim && (
                        <p className="text-sm">
                          <span className="font-medium">Data fim:</span> {format(new Date(recurrence.dataFim), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Estatísticas</p>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Tarefas criadas:</span> {recurrence.tasks?.length || 0}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Criado em:</span> {format(new Date(recurrence.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
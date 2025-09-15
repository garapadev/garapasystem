'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CreateTaskData, UpdateTaskData } from '@/hooks/useTasks';

interface TaskFormProps {
  task?: any;
  onSubmit: (data: CreateTaskData | UpdateTaskData) => void;
  onCancel: () => void;
  clientes: any[];
  colaboradores: any[];
  negocios: any[];
  isEditing?: boolean;
}

export function TaskForm({
  task,
  onSubmit,
  onCancel,
  clientes,
  colaboradores,
  negocios,
  isEditing = false
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    status: 'PENDENTE',
    prioridade: 'MEDIA',
    dataVencimento: '',
    dataInicio: '',
    dataConclusao: '',
    estimativaHoras: '',
    horasGastas: '',
    responsavelId: '',
    clienteId: '',
    negocioId: '',
    recorrencia: {
      enabled: false,
      tipo: 'SEMANAL',
      intervalo: 1,
      diasSemana: [] as string[],
      diaMes: 1
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        titulo: task.titulo || '',
        descricao: task.descricao || '',
        status: task.status || 'PENDENTE',
        prioridade: task.prioridade || 'MEDIA',
        dataVencimento: task.dataVencimento ? task.dataVencimento.split('T')[0] : '',
        dataInicio: task.dataInicio ? task.dataInicio.split('T')[0] : '',
        dataConclusao: task.dataConclusao ? task.dataConclusao.split('T')[0] : '',
        estimativaHoras: task.estimativaHoras?.toString() || '',
        horasGastas: task.horasGastas?.toString() || '',
        responsavelId: task.responsavel?.id || '',
        clienteId: task.cliente?.id || '',
        negocioId: task.oportunidade?.id || '',
        recorrencia: {
          enabled: !!task.recorrencia,
          tipo: task.recorrencia?.tipo || 'SEMANAL',
          intervalo: task.recorrencia?.intervalo || 1,
          diasSemana: task.recorrencia?.diasSemana || [],
          diaMes: task.recorrencia?.diaMes || 1
        }
      });
    }
  }, [task]);

  // Verificar validade do formulário em tempo real
  useEffect(() => {
    const isValid = checkFormValidity();
    setIsFormValid(isValid);
  }, [formData, isEditing]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validação do título (obrigatório)
    if (!formData.titulo.trim()) {
      newErrors.titulo = 'obrigatório*';
    } else if (formData.titulo.trim().length < 3) {
      newErrors.titulo = 'Título deve ter pelo menos 3 caracteres';
    } else if (formData.titulo.trim().length > 200) {
      newErrors.titulo = 'Título deve ter no máximo 200 caracteres';
    }

    // Validação do responsável (obrigatório)
    if (!formData.responsavelId || formData.responsavelId === 'none') {
      newErrors.responsavelId = 'obrigatório*';
    }

    // Validação da data de vencimento (obrigatória)
    if (!formData.dataVencimento) {
      newErrors.dataVencimento = 'obrigatório*';
    }

    // Validação da descrição
    if (formData.descricao && formData.descricao.length > 2000) {
      newErrors.descricao = 'Descrição deve ter no máximo 2000 caracteres';
    }

    // Validação das datas
    if (formData.dataVencimento && formData.dataInicio) {
      const dataInicio = new Date(formData.dataInicio);
      const dataVencimento = new Date(formData.dataVencimento);
      
      if (dataVencimento < dataInicio) {
        newErrors.dataVencimento = 'Data de vencimento deve ser posterior à data de início';
      }
    }

    // Validação da data de conclusão (apenas para edição)
    if (isEditing && formData.dataConclusao) {
      const dataConclusao = new Date(formData.dataConclusao);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      
      if (dataConclusao > hoje) {
        newErrors.dataConclusao = 'Data de conclusão não pode ser futura';
      }
      
      if (formData.dataInicio) {
        const dataInicio = new Date(formData.dataInicio);
        if (dataConclusao < dataInicio) {
          newErrors.dataConclusao = 'Data de conclusão deve ser posterior à data de início';
        }
      }
    }

    // Validação da estimativa de horas
    if (formData.estimativaHoras) {
      const estimativa = Number(formData.estimativaHoras);
      if (isNaN(estimativa)) {
        newErrors.estimativaHoras = 'Estimativa deve ser um número válido';
      } else if (estimativa <= 0) {
        newErrors.estimativaHoras = 'Estimativa deve ser maior que zero';
      } else if (estimativa > 9999) {
        newErrors.estimativaHoras = 'Estimativa deve ser menor que 10.000 horas';
      }
    }

    // Validação das horas gastas (apenas para edição)
    if (isEditing && formData.horasGastas) {
      const horasGastas = Number(formData.horasGastas);
      if (isNaN(horasGastas)) {
        newErrors.horasGastas = 'Horas gastas deve ser um número válido';
      } else if (horasGastas < 0) {
        newErrors.horasGastas = 'Horas gastas não pode ser negativa';
      } else if (horasGastas > 9999) {
        newErrors.horasGastas = 'Horas gastas deve ser menor que 10.000 horas';
      }
      
      // Validar se horas gastas não excedem muito a estimativa
      if (formData.estimativaHoras && horasGastas > 0) {
        const estimativa = Number(formData.estimativaHoras);
        if (!isNaN(estimativa) && horasGastas > estimativa * 3) {
          newErrors.horasGastas = 'Horas gastas excedem significativamente a estimativa. Verifique os valores.';
        }
      }
    }

    // Validação da recorrência
    if (formData.recorrencia.enabled && !isEditing) {
      if (formData.recorrencia.tipo === 'SEMANAL' && formData.recorrencia.diasSemana.length === 0) {
        newErrors.diasSemana = 'Selecione pelo menos um dia da semana para recorrência semanal';
      }
      
      if (formData.recorrencia.intervalo < 1) {
        newErrors.intervalo = 'Intervalo deve ser pelo menos 1';
      }
      
      if (formData.recorrencia.tipo === 'MENSAL') {
        if (formData.recorrencia.diaMes < 1 || formData.recorrencia.diaMes > 31) {
          newErrors.diaMes = 'Dia do mês deve estar entre 1 e 31';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para verificar se o formulário está válido (sem mostrar erros)
  const checkFormValidity = () => {
    // Verificações básicas obrigatórias
    if (!formData.titulo.trim() || formData.titulo.trim().length < 3) {
      return false;
    }

    // Responsável é obrigatório
    if (!formData.responsavelId || formData.responsavelId === 'none') {
      return false;
    }

    // Data de vencimento é obrigatória
    if (!formData.dataVencimento) {
      return false;
    }

    // Verificar se há erros de validação
    const tempErrors: Record<string, string> = {};
    
    if (formData.dataVencimento && formData.dataInicio) {
      if (new Date(formData.dataVencimento) < new Date(formData.dataInicio)) {
        return false;
      }
    }
    
    if (formData.estimativaHoras && (isNaN(Number(formData.estimativaHoras)) || Number(formData.estimativaHoras) <= 0)) {
      return false;
    }
    
    if (isEditing && formData.horasGastas && (isNaN(Number(formData.horasGastas)) || Number(formData.horasGastas) < 0)) {
      return false;
    }
    
    if (formData.recorrencia.enabled && !isEditing) {
      if (formData.recorrencia.tipo === 'SEMANAL' && formData.recorrencia.diasSemana.length === 0) {
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('handleSubmit chamado');
    console.log('formData atual:', JSON.stringify(formData, null, 2));
    console.log('isSubmitting:', isSubmitting);
    
    // Prevenir múltiplas submissões
    if (isSubmitting) {
      console.log('Submissão bloqueada - já está enviando');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const isValid = validateForm();
      console.log('Formulário válido:', isValid);
      console.log('Erros de validação:', errors);
      
      if (!isValid) {
        console.log('Validação falhou, retornando');
        return;
      }

      const submitData: any = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao?.trim() || undefined,
        status: formData.status,
        prioridade: formData.prioridade,
        dataVencimento: formData.dataVencimento || undefined,
        dataInicio: formData.dataInicio || undefined,
        estimativaHoras: formData.estimativaHoras ? Number(formData.estimativaHoras) : undefined,
        responsavelId: formData.responsavelId && formData.responsavelId !== 'none' ? formData.responsavelId : undefined,
        clienteId: formData.clienteId && formData.clienteId !== 'none' ? Number(formData.clienteId) : undefined,
        negocioId: formData.negocioId && formData.negocioId !== 'none' ? Number(formData.negocioId) : undefined
      };

      console.log('=== DEBUG RESPONSAVEL ===');
      console.log('formData.responsavelId:', formData.responsavelId);
      console.log('submitData.responsavelId após criação:', submitData.responsavelId);
      console.log('=== FIM DEBUG ===');

      if (isEditing) {
        submitData.dataConclusao = formData.dataConclusao || undefined;
        submitData.horasGastas = formData.horasGastas ? Number(formData.horasGastas) : undefined;
      }

      if (formData.recorrencia.enabled && !isEditing) {
        submitData.recorrencia = {
          tipo: formData.recorrencia.tipo,
          intervalo: formData.recorrencia.intervalo,
          diasSemana: formData.recorrencia.tipo === 'SEMANAL' ? formData.recorrencia.diasSemana : undefined,
          diaMes: formData.recorrencia.tipo === 'MENSAL' ? formData.recorrencia.diaMes : undefined
        };
      }

      console.log('=== DEBUG RESPONSAVEL ===');
      console.log('formData.responsavelId:', formData.responsavelId);
      console.log('submitData antes do log:', submitData);
      console.log('Dados sendo enviados para onSubmit:', JSON.stringify(submitData, null, 2));
      console.log('=== FIM DEBUG ===');
      await onSubmit(submitData);
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      // O tratamento de erro específico será feito pelo componente pai
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validação em tempo real e remoção automática de erros quando corrigido
    const newErrors = { ...errors };
    
    if (field === 'titulo') {
      if (!value || !value.trim()) {
        newErrors.titulo = 'obrigatório*';
      } else if (value.trim().length < 3) {
        newErrors.titulo = 'Título deve ter pelo menos 3 caracteres';
      } else if (value.trim().length > 200) {
        newErrors.titulo = 'Título deve ter no máximo 200 caracteres';
      } else {
        delete newErrors.titulo;
      }
    }
    
    if (field === 'descricao') {
      if (value && value.length > 2000) {
        newErrors.descricao = 'Descrição deve ter no máximo 2000 caracteres';
      } else {
        delete newErrors.descricao;
      }
    }
    
    if (field === 'responsavelId') {
      if (!value || value === 'none') {
        newErrors.responsavelId = 'obrigatório*';
      } else {
        delete newErrors.responsavelId;
      }
    }
    
    if (field === 'dataVencimento') {
      if (!value) {
        newErrors.dataVencimento = 'obrigatório*';
      } else {
        delete newErrors.dataVencimento;
      }
    }
    
    if (field === 'estimativaHoras') {
      if (value && (isNaN(Number(value)) || Number(value) <= 0)) {
        newErrors.estimativaHoras = 'Estimativa deve ser um número maior que zero';
      } else if (value && Number(value) > 9999) {
        newErrors.estimativaHoras = 'Estimativa deve ser menor que 10.000 horas';
      } else {
        delete newErrors.estimativaHoras;
      }
    }
    
    if (field === 'horasGastas' && isEditing) {
      if (value && (isNaN(Number(value)) || Number(value) < 0)) {
        newErrors.horasGastas = 'Horas gastas deve ser um número não negativo';
      } else if (value && Number(value) > 9999) {
        newErrors.horasGastas = 'Horas gastas deve ser menor que 10.000 horas';
      } else {
        delete newErrors.horasGastas;
      }
    }
    
    setErrors(newErrors);
  };

  const handleRecurrenceChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      recorrencia: { ...prev.recorrencia, [field]: value }
    }));
  };

  const toggleDiaSemana = (dia: string) => {
    const diasSemana = formData.recorrencia.diasSemana;
    const newDias = diasSemana.includes(dia)
      ? diasSemana.filter(d => d !== dia)
      : [...diasSemana, dia];
    
    handleRecurrenceChange('diasSemana', newDias);
  };

  const diasSemanaOptions = [
    { value: 'DOMINGO', label: 'Dom' },
    { value: 'SEGUNDA', label: 'Seg' },
    { value: 'TERCA', label: 'Ter' },
    { value: 'QUARTA', label: 'Qua' },
    { value: 'QUINTA', label: 'Qui' },
    { value: 'SEXTA', label: 'Sex' },
    { value: 'SABADO', label: 'Sáb' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              placeholder="Digite o título da tarefa"
              className={errors.titulo ? 'border-red-500' : ''}
            />
            {errors.titulo && (
              <p className="text-sm text-red-500 mt-1">{errors.titulo}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => handleInputChange('descricao', e.target.value)}
              placeholder="Descreva a tarefa em detalhes"
              rows={3}
              className={errors.descricao ? 'border-red-500' : ''}
            />
            {errors.descricao && (
              <p className="text-sm text-red-500 mt-1">{errors.descricao}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                  <SelectItem value="CANCELADA">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={formData.prioridade} onValueChange={(value) => handleInputChange('prioridade', value)}>
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
          </div>
        </CardContent>
      </Card>

      {/* Datas e Tempo */}
      <Card>
        <CardHeader>
          <CardTitle>Datas e Tempo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={formData.dataInicio}
                onChange={(e) => handleInputChange('dataInicio', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={formData.dataVencimento}
                onChange={(e) => handleInputChange('dataVencimento', e.target.value)}
                className={errors.dataVencimento ? 'border-red-500' : ''}
              />
              {errors.dataVencimento && (
                <p className="text-sm text-red-500 mt-1">{errors.dataVencimento}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div>
              <Label htmlFor="dataConclusao">Data de Conclusão</Label>
              <Input
                id="dataConclusao"
                type="date"
                value={formData.dataConclusao}
                onChange={(e) => handleInputChange('dataConclusao', e.target.value)}
                className={errors.dataConclusao ? 'border-red-500' : ''}
              />
              {errors.dataConclusao && (
                <p className="text-sm text-red-500 mt-1">{errors.dataConclusao}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimativaHoras">Estimativa (horas)</Label>
              <Input
                id="estimativaHoras"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimativaHoras}
                onChange={(e) => handleInputChange('estimativaHoras', e.target.value)}
                placeholder="Ex: 8"
                className={errors.estimativaHoras ? 'border-red-500' : ''}
              />
              {errors.estimativaHoras && (
                <p className="text-sm text-red-500 mt-1">{errors.estimativaHoras}</p>
              )}
            </div>

            {isEditing && (
              <div>
                <Label htmlFor="horasGastas">Horas Gastas</Label>
                <Input
                  id="horasGastas"
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.horasGastas}
                  onChange={(e) => handleInputChange('horasGastas', e.target.value)}
                  placeholder="Ex: 6"
                  className={errors.horasGastas ? 'border-red-500' : ''}
                />
                {errors.horasGastas && (
                  <p className="text-sm text-red-500 mt-1">{errors.horasGastas}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Atribuições */}
      <Card>
        <CardHeader>
          <CardTitle>Atribuições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="responsavelId">Responsável *</Label>
            <Select value={formData.responsavelId} onValueChange={(value) => handleInputChange('responsavelId', value)}>
              <SelectTrigger className={errors.responsavelId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {colaboradores.map((colaborador) => (
                  <SelectItem key={colaborador.id} value={colaborador.id.toString()}>
                    {colaborador.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.responsavelId && (
              <p className="text-sm text-red-500 mt-1">{errors.responsavelId}</p>
            )}
          </div>

          <div>
            <Label htmlFor="clienteId">Cliente</Label>
            <Select value={formData.clienteId} onValueChange={(value) => handleInputChange('clienteId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="negocioId">Negócio</Label>
            <Select value={formData.negocioId} onValueChange={(value) => handleInputChange('negocioId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um negócio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {negocios.map((negocio) => (
                  <SelectItem key={negocio.id} value={negocio.id.toString()}>
                    {negocio.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Recorrência (apenas para criação) */}
      {!isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>Recorrência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recorrencia"
                checked={formData.recorrencia.enabled}
                onCheckedChange={(checked) => handleRecurrenceChange('enabled', checked)}
              />
              <Label htmlFor="recorrencia">Tarefa recorrente</Label>
            </div>

            {formData.recorrencia.enabled && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoRecorrencia">Tipo</Label>
                    <Select
                      value={formData.recorrencia.tipo}
                      onValueChange={(value) => handleRecurrenceChange('tipo', value)}
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
                    <Label htmlFor="intervalo">Intervalo</Label>
                    <Input
                      id="intervalo"
                      type="number"
                      min="1"
                      value={formData.recorrencia.intervalo}
                      onChange={(e) => handleRecurrenceChange('intervalo', Number(e.target.value))}
                      placeholder="Ex: 1"
                      className={errors.intervalo ? 'border-red-500' : ''}
                    />
                    {errors.intervalo && (
                      <p className="text-sm text-red-500 mt-1">{errors.intervalo}</p>
                    )}
                  </div>
                </div>

                {formData.recorrencia.tipo === 'SEMANAL' && (
                  <div>
                    <Label>Dias da Semana</Label>
                    <div className="flex gap-2 mt-2">
                      {diasSemanaOptions.map((dia) => (
                        <Button
                          key={dia.value}
                          type="button"
                          variant={formData.recorrencia.diasSemana.includes(dia.value) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleDiaSemana(dia.value)}
                        >
                          {dia.label}
                        </Button>
                      ))}
                    </div>
                    {errors.diasSemana && (
                      <p className="text-sm text-red-500 mt-1">{errors.diasSemana}</p>
                    )}
                  </div>
                )}

                {formData.recorrencia.tipo === 'MENSAL' && (
                      <div>
                        <Label htmlFor="diaMes">Dia do Mês</Label>
                        <Input
                          id="diaMes"
                          type="number"
                          min="1"
                          max="31"
                          value={formData.recorrencia.diaMes}
                          onChange={(e) => handleRecurrenceChange('diaMes', Number(e.target.value))}
                          placeholder="Ex: 15"
                          className={errors.diaMes ? 'border-red-500' : ''}
                        />
                        {errors.diaMes && (
                          <p className="text-sm text-red-500 mt-1">{errors.diaMes}</p>
                        )}
                      </div>
                    )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botões */}
      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className={!isFormValid ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? 'Atualizando...' : 'Criando...'}
            </>
          ) : (
            isEditing ? 'Atualizar Tarefa' : 'Criar Tarefa'
          )}
        </Button>
      </div>
    </form>
  );
}
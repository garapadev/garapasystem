'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { useAllGruposHierarquicos } from '@/hooks/useGruposHierarquicos';
import { useToast } from '@/hooks/use-toast';
import { 
  AUTOMATION_CONDITIONS, 
  AUTOMATION_ACTIONS,
  getConditionLabel,
  getActionLabel,
  isValidCondition,
  isValidAction
} from '@/lib/tasks/automation-constants';

interface AutomationStep {
  id: string;
  name: string;
  description: string;
  order: number;
}

interface AutomationRule {
  id: string;
  fromStep: string;
  toStep: string;
  condition: string;
  action: string;
}

interface NewRuleForm {
  fromStep: string | undefined;
  toStep: string | undefined;
  condition: string;
  action: string;
}

interface AutomationForm {
  name: string;
  description: string;
  grupoHierarquicoId: string;
  steps: AutomationStep[];
  rules: AutomationRule[];
  template: string;
  isActive: boolean;
}

export default function NewAutomationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { grupos, loading: gruposLoading, refetch: fetchGrupos } = useAllGruposHierarquicos();
  
  const [form, setForm] = useState<AutomationForm>({
    name: '',
    description: '',
    grupoHierarquicoId: '',
    steps: [],
    rules: [],
    template: '',
    isActive: true
  });
  
  const [newStep, setNewStep] = useState({ name: '', description: '' });
  const [newRule, setNewRule] = useState<NewRuleForm>({ fromStep: undefined, toStep: undefined, condition: '', action: '' });
  const [automationOptions, setAutomationOptions] = useState<{
    conditions: Array<{value: string, label: string}>;
    actions: Array<{value: string, label: string}>;
  }>({ conditions: [], actions: [] });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchGrupos();
    loadAutomationOptions();
  }, [fetchGrupos]);

  const loadAutomationOptions = async () => {
    try {
      const response = await fetch('/api/tasks/automation/options');
      if (response.ok) {
        const data = await response.json();
        setAutomationOptions(data);
      } else {
        // Fallback para constantes locais se a API falhar
        setAutomationOptions({
          conditions: Object.entries(AUTOMATION_CONDITIONS).map(([key, value]) => ({
            value,
            label: getConditionLabel(value)
          })),
          actions: Object.entries(AUTOMATION_ACTIONS).map(([key, value]) => ({
            value,
            label: getActionLabel(value)
          }))
        });
      }
    } catch (error) {
      console.error('Erro ao carregar opções de automação:', error);
      // Usar constantes locais como fallback
      setAutomationOptions({
        conditions: Object.entries(AUTOMATION_CONDITIONS).map(([key, value]) => ({
          value,
          label: getConditionLabel(value)
        })),
        actions: Object.entries(AUTOMATION_ACTIONS).map(([key, value]) => ({
          value,
          label: getActionLabel(value)
        }))
      });
    }
  };

  const getGrupoDisplayName = (grupo: any): string => {
    if (!grupo) return '';
    const parts = [];
    if (grupo.empresa) parts.push(grupo.empresa);
    if (grupo.departamento) parts.push(grupo.departamento);
    if (grupo.setor) parts.push(grupo.setor);
    if (grupo.cargo) parts.push(grupo.cargo);
    return parts.join(' > ') || 'Grupo sem nome';
  };

  const addStep = () => {
    if (!newStep.name.trim()) {
      setErrors({ ...errors, stepName: 'Nome da etapa é obrigatório' });
      return;
    }
    
    const step: AutomationStep = {
      id: Date.now().toString(),
      name: newStep.name,
      description: newStep.description,
      order: form.steps.length + 1
    };
    
    setForm({ ...form, steps: [...form.steps, step] });
    setNewStep({ name: '', description: '' });
    setErrors({ ...errors, stepName: '' });
  };

  const removeStep = (stepId: string) => {
    const updatedSteps = form.steps.filter(step => step.id !== stepId);
    const updatedRules = form.rules.filter(rule => rule.fromStep !== stepId && rule.toStep !== stepId);
    
    setForm({ 
      ...form, 
      steps: updatedSteps.map((step, index) => ({ ...step, order: index + 1 })),
      rules: updatedRules
    });
  };

  const addRule = () => {
    if (!newRule.fromStep || !newRule.toStep || !newRule.condition || !newRule.action) {
      setErrors({ ...errors, rule: 'Todos os campos da regra são obrigatórios' });
      return;
    }
    
    // Ensure values are strings before creating the rule
    if (typeof newRule.fromStep !== 'string' || typeof newRule.toStep !== 'string') {
      setErrors({ ...errors, rule: 'Etapas selecionadas são inválidas' });
      return;
    }
    
    const rule: AutomationRule = {
      id: Date.now().toString(),
      fromStep: newRule.fromStep,
      toStep: newRule.toStep,
      condition: newRule.condition,
      action: newRule.action
    };
    
    setForm({ ...form, rules: [...form.rules, rule] });
    setNewRule({ fromStep: undefined, toStep: undefined, condition: '', action: '' });
    setErrors({ ...errors, rule: '' });
  };

  const removeRule = (ruleId: string) => {
    setForm({ ...form, rules: form.rules.filter(rule => rule.id !== ruleId) });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) newErrors.name = 'Nome da automação é obrigatório';
    if (form.steps.length === 0) newErrors.steps = 'Pelo menos uma etapa é obrigatória';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/tasks/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          grupoHierarquicoId: form.grupoHierarquicoId === 'none' ? undefined : form.grupoHierarquicoId,
          steps: form.steps,
          rules: form.rules,
          template: form.template,
          isActive: form.isActive
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar automação');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Automação criada com sucesso!'
      });
      
      router.push('/tasks');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar automação. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nova Automação de Negócios</h1>
            <p className="text-muted-foreground">Configure uma nova automação para otimizar seus processos</p>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>{isSubmitting ? 'Salvando...' : 'Salvar Automação'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Básicas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Configure os dados principais da automação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Automação *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Aprovação de Orçamentos"
                    className={errors.name ? 'border-red-500' : ''}
                    suppressHydrationWarning
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="grupo">Grupo Hierárquico (Opcional)</Label>
                  <Select
                    value={form.grupoHierarquicoId}
                    onValueChange={(value) => setForm({ ...form, grupoHierarquicoId: value })}
                  >
                    <SelectTrigger className={errors.grupo ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione um grupo (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum grupo selecionado</SelectItem>
                      {gruposLoading ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : (
                        grupos.map((grupo) => (
                          <SelectItem key={grupo.id} value={grupo.id}>
                            {getGrupoDisplayName(grupo)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.grupo && <p className="text-sm text-red-500">{errors.grupo}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descreva o objetivo e funcionamento da automação"
                  rows={3}
                  suppressHydrationWarning
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template">Template de Mensagem</Label>
                <Textarea
                  id="template"
                  value={form.template}
                  onChange={(e) => setForm({ ...form, template: e.target.value })}
                  placeholder="Template para notificações automáticas (opcional)"
                  rows={2}
                  suppressHydrationWarning
                />
              </div>
            </CardContent>
          </Card>

          {/* Etapas do Processo */}
          <Card>
            <CardHeader>
              <CardTitle>Etapas do Processo</CardTitle>
              <CardDescription>Defina as etapas que compõem o fluxo de automação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adicionar Nova Etapa */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Adicionar Nova Etapa</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Input
                      value={newStep.name}
                      onChange={(e) => setNewStep({ ...newStep, name: e.target.value })}
                      placeholder="Nome da etapa"
                      className={errors.stepName ? 'border-red-500' : ''}
                      suppressHydrationWarning
                    />
                    {errors.stepName && <p className="text-sm text-red-500 mt-1">{errors.stepName}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newStep.description}
                      onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                      placeholder="Descrição (opcional)"
                      className="flex-1"
                      suppressHydrationWarning
                    />
                    <Button onClick={addStep} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Lista de Etapas */}
              {form.steps.length > 0 ? (
                <div className="space-y-2">
                  {form.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{step.name}</p>
                          {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStep(step.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Nenhuma etapa adicionada ainda</p>
                  {errors.steps && <p className="text-sm text-red-500 mt-1">{errors.steps}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Regras de Transição */}
          <Card>
            <CardHeader>
              <CardTitle>Regras de Transição</CardTitle>
              <CardDescription>Configure as condições para mudança entre etapas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Adicionar Nova Regra */}
              {form.steps.length >= 2 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">Adicionar Nova Regra</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select
                      value={newRule.fromStep}
                      onValueChange={(value) => setNewRule({ ...newRule, fromStep: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Etapa origem" />
                      </SelectTrigger>
                      <SelectContent>
                        {form.steps.map((step) => (
                          <SelectItem key={step.id} value={step.id}>{step.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={newRule.toStep}
                      onValueChange={(value) => setNewRule({ ...newRule, toStep: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Etapa destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {form.steps.map((step) => (
                          <SelectItem key={step.id} value={step.id}>{step.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select
                      value={newRule.condition}
                      onValueChange={(value) => setNewRule({ ...newRule, condition: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma condição" />
                      </SelectTrigger>
                      <SelectContent>
                        {automationOptions.conditions.map((condition) => (
                          <SelectItem key={condition.value} value={condition.value}>
                            {condition.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex space-x-2">
                      <Select
                        value={newRule.action}
                        onValueChange={(value) => setNewRule({ ...newRule, action: value })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecione uma ação" />
                        </SelectTrigger>
                        <SelectContent>
                          {automationOptions.actions.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={addRule} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {errors.rule && <p className="text-sm text-red-500 mt-2">{errors.rule}</p>}
                </div>
              )}
              
              {/* Lista de Regras */}
              {form.rules.length > 0 ? (
                <div className="space-y-2">
                  {form.rules.map((rule) => {
                    const fromStep = form.steps.find(s => s.id === rule.fromStep);
                    const toStep = form.steps.find(s => s.id === rule.toStep);
                    
                    return (
                      <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">
                            {fromStep?.name} → {toStep?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Condição: {getConditionLabel(rule.condition)} | Ação: {getActionLabel(rule.action)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRule(rule.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>
                    {form.steps.length < 2 
                      ? 'Adicione pelo menos 2 etapas para criar regras'
                      : 'Nenhuma regra adicionada ainda'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Resumo */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Automação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded"
                    suppressHydrationWarning
                  />
                  <span className="text-sm">Automação ativa</span>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label className="text-sm font-medium">Estatísticas</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Etapas:</span>
                    <Badge variant="secondary">{form.steps.length}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Regras:</span>
                    <Badge variant="secondary">{form.rules.length}</Badge>
                  </div>
                </div>
              </div>
              
              {form.grupoHierarquicoId && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium">Grupo Selecionado</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getGrupoDisplayName(grupos.find(g => g.id === form.grupoHierarquicoId))}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useBusinessIntegration } from '@/hooks/useBusinessIntegration';
import { 
  Settings, 
  TrendingUp, 
  Zap, 
  CheckCircle, 
  Clock, 
  Users, 
  Bell,
  BarChart3,
  Activity,
  ArrowRight,
  Play,
  Pause
} from 'lucide-react';

const BusinessAutomationPanel: React.FC = () => {
  const {
    stats,
    rules,
    loading,
    error,
    toggleRule,
    simulateOportunidadeMovement,
    getApplicableRules,
    getAutomationSummary
  } = useBusinessIntegration();

  const [simulationData, setSimulationData] = useState({
    oportunidadeId: '',
    etapaAnteriorId: 'etapa_001',
    etapaAtualId: 'etapa_002',
    responsavelId: '',
    clienteId: ''
  });

  const automationSummary = getAutomationSummary();

  const handleToggleRule = async (ruleId: string, ativo: boolean) => {
    await toggleRule(ruleId, ativo);
  };

  const handleSimulation = async () => {
    if (!simulationData.oportunidadeId || !simulationData.clienteId) {
      alert('Por favor, preencha os campos obrigatórios para simulação');
      return;
    }
    await simulateOportunidadeMovement(simulationData);
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE': return 'bg-red-500';
      case 'ALTA': return 'bg-orange-500';
      case 'MEDIA': return 'bg-yellow-500';
      case 'BAIXA': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionIcon = (acao: string) => {
    switch (acao) {
      case 'CRIAR': return <CheckCircle className="h-4 w-4" />;
      case 'ATUALIZAR_STATUS': return <Activity className="h-4 w-4" />;
      case 'ATRIBUIR': return <Users className="h-4 w-4" />;
      case 'NOTIFICAR': return <Bell className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando automação de negócios...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalTarefasAutomaticas}</p>
                <p className="text-sm text-gray-600">Tarefas Automáticas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.tarefasUltimos30Dias}</p>
                <p className="text-sm text-gray-600">Últimos 30 dias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.regrasAtivas}</p>
                <p className="text-sm text-gray-600">Regras Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.totalRegras}</p>
                <p className="text-sm text-gray-600">Total de Regras</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Regras de Automação</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
          <TabsTrigger value="simulation">Simulação</TabsTrigger>
        </TabsList>

        {/* Regras de Automação */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configuração de Regras</span>
              </CardTitle>
              <CardDescription>
                Configure as regras de automação para criação de tarefas baseadas no pipeline de vendas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {rule.ativo ? (
                          <Play className="h-4 w-4 text-green-600" />
                        ) : (
                          <Pause className="h-4 w-4 text-gray-400" />
                        )}
                        <h4 className="font-medium">{rule.nome}</h4>
                      </div>
                      <Badge variant={rule.ativo ? 'default' : 'secondary'}>
                        {rule.ativo ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <Switch
                      checked={rule.ativo}
                      onCheckedChange={(checked) => handleToggleRule(rule.id, checked)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>Etapa {rule.etapaOrigemId}</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>Etapa {rule.etapaDestinoId}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center space-x-1">
                      {getActionIcon(rule.acaoTarefa)}
                      <span>{rule.acaoTarefa}</span>
                    </div>
                  </div>

                  {rule.templateTarefa && (
                    <div className="bg-gray-50 rounded p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium text-sm">Template de Tarefa</h5>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            className={`${getPriorityColor(rule.templateTarefa.prioridade)} text-white`}
                          >
                            {rule.templateTarefa.prioridade}
                          </Badge>
                          <Badge variant="outline">
                            {rule.templateTarefa.diasVencimento} dias
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{rule.templateTarefa.titulo}</p>
                      <p className="text-xs text-gray-600">{rule.templateTarefa.descricao}</p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resumo */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Ações por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(automationSummary.acoesPorTipo).map(([tipo, count]) => (
                    <div key={tipo} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getActionIcon(tipo)}
                        <span className="text-sm">{tipo}</span>
                      </div>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Etapas com Automação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {automationSummary.etapasComAutomacao.map((etapa) => (
                    <div key={etapa} className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Etapa {etapa}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Regras por Transição</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(automationSummary.regrasPorEtapa).map(([transicao, count]) => (
                  <div key={transicao} className="flex items-center justify-between">
                    <span className="text-sm">{transicao}</span>
                    <Badge variant="outline">{count} regra(s)</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulação */}
        <TabsContent value="simulation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simular Movimento de Oportunidade</CardTitle>
              <CardDescription>
                Teste as regras de automação simulando o movimento de uma oportunidade no pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ID da Oportunidade *</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={simulationData.oportunidadeId}
                    onChange={(e) => setSimulationData(prev => ({ ...prev, oportunidadeId: e.target.value }))}
                    placeholder="ex: opp_123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ID do Cliente *</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={simulationData.clienteId}
                    onChange={(e) => setSimulationData(prev => ({ ...prev, clienteId: e.target.value }))}
                    placeholder="ex: client_456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Etapa Anterior</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={simulationData.etapaAnteriorId}
                    onChange={(e) => setSimulationData(prev => ({ ...prev, etapaAnteriorId: e.target.value }))}
                  >
                    <option value="etapa_001">Etapa 001 - Prospecção</option>
                    <option value="etapa_002">Etapa 002 - Qualificação</option>
                    <option value="etapa_003">Etapa 003 - Proposta</option>
                    <option value="etapa_004">Etapa 004 - Negociação</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Etapa Atual</label>
                  <select
                    className="w-full p-2 border rounded"
                    value={simulationData.etapaAtualId}
                    onChange={(e) => setSimulationData(prev => ({ ...prev, etapaAtualId: e.target.value }))}
                  >
                    <option value="etapa_002">Etapa 002 - Qualificação</option>
                    <option value="etapa_003">Etapa 003 - Proposta</option>
                    <option value="etapa_004">Etapa 004 - Negociação</option>
                    <option value="etapa_005">Etapa 005 - Fechamento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ID do Responsável</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded"
                    value={simulationData.responsavelId}
                    onChange={(e) => setSimulationData(prev => ({ ...prev, responsavelId: e.target.value }))}
                    placeholder="ex: user_789 (opcional)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-600">
                  Regras aplicáveis: {getApplicableRules(simulationData.etapaAnteriorId, simulationData.etapaAtualId).length}
                </div>
                <Button onClick={handleSimulation} disabled={loading}>
                  {loading ? 'Processando...' : 'Simular Movimento'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BusinessAutomationPanel;
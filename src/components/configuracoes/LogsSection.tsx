'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Download, 
  RefreshCw, 
  Search, 
  Filter,
  Play,
  Square,
  Trash2,
  Settings,
  Monitor,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Mail,
  MessageSquare,
  Users,
  Briefcase,
  Terminal,
  Server
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Interfaces para os dados
interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  module: string;
  message: string;
  details?: any;
}

interface ModuleInfo {
  name: string;
  displayName: string;
  status: 'online' | 'offline' | 'error';
  pid?: number;
  uptime?: string;
  memory?: string;
  cpu?: string;
  restarts?: number;
  icon: any;
}

interface DebugConfig {
  module: string;
  debug_enabled: boolean;
  debug_level: 'error' | 'warn' | 'info' | 'debug';
  log_retention_days: number;
}

interface LogFilters {
  level: string;
  search: string;
  lines: number;
}

interface RetentionConfig {
  globalRetentionDays: number;
  moduleConfigs: Record<string, {
    retentionDays: number;
    autoCleanup: boolean;
  }>;
  lastCleanup: string;
}

export default function LogsSection() {
  const [selectedModule, setSelectedModule] = useState<string>('garapasystem');
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [debugConfigs, setDebugConfigs] = useState<DebugConfig[]>([]);
  const [retentionConfig, setRetentionConfig] = useState<RetentionConfig>({
    globalRetentionDays: 30,
    moduleConfigs: {},
    lastCleanup: new Date().toISOString()
  });
  const [filters, setFilters] = useState<LogFilters>({
    level: 'all',
    search: '',
    lines: 50
  });
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [isCleaningLogs, setIsCleaningLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Módulos disponíveis no sistema
  const availableModules: ModuleInfo[] = [
    {
      name: 'garapasystem',
      displayName: 'Sistema Principal',
      status: 'online',
      icon: Server
    },
    {
      name: 'helpdesk-worker',
      displayName: 'Helpdesk Worker',
      status: 'online',
      icon: MessageSquare
    },
    {
      name: 'webmail-sync-worker',
      displayName: 'Webmail Sync',
      status: 'online',
      icon: Mail
    },
    {
      name: 'tasks-worker',
      displayName: 'Tasks Worker',
      status: 'offline',
      icon: Briefcase
    },
    {
      name: 'notifications-worker',
      displayName: 'Notifications',
      status: 'offline',
      icon: Activity
    }
  ];

  // Carregar logs do módulo selecionado
  const loadModuleLogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/logs/system?module=${selectedModule}&lines=${filters.lines}&level=${filters.level}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar informações dos módulos
  const loadModulesInfo = async () => {
    try {
      const response = await fetch('/api/logs/system/modules');
      if (response.ok) {
        const data = await response.json();
        setModules(data.modules || availableModules);
      }
    } catch (error) {
      console.error('Erro ao carregar informações dos módulos:', error);
      setModules(availableModules);
    }
  };

  // Carregar configurações de debug
  const loadDebugConfigs = async () => {
    try {
      const response = await fetch('/api/logs/debug-config');
      if (response.ok) {
        const data = await response.json();
        setDebugConfigs(data.configs || []);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de debug:', error);
    }
  };

  // Carregar configurações de retenção
  const loadRetentionConfig = async () => {
    try {
      const response = await fetch('/api/logs/retention');
      if (response.ok) {
        const data = await response.json();
        setRetentionConfig(data.config);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de retenção:', error);
    }
  };

  // Atualizar configurações de retenção
  const updateRetentionConfig = async (config: Partial<RetentionConfig>) => {
    try {
      const response = await fetch('/api/logs/retention', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        const data = await response.json();
        setRetentionConfig(data.config);
      } else {
        const errorData = await response.text();
        console.error('Erro na resposta da API:', response.status, errorData);
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações de retenção:', error);
    }
  };

  // Atualizar configuração de debug
  const updateDebugConfig = async (module: string, config: Partial<DebugConfig>) => {
    try {
      const response = await fetch(`/api/logs/debug-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module, ...config }),
      });
      
      if (response.ok) {
        loadDebugConfigs();
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração de debug:', error);
    }
  };

  // Limpar logs do módulo
  const clearModuleLogs = async () => {
    try {
      const response = await fetch(`/api/logs/system`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module: selectedModule }),
      });
      
      if (response.ok) {
        setLogs([]);
      }
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
    }
  };

  // Executar limpeza manual de logs baseada na retenção
  const executeManualCleanup = async (module?: string) => {
    setIsCleaningLogs(true);
    try {
      const response = await fetch('/api/logs/retention', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module }),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Limpeza concluída: ${data.message}`);
        loadRetentionConfig(); // Recarregar configurações para atualizar lastCleanup
        if (!module || module === selectedModule) {
          loadModuleLogs(); // Recarregar logs se afetou o módulo atual
        }
      }
    } catch (error) {
      console.error('Erro ao executar limpeza manual:', error);
      alert('Erro ao executar limpeza manual');
    } finally {
      setIsCleaningLogs(false);
    }
  };

  // Reiniciar módulo
  const restartModule = async () => {
    try {
      const response = await fetch(`/api/logs/system/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ module: selectedModule }),
      });
      
      if (response.ok) {
        loadModulesInfo();
        setTimeout(loadModuleLogs, 2000); // Aguardar reinicialização
      }
    } catch (error) {
      console.error('Erro ao reiniciar módulo:', error);
    }
  };

  // Exportar logs
  const exportLogs = () => {
    const filteredLogs = logs.filter(log => {
      const matchesLevel = filters.level === 'all' || log.level === filters.level;
      const matchesSearch = !filters.search || 
        log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
        log.module.toLowerCase().includes(filters.search.toLowerCase());
      return matchesLevel && matchesSearch;
    });

    const logText = filteredLogs.map(log => 
      `${log.timestamp} | ${log.level.toUpperCase()} | ${log.module} | ${log.message}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedModule}-logs-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Auto scroll para o final dos logs
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Efeitos
  useEffect(() => {
    loadModulesInfo();
    loadDebugConfigs();
    loadRetentionConfig();
  }, []);

  useEffect(() => {
    loadModuleLogs();
  }, [selectedModule, filters.lines, filters.level]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(loadModuleLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedModule, filters]);

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Filtrar logs
  const filteredLogs = logs.filter(log => {
    const matchesLevel = filters.level === 'all' || log.level === filters.level;
    const matchesSearch = !filters.search || 
      log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
      log.module.toLowerCase().includes(filters.search.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  // Obter status do módulo
  const getModuleStatus = (moduleName: string) => {
    const module = modules.find(m => m.name === moduleName) || 
                  availableModules.find(m => m.name === moduleName);
    return module?.status || 'unknown';
  };

  // Obter configuração de debug do módulo
  const getDebugConfig = (moduleName: string) => {
    return debugConfigs.find(config => config.module === moduleName);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Logs do Sistema</h2>
          <p className="text-muted-foreground">
            Monitore logs e atividades dos módulos do sistema
          </p>
        </div>
      </div>

      <Tabs value={selectedModule} onValueChange={setSelectedModule} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          {availableModules.map((module) => {
            const Icon = module.icon;
            const status = getModuleStatus(module.name);
            return (
              <TabsTrigger key={module.name} value={module.name} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{module.displayName}</span>
                <Badge 
                  variant={status === 'online' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}
                  className="ml-1 h-2 w-2 p-0"
                />
              </TabsTrigger>
            );
          })}
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Retenção</span>
          </TabsTrigger>
        </TabsList>

        {availableModules.map((module) => (
          <TabsContent key={module.name} value={module.name} className="space-y-4">
            {/* Controles */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <module.icon className="h-5 w-5" />
                    <div>
                      <CardTitle className="text-lg">{module.displayName}</CardTitle>
                      <CardDescription>
                        Status: <Badge variant={getModuleStatus(module.name) === 'online' ? 'default' : 'destructive'}>
                          {getModuleStatus(module.name)}
                        </Badge>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={restartModule}
                      disabled={isLoading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Reiniciar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearModuleLogs}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Filtros */}
                  <div className="space-y-2">
                    <Label>Nível</Label>
                    <Select value={filters.level} onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Linhas</Label>
                    <Select value={filters.lines.toString()} onValueChange={(value) => setFilters(prev => ({ ...prev, lines: parseInt(value) }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Buscar</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar nos logs..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Controles</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadModuleLogs}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportLogs}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={autoRefresh}
                          onCheckedChange={setAutoRefresh}
                        />
                        <Label className="text-xs">Auto</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Debug */}
            {(() => {
              const debugConfig = getDebugConfig(module.name);
              return debugConfig && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Configurações de Debug
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={debugConfig.debug_enabled}
                          onCheckedChange={(checked) => updateDebugConfig(module.name, { debug_enabled: checked })}
                        />
                        <Label>Debug Ativo</Label>
                      </div>
                      <div className="space-y-2">
                        <Label>Nível de Debug</Label>
                        <Select 
                          value={debugConfig.debug_level} 
                          onValueChange={(value) => updateDebugConfig(module.name, { debug_level: value as any })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="error">Error</SelectItem>
                            <SelectItem value="warn">Warning</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                            <SelectItem value="debug">Debug</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Retenção (dias)</Label>
                        <Input
                          type="number"
                          value={debugConfig.log_retention_days}
                          onChange={(e) => updateDebugConfig(module.name, { log_retention_days: parseInt(e.target.value) })}
                          min="1"
                          max="365"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Logs em Tempo Real ({filteredLogs.length} entradas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-lg font-mono text-sm h-96 overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <div className="text-slate-500 dark:text-slate-400 text-center py-8">
                      Nenhum log encontrado para os filtros selecionados
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log.id} className="mb-1 flex hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded transition-colors">
                        <span className="text-slate-500 dark:text-slate-400 mr-2 min-w-[60px]">
                          {format(new Date(log.timestamp), 'HH:mm:ss', { locale: ptBR })}
                        </span>
                        <span className={`mr-2 font-semibold min-w-[60px] ${
                          log.level === 'error' ? 'text-red-600 dark:text-red-400' :
                          log.level === 'warn' ? 'text-yellow-600 dark:text-yellow-400' :
                          log.level === 'info' ? 'text-blue-600 dark:text-blue-400' :
                          'text-slate-600 dark:text-slate-400'
                        }`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 mr-2 min-w-[120px]">{log.module}:</span>
                        <span className="text-slate-800 dark:text-slate-200 flex-1">{log.message}</span>
                      </div>
                    ))
                  )}
                  <div ref={logsEndRef} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}

        {/* Aba de Configuração de Retenção */}
        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuração de Retenção de Logs
              </CardTitle>
              <CardDescription>
                Configure o período de armazenamento dos logs e execute limpezas manuais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Configuração Global */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuração Global</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="globalRetention">Retenção Global (dias)</Label>
                    <Input
                      id="globalRetention"
                      type="number"
                      min="1"
                      max="365"
                      value={retentionConfig.globalRetentionDays}
                      onChange={(e) => setRetentionConfig(prev => ({
                        ...prev,
                        globalRetentionDays: parseInt(e.target.value) || 7
                      }))}
                      placeholder="7"
                    />
                    <p className="text-sm text-muted-foreground">
                      Logs mais antigos que este período serão removidos automaticamente
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Última Limpeza</Label>
                    <div className="p-2 bg-muted rounded-md text-sm">
                      {retentionConfig.lastCleanup ? 
                        format(new Date(retentionConfig.lastCleanup), 'dd/MM/yyyy HH:mm', { locale: ptBR }) :
                        'Nunca executada'
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ações</h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={() => updateRetentionConfig(retentionConfig)}
                    variant="default"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                  <Button 
                    onClick={() => executeManualCleanup()}
                    variant="outline"
                    disabled={isCleaningLogs}
                  >
                    {isCleaningLogs ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {isCleaningLogs ? 'Limpando...' : 'Limpar Logs Antigos'}
                  </Button>
                </div>
              </div>

              {/* Configurações por Módulo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações por Módulo</h3>
                <div className="grid gap-4">
                  {availableModules.map((module) => {
                    const moduleConfig = retentionConfig.moduleConfigs[module.name];
                    const Icon = module.icon;
                    
                    return (
                      <Card key={module.name} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5" />
                            <div>
                              <h4 className="font-medium">{module.displayName}</h4>
                              <p className="text-sm text-muted-foreground">
                                Retenção: {moduleConfig?.retentionDays || retentionConfig.globalRetentionDays} dias
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="365"
                              value={moduleConfig?.retentionDays || ''}
                              onChange={(e) => {
                                const days = parseInt(e.target.value);
                                setRetentionConfig(prev => ({
                                  ...prev,
                                  moduleConfigs: {
                                    ...prev.moduleConfigs,
                                    [module.name]: {
                                      retentionDays: days || prev.globalRetentionDays,
                                      autoCleanup: moduleConfig?.autoCleanup || false
                                    }
                                  }
                                }));
                              }}
                              placeholder={retentionConfig.globalRetentionDays.toString()}
                              className="w-20"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => executeManualCleanup(module.name)}
                              disabled={isCleaningLogs}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Informações sobre Limpeza Automática */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Limpeza Automática</h3>
                <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">
                        Rotina Automática Configurada
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        O sistema executa automaticamente a limpeza de logs diariamente às 02:00h, 
                        removendo logs mais antigos que o período de retenção configurado.
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                        Para configurar a rotina automática, execute o script: 
                        <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded ml-1">
                          ./setup-log-cleanup.sh
                        </code>
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
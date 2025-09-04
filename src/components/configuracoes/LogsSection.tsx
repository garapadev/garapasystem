'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Activity, RefreshCw, Filter, Download, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ApiLog {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  apiKey?: {
    nome: string;
  };
}

interface WebhookLog {
  id: string;
  webhookConfigId: string;
  evento: string;
  sucesso: boolean;
  statusCode?: number;
  responseTime?: number;
  errorMessage?: string;
  teste: boolean;
  createdAt: string;
  webhookConfig?: {
    nome: string;
    url: string;
  };
}

interface LogFilters {
  dateRange: string;
  status?: string;
  method?: string;
  endpoint?: string;
  evento?: string;
  sucesso?: string;
  teste?: string;
}

export function LogsSection() {
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('api');
  const [filters, setFilters] = useState<LogFilters>({
    dateRange: '7d',
  });

  useEffect(() => {
    if (activeTab === 'api') {
      fetchApiLogs();
    } else {
      fetchWebhookLogs();
    }
  }, [activeTab, filters]);

  const fetchApiLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.status) params.append('status', filters.status);
      if (filters.method) params.append('method', filters.method);
      if (filters.endpoint) params.append('endpoint', filters.endpoint);
      
      const response = await fetch(`/api/logs/api?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setApiLogs(data.logs || []);
      } else {
        throw new Error('Erro ao carregar logs da API');
      }
    } catch (error) {
      console.error('Erro ao carregar logs da API:', error);
      toast.error('Erro ao carregar logs da API');
    } finally {
      setLoading(false);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.dateRange) params.append('dateRange', filters.dateRange);
      if (filters.evento) params.append('evento', filters.evento);
      if (filters.sucesso) params.append('sucesso', filters.sucesso);
      if (filters.teste) params.append('teste', filters.teste);
      
      const response = await fetch(`/api/logs/webhooks?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setWebhookLogs(data.logs || []);
      } else {
        throw new Error('Erro ao carregar logs de webhook');
      }
    } catch (error) {
      console.error('Erro ao carregar logs de webhook:', error);
      toast.error('Erro ao carregar logs de webhook');
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const logs = activeTab === 'api' ? apiLogs : webhookLogs;
      const csvContent = generateCSV(logs, activeTab);
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${activeTab}-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Logs exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar logs');
    }
  };

  const generateCSV = (logs: any[], type: string) => {
    if (type === 'api') {
      const headers = ['Data/Hora', 'Chave API', 'Endpoint', 'Método', 'Status', 'Tempo (ms)', 'IP', 'User Agent'];
      const rows = logs.map(log => [
        format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
        log.apiKey?.nome || 'N/A',
        log.endpoint,
        log.method,
        log.status,
        log.responseTime,
        log.ip || 'N/A',
        log.userAgent || 'N/A'
      ]);
      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    } else {
      const headers = ['Data/Hora', 'Webhook', 'Evento', 'Sucesso', 'Status', 'Tempo (ms)', 'Teste', 'Erro'];
      const rows = logs.map(log => [
        format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }),
        log.webhookConfig?.nome || 'N/A',
        log.evento,
        log.sucesso ? 'Sim' : 'Não',
        log.status || 'N/A',
        log.responseTime || 'N/A',
        log.teste ? 'Sim' : 'Não',
        log.erro || 'N/A'
      ]);
      return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-green-100 text-green-800 border-green-200';
    if (status >= 400 && status < 500) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (status >= 500) return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const clearFilters = () => {
    setFilters({ dateRange: '7d' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Logs de Integração</h3>
          <p className="text-sm text-muted-foreground">
            Monitore o uso da API e envios de webhook
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => activeTab === 'api' ? fetchApiLogs() : fetchWebhookLogs()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="api">Logs da API</TabsTrigger>
          <TabsTrigger value="webhooks">Logs de Webhook</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Filtros</CardTitle>
                <CardDescription>Filtre os logs por período e outros critérios</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="dateRange">Período</Label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Último dia</SelectItem>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {activeTab === 'api' ? (
                <>
                  <div>
                    <Label htmlFor="method">Método</Label>
                    <Select value={filters.method || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, method: value === 'all' ? undefined : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={filters.status || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="2xx">2xx (Sucesso)</SelectItem>
                        <SelectItem value="4xx">4xx (Erro do Cliente)</SelectItem>
                        <SelectItem value="5xx">5xx (Erro do Servidor)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="endpoint">Endpoint</Label>
                    <Input
                      id="endpoint"
                      placeholder="Ex: /api/clientes"
                      value={filters.endpoint || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, endpoint: e.target.value || undefined }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label htmlFor="evento">Evento</Label>
                    <Input
                      id="evento"
                      placeholder="Ex: cliente.criado"
                      value={filters.evento || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, evento: e.target.value || undefined }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sucesso">Sucesso</Label>
                    <Select value={filters.sucesso || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, sucesso: value === 'all' ? undefined : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Sucesso</SelectItem>
                        <SelectItem value="false">Falha</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="teste">Teste</Label>
                    <Select value={filters.teste || 'all'} onValueChange={(value) => setFilters(prev => ({ ...prev, teste: value === 'all' ? undefined : value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="true">Teste</SelectItem>
                        <SelectItem value="false">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logs da API</CardTitle>
              <CardDescription>
                {apiLogs.length} registro{apiLogs.length !== 1 ? 's' : ''} encontrado{apiLogs.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : apiLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum log encontrado</p>
                  <p className="text-sm">Ajuste os filtros ou aguarde novas requisições</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Chave API</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {log.apiKey?.nome || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{log.endpoint}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(log.statusCode)} border`}>
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {log.responseTime}ms
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {log.ipAddress || 'N/A'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Logs de Webhook</CardTitle>
              <CardDescription>
                {webhookLogs.length} registro{webhookLogs.length !== 1 ? 's' : ''} encontrado{webhookLogs.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </div>
              ) : webhookLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Nenhum log encontrado</p>
                  <p className="text-sm">Ajuste os filtros ou aguarde novos envios</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Webhook</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-sm">
                              {log.webhookConfig?.nome || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {log.webhookConfig?.url}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.evento}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {log.sucesso ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge
                              variant={log.sucesso ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {log.sucesso ? 'Sucesso' : 'Falha'}
                            </Badge>
                            {log.statusCode && (
                              <Badge className={`${getStatusColor(log.statusCode)} border text-xs`}>
                                {log.statusCode}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {log.responseTime ? `${log.responseTime}ms` : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.teste ? 'secondary' : 'outline'}>
                            {log.teste ? 'Teste' : 'Produção'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.errorMessage ? (
                            <div className="max-w-xs">
                              <span className="text-sm text-red-600 truncate block" title={log.errorMessage}>
                                {log.errorMessage}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
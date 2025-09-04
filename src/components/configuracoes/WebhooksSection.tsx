'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Play, CheckCircle, XCircle, Clock, Webhook, FileText, Activity } from 'lucide-react';
import { useWebhooks, type CreateWebhookData, type WebhookTestResult } from '@/hooks/useWebhooks';
import { useLogs, type WebhookLog } from '@/hooks/useLogs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WEBHOOK_EVENTS = [
  { value: 'cliente.criado', label: 'Cliente Criado' },
  { value: 'cliente.atualizado', label: 'Cliente Atualizado' },
  { value: 'oportunidade.criada', label: 'Oportunidade Criada' },
  { value: 'oportunidade.atualizada', label: 'Oportunidade Atualizada' },
  { value: 'oportunidade.fechada', label: 'Oportunidade Fechada' },
  { value: 'usuario.criado', label: 'Usuário Criado' },
  { value: 'usuario.atualizado', label: 'Usuário Atualizado' },
];

export function WebhooksSection() {
  const { webhooks, loading, createWebhook, updateWebhook, deleteWebhook, testWebhook, toggleWebhookStatus } = useWebhooks();
  const { webhookLogs, loading: logsLoading, fetchWebhookLogs } = useLogs();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<any>(null);
  const [testingWebhook, setTestingWebhook] = useState<any>(null);
  const [viewingLogsWebhook, setViewingLogsWebhook] = useState<any>(null);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [testPayload, setTestPayload] = useState('');
  const [formData, setFormData] = useState<CreateWebhookData>({
    nome: '',
    url: '',
    evento: '',
    secret: '',
    headers: {},
    ativo: true,
  });

  const handleCreateWebhook = async () => {
    if (!formData.nome.trim() || !formData.url.trim() || !formData.evento) {
      toast.error('Nome, URL e evento são obrigatórios');
      return;
    }

    const result = await createWebhook(formData);
    if (result) {
      setIsCreateDialogOpen(false);
      setFormData({
        nome: '',
        url: '',
        evento: '',
        secret: '',
        headers: {},
        ativo: true,
      });
    }
  };

  const handleEditWebhook = async () => {
    if (!editingWebhook || !formData.nome.trim() || !formData.url.trim() || !formData.evento) {
      toast.error('Nome, URL e evento são obrigatórios');
      return;
    }

    const result = await updateWebhook(editingWebhook.id, {
      nome: formData.nome,
      url: formData.url,
      evento: formData.evento,
      secret: formData.secret || undefined,
      headers: formData.headers,
      ativo: formData.ativo,
    });
    
    if (result) {
      setIsEditDialogOpen(false);
      setEditingWebhook(null);
      setFormData({
        nome: '',
        url: '',
        evento: '',
        secret: '',
        headers: {},
        ativo: true,
      });
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta configuração de webhook?')) {
      await deleteWebhook(id);
    }
  };

  const handleTestWebhook = async () => {
    if (!testingWebhook) return;

    let payload = {};
    if (testPayload.trim()) {
      try {
        payload = JSON.parse(testPayload);
      } catch {
        toast.error('Payload inválido. Deve ser um JSON válido.');
        return;
      }
    }

    const result = await testWebhook(testingWebhook.id, payload);
    setTestResult(result);
  };

  const openEditDialog = (webhook: any) => {
    setEditingWebhook(webhook);
    setFormData({
      nome: webhook.nome,
      url: webhook.url,
      evento: webhook.evento,
      secret: webhook.secret || '',
      headers: webhook.headers ? JSON.parse(webhook.headers) : {},
      ativo: webhook.ativo,
    });
    setIsEditDialogOpen(true);
  };

  const openTestDialog = (webhook: any) => {
    setTestingWebhook(webhook);
    setTestResult(null);
    setTestPayload(JSON.stringify({
      id: '123',
      evento: webhook.evento,
      timestamp: new Date().toISOString(),
      dados: {
        exemplo: 'dados do evento'
      }
    }, null, 2));
    setIsTestDialogOpen(true);
  };

  const openLogsDialog = async (webhook: any) => {
    setViewingLogsWebhook(webhook);
    setIsLogsDialogOpen(true);
    // Buscar logs específicos deste webhook
    await fetchWebhookLogs({ webhookConfigId: webhook.id, limit: 50 });
  };

  const getEventLabel = (eventValue: string) => {
    const event = WEBHOOK_EVENTS.find(e => e.value === eventValue);
    return event ? event.label : eventValue;
  };

  if (loading) {
    return <div className="flex justify-center p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Configurações de Webhook</h3>
          <p className="text-sm text-muted-foreground">
            {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configurado{webhooks.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Webhook</DialogTitle>
              <DialogDescription>
                Configure um webhook para receber notificações de eventos do sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome do Webhook</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Notificação Sistema X"
                  />
                </div>
                <div>
                  <Label htmlFor="evento">Evento</Label>
                  <Select value={formData.evento} onValueChange={(value) => setFormData(prev => ({ ...prev, evento: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEBHOOK_EVENTS.map((event) => (
                        <SelectItem key={event.value} value={event.value}>
                          {event.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="url">URL do Webhook</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://exemplo.com/webhook"
                />
              </div>
              <div>
                <Label htmlFor="secret">Secret (opcional)</Label>
                <Input
                  id="secret"
                  type="password"
                  value={formData.secret}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="Chave secreta para assinatura"
                />
              </div>
              <div>
                <Label htmlFor="headers">Headers Personalizados (JSON)</Label>
                <Textarea
                  id="headers"
                  value={JSON.stringify(formData.headers, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, headers: parsed }));
                    } catch {
                      // Ignore invalid JSON while typing
                    }
                  }}
                  placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                />
                <Label htmlFor="ativo">Webhook ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWebhook}>
                Criar Webhook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {webhooks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Webhook className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Nenhum webhook configurado</p>
          <p className="text-sm">Clique em "Novo Webhook" para começar</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Evento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Envio</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map((webhook) => (
              <TableRow key={webhook.id}>
                <TableCell className="font-medium">{webhook.nome}</TableCell>
                <TableCell>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {webhook.url}
                  </code>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {getEventLabel(webhook.evento)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={webhook.ativo}
                      onCheckedChange={(checked) => toggleWebhookStatus(webhook.id, checked)}
                    />
                    <Badge variant={webhook.ativo ? 'default' : 'secondary'}>
                      {webhook.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {webhook.ultimoEnvio
                    ? format(new Date(webhook.ultimoEnvio), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : 'Nunca'
                  }
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openTestDialog(webhook)}>
                        <Play className="mr-2 h-4 w-4" />
                        Testar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openLogsDialog(webhook)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Ver Logs
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(webhook)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Webhook</DialogTitle>
            <DialogDescription>
              Atualize as configurações do webhook.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-nome">Nome do Webhook</Label>
                <Input
                  id="edit-nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Notificação Sistema X"
                />
              </div>
              <div>
                <Label htmlFor="edit-evento">Evento</Label>
                <Select value={formData.evento} onValueChange={(value) => setFormData(prev => ({ ...prev, evento: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEBHOOK_EVENTS.map((event) => (
                      <SelectItem key={event.value} value={event.value}>
                        {event.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-url">URL do Webhook</Label>
              <Input
                id="edit-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://exemplo.com/webhook"
              />
            </div>
            <div>
              <Label htmlFor="edit-secret">Secret (opcional)</Label>
              <Input
                id="edit-secret"
                type="password"
                value={formData.secret}
                onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Chave secreta para assinatura"
              />
            </div>
            <div>
              <Label htmlFor="edit-headers">Headers Personalizados (JSON)</Label>
              <Textarea
                id="edit-headers"
                value={JSON.stringify(formData.headers, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData(prev => ({ ...prev, headers: parsed }));
                  } catch {
                    // Ignore invalid JSON while typing
                  }
                }}
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="edit-ativo">Webhook ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditWebhook}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Testar Webhook</DialogTitle>
            <DialogDescription>
              Envie um payload de teste para o webhook: {testingWebhook?.nome}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-payload">Payload de Teste (JSON)</Label>
              <Textarea
                id="test-payload"
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
            </div>
            
            {testResult && (
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-medium">
                    {testResult.success ? 'Teste bem-sucedido' : 'Teste falhou'}
                  </span>
                  {testResult.status && (
                    <Badge variant={testResult.success ? 'default' : 'destructive'}>
                      {testResult.status}
                    </Badge>
                  )}
                </div>
                
                {testResult.responseTime && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Tempo de resposta: {testResult.responseTime}ms
                  </div>
                )}
                
                {testResult.response && (
                  <div>
                    <Label>Resposta:</Label>
                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto max-h-32">
                      {testResult.response}
                    </pre>
                  </div>
                )}
                
                {testResult.error && (
                  <div>
                    <Label className="text-destructive">Erro:</Label>
                    <pre className="text-xs bg-destructive/10 p-2 rounded mt-1 text-destructive">
                      {testResult.error}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              Fechar
            </Button>
            <Button onClick={handleTestWebhook}>
              <Play className="mr-2 h-4 w-4" />
              Enviar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Logs */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Logs do Webhook: {viewingLogsWebhook?.nome}
            </DialogTitle>
            <DialogDescription>
              Histórico de execuções do webhook
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando logs...</div>
              </div>
            ) : webhookLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum log encontrado</h3>
                <p className="text-muted-foreground">
                  Este webhook ainda não foi executado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {webhookLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {log.sucesso ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span className="font-medium">
                          {log.sucesso ? 'Sucesso' : 'Falha'}
                        </span>
                        {log.status && (
                           <Badge variant={log.sucesso ? 'default' : 'destructive'}>
                             {log.status}
                           </Badge>
                         )}
                        {log.teste && (
                          <Badge variant="outline">Teste</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {log.responseTime && (
                           <div className="flex items-center gap-1">
                             <Clock className="h-4 w-4" />
                             {log.responseTime}ms
                           </div>
                         )}
                        <span>
                           {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                         </span>
                      </div>
                    </div>
                    
                    {log.webhookConfig && (
                       <div>
                         <Label className="text-xs font-medium text-muted-foreground">URL:</Label>
                         <div className="text-xs bg-muted p-2 rounded mt-1">
                           {log.webhookConfig.url}
                         </div>
                       </div>
                     )}
                    
                    {log.erro && (
                      <div>
                        <Label className="text-xs font-medium text-destructive">Erro:</Label>
                        <pre className="text-xs bg-destructive/10 p-2 rounded mt-1 text-destructive overflow-auto max-h-24">
                          {log.erro}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
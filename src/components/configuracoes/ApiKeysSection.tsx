'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, MoreHorizontal, Copy, Edit, Trash2, Eye, EyeOff, Key } from 'lucide-react';
import { useApiKeys, type CreateApiKeyData } from '@/hooks/useApiKeys';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ApiKeysSection() {
  const { apiKeys, loading, createApiKey, updateApiKey, deleteApiKey, toggleApiKeyStatus } = useApiKeys();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<any>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<CreateApiKeyData>({
    nome: '',
    expiresAt: '',
    permissoes: {},
  });

  const handleCreateApiKey = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const result = await createApiKey(formData);
    if (result) {
      setIsCreateDialogOpen(false);
      setFormData({ nome: '', expiresAt: '', permissoes: {} });
    }
  };

  const handleEditApiKey = async () => {
    if (!editingKey || !formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const result = await updateApiKey(editingKey.id, {
      nome: formData.nome,
      expiresAt: formData.expiresAt || undefined,
      permissoes: formData.permissoes,
    });
    
    if (result) {
      setIsEditDialogOpen(false);
      setEditingKey(null);
      setFormData({ nome: '', expiresAt: '', permissoes: {} });
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta chave de API?')) {
      await deleteApiKey(id);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Chave copiada para a área de transferência!');
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const openEditDialog = (apiKey: any) => {
    setEditingKey(apiKey);
    setFormData({
      nome: apiKey.nome,
      expiresAt: apiKey.expiresAt ? format(new Date(apiKey.expiresAt), 'yyyy-MM-dd') : '',
      permissoes: apiKey.permissoes ? JSON.parse(apiKey.permissoes) : {},
    });
    setIsEditDialogOpen(true);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}`;
  };

  if (loading) {
    return <div className="flex justify-center p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Chaves de API</h3>
          <p className="text-sm text-muted-foreground">
            {apiKeys.length} chave{apiKeys.length !== 1 ? 's' : ''} configurada{apiKeys.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Chave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Chave de API</DialogTitle>
              <DialogDescription>
                Crie uma nova chave de API para integração com sistemas externos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Chave</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Integração Sistema X"
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Data de Expiração (opcional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="permissoes">Permissões (JSON)</Label>
                <Textarea
                  id="permissoes"
                  value={JSON.stringify(formData.permissoes, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, permissoes: parsed }));
                    } catch {
                      // Ignore invalid JSON while typing
                    }
                  }}
                  placeholder='{"read": true, "write": false}'
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateApiKey}>
                Criar Chave
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {apiKeys.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p>Nenhuma chave de API configurada</p>
          <p className="text-sm">Clique em "Nova Chave" para começar</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Chave</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Uso</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((apiKey) => (
              <TableRow key={apiKey.id}>
                <TableCell className="font-medium">{apiKey.nome}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {showKeys[apiKey.id] ? apiKey.chave : maskApiKey(apiKey.chave)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(apiKey.chave)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={apiKey.ativo}
                      onCheckedChange={(checked) => toggleApiKeyStatus(apiKey.id, checked)}
                    />
                    <Badge variant={apiKey.ativo ? 'default' : 'secondary'}>
                      {apiKey.ativo ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  {apiKey.ultimoUso
                    ? format(new Date(apiKey.ultimoUso), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : 'Nunca'
                  }
                </TableCell>
                <TableCell>
                  {apiKey.expiresAt ? (
                    <Badge variant={new Date(apiKey.expiresAt) < new Date() ? 'destructive' : 'outline'}>
                      {format(new Date(apiKey.expiresAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Sem expiração</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(apiKey)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteApiKey(apiKey.id)}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Chave de API</DialogTitle>
            <DialogDescription>
              Atualize as informações da chave de API.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nome">Nome da Chave</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Integração Sistema X"
              />
            </div>
            <div>
              <Label htmlFor="edit-expiresAt">Data de Expiração (opcional)</Label>
              <Input
                id="edit-expiresAt"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-permissoes">Permissões (JSON)</Label>
              <Textarea
                id="edit-permissoes"
                value={JSON.stringify(formData.permissoes, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setFormData(prev => ({ ...prev, permissoes: parsed }));
                  } catch {
                    // Ignore invalid JSON while typing
                  }
                }}
                placeholder='{"read": true, "write": false}'
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditApiKey}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
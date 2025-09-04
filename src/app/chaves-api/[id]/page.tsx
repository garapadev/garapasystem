'use client';

import { useState, useEffect, use } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Key, Save, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AVAILABLE_PERMISSIONS = [
  { id: 'clientes.read', label: 'Ler Clientes', description: 'Visualizar informações de clientes' },
  { id: 'clientes.write', label: 'Escrever Clientes', description: 'Criar e editar clientes' },
  { id: 'clientes.delete', label: 'Excluir Clientes', description: 'Remover clientes do sistema' },
  { id: 'oportunidades.read', label: 'Ler Oportunidades', description: 'Visualizar oportunidades de negócio' },
  { id: 'oportunidades.write', label: 'Escrever Oportunidades', description: 'Criar e editar oportunidades' },
  { id: 'oportunidades.delete', label: 'Excluir Oportunidades', description: 'Remover oportunidades do sistema' },
  { id: 'usuarios.read', label: 'Ler Usuários', description: 'Visualizar informações de usuários' },
  { id: 'usuarios.write', label: 'Escrever Usuários', description: 'Criar e editar usuários' },
  { id: 'usuarios.delete', label: 'Excluir Usuários', description: 'Remover usuários do sistema' },
  { id: 'relatorios.read', label: 'Ler Relatórios', description: 'Acessar relatórios e dashboards' },
  { id: 'configuracoes.read', label: 'Ler Configurações', description: 'Visualizar configurações do sistema' },
  { id: 'configuracoes.write', label: 'Escrever Configurações', description: 'Modificar configurações do sistema' },
];

interface EditarChaveApiPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditarChaveApiPage({ params }: EditarChaveApiPageProps) {
  const { apiKeys, updateApiKey, deleteApiKey } = useApiKeys();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState<any>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    ativo: true,
    expiresAt: '',
    permissoes: [] as string[],
  });

  const resolvedParams = use(params);

  useEffect(() => {
    const foundApiKey = apiKeys.find(key => key.id === resolvedParams.id);
    if (foundApiKey) {
      setApiKey(foundApiKey);
      const permissoes = Array.isArray(foundApiKey.permissoes) 
        ? foundApiKey.permissoes 
        : JSON.parse(foundApiKey.permissoes || '[]');
      
      setFormData({
        nome: foundApiKey.nome,
        ativo: foundApiKey.ativo,
        expiresAt: foundApiKey.expiresAt 
          ? new Date(foundApiKey.expiresAt).toISOString().split('T')[0] 
          : '',
        permissoes,
      });
    }
  }, [apiKeys, resolvedParams.id]);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissoes: checked
        ? [...prev.permissoes, permissionId]
        : prev.permissoes.filter(p => p !== permissionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome da chave é obrigatório');
      return;
    }

    if (formData.permissoes.length === 0) {
      toast.error('Selecione pelo menos uma permissão');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        nome: formData.nome,
        ativo: formData.ativo,
        expiresAt: formData.expiresAt || undefined,
        permissoes: formData.permissoes,
      };

      const result = await updateApiKey(resolvedParams.id, updateData);
      if (result) {
        toast.success('Chave de API atualizada com sucesso!');
        router.push('/chaves-api');
      }
    } catch (error) {
      toast.error('Erro ao atualizar chave de API');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir esta chave de API? Esta ação não pode ser desfeita.')) {
      const result = await deleteApiKey(resolvedParams.id);
      if (result) {
        toast.success('Chave de API excluída com sucesso!');
        router.push('/chaves-api');
      }
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Chave copiada para a área de transferência');
    } catch (error) {
      toast.error('Erro ao copiar chave');
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    const [resource] = permission.id.split('.');
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>);

  if (!apiKey) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/chaves-api">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Chave de API não encontrada</h1>
            <p className="text-muted-foreground">
              A chave de API solicitada não foi encontrada.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/chaves-api">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Chave de API</h1>
          <p className="text-muted-foreground">
            Atualize as configurações da chave de API.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Informações da Chave
            </CardTitle>
            <CardDescription>
              Informações básicas e chave de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Chave *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Integração Sistema X"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Data de Expiração (opcional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Chave de API</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-muted px-3 py-2 rounded font-mono">
                  {keyVisible ? (apiKey?.chave || '') : maskApiKey(apiKey?.chave || '')}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setKeyVisible(!keyVisible)}
                >
                  {keyVisible ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(apiKey?.chave || '')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Criada em</Label>
                <p>{apiKey?.createdAt ? format(new Date(apiKey.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Último uso</Label>
                <p>{apiKey?.ultimoUso ? format(new Date(apiKey.ultimoUso), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Nunca'}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                  />
                  <span className={formData.ativo ? 'text-green-600' : 'text-red-600'}>
                    {formData.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissões</CardTitle>
            <CardDescription>
              Selecione as permissões que esta chave de API terá no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                <div key={resource} className="space-y-3">
                  <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                    {resource.charAt(0).toUpperCase() + resource.slice(1)}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id={permission.id}
                          checked={formData.permissoes.includes(permission.id)}
                          onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <Label
                            htmlFor={permission.id}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {permission.label}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {permission.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {formData.permissoes.length > 0 && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Permissões Selecionadas ({formData.permissoes.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.permissoes.map((permissionId) => {
                    const permission = AVAILABLE_PERMISSIONS.find(p => p.id === permissionId);
                    return (
                      <span key={permissionId} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground">
                        {permission?.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Chave
          </Button>
          
          <div className="flex items-center gap-4">
            <Link href="/chaves-api">
              <Button variant="outline" type="button">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGruposHierarquicos } from '@/hooks/useGruposHierarquicos';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface HelpdeskDepartamento {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  imapHost?: string;
  imapPort?: number;
  imapSecure: boolean;
  imapEmail?: string;
  imapPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure: boolean;
  smtpEmail?: string;
  smtpPassword?: string;
  syncEnabled: boolean;
  syncInterval: number;
  lastSync?: Date;
  grupoHierarquicoId?: string;
  grupoHierarquico?: {
    id: string;
    nome: string;
  };
}

interface UpdateDepartamentoForm {
  nome: string;
  descricao: string;
  ativo: boolean;
  grupoHierarquicoId: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  imapEmail: string;
  imapPassword: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpEmail: string;
  smtpPassword: string;
  syncEnabled: boolean;
  syncInterval: number;
}

export default function EditarDepartamentoPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { grupos, loading: gruposLoading } = useGruposHierarquicos();
  const [loading, setLoading] = useState(false);
  const [loadingDepartamento, setLoadingDepartamento] = useState(true);
  const [departamento, setDepartamento] = useState<HelpdeskDepartamento | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  const [form, setForm] = useState<UpdateDepartamentoForm>({
    nome: '',
    descricao: '',
    ativo: true,
    grupoHierarquicoId: '',
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    imapEmail: '',
    imapPassword: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpEmail: '',
    smtpPassword: '',
    syncEnabled: true,
    syncInterval: 300
  });

  // Carregar dados do departamento
  useEffect(() => {
    const loadDepartamento = async () => {
      if (!params.id) return;
      
      try {
        setLoadingDepartamento(true);
        const response = await fetch(`/api/helpdesk/departamentos/${params.id}`);
        
        if (!response.ok) {
          throw new Error('Departamento não encontrado');
        }
        
        const data = await response.json();
        setDepartamento(data);
        
        // Preencher formulário
        setForm({
          nome: data.nome || '',
          descricao: data.descricao || '',
          ativo: data.ativo ?? true,
          grupoHierarquicoId: data.grupoHierarquicoId || 'none',
          imapHost: data.imapHost || '',
          imapPort: data.imapPort || 993,
          imapSecure: data.imapSecure ?? true,
          imapEmail: data.imapEmail || '',
          imapPassword: '', // Não carregar senha por segurança
          smtpHost: data.smtpHost || '',
          smtpPort: data.smtpPort || 587,
          smtpSecure: data.smtpSecure ?? false,
          smtpEmail: data.smtpEmail || '',
          smtpPassword: '', // Não carregar senha por segurança
          syncEnabled: data.syncEnabled ?? true,
          syncInterval: data.syncInterval || 300
        });
      } catch (error) {
        console.error('Erro ao carregar departamento:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar dados do departamento',
          variant: 'destructive'
        });
        router.push('/configuracoes?tab=helpdesk');
      } finally {
        setLoadingDepartamento(false);
      }
    };

    loadDepartamento();
  }, [params.id, router, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do departamento é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const updateData = { ...form };
      
      // Remover senhas vazias do payload
      if (!updateData.imapPassword) {
        delete (updateData as any).imapPassword;
      }
      if (!updateData.smtpPassword) {
        delete (updateData as any).smtpPassword;
      }
      
      // Converter grupoHierarquicoId vazio ou "none" para null
      if (!updateData.grupoHierarquicoId || updateData.grupoHierarquicoId === 'none') {
        (updateData as any).grupoHierarquicoId = null;
      }

      const response = await fetch(`/api/helpdesk/departamentos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao atualizar departamento');
      }

      toast({
        title: 'Sucesso',
        description: 'Departamento atualizado com sucesso'
      });

      router.push('/configuracoes?tab=helpdesk');
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar departamento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/helpdesk/departamentos/${params.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao excluir departamento');
      }

      toast({
        title: 'Sucesso',
        description: 'Departamento excluído com sucesso'
      });

      router.push('/configuracoes?tab=helpdesk');
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir departamento',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const updateForm = (field: keyof UpdateDepartamentoForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  if (loadingDepartamento) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!departamento) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Departamento não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Departamento</h1>
            <p className="text-muted-foreground">
              {departamento.nome}
            </p>
          </div>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o departamento "{departamento.nome}"? 
                Esta ação não pode ser desfeita e todos os tickets associados serão afetados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={form.nome}
                  onChange={(e) => updateForm('nome', e.target.value)}
                  placeholder="Nome do departamento"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grupoHierarquico">Grupo Hierárquico</Label>
                <Select
                  value={form.grupoHierarquicoId}
                  onValueChange={(value) => updateForm('grupoHierarquicoId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (público)</SelectItem>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id}>
                        {grupo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={form.descricao}
                onChange={(e) => updateForm('descricao', e.target.value)}
                placeholder="Descrição do departamento"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => updateForm('ativo', checked)}
              />
              <Label htmlFor="ativo">Departamento ativo</Label>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Email */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* IMAP */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações IMAP (Recebimento)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imapHost">Servidor IMAP</Label>
                  <Input
                    id="imapHost"
                    value={form.imapHost}
                    onChange={(e) => updateForm('imapHost', e.target.value)}
                    placeholder="imap.gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imapPort">Porta IMAP</Label>
                  <Input
                    id="imapPort"
                    type="number"
                    value={form.imapPort}
                    onChange={(e) => updateForm('imapPort', parseInt(e.target.value) || 993)}
                    placeholder="993"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imapEmail">Email IMAP</Label>
                  <Input
                    id="imapEmail"
                    type="email"
                    value={form.imapEmail}
                    onChange={(e) => updateForm('imapEmail', e.target.value)}
                    placeholder="departamento@empresa.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="imapPassword">Senha IMAP</Label>
                  <Input
                    id="imapPassword"
                    type="password"
                    value={form.imapPassword}
                    onChange={(e) => updateForm('imapPassword', e.target.value)}
                    placeholder="Deixe vazio para manter a senha atual"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="imapSecure"
                  checked={form.imapSecure}
                  onCheckedChange={(checked) => updateForm('imapSecure', checked)}
                />
                <Label htmlFor="imapSecure">Conexão segura (SSL/TLS)</Label>
              </div>
            </div>

            {/* SMTP */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configurações SMTP (Envio)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">Servidor SMTP</Label>
                  <Input
                    id="smtpHost"
                    value={form.smtpHost}
                    onChange={(e) => updateForm('smtpHost', e.target.value)}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpPort">Porta SMTP</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    value={form.smtpPort}
                    onChange={(e) => updateForm('smtpPort', parseInt(e.target.value) || 587)}
                    placeholder="587"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpEmail">Email SMTP</Label>
                  <Input
                    id="smtpEmail"
                    type="email"
                    value={form.smtpEmail}
                    onChange={(e) => updateForm('smtpEmail', e.target.value)}
                    placeholder="departamento@empresa.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtpPassword">Senha SMTP</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={form.smtpPassword}
                    onChange={(e) => updateForm('smtpPassword', e.target.value)}
                    placeholder="Deixe vazio para manter a senha atual"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="smtpSecure"
                  checked={form.smtpSecure}
                  onCheckedChange={(checked) => updateForm('smtpSecure', checked)}
                />
                <Label htmlFor="smtpSecure">Conexão segura (SSL/TLS)</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Sincronização */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Sincronização</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="syncEnabled"
                checked={form.syncEnabled}
                onCheckedChange={(checked) => updateForm('syncEnabled', checked)}
              />
              <Label htmlFor="syncEnabled">Sincronização automática habilitada</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="syncInterval">Intervalo de sincronização (segundos)</Label>
              <Input
                id="syncInterval"
                type="number"
                value={form.syncInterval}
                onChange={(e) => updateForm('syncInterval', parseInt(e.target.value) || 300)}
                placeholder="300"
                min="60"
              />
              <p className="text-sm text-muted-foreground">
                Intervalo mínimo: 60 segundos
              </p>
            </div>
            
            {departamento.lastSync && (
              <div className="text-sm text-muted-foreground">
                Última sincronização: {new Date(departamento.lastSync).toLocaleString('pt-BR')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
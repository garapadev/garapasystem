'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGruposHierarquicos } from '@/hooks/useGruposHierarquicos';

interface CreateDepartamentoForm {
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

export default function NovoDepartamentoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { grupos, loading: gruposLoading } = useGruposHierarquicos();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState<CreateDepartamentoForm>({
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
      const response = await fetch('/api/helpdesk/departamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...form,
          grupoHierarquicoId: form.grupoHierarquicoId === 'none' ? null : form.grupoHierarquicoId || null
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar departamento');
      }

      toast({
        title: 'Sucesso',
        description: 'Departamento criado com sucesso'
      });

      router.push('/configuracoes?tab=helpdesk');
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar departamento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (field: keyof CreateDepartamentoForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold">Novo Departamento</h1>
          <p className="text-muted-foreground">
            Configure um novo departamento do Helpdesk
          </p>
        </div>
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
                    placeholder="Senha do email"
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
                    placeholder="Senha do email"
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
                Criando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Criar Departamento
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { Loader2 } from 'lucide-react';

export default function ConfiguracoesGeralPage() {
  const { toast } = useToast();
  const { configuracoes, loading, updateConfiguracao } = useConfiguracoes();
  const [formData, setFormData] = useState({
    nomeDoSistema: '',
    tituloDoSistema: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (configuracoes && configuracoes.length > 0) {
      const nomeDoSistema = configuracoes.find(config => config.chave === 'sistema_nome')?.valor || '';
      const tituloDoSistema = configuracoes.find(config => config.chave === 'projeto_titulo')?.valor || '';
      
      setFormData(prev => {
        if (prev.nomeDoSistema === nomeDoSistema && prev.tituloDoSistema === tituloDoSistema) {
          return prev;
        }
        return {
          nomeDoSistema,
          tituloDoSistema
        };
      });
    }
  }, [configuracoes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateConfiguracao('sistema_nome', formData.nomeDoSistema, 'Nome do sistema'),
        updateConfiguracao('projeto_titulo', formData.tituloDoSistema, 'Título do projeto')
      ]);
      
      toast({
        title: 'Configurações salvas',
        description: 'As configurações foram atualizadas com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar as configurações.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações Gerais</h1>
        <p className="text-muted-foreground">
          Configure as informações básicas do sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>
            Configure as informações básicas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeDoSistema">Nome do Sistema</Label>
            <Input
              id="nomeDoSistema"
              value={formData.nomeDoSistema}
              onChange={(e) => setFormData({ ...formData, nomeDoSistema: e.target.value })}
              placeholder="Digite o nome do sistema"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tituloDoSistema">Título do Projeto</Label>
            <Input
              id="tituloDoSistema"
              value={formData.tituloDoSistema}
              onChange={(e) => setFormData({ ...formData, tituloDoSistema: e.target.value })}
              placeholder="Digite o título do projeto"
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
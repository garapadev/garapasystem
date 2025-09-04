'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Loader2 } from 'lucide-react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function ConfiguracoesPage() {
  const { canAccess } = useAuth();
  const { configuracoes, loading, error, updateConfiguracao, getConfiguracao } = useConfiguracoes();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    sistemaNome: '',
    projetoTitulo: ''
  });

  // Inicializar dados do formulário quando as configurações carregarem
  useEffect(() => {
    if (!loading && configuracoes.length > 0) {
      const sistemaNome = configuracoes.find(config => config.chave === 'sistema_nome')?.valor || 'CRM/ERP Sistema';
      const projetoTitulo = configuracoes.find(config => config.chave === 'projeto_titulo')?.valor || 'Gestão Empresarial';
      
      setFormData({
        sistemaNome,
        projetoTitulo
      });
    }
  }, [loading, configuracoes]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Salvar configurações
      await Promise.all([
        updateConfiguracao(
          'sistema_nome', 
          formData.sistemaNome, 
          'Nome do sistema CRM/ERP'
        ),
        updateConfiguracao(
          'projeto_titulo', 
          formData.projetoTitulo, 
          'Título do projeto'
        )
      ]);
      
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[{ recurso: 'configuracoes', acao: 'editar' }]}>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-1 lg:w-[400px]">
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>
          
          <TabsContent value="geral" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configure as informações básicas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sistemaNome">Nome do Sistema</Label>
                    <Input
                      id="sistemaNome"
                      placeholder="Ex: CRM/ERP Sistema"
                      value={formData.sistemaNome}
                      onChange={(e) => handleInputChange('sistemaNome', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Este nome aparecerá no cabeçalho e em outras partes do sistema
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="projetoTitulo">Título do Projeto</Label>
                    <Input
                      id="projetoTitulo"
                      placeholder="Ex: Gestão Empresarial"
                      value={formData.projetoTitulo}
                      onChange={(e) => handleInputChange('projetoTitulo', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Título que aparecerá na aba do navegador e em documentos
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="min-w-[120px]"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
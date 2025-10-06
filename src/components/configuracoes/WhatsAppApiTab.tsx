'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { Loader2, MessageSquare, Key, Globe, TestTube, Settings } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { WhatsAppApiFactory } from '@/lib/whatsapp';

export default function WhatsAppApiTab() {
  const { toast } = useToast();
  const { configuracoes, loading, updateConfiguracao, getConfiguracao } = useConfiguracoes();
  const [formData, setFormData] = useState({
    apiType: 'wuzapi',
    // WuzAPI configs
    wuzapiUrl: '',
    wuzapiAdminToken: '',
    // WAHA configs
    wahaUrl: '',
    wahaApiKey: ''
  });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (configuracoes && configuracoes.length > 0) {
      const apiType = configuracoes.find(config => config.chave === 'whatsapp_api_type')?.valor || 'wuzapi';
      const wuzapiUrl = configuracoes.find(config => config.chave === 'wuzapi_url')?.valor || 'http://localhost:8080';
      const wuzapiAdminToken = configuracoes.find(config => config.chave === 'wuzapi_admin_token')?.valor || '';
      const wahaUrl = configuracoes.find(config => config.chave === 'waha_url')?.valor || 'https://waha.devlike.pro';
      const wahaApiKey = configuracoes.find(config => config.chave === 'waha_api_key')?.valor || '';
      
      setFormData(prev => {
        // Evitar atualizações desnecessárias
        if (prev.apiType === apiType && prev.wuzapiUrl === wuzapiUrl && 
            prev.wuzapiAdminToken === wuzapiAdminToken && prev.wahaUrl === wahaUrl && 
            prev.wahaApiKey === wahaApiKey) {
          return prev;
        }
        return {
          apiType,
          wuzapiUrl,
          wuzapiAdminToken,
          wahaUrl,
          wahaApiKey
        };
      });
    }
  }, [configuracoes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateConfiguracao('whatsapp_api_type', formData.apiType, 'Tipo de API WhatsApp utilizada'),
        updateConfiguracao('wuzapi_url', formData.wuzapiUrl, 'URL da API Wuzapi'),
        updateConfiguracao('wuzapi_admin_token', formData.wuzapiAdminToken, 'Token de administrador Wuzapi'),
        updateConfiguracao('waha_url', formData.wahaUrl, 'URL da API WAHA'),
        updateConfiguracao('waha_api_key', formData.wahaApiKey, 'Chave de API para WAHA')
      ]);
      
      // Invalidar o adaptador para que seja recriado com as novas configurações
       WhatsAppApiFactory.getInstance().invalidateAdapter();
       
       toast({
         title: 'Configurações salvas',
        description: 'As configurações da API WhatsApp foram atualizadas com sucesso.',
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

  const testConnection = async () => {
    setTesting(true);
    try {
      // Usar o factory para testar a conexão
       const factory = WhatsAppApiFactory.getInstance();
       const adapter = await factory.getCurrentAdapter();
       const isConnected = await adapter.testConnection();
       
       if (!isConnected) {
         throw new Error('Falha na conexão com a API');
       }
      
      toast({
        title: 'Conexão bem-sucedida',
        description: `A conexão com a API ${formData.apiType.toUpperCase()} foi estabelecida com sucesso.`,
      });
    } catch (error) {
      toast({
        title: 'Erro de conexão',
        description: `Não foi possível conectar com a API ${formData.apiType.toUpperCase()}. Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const createUserExample = async () => {
    if (formData.apiType !== 'wuzapi') {
      toast({
        title: 'Funcionalidade não disponível',
        description: 'A criação de usuários está disponível apenas para WuzAPI.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.wuzapiUrl || !formData.wuzapiAdminToken) {
      toast({
        title: 'Configurações incompletas',
        description: 'Por favor, configure a WuzAPI antes de criar usuários.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Cria usuário fazendo uma requisição direta para a WuzAPI
      const response = await fetch(`${formData.wuzapiUrl}/admin/users`, {
        method: 'POST',
        headers: {
          'Token': formData.wuzapiAdminToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'usuario_teste',
          token: 'token_usuario_teste'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Usuário criado',
          description: `Usuário teste criado com sucesso.`,
        });
      } else {
        const errorText = await response.text();
        throw new Error(`Falha ao criar usuário: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      toast({
        title: 'Erro ao criar usuário',
        description: `Não foi possível criar o usuário teste. Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Configurações da API WhatsApp
          </CardTitle>
          <CardDescription>
            Configure a integração com APIs de WhatsApp (WuzAPI ou WAHA)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiType" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Tipo de API WhatsApp
            </Label>
            <Select 
              value={formData.apiType} 
              onValueChange={(value) => setFormData({ ...formData, apiType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de API" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wuzapi">
                  <div className="flex items-center gap-2">
                    WuzAPI
                    <Badge variant="secondary">Atual</Badge>
                  </div>
                </SelectItem>
                <SelectItem value="waha">
                  <div className="flex items-center gap-2">
                    WAHA
                    <Badge variant="outline">Novo</Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Escolha qual API de WhatsApp será utilizada pelo sistema
            </p>
          </div>

          {formData.apiType === 'wuzapi' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="wuzapiUrl" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  URL da API WuzAPI
                </Label>
                <Input
                  id="wuzapiUrl"
                  value={formData.wuzapiUrl}
                  onChange={(e) => setFormData({ ...formData, wuzapiUrl: e.target.value })}
                  placeholder="http://localhost:8080"
                />
                <p className="text-sm text-muted-foreground">
                  URL base da API WuzAPI (ex: http://localhost:8080)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wuzapiAdminToken" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Token de Administrador WuzAPI
                </Label>
                <Input
                  id="wuzapiAdminToken"
                  type="password"
                  value={formData.wuzapiAdminToken}
                  onChange={(e) => setFormData({ ...formData, wuzapiAdminToken: e.target.value })}
                  placeholder="Token de administrador da API"
                />
                <p className="text-sm text-muted-foreground">
                  Token necessário para criar e gerenciar usuários na API WuzAPI
                </p>
              </div>
            </>
          )}

          {formData.apiType === 'waha' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="wahaUrl" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  URL da API WAHA
                </Label>
                <Input
                  id="wahaUrl"
                  value={formData.wahaUrl}
                  onChange={(e) => setFormData({ ...formData, wahaUrl: e.target.value })}
                  placeholder="https://waha.devlike.pro"
                />
                <p className="text-sm text-muted-foreground">
                  URL base da API WAHA (ex: https://waha.devlike.pro)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="wahaApiKey" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Chave de API WAHA
                </Label>
                <Input
                  id="wahaApiKey"
                  type="password"
                  value={formData.wahaApiKey}
                  onChange={(e) => setFormData({ ...formData, wahaApiKey: e.target.value })}
                  placeholder="Chave de API (opcional)"
                />
                <p className="text-sm text-muted-foreground">
                  Chave de API para autenticação (opcional, dependendo da configuração do servidor)
                </p>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações
            </Button>
            
            <Button 
              variant="outline" 
              onClick={testConnection} 
              disabled={testing}
            >
              {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <TestTube className="mr-2 h-4 w-4" />
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>

      {formData.apiType === 'wuzapi' && (
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento de Usuários WuzAPI</CardTitle>
            <CardDescription>
              Funcionalidades para criar e gerenciar usuários na API WuzAPI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Como funciona:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Quando um colaborador for criado, uma instância será criada automaticamente</li>
                <li>• O token será gerado usando o ID do colaborador</li>
                <li>• Todos os eventos serão marcados para captura</li>
                <li>• O nome da instância será baseado no email do colaborador</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Exemplo de API:</h4>
              <div className="bg-slate-100 p-3 rounded-md text-sm font-mono">
                <div className="text-slate-600">curl -X POST {formData.wuzapiUrl || 'http://localhost:8080'}/admin/users \</div>
                <div className="text-slate-600 ml-2">-H "Authorization: {formData.wuzapiAdminToken || '$WUZAPI_ADMIN_TOKEN'}" \</div>
                <div className="text-slate-600 ml-2">-H "Content-Type: application/json" \</div>
                <div className="text-slate-600 ml-2">-d '{`{"name": "João", "token": "Z1234ABCCXD"}`}'</div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={createUserExample}
              className="w-full"
            >
              Criar Usuário Teste
            </Button>
          </CardContent>
        </Card>
      )}

      {formData.apiType === 'waha' && (
        <Card>
          <CardHeader>
            <CardTitle>Informações sobre WAHA</CardTitle>
            <CardDescription>
              Detalhes sobre a integração com a API WAHA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Características da WAHA:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• API REST moderna e bem documentada</li>
                <li>• Suporte a múltiplas sessões de WhatsApp</li>
                <li>• Webhooks para eventos em tempo real</li>
                <li>• Interface Swagger para testes</li>
                <li>• Gerenciamento automático de sessões</li>
              </ul>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Exemplo de uso:</h4>
              <div className="bg-slate-100 p-3 rounded-md text-sm font-mono">
                <div className="text-slate-600">curl -X GET {formData.wahaUrl || 'https://waha.devlike.pro'}/api/sessions \</div>
                {formData.wahaApiKey && (
                  <div className="text-slate-600 ml-2">-H "X-Api-Key: {formData.wahaApiKey}" \</div>
                )}
                <div className="text-slate-600 ml-2">-H "Content-Type: application/json"</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
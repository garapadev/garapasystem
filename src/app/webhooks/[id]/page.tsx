'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Save, Webhook, Trash2 } from 'lucide-react';
import { useWebhooks } from '@/hooks/useWebhooks';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

const WEBHOOK_EVENTS = [
  { value: 'cliente.criado', label: 'Cliente Criado', description: 'Disparado quando um novo cliente é criado' },
  { value: 'cliente.atualizado', label: 'Cliente Atualizado', description: 'Disparado quando um cliente é atualizado' },
  { value: 'oportunidade.criada', label: 'Oportunidade Criada', description: 'Disparado quando uma nova oportunidade é criada' },
  { value: 'oportunidade.atualizada', label: 'Oportunidade Atualizada', description: 'Disparado quando uma oportunidade é atualizada' },
  { value: 'oportunidade.fechada', label: 'Oportunidade Fechada', description: 'Disparado quando uma oportunidade é fechada' },
  { value: 'usuario.criado', label: 'Usuário Criado', description: 'Disparado quando um novo usuário é criado' },
  { value: 'usuario.atualizado', label: 'Usuário Atualizado', description: 'Disparado quando um usuário é atualizado' },
];

export default function EditarWebhookPage() {
  const { webhooks, updateWebhook, deleteWebhook, loading } = useWebhooks();
  const router = useRouter();
  const params = useParams();
  const webhookId = params.id as string;
  
  const [formData, setFormData] = useState({
    nome: '',
    url: '',
    eventos: [] as string[],
    secret: '',
    headers: '',
    ativo: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const webhook = webhooks.find(w => w.id === webhookId);
    if (webhook) {
      const eventos = Array.isArray(webhook.eventos) 
        ? webhook.eventos 
        : JSON.parse(webhook.eventos || '[]');
      
      const headers = webhook.headers ? 
        (typeof webhook.headers === 'string' ? webhook.headers : JSON.stringify(webhook.headers, null, 2))
        : '';

      setFormData({
        nome: webhook.nome,
        url: webhook.url,
        eventos,
        secret: webhook.secret || '',
        headers,
        ativo: webhook.ativo,
      });
      setIsLoading(false);
    } else if (!loading) {
      // Se não está carregando e não encontrou o webhook, redirecionar
      toast.error('Webhook não encontrado');
      router.push('/webhooks');
    }
  }, [webhooks, webhookId, loading, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL é obrigatória';
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'URL inválida';
      }
    }

    if (formData.eventos.length === 0) {
      newErrors.eventos = 'Selecione pelo menos um evento';
    }

    if (formData.headers.trim()) {
      try {
        JSON.parse(formData.headers);
      } catch {
        newErrors.headers = 'Headers devem estar em formato JSON válido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEventChange = (eventValue: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      eventos: checked
        ? [...prev.eventos, eventValue]
        : prev.eventos.filter(e => e !== eventValue)
    }));
    
    // Limpar erro de eventos se algum evento for selecionado
    if (checked && errors.eventos) {
      setErrors(prev => ({ ...prev, eventos: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    try {
      const updateData = {
        ...formData,
        headers: formData.headers.trim() ? JSON.parse(formData.headers) : undefined
      };
      await updateWebhook(webhookId, updateData);
      toast.success('Webhook atualizado com sucesso!');
      router.push('/webhooks');
    } catch (error) {
      console.error('Erro ao atualizar webhook:', error);
      toast.error('Erro ao atualizar webhook. Tente novamente.');
    }
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este webhook? Esta ação não pode ser desfeita.')) {
      try {
        await deleteWebhook(webhookId);
        toast.success('Webhook excluído com sucesso!');
        router.push('/webhooks');
      } catch (error) {
        console.error('Erro ao excluir webhook:', error);
        toast.error('Erro ao excluir webhook. Tente novamente.');
      }
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando webhook...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/webhooks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Editar Webhook</h1>
          <p className="text-muted-foreground mt-2">
            Atualize as configurações do webhook.
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </Button>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
              <CardDescription>
                Configure as informações básicas do webhook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Webhook *</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Notificação Sistema X"
                  value={formData.nome}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, nome: e.target.value }));
                    if (errors.nome) setErrors(prev => ({ ...prev, nome: '' }));
                  }}
                  className={errors.nome ? 'border-red-500' : ''}
                />
                {errors.nome && <p className="text-sm text-red-500">{errors.nome}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">URL do Webhook *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://exemplo.com/webhook"
                  value={formData.url}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, url: e.target.value }));
                    if (errors.url) setErrors(prev => ({ ...prev, url: '' }));
                  }}
                  className={errors.url ? 'border-red-500' : ''}
                />
                {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret (opcional)</Label>
                <Input
                  id="secret"
                  type="password"
                  placeholder="Chave secreta para validação"
                  value={formData.secret}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                />
                <p className="text-sm text-muted-foreground">
                  Usado para validar a autenticidade dos webhooks enviados.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                />
                <Label htmlFor="ativo">Webhook ativo</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos *</CardTitle>
              <CardDescription>
                Selecione os eventos que devem disparar este webhook.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-start space-x-3">
                    <Checkbox
                      id={event.value}
                      checked={formData.eventos.includes(event.value)}
                      onCheckedChange={(checked) => handleEventChange(event.value, checked as boolean)}
                      className={errors.eventos ? 'border-red-500' : ''}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor={event.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {event.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
                {errors.eventos && <p className="text-sm text-red-500">{errors.eventos}</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Headers Personalizados</CardTitle>
              <CardDescription>
                Configure headers HTTP adicionais (formato JSON).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Textarea
                  placeholder='{\n  "Authorization": "Bearer token",\n  "X-Custom-Header": "valor"\n}'
                  value={formData.headers}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, headers: e.target.value }));
                    if (errors.headers) setErrors(prev => ({ ...prev, headers: '' }));
                  }}
                  className={`min-h-[120px] font-mono text-sm ${errors.headers ? 'border-red-500' : ''}`}
                />
                {errors.headers && <p className="text-sm text-red-500">{errors.headers}</p>}
                <p className="text-sm text-muted-foreground">
                  Deixe em branco se não precisar de headers personalizados.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button type="submit" disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Link href="/webhooks">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
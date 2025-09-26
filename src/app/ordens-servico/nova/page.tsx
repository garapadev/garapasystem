'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Loader2, Plus, Trash2, FileText, User, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useClientes } from '@/hooks/useClientes';
import { useTemplatesChecklist } from '@/hooks/useOrdensServico';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { z } from 'zod';

// Schema de validação
const ordemServicoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  responsavelId: z.string().optional(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  valorOrcamento: z.string().optional(),
  observacoes: z.string().optional(),
  templateChecklistId: z.string().optional(),
  itens: z.array(z.object({
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
    valorUnitario: z.number().min(0, 'Valor unitário deve ser maior ou igual a 0'),
    observacoes: z.string().optional()
  })).optional()
});

type OrdemServicoFormData = z.infer<typeof ordemServicoSchema>;

export default function NovaOrdemServicoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, canAccess } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchCliente, setSearchCliente] = useState('');
  const [searchTemplate, setSearchTemplate] = useState('');

  // Hooks para buscar dados
  const { clientes, loading: clientesLoading } = useClientes({
    page: 1,
    limit: 50,
    search: searchCliente
  });

  const { templates, loading: templatesLoading } = useTemplatesChecklist({
    page: 1,
    limit: 50,
    search: searchTemplate,
    ativo: true
  });

  const form = useForm<OrdemServicoFormData>({
    resolver: zodResolver(ordemServicoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      clienteId: '',
      responsavelId: user?.colaborador?.id || '',
      prioridade: 'MEDIA',
      dataInicio: '',
      dataFim: '',
      valorOrcamento: '0',
      observacoes: '',
      templateChecklistId: '',
      itens: []
    }
  });

  const { fields: itensFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: 'itens'
  });

  // Verificar permissões
  if (!canAccess.ordens_servico.create) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para criar ordens de serviço.</p>
        </div>
      </div>
    );
  }

  const adicionarItem = () => {
    appendItem({
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
      observacoes: ''
    });
  };

  const calcularValorTotal = () => {
    const itens = form.getValues('itens') || [];
    return itens.reduce((total, item) => total + (item.quantidade * item.valorUnitario), 0);
  };

  const onSubmit = async (data: OrdemServicoFormData) => {
    setIsSubmitting(true);
    try {
      // Verificar se o usuário está logado e tem colaborador associado
      if (!user?.colaborador?.id) {
        toast({
          title: 'Erro',
          description: 'Usuário não está logado ou não possui colaborador associado.',
          variant: 'destructive'
        });
        setIsSubmitting(false);
        return;
      }

      const ordemData = {
        ...data,
        criadoPorId: user.colaborador.id, // Adicionar o ID do colaborador logado como criador
        valorOrcamento: data.valorOrcamento ? parseFloat(data.valorOrcamento) : 0,
        valorTotal: calcularValorTotal(),
        status: 'RASCUNHO' as const
      };

      const response = await fetch('/api/ordens-servico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ordemData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar ordem de serviço');
      }

      const result = await response.json();

      toast({
        title: 'Sucesso!',
        description: 'Ordem de serviço criada com sucesso.'
      });

      router.push(`/ordens-servico/${result.id}`);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar ordem de serviço',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Carregar itens do template quando selecionado
  const templateSelecionado = form.watch('templateChecklistId');
  useEffect(() => {
    if (templateSelecionado) {
      const template = templates.find(t => t.id === templateSelecionado);
      if (template && template.itens) {
        // Limpar itens existentes e adicionar os do template
        form.setValue('itens', []);
        template.itens.forEach(item => {
          appendItem({
            descricao: item.descricao,
            quantidade: 1,
            valorUnitario: 0,
            observacoes: ''
          });
        });
      }
    }
  }, [templateSelecionado, templates, appendItem, form]);

  return (
    <ProtectedRoute
      requiredPermission={{
        recurso: 'ordens_servico',
        acao: 'create'
      }}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center space-x-4">
          <Link href="/ordens-servico">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Ordem de Serviço</h1>
          <p className="text-muted-foreground">
            Crie uma nova ordem de serviço para um cliente
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Dados principais da ordem de serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Manutenção preventiva do sistema" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Descreva detalhadamente o serviço a ser realizado..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clienteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientesLoading ? (
                            <SelectItem value="loading" disabled>Carregando...</SelectItem>
                          ) : (
                            clientes.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                {cliente.nome}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BAIXA">
                            <Badge variant="outline">Baixa</Badge>
                          </SelectItem>
                          <SelectItem value="MEDIA">
                            <Badge variant="secondary">Média</Badge>
                          </SelectItem>
                          <SelectItem value="ALTA">
                            <Badge variant="default">Alta</Badge>
                          </SelectItem>
                          <SelectItem value="URGENTE">
                            <Badge variant="destructive">Urgente</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Planejamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Planejamento
                </CardTitle>
                <CardDescription>
                  Datas e valores estimados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="dataInicio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataFim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim Prevista</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valorOrcamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Orçamento</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          min="0"
                          {...field} 
                          placeholder="0.00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Observações adicionais..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Template de Checklist */}
          <Card>
            <CardHeader>
              <CardTitle>Template de Checklist</CardTitle>
              <CardDescription>
                Selecione um template para carregar itens pré-definidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="templateChecklistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um template (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum template</SelectItem>
                        {templatesLoading ? (
                          <SelectItem value="loading" disabled>Carregando...</SelectItem>
                        ) : (
                          templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.nome}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Itens da Ordem de Serviço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Itens da Ordem de Serviço
                </div>
                <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Item
                </Button>
              </CardTitle>
              <CardDescription>
                Adicione os itens e serviços que serão executados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itensFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum item adicionado ainda.</p>
                  <Button type="button" variant="outline" onClick={adicionarItem} className="mt-2">
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar primeiro item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {itensFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.descricao`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Descrição *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Descrição do item/serviço" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name={`itens.${index}.quantidade`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Quantidade</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min="1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name={`itens.${index}.valorUnitario`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Valor Unitário</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <div className="mt-4 flex items-end gap-4">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`itens.${index}.observacoes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Observações</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Observações do item" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                  
                  {/* Resumo dos valores */}
                  <div className="border-t pt-4">
                    <div className="flex justify-end">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Valor Total dos Itens:</p>
                        <p className="text-lg font-semibold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL'
                          }).format(calcularValorTotal())}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Criar Ordem de Serviço
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
      </div>
    </ProtectedRoute>
  );
}
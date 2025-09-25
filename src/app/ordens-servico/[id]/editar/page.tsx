'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useOrdemServico, useTemplatesChecklist } from '@/hooks/useOrdensServico';
import { useClientes } from '@/hooks/useClientes';
import { formatCurrency } from '@/lib/utils';

const ordemServicoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  responsavelId: z.string().optional(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  itens: z.array(z.object({
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    quantidade: z.number().min(1, 'Quantidade deve ser maior que 0'),
    valorUnitario: z.number().min(0, 'Valor unitário deve ser maior ou igual a 0'),
    observacoes: z.string().optional()
  })).min(1, 'Pelo menos um item é obrigatório')
});

type OrdemServicoFormData = z.infer<typeof ordemServicoSchema>;

interface OrdemServicoEditPageProps {
  params: {
    id: string;
  };
}

export default function OrdemServicoEditPage({ params }: OrdemServicoEditPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, canAccess } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { ordemServico, loading: loadingOS, error: errorOS } = useOrdemServico(params.id);
  const { clientes, loading: loadingClientes } = useClientes({ page: 1, limit: 1000 });
  const { templates, loading: loadingTemplates } = useTemplatesChecklist({ page: 1, limit: 100 });

  const form = useForm<OrdemServicoFormData>({
    resolver: zodResolver(ordemServicoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      observacoes: '',
      clienteId: '',
      responsavelId: '',
      prioridade: 'MEDIA',
      dataInicio: '',
      dataFim: '',
      itens: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens'
  });

  // Carregar dados da ordem de serviço quando disponível
  useEffect(() => {
    if (ordemServico) {
      form.reset({
        titulo: ordemServico.titulo,
        descricao: ordemServico.descricao || '',
        observacoes: ordemServico.observacoes || '',
        clienteId: ordemServico.clienteId,
        responsavelId: ordemServico.responsavelId || '',
        prioridade: ordemServico.prioridade,
        dataInicio: ordemServico.dataInicio ? new Date(ordemServico.dataInicio).toISOString().split('T')[0] : '',
        dataFim: ordemServico.dataFim ? new Date(ordemServico.dataFim).toISOString().split('T')[0] : '',
        itens: ordemServico.itens || []
      });
    }
  }, [ordemServico, form]);

  if (!canAccess.ordens_servico.update) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para editar ordens de serviço.</p>
        </div>
      </div>
    );
  }

  if (loadingOS || loadingClientes) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (errorOS || !ordemServico) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive">{errorOS || 'Ordem de serviço não encontrada'}</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-2">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Verificar se pode editar baseado no status
  const canEdit = ['RASCUNHO', 'APROVADA', 'EM_ANDAMENTO', 'PAUSADA'].includes(ordemServico.status);
  
  if (!canEdit) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Edição não permitida</h2>
          <p className="text-muted-foreground">
            Esta ordem de serviço não pode ser editada no status atual: {ordemServico.status}
          </p>
          <Button variant="outline" onClick={() => router.back()} className="mt-2">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: OrdemServicoFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/ordens-servico/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          dataInicio: data.dataInicio ? new Date(data.dataInicio).toISOString() : null,
          dataFim: data.dataFim ? new Date(data.dataFim).toISOString() : null,
          responsavelId: data.responsavelId || user?.colaborador?.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar ordem de serviço');
      }

      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço atualizada com sucesso'
      });

      router.push(`/ordens-servico/${params.id}`);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar ordem de serviço',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addItem = () => {
    append({
      descricao: '',
      quantidade: 1,
      valorUnitario: 0,
      observacoes: ''
    });
  };

  const addTemplateItems = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template?.itens) {
      template.itens.forEach(item => {
        append({
          descricao: item.descricao,
          quantidade: 1,
          valorUnitario: 0,
          observacoes: ''
        });
      });
    }
  };

  const calculateTotal = () => {
    const itens = form.watch('itens');
    return itens.reduce((total, item) => total + (item.quantidade * item.valorUnitario), 0);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/ordens-servico/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Editar Ordem de Serviço #{ordemServico.numero}
            </h1>
            <p className="text-muted-foreground">
              Atualize as informações da ordem de serviço
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Formulário Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Básicas */}
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
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
                          <Input placeholder="Digite o título da ordem de serviço" {...field} />
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
                            placeholder="Descreva detalhadamente o serviço a ser realizado"
                            className="min-h-[100px]"
                            {...field}
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
                            placeholder="Observações adicionais"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Itens da Ordem de Serviço */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Itens da Ordem de Serviço</CardTitle>
                      <CardDescription>
                        Adicione os itens que compõem esta ordem de serviço
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {!loadingTemplates && templates && templates.length > 0 && (
                        <Select onValueChange={addTemplateItems}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Usar template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button type="button" onClick={addItem} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Item
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhum item adicionado ainda.</p>
                      <Button type="button" onClick={addItem} variant="outline" className="mt-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Primeiro Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="w-24">Qtd</TableHead>
                            <TableHead className="w-32">Valor Unit.</TableHead>
                            <TableHead className="w-32">Total</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fields.map((field, index) => (
                            <TableRow key={field.id}>
                              <TableCell>
                                <div className="space-y-2">
                                  <FormField
                                    control={form.control}
                                    name={`itens.${index}.descricao`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input placeholder="Descrição do item" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={form.control}
                                    name={`itens.${index}.observacoes`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input placeholder="Observações (opcional)" {...field} />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`itens.${index}.quantidade`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1"
                                          {...field}
                                          onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`itens.${index}.valorUnitario`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="0"
                                          step="0.01"
                                          {...field}
                                          onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <span className="font-medium">
                                  {formatCurrency(
                                    (form.watch(`itens.${index}.quantidade`) || 0) * 
                                    (form.watch(`itens.${index}.valorUnitario`) || 0)
                                  )}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => remove(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      <div className="flex justify-end pt-4 border-t">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Valor Total:</p>
                          <p className="text-lg font-semibold">{formatCurrency(calculateTotal())}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cliente e Responsável */}
              <Card>
                <CardHeader>
                  <CardTitle>Cliente e Responsável</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clienteId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cliente *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clientes?.map((cliente) => (
                              <SelectItem key={cliente.id} value={cliente.id}>
                                {cliente.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Configurações */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            <SelectItem value="BAIXA">Baixa</SelectItem>
                            <SelectItem value="MEDIA">Média</SelectItem>
                            <SelectItem value="ALTA">Alta</SelectItem>
                            <SelectItem value="URGENTE">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                </CardContent>
              </Card>

              {/* Ações */}
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
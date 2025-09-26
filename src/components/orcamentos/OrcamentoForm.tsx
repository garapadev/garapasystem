'use client';

import { useState, useEffect } from 'react';
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
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Send, X } from 'lucide-react';
import { useOrdensServico } from '@/hooks/useOrdensServico';
import { useClientes } from '@/hooks/useClientes';
import { formatCurrency, parseCurrency } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { Orcamento } from '@/hooks/useOrcamentos';

const itemOrcamentoSchema = z.object({
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  quantidade: z.number().min(0.01, 'Quantidade deve ser maior que 0'),
  valorUnitario: z.number().min(0.01, 'Valor unitário deve ser maior que 0'),
  observacoes: z.string().optional(),
});

const orcamentoSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  ordemServicoId: z.string().min(1, 'Ordem de serviço é obrigatória'),
  laudoTecnicoId: z.string().optional(),
  dataValidade: z.string().min(1, 'Data de validade é obrigatória'),
  itens: z.array(itemOrcamentoSchema).min(1, 'Pelo menos um item é obrigatório'),
});

type OrcamentoFormData = z.infer<typeof orcamentoSchema>;

interface OrcamentoFormProps {
  orcamento?: Orcamento;
  onSuccess: () => void;
  onCancel: () => void;
}

export function OrcamentoForm({ orcamento, onSuccess, onCancel }: OrcamentoFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');

  const { clientes } = useClientes({ page: 1, limit: 100 });
  const { ordensServico } = useOrdensServico({ 
    page: 1, 
    limit: 100,
    clienteId: selectedClienteId || undefined
  });

  const form = useForm<OrcamentoFormData>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      observacoes: '',
      clienteId: '',
      ordemServicoId: '',
      laudoTecnicoId: '',
      dataValidade: '',
      itens: [
        {
          descricao: '',
          quantidade: 1,
          valorUnitario: 0,
          observacoes: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'itens',
  });

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (orcamento) {
      setSelectedClienteId(orcamento.cliente.id);
      form.reset({
        titulo: orcamento.titulo,
        descricao: orcamento.descricao || '',
        observacoes: orcamento.observacoes || '',
        clienteId: orcamento.cliente.id,
        ordemServicoId: orcamento.ordemServico.id,
        laudoTecnicoId: orcamento.laudoTecnico?.id || '',
        dataValidade: new Date(orcamento.dataValidade).toISOString().split('T')[0],
        itens: orcamento.itens.map(item => ({
          descricao: item.descricao,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          observacoes: item.observacoes || '',
        })),
      });
    }
  }, [orcamento, form]);

  // Calcular valor total
  const calcularValorTotal = () => {
    const itens = form.watch('itens');
    return itens.reduce((total, item) => {
      const quantidade = Number(item.quantidade) || 0;
      const valorUnitario = Number(item.valorUnitario) || 0;
      return total + (quantidade * valorUnitario);
    }, 0);
  };

  const valorTotal = calcularValorTotal();

  const onSubmit = async (data: OrcamentoFormData, enviar = false) => {
    try {
      setLoading(true);

      const payload = {
        ...data,
        valorTotal,
        status: enviar ? 'ENVIADO' : 'RASCUNHO',
        itens: data.itens.map(item => ({
          ...item,
          valorTotal: item.quantidade * item.valorUnitario,
        })),
      };

      const url = orcamento ? `/api/orcamentos/${orcamento.id}` : '/api/orcamentos';
      const method = orcamento ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar orçamento');
      }

      toast({
        title: 'Sucesso',
        description: `Orçamento ${orcamento ? 'atualizado' : 'criado'} ${enviar ? 'e enviado' : ''} com sucesso`,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar orçamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    form.setValue('clienteId', clienteId);
    form.setValue('ordemServicoId', ''); // Reset ordem de serviço
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais do orçamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do orçamento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataValidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Validade *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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
                    <Select 
                      value={field.value} 
                      onValueChange={handleClienteChange}
                      disabled={!!orcamento}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes?.data?.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nome}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ordemServicoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem de Serviço *</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                      disabled={!selectedClienteId || !!orcamento}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma ordem de serviço" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ordensServico?.data?.map((os) => (
                          <SelectItem key={os.id} value={os.id}>
                            {os.numero} - {os.titulo}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição do orçamento"
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
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Itens do Orçamento */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Itens do Orçamento</CardTitle>
                <CardDescription>
                  Adicione os itens que compõem este orçamento
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({
                  descricao: '',
                  quantidade: 1,
                  valorUnitario: 0,
                  observacoes: '',
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-24">Qtd</TableHead>
                  <TableHead className="w-32">Valor Unit.</TableHead>
                  <TableHead className="w-32">Total</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const quantidade = form.watch(`itens.${index}.quantidade`) || 0;
                  const valorUnitario = form.watch(`itens.${index}.valorUnitario`) || 0;
                  const total = quantidade * valorUnitario;

                  return (
                    <TableRow key={field.id}>
                      <TableCell className="space-y-2">
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
                                  step="0.01"
                                  min="0.01"
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
                                  step="0.01"
                                  min="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(total)}
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-lg font-semibold">
                  Total: {formatCurrency(valorTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={form.handleSubmit((data) => onSubmit(data, false))}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit((data) => onSubmit(data, true))}
            disabled={loading}
          >
            <Send className="h-4 w-4 mr-2" />
            Salvar e Enviar
          </Button>
        </div>
      </form>
    </Form>
  );
}
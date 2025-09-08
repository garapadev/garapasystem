'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useCliente, updateCliente } from '@/hooks/useClientes';
import { useToast } from '@/hooks/use-toast';
import { clienteSchema, type ClienteFormData } from '@/lib/validations/cliente';
import { useViaCep } from '@/hooks/useViaCep';
import { EnderecoForm } from '@/components/clientes/EnderecoForm';

export default function EditarClientePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { buscarCep, formatarCep, validarCep, loading: cepLoading, error: cepError } = useViaCep();

  const adicionarEndereco = () => {
    const enderecosAtuais = form.getValues('enderecos') || [];
    const novoEndereco = {
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      complemento: '',
      cidade: '',
      estado: '',
      pais: 'Brasil',
      tipo: 'RESIDENCIAL' as const,
      informacoesAdicionais: '',
      principal: false,
      ativo: true
    };
    form.setValue('enderecos', [...enderecosAtuais, novoEndereco]);
  };

  const removerEndereco = (index: number) => {
    const enderecosAtuais = form.getValues('enderecos') || [];
    if (enderecosAtuais.length > 1) {
      const novosEnderecos = enderecosAtuais.filter((_, i) => i !== index);
      form.setValue('enderecos', novosEnderecos);
    }
  };
  
  const form = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      email: '',
      telefone: '',
      documento: '',
      tipo: 'PESSOA_FISICA',
      status: 'LEAD',
      enderecos: [{
        cep: '',
        logradouro: '',
        numero: '',
        bairro: '',
        complemento: '',
        cidade: '',
        estado: '',
        pais: 'Brasil',
        tipo: 'RESIDENCIAL',
        informacoesAdicionais: '',
        principal: true,
        ativo: true
      }],
      observacoes: '',
      valorPotencial: '0'
    }
  });

  const { cliente, loading, error: fetchError } = useCliente(params.id as string);

  useEffect(() => {
    if (cliente) {
      form.reset({
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone || '',
        documento: cliente.documento || '',
        tipo: cliente.tipo,
        status: cliente.status,
        enderecos: cliente.enderecos && cliente.enderecos.length > 0 ? cliente.enderecos : [{
          cep: '',
          logradouro: '',
          numero: '',
          bairro: '',
          complemento: '',
          cidade: '',
          estado: '',
          pais: 'Brasil',
          tipo: 'RESIDENCIAL' as const,
          informacoesAdicionais: '',
          principal: true,
          ativo: true
        }],
        observacoes: cliente.observacoes || '',
        valorPotencial: cliente.valorPotencial?.toString() || '0'
      });
    }
  }, [cliente, form]);

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const clienteData = {
        ...data,
        valorPotencial: data.valorPotencial ? parseFloat(data.valorPotencial) : undefined,
        status: data.status as 'LEAD' | 'PROSPECT' | 'CLIENTE'
      };

      await updateCliente(params.id as string, clienteData);
      
      toast({
        title: "Sucesso!",
        description: "Cliente atualizado com sucesso.",
      });
      
      router.push('/clientes');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
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

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
        <Link href="/clientes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Button>
        </Link>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p>Cliente não encontrado</p>
        <Link href="/clientes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/clientes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-muted-foreground">
            Atualize as informações do cliente
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Digite o email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o telefone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF/CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="CPF ou CNPJ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Classificação */}
            <Card>
              <CardHeader>
                <CardTitle>Classificação</CardTitle>
                <CardDescription>
                  Tipo e status do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PESSOA_FISICA">Pessoa Física</SelectItem>
                          <SelectItem value="PESSOA_JURIDICA">Pessoa Jurídica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LEAD">Lead</SelectItem>
                          <SelectItem value="PROSPECT">Prospect</SelectItem>
                          <SelectItem value="CLIENTE">Cliente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="valorPotencial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Potencial (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Endereços */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Endereços</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie os endereços do cliente
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={adicionarEndereco}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Endereço
                </Button>
              </div>
              
              {form.watch('enderecos')?.map((_, index) => (
                <EnderecoForm
                  key={index}
                  form={form}
                  index={index}
                  onRemove={() => removerEndereco(index)}
                  canRemove={(form.watch('enderecos')?.length || 0) > 1}
                />
              ))}
            </div>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
                <CardDescription>
                  Informações adicionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="observacoes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais sobre o cliente"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/clientes">
              <Button variant="outline" disabled={form.formState.isSubmitting}>Cancelar</Button>
            </Link>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {form.formState.isSubmitting ? 'Salvando...' : 'Atualizar Cliente'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
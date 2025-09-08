'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Save, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { createCliente } from '@/hooks/useClientes';
import { useToast } from '@/hooks/use-toast';
import { clienteSchema, type ClienteFormData } from '@/lib/validations/cliente';
import { useViaCep } from '@/hooks/useViaCep';
import { EnderecoForm } from '@/components/clientes/EnderecoForm';

export default function NovoClientePage() {
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

  const onSubmit = async (data: ClienteFormData) => {
    try {
      const clienteData = {
        nome: data.nome,
        email: data.email,
        telefone: data.telefone,
        documento: data.documento,
        tipo: data.tipo,
        status: data.status as 'LEAD' | 'PROSPECT' | 'CLIENTE',
        ...(data.observacoes && { observacoes: data.observacoes }),
        ...(data.valorPotencial && { valorPotencial: parseFloat(data.valorPotencial) }),
        ...(data.enderecos && { enderecos: data.enderecos })
      };

      await createCliente(clienteData);
      
      toast({
        title: "Sucesso!",
        description: "Cliente criado com sucesso.",
      });
      
      router.push('/clientes');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground">
            Cadastre um novo cliente ou lead
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
                        <Input {...field} />
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
                        <Input type="email" {...field} />
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
                        <Input {...field} />
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
                      <FormLabel>Documento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="CPF ou CNPJ" />
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
                          placeholder="Digite observações adicionais"
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
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
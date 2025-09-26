'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrdensServico } from '@/hooks/useOrdensServico';
import { useClientes } from '@/hooks/useClientes';
import { useGerarOrcamentoAutomatico } from '@/hooks/useOrcamentos';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const gerarOrcamentoSchema = z.object({
  clienteId: z.string().min(1, 'Cliente é obrigatório'),
  ordemServicoId: z.string().min(1, 'Ordem de serviço é obrigatória'),
  laudoTecnicoId: z.string().optional(),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  observacoes: z.string().optional(),
  dataValidade: z.string().min(1, 'Data de validade é obrigatória'),
  margemLucro: z.number().min(0).max(100, 'Margem deve estar entre 0 e 100%'),
});

type GerarOrcamentoFormData = z.infer<typeof gerarOrcamentoSchema>;

export default function GerarOrcamentoAutomaticoPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [selectedOrdemServicoId, setSelectedOrdemServicoId] = useState<string>('');
  const [previewData, setPreviewData] = useState<any>(null);

  const { clientes } = useClientes({ page: 1, limit: 100 });
  const { ordensServico } = useOrdensServico({ 
    page: 1, 
    limit: 100,
    clienteId: selectedClienteId || undefined
  });
  const { gerarOrcamento, loading } = useGerarOrcamentoAutomatico();

  const form = useForm<GerarOrcamentoFormData>({
    resolver: zodResolver(gerarOrcamentoSchema),
    defaultValues: {
      clienteId: '',
      ordemServicoId: '',
      laudoTecnicoId: '',
      titulo: '',
      descricao: '',
      observacoes: '',
      dataValidade: '',
      margemLucro: 20, // 20% de margem padrão
    },
  });

  if (!canAccess.orcamentos?.create) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para criar orçamentos.</p>
        </div>
      </div>
    );
  }

  const handleClienteChange = (clienteId: string) => {
    setSelectedClienteId(clienteId);
    form.setValue('clienteId', clienteId);
    form.setValue('ordemServicoId', ''); // Reset ordem de serviço
    setSelectedOrdemServicoId('');
    setPreviewData(null);
  };

  const handleOrdemServicoChange = (ordemServicoId: string) => {
    setSelectedOrdemServicoId(ordemServicoId);
    form.setValue('ordemServicoId', ordemServicoId);
    
    // Buscar dados da OS para pré-preencher o formulário
    const ordemServico = ordensServico?.data.find(os => os.id === ordemServicoId);
    if (ordemServico) {
      form.setValue('titulo', `Orçamento para ${ordemServico.titulo}`);
      form.setValue('descricao', ordemServico.descricao || '');
      
      // Definir data de validade padrão (30 dias a partir de hoje)
      const dataValidade = new Date();
      dataValidade.setDate(dataValidade.getDate() + 30);
      form.setValue('dataValidade', dataValidade.toISOString().split('T')[0]);
    }
    setPreviewData(null);
  };

  const handlePreview = async () => {
    const formData = form.getValues();
    
    if (!formData.ordemServicoId) {
      toast({
        title: 'Erro',
        description: 'Selecione uma ordem de serviço para gerar o preview',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/orcamentos/gerar-automatico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          preview: true, // Flag para indicar que é apenas preview
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao gerar preview');
      }

      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar preview',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: GerarOrcamentoFormData) => {
    try {
      const orcamento = await gerarOrcamento(data);
      
      toast({
        title: 'Sucesso',
        description: 'Orçamento gerado automaticamente com sucesso',
      });

      router.push(`/orcamentos/${orcamento.id}`);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao gerar orçamento',
        variant: 'destructive',
      });
    }
  };

  const selectedOrdemServico = ordensServico?.data.find(os => os.id === selectedOrdemServicoId);

  return (
    <ProtectedRoute
      requiredPermission={{
        recurso: 'orcamentos',
        acao: 'criar'
      }}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/orcamentos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Gerar Orçamento Automático
            </h1>
            <p className="text-muted-foreground">
              Gere orçamentos automaticamente baseados nos itens da ordem de serviço
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Configurações do Orçamento
                </CardTitle>
                <CardDescription>
                  Configure os parâmetros para geração automática do orçamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="clienteId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente *</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={handleClienteChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um cliente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clientes?.data.map((cliente) => (
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

                      <FormField
                        control={form.control}
                        name="ordemServicoId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ordem de Serviço *</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={handleOrdemServicoChange}
                              disabled={!selectedClienteId}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma OS" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ordensServico?.data.map((os) => (
                                  <SelectItem key={os.id} value={os.id}>
                                    {os.numero} - {os.titulo}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        name="margemLucro"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Margem de Lucro (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder="20"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
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
                              className="min-h-[80px]"
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
                              className="min-h-[60px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePreview}
                        disabled={!selectedOrdemServicoId}
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Preview
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading || !previewData}
                        className="flex-1"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Gerar Orçamento
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Preview e Informações da OS */}
          <div className="space-y-6">
            {/* Informações da OS Selecionada */}
            {selectedOrdemServico && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Ordem de Serviço Selecionada
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Número</p>
                    <p className="text-sm text-muted-foreground">{selectedOrdemServico.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Título</p>
                    <p className="text-sm text-muted-foreground">{selectedOrdemServico.titulo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge variant="outline">{selectedOrdemServico.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Itens</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrdemServico.itens?.length || 0} item(ns)
                    </p>
                  </div>
                  {selectedOrdemServico.descricao && (
                    <div>
                      <p className="text-sm font-medium">Descrição</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {selectedOrdemServico.descricao}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Preview do Orçamento */}
            {previewData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    Preview do Orçamento
                  </CardTitle>
                  <CardDescription>
                    Visualize como ficará o orçamento antes de gerar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total de Itens</p>
                      <p className="text-lg font-semibold">{previewData.itens?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Valor Total</p>
                      <p className="text-lg font-semibold text-primary">
                        {formatCurrency(previewData.valorTotal || 0)}
                      </p>
                    </div>
                  </div>

                  {previewData.itens && previewData.itens.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Itens Incluídos</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {previewData.itens.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.descricao}</p>
                              <p className="text-xs text-muted-foreground">
                                Qtd: {item.quantidade} × {formatCurrency(item.valorUnitario)}
                              </p>
                            </div>
                            <p className="text-sm font-medium">
                              {formatCurrency(item.valorTotal)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800">
                      ✓ Orçamento pronto para ser gerado com {previewData.itens?.length || 0} item(ns)
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instruções */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Como Funciona
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">1</span>
                  <p>Selecione o cliente e a ordem de serviço</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">2</span>
                  <p>Configure o título, data de validade e margem de lucro</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">3</span>
                  <p>Clique em "Gerar Preview" para visualizar o resultado</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">4</span>
                  <p>Se estiver satisfeito, clique em "Gerar Orçamento"</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
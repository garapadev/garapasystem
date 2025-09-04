'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNegocios } from '@/hooks/useNegocios';

interface Cliente {
  id: string;
  nome: string;
  email: string;
}

interface Colaborador {
  id: string;
  nome: string;
  email: string;
}

interface Etapa {
  id: string;
  nome: string;
  ordem: number;
}

interface NovaOportunidadeForm {
  titulo: string;
  descricao: string;
  valor: string;
  probabilidade: string;
  dataFechamento: string;
  observacoes: string;
  clienteId: string;
  responsavelId: string;
  etapaId: string;
}

export default function NovaOportunidadePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createOportunidade, etapas } = useNegocios();
  
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [formData, setFormData] = useState<NovaOportunidadeForm>({
    titulo: '',
    descricao: '',
    valor: '',
    probabilidade: '',
    dataFechamento: '',
    observacoes: '',
    clienteId: '',
    responsavelId: '',
    etapaId: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      
      // Carregar clientes
      const clientesResponse = await fetch('/api/clientes');
      if (clientesResponse.ok) {
        const clientesData = await clientesResponse.json();
        // A API retorna { data: [...], meta: {...} }
        setClientes(Array.isArray(clientesData.data) ? clientesData.data : []);
      } else {
        setClientes([]);
      }
      
      // Carregar colaboradores
      const colaboradoresResponse = await fetch('/api/colaboradores');
      if (colaboradoresResponse.ok) {
        const colaboradoresData = await colaboradoresResponse.json();
        // A API retorna { data: [...], meta: {...} }
        setColaboradores(Array.isArray(colaboradoresData.data) ? colaboradoresData.data : []);
      } else {
        setColaboradores([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setClientes([]);
      setColaboradores([]);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados necessários',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field: keyof NovaOportunidadeForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.clienteId || !formData.etapaId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const oportunidadeData = {
        titulo: formData.titulo,
        descricao: formData.descricao || undefined,
        valor: formData.valor ? parseFloat(formData.valor) : 0,
        probabilidade: formData.probabilidade ? parseInt(formData.probabilidade) : 0,
        dataFechamento: formData.dataFechamento || undefined,
        observacoes: formData.observacoes || undefined,
        clienteId: formData.clienteId,
        responsavelId: formData.responsavelId || undefined,
        etapaId: formData.etapaId,
      };

      await createOportunidade(oportunidadeData);
      
      toast({
        title: 'Sucesso',
        description: 'Oportunidade criada com sucesso',
      });
      
      router.push('/negocios');
    } catch (error) {
      console.error('Erro ao criar oportunidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar oportunidade',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/negocios">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Oportunidade</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova oportunidade de negócio
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Dados principais da oportunidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  placeholder="Digite o título da oportunidade"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  placeholder="Descreva a oportunidade"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Relacionamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Relacionamentos</CardTitle>
              <CardDescription>
                Cliente, responsável e etapa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cliente">Cliente *</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(value) => handleChange('clienteId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="etapa">Etapa *</Label>
                <Select
                  value={formData.etapaId}
                  onValueChange={(value) => handleChange('etapaId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    {etapas.map(etapa => (
                      <SelectItem key={etapa.id} value={etapa.id}>
                        {etapa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="responsavel">Responsável</Label>
                <Select
                  value={formData.responsavelId}
                  onValueChange={(value) => handleChange('responsavelId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {colaboradores.map(colaborador => (
                      <SelectItem key={colaborador.id} value={colaborador.id}>
                        {colaborador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Valores e Datas */}
          <Card>
            <CardHeader>
              <CardTitle>Valores e Datas</CardTitle>
              <CardDescription>
                Informações financeiras e prazos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => handleChange('valor', e.target.value)}
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <Label htmlFor="probabilidade">Probabilidade (%)</Label>
                <Input
                  id="probabilidade"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probabilidade}
                  onChange={(e) => handleChange('probabilidade', e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="dataFechamento">Data de Fechamento</Label>
                <Input
                  id="dataFechamento"
                  type="date"
                  value={formData.dataFechamento}
                  onChange={(e) => handleChange('dataFechamento', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 mt-6">
          <Link href="/negocios">
            <Button type="button" variant="outline">
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Salvando...' : 'Criar Oportunidade'}
          </Button>
        </div>
      </form>
    </div>
  );
}
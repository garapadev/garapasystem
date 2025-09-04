'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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

interface Oportunidade {
  id: string;
  titulo: string;
  descricao?: string;
  valor: number;
  probabilidade?: number;
  dataFechamento?: string;
  observacoes?: string;
  clienteId: string;
  responsavelId?: string;
  etapaId: string;
  cliente: Cliente;
  responsavel?: Colaborador;
  etapa: Etapa;
}

interface FormData {
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

export default function EditarOportunidadePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const oportunidadeId = params.id as string;
  
  const [oportunidade, setOportunidade] = useState<Oportunidade | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
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
    loadData();
  }, [oportunidadeId]);

  useEffect(() => {
    if (oportunidade) {
      setFormData({
        titulo: oportunidade.titulo,
        descricao: oportunidade.descricao || '',
        valor: oportunidade.valor.toString(),
        probabilidade: oportunidade.probabilidade?.toString() || '',
        dataFechamento: oportunidade.dataFechamento ? new Date(oportunidade.dataFechamento).toISOString().split('T')[0] : '',
        observacoes: oportunidade.observacoes || '',
        clienteId: oportunidade.clienteId,
        responsavelId: oportunidade.responsavelId || 'none',
        etapaId: oportunidade.etapaId
      });
    }
  }, [oportunidade]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [oportunidadeRes, clientesRes, colaboradoresRes, etapasRes] = await Promise.all([
        fetch(`/api/negocios/oportunidades/${oportunidadeId}`),
        fetch('/api/clientes'),
        fetch('/api/colaboradores'),
        fetch('/api/negocios/etapas')
      ]);

      if (oportunidadeRes.ok) {
        const oportunidadeData = await oportunidadeRes.json();
        setOportunidade(oportunidadeData);
      } else {
        toast({
          title: 'Erro',
          description: 'Oportunidade não encontrada',
          variant: 'destructive'
        });
        router.push('/negocios');
        return;
      }

      if (clientesRes.ok) {
        const clientesData = await clientesRes.json();
        setClientes(Array.isArray(clientesData.data) ? clientesData.data : []);
      }

      if (colaboradoresRes.ok) {
        const colaboradoresData = await colaboradoresRes.json();
        setColaboradores(Array.isArray(colaboradoresData.data) ? colaboradoresData.data : []);
      }

      if (etapasRes.ok) {
        const etapasData = await etapasRes.json();
        setEtapas(etapasData.etapas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da oportunidade',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.clienteId || !formData.etapaId) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        valor: parseFloat(formData.valor) || 0,
        probabilidade: formData.probabilidade ? parseInt(formData.probabilidade) : undefined,
        dataFechamento: formData.dataFechamento || undefined,
        observacoes: formData.observacoes.trim() || undefined,
        clienteId: formData.clienteId,
        responsavelId: formData.responsavelId && formData.responsavelId !== 'none' ? formData.responsavelId : undefined,
        etapaId: formData.etapaId
      };

      const response = await fetch(`/api/negocios/oportunidades/${oportunidadeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Oportunidade atualizada com sucesso!'
        });
        router.push('/negocios');
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erro',
          description: errorData.error || 'Erro ao atualizar oportunidade',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar oportunidade:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar oportunidade',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!oportunidade) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Oportunidade não encontrada</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Editar Oportunidade</h1>
          <p className="text-muted-foreground">
            Atualize as informações da oportunidade
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
              
              <div className="grid grid-cols-2 gap-4">
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

          {/* Relacionamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Relacionamentos</CardTitle>
              <CardDescription>
                Cliente, responsável e etapa da oportunidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="clienteId">Cliente *</Label>
                <Select value={formData.clienteId} onValueChange={(value) => handleChange('clienteId', value)}>
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
                <Label htmlFor="responsavelId">Responsável</Label>
                <Select value={formData.responsavelId} onValueChange={(value) => handleChange('responsavelId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum responsável</SelectItem>
                    {colaboradores.map(colaborador => (
                      <SelectItem key={colaborador.id} value={colaborador.id}>
                        {colaborador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="etapaId">Etapa *</Label>
                <Select value={formData.etapaId} onValueChange={(value) => handleChange('etapaId', value)}>
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
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <Link href="/negocios">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
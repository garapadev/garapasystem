'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Archive, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  categoria: {
    nome: string;
  };
}

interface Fornecedor {
  id: string;
  nome: string;
  documento: string;
}

interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
}

interface Colaborador {
  id: string;
  nome: string;
  email: string;
}

export default function NovoItemPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    numeroTombamento: '',
    descricao: '',
    produtoId: '',
    fornecedorId: '',
    centroCustoId: '',
    responsavelId: '',
    valorAquisicao: '',
    dataAquisicao: '',
    dataGarantia: '',
    localizacao: '',
    observacoes: ''
  });

  useEffect(() => {
    fetchData();
    generateTombamentoNumber();
  }, []);

  const fetchData = async () => {
    try {
      const [produtosRes, fornecedoresRes, centrosRes, colaboradoresRes] = await Promise.all([
        fetch('/api/produtos'),
        fetch('/api/fornecedores'),
        fetch('/api/centros-custo'),
        fetch('/api/colaboradores')
      ]);

      if (produtosRes.ok) {
        const data = await produtosRes.json();
        setProdutos(data.produtos || []);
      }

      if (fornecedoresRes.ok) {
        const data = await fornecedoresRes.json();
        setFornecedores(data.fornecedores || []);
      }

      if (centrosRes.ok) {
        const data = await centrosRes.json();
        setCentrosCusto(data.centrosCusto || []);
      }

      if (colaboradoresRes.ok) {
        const data = await colaboradoresRes.json();
        setColaboradores(data.colaboradores || []);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoadingData(false);
    }
  };

  const generateTombamentoNumber = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const numero = `TB${year}${timestamp}`;
    setFormData(prev => ({ ...prev, numeroTombamento: numero }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valorAquisicao || !formData.dataAquisicao || !formData.localizacao) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/tombamento', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numeroTombamento: formData.numeroTombamento,
          descricao: formData.descricao,
          produtoId: formData.produtoId || undefined,
          fornecedorId: formData.fornecedorId || undefined,
          centroCustoId: formData.centroCustoId || undefined,
          responsavelId: formData.responsavelId || undefined,
          valorAquisicao: parseFloat(formData.valorAquisicao),
          dataAquisicao: formData.dataAquisicao,
          dataGarantia: formData.dataGarantia || undefined,
          localizacao: formData.localizacao,
          observacoes: formData.observacoes || undefined
        }),
      });

      if (response.ok) {
        toast.success('Item tombado com sucesso!');
        router.push('/tombamento');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar item');
      }
    } catch (error) {
      console.error('Erro ao criar item:', error);
      toast.error('Erro ao criar item');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[{ recurso: 'tombamento', acao: 'create' }]}>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Archive className="h-8 w-8" />
              Novo Item de Tombamento
            </h1>
            <p className="text-muted-foreground">
              Cadastre um novo item no patrimônio
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Dados principais do item
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroTombamento">Número de Tombamento *</Label>
                  <Input
                    id="numeroTombamento"
                    value={formData.numeroTombamento}
                    onChange={(e) => handleInputChange('numeroTombamento', e.target.value)}
                    placeholder="TB202400001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="produto">Produto Relacionado</Label>
                  <Select
                    value={formData.produtoId}
                    onValueChange={(value) => handleInputChange('produtoId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((produto) => (
                        <SelectItem key={produto.id} value={produto.id}>
                          {produto.codigo} - {produto.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descrição detalhada do item..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="localizacao">Localização *</Label>
                <Input
                  id="localizacao"
                  value={formData.localizacao}
                  onChange={(e) => handleInputChange('localizacao', e.target.value)}
                  placeholder="Ex: Sala 101, Almoxarifado, etc."
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Financeiras</CardTitle>
              <CardDescription>
                Dados de aquisição e valores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valorAquisicao">Valor de Aquisição *</Label>
                  <Input
                    id="valorAquisicao"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valorAquisicao}
                    onChange={(e) => handleInputChange('valorAquisicao', e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataAquisicao">Data de Aquisição *</Label>
                  <Input
                    id="dataAquisicao"
                    type="date"
                    value={formData.dataAquisicao}
                    onChange={(e) => handleInputChange('dataAquisicao', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataGarantia">Data de Vencimento da Garantia</Label>
                  <Input
                    id="dataGarantia"
                    type="date"
                    value={formData.dataGarantia}
                    onChange={(e) => handleInputChange('dataGarantia', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fornecedor">Fornecedor</Label>
                  <Select
                    value={formData.fornecedorId}
                    onValueChange={(value) => handleInputChange('fornecedorId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {fornecedores.map((fornecedor) => (
                        <SelectItem key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsabilidade e Centro de Custo</CardTitle>
              <CardDescription>
                Definição de responsável e centro de custo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Select
                    value={formData.responsavelId}
                    onValueChange={(value) => handleInputChange('responsavelId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores.map((colaborador) => (
                        <SelectItem key={colaborador.id} value={colaborador.id}>
                          {colaborador.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="centroCusto">Centro de Custo</Label>
                  <Select
                    value={formData.centroCustoId}
                    onValueChange={(value) => handleInputChange('centroCustoId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o centro de custo" />
                    </SelectTrigger>
                    <SelectContent>
                      {centrosCusto.map((centro) => (
                        <SelectItem key={centro.id} value={centro.id}>
                          {centro.codigo} - {centro.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais sobre o item..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Item'
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
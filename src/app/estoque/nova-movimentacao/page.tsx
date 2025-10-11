'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Package, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  unidadeMedida: string;
  categoria: {
    nome: string;
  };
}

interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
}

interface ItemMovimentacao {
  produtoId: string;
  produto?: Produto;
  quantidade: number;
  valorUnitario: number;
  observacoes: string;
}

export default function NovaMovimentacaoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState({
    tipo: '',
    centroCustoId: '',
    documentoReferencia: '',
    observacoes: ''
  });

  const [itens, setItens] = useState<ItemMovimentacao[]>([
    {
      produtoId: '',
      quantidade: 0,
      valorUnitario: 0,
      observacoes: ''
    }
  ]);

  useEffect(() => {
    fetchProdutos();
    fetchCentrosCusto();
  }, []);

  const fetchProdutos = async () => {
    try {
      const response = await fetch('/api/produtos');
      if (response.ok) {
        const data = await response.json();
        setProdutos(data.produtos || []);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const fetchCentrosCusto = async () => {
    try {
      const response = await fetch('/api/centros-custo');
      if (response.ok) {
        const data = await response.json();
        setCentrosCusto(data.centrosCusto || []);
      }
    } catch (error) {
      console.error('Erro ao buscar centros de custo:', error);
      toast.error('Erro ao carregar centros de custo');
    } finally {
      setLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItens = [...itens];
    newItens[index] = {
      ...newItens[index],
      [field]: value
    };

    // Se mudou o produto, buscar os dados do produto
    if (field === 'produtoId' && value) {
      const produto = produtos.find(p => p.id === value);
      if (produto) {
        newItens[index].produto = produto;
      }
    }

    setItens(newItens);
  };

  const addItem = () => {
    setItens([...itens, {
      produtoId: '',
      quantidade: 0,
      valorUnitario: 0,
      observacoes: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return itens.reduce((total, item) => {
      return total + (item.quantidade * item.valorUnitario);
    }, 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tipo) {
      toast.error('Selecione o tipo de movimentação');
      return;
    }

    if (itens.some(item => !item.produtoId || item.quantidade <= 0)) {
      toast.error('Preencha todos os itens corretamente');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/estoque', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          itens: itens.map(item => ({
            produtoId: item.produtoId,
            quantidade: Number(item.quantidade),
            valorUnitario: Number(item.valorUnitario),
            observacoes: item.observacoes
          }))
        }),
      });

      if (response.ok) {
        toast.success('Movimentação criada com sucesso!');
        router.push('/estoque');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar movimentação');
      }
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      toast.error('Erro ao criar movimentação');
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
    <ProtectedRoute requiredPermissions={[{ recurso: 'estoque', acao: 'create' }]}>
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
              <Package className="h-8 w-8" />
              Nova Movimentação de Estoque
            </h1>
            <p className="text-muted-foreground">
              Registre entradas, saídas e ajustes de estoque
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Dados básicos da movimentação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Movimentação *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleInputChange('tipo', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENTRADA">Entrada</SelectItem>
                      <SelectItem value="SAIDA">Saída</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      <SelectItem value="AJUSTE">Ajuste</SelectItem>
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
                <Label htmlFor="documentoReferencia">Documento de Referência</Label>
                <Input
                  id="documentoReferencia"
                  value={formData.documentoReferencia}
                  onChange={(e) => handleInputChange('documentoReferencia', e.target.value)}
                  placeholder="Ex: NF 12345, Requisição 001, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações sobre a movimentação..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Itens da Movimentação</CardTitle>
                  <CardDescription>
                    Adicione os produtos e quantidades
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto *</TableHead>
                      <TableHead>Quantidade *</TableHead>
                      <TableHead>Valor Unitário *</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Observações</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.produtoId}
                            onValueChange={(value) => handleItemChange(index, 'produtoId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {produtos.map((produto) => (
                                <SelectItem key={produto.id} value={produto.id}>
                                  {produto.codigo} - {produto.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.quantidade || ''}
                              onChange={(e) => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                            {item.produto && (
                              <p className="text-xs text-muted-foreground">
                                {item.produto.unidadeMedida}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.valorUnitario || ''}
                            onChange={(e) => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {formatCurrency(item.quantidade * item.valorUnitario)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.observacoes}
                            onChange={(e) => handleItemChange(index, 'observacoes', e.target.value)}
                            placeholder="Observações do item..."
                          />
                        </TableCell>
                        <TableCell>
                          {itens.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeItem(index)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end mt-4 p-4 bg-muted rounded-lg">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>
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
                'Criar Movimentação'
              )}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
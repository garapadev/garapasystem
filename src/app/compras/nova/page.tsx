'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { CentroCustoCreateDialog } from '@/components/centros-custo/CentroCustoCreateDialog';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';

interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
}

interface Produto {
  id: string;
  codigo: string;
  nome: string;
  unidadeMedida: string;
}

interface ItemSolicitacao {
  produtoId: string;
  produto?: Produto;
  quantidade: number;
  valorUnitario: number;
  observacoes: string;
}

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [createCentroDialogOpen, setCreateCentroDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    descricao: '',
    justificativa: '',
    centroCustoId: '',
    observacoes: ''
  });

  const [itens, setItens] = useState<ItemSolicitacao[]>([
    {
      produtoId: '',
      quantidade: 1,
      valorUnitario: 0,
      observacoes: ''
    }
  ]);

  useEffect(() => {
    fetchCentrosCusto();
    fetchProdutos();
  }, []);

  const fetchCentrosCusto = async () => {
    try {
      const response = await fetch('/api/centros-custo');
      if (response.ok) {
        const data = await response.json();
        setCentrosCusto(data.centrosCusto || []);
      }
    } catch (error) {
      console.error('Erro ao buscar centros de custo:', error);
    }
  };

  const fetchProdutos = async () => {
    try {
      const response = await fetch('/api/produtos');
      if (response.ok) {
        const data = await response.json();
        setProdutos(data.produtos || []);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setItens(prev => {
      const newItens = [...prev];
      newItens[index] = {
        ...newItens[index],
        [field]: value
      };

      // Se mudou o produto, buscar informações do produto
      if (field === 'produtoId' && value) {
        const produto = produtos.find(p => p.id === value);
        if (produto) {
          newItens[index].produto = produto;
        }
      }

      return newItens;
    });
  };

  const addItem = () => {
    setItens(prev => [
      ...prev,
      {
        produtoId: '',
        quantidade: 1,
        valorUnitario: 0,
        observacoes: ''
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) {
      setItens(prev => prev.filter((_, i) => i !== index));
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
    
    if (!formData.descricao || !formData.centroCustoId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (itens.some(item => !item.produtoId || item.quantidade <= 0)) {
      toast.error('Todos os itens devem ter produto e quantidade válidos');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        itens: itens.map(item => ({
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          observacoes: item.observacoes
        }))
      };

      const response = await fetch('/api/compras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Solicitação de compra criada com sucesso!');
        router.push(`/compras/${data.solicitacao.id}`);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar solicitação');
      }
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast.error('Erro ao criar solicitação de compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredPermissions={[{ recurso: 'compras', acao: 'create' }]}>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Nova Solicitação de Compra
            </h1>
            <p className="text-muted-foreground">
              Crie uma nova solicitação de compra
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>
                Dados básicos da solicitação de compra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    placeholder="Descrição da solicitação"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="centroCusto">Centro de Custo *</Label>
                  <div className="flex items-center gap-2">
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Novo Centro de Custo"
                      onClick={() => setCreateCentroDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa</Label>
                <Textarea
                  id="justificativa"
                  value={formData.justificativa}
                  onChange={(e) => handleInputChange('justificativa', e.target.value)}
                  placeholder="Justificativa para a compra"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Observações adicionais"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Itens da Solicitação</CardTitle>
                  <CardDescription>
                    Produtos e quantidades solicitadas
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
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
                      <TableHead>Produto</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor Unitário</TableHead>
                      <TableHead>Total</TableHead>
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
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantidade}
                            onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.valorUnitario}
                            onChange={(e) => handleItemChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            className="w-32"
                          />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(item.quantidade * item.valorUnitario)}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.observacoes}
                            onChange={(e) => handleItemChange(index, 'observacoes', e.target.value)}
                            placeholder="Observações"
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          {itens.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
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

              <div className="flex justify-end mt-4">
                <div className="text-lg font-semibold">
                  Total: {formatCurrency(calculateTotal())}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Criar Solicitação
            </Button>
          </div>
        </form>
        <CentroCustoCreateDialog
          open={createCentroDialogOpen}
          onOpenChange={setCreateCentroDialogOpen}
          onCreated={(created) => {
            setCentrosCusto((prev) => [created, ...prev]);
            setFormData((prev) => ({ ...prev, centroCustoId: created.id }));
          }}
        />
      </div>
    </ProtectedRoute>
  );
}
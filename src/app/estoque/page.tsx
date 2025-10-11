'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Package, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';

interface EstoqueProduto {
  id: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  produto: {
    id: string;
    codigo: string;
    nome: string;
    unidadeMedida: string;
    estoqueMinimo: number;
    categoria: {
      nome: string;
    };
  };
  centroCusto?: {
    codigo: string;
    nome: string;
  };
}

interface MovimentacaoEstoque {
  id: string;
  tipo: 'ENTRADA' | 'SAIDA' | 'TRANSFERENCIA' | 'AJUSTE';
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  quantidadeAnterior: number;
  quantidadeAtual: number;
  observacoes: string;
  documentoReferencia: string;
  createdAt: string;
  produto: {
    codigo: string;
    nome: string;
  };
  responsavel: {
    nome: string;
  };
}

const getTipoVariant = (tipo: string) => {
  switch (tipo) {
    case 'ENTRADA':
      return 'default';
    case 'SAIDA':
      return 'destructive';
    case 'TRANSFERENCIA':
      return 'secondary';
    case 'AJUSTE':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getTipoIcon = (tipo: string) => {
  switch (tipo) {
    case 'ENTRADA':
      return <TrendingUp className="h-4 w-4" />;
    case 'SAIDA':
      return <TrendingDown className="h-4 w-4" />;
    case 'TRANSFERENCIA':
      return <Package className="h-4 w-4" />;
    case 'AJUSTE':
      return <Package className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function EstoquePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [estoque, setEstoque] = useState<EstoqueProduto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [activeTab, setActiveTab] = useState('estoque');

  useEffect(() => {
    fetchEstoque();
    fetchMovimentacoes();
  }, []);

  const fetchEstoque = async () => {
    try {
      const response = await fetch('/api/estoque');
      if (response.ok) {
        const data = await response.json();
        setEstoque(data.estoque || []);
      } else {
        toast.error('Erro ao carregar estoque');
      }
    } catch (error) {
      console.error('Erro ao buscar estoque:', error);
      toast.error('Erro ao carregar estoque');
    }
  };

  const fetchMovimentacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/estoque?tipo=movimentacoes');
      if (response.ok) {
        const data = await response.json();
        setMovimentacoes(data.movimentacoes || []);
      } else {
        toast.error('Erro ao carregar movimentações');
      }
    } catch (error) {
      console.error('Erro ao buscar movimentações:', error);
      toast.error('Erro ao carregar movimentações');
    } finally {
      setLoading(false);
    }
  };

  const filteredEstoque = estoque.filter(item => {
    const matchesSearch = 
      item.produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.produto.categoria.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const filteredMovimentacoes = movimentacoes.filter(mov => {
    const matchesSearch = 
      mov.produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === '' || mov.tipo === tipoFilter;
    
    return matchesSearch && matchesTipo;
  });

  const alertasEstoque = filteredEstoque.filter(item => 
    item.quantidade <= item.produto.estoqueMinimo && item.produto.estoqueMinimo > 0
  );

  const handleNovaMovimentacao = () => {
    router.push('/estoque/nova-movimentacao');
  };

  const isEstoqueBaixo = (item: EstoqueProduto) => {
    return item.quantidade <= item.produto.estoqueMinimo && item.produto.estoqueMinimo > 0;
  };

  return (
    <ProtectedRoute requiredPermissions={[{ recurso: 'estoque', acao: 'read' }]}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8" />
              Estoque
            </h1>
            <p className="text-muted-foreground">
              Gerencie produtos e movimentações de estoque
            </p>
          </div>
          <Button onClick={handleNovaMovimentacao} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>

        {alertasEstoque.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Estoque
              </CardTitle>
              <CardDescription className="text-orange-700">
                {alertasEstoque.length} produto(s) com estoque abaixo do mínimo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertasEstoque.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {item.produto.codigo} - {item.produto.nome}
                    </span>
                    <span className="text-orange-700">
                      Atual: {item.quantidade} | Mínimo: {item.produto.estoqueMinimo}
                    </span>
                  </div>
                ))}
                {alertasEstoque.length > 3 && (
                  <p className="text-sm text-orange-700">
                    E mais {alertasEstoque.length - 3} produto(s)...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="estoque">Estoque Atual</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          </TabsList>

          <TabsContent value="estoque" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Produtos em Estoque</CardTitle>
                <CardDescription>
                  Visualize a quantidade atual de todos os produtos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por código, nome ou categoria..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Categoria</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Estoque Mínimo</TableHead>
                          <TableHead>Valor Unitário</TableHead>
                          <TableHead>Valor Total</TableHead>
                          <TableHead>Centro de Custo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEstoque.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Nenhum produto encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredEstoque.map((item) => (
                            <TableRow key={item.id} className={isEstoqueBaixo(item) ? 'bg-orange-50' : ''}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {isEstoqueBaixo(item) && (
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  )}
                                  <div>
                                    <p className="font-medium">{item.produto.nome}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.produto.codigo}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{item.produto.categoria.nome}</TableCell>
                              <TableCell>
                                <span className={isEstoqueBaixo(item) ? 'text-orange-600 font-medium' : ''}>
                                  {item.quantidade} {item.produto.unidadeMedida}
                                </span>
                              </TableCell>
                              <TableCell>{item.produto.estoqueMinimo}</TableCell>
                              <TableCell>{formatCurrency(item.valorUnitario)}</TableCell>
                              <TableCell>{formatCurrency(item.valorTotal)}</TableCell>
                              <TableCell>
                                {item.centroCusto ? 
                                  `${item.centroCusto.codigo} - ${item.centroCusto.nome}` : 
                                  'Geral'
                                }
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movimentacoes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Movimentações de Estoque</CardTitle>
                <CardDescription>
                  Histórico de todas as movimentações realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por produto ou responsável..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={tipoFilter}
                    onChange={(e) => setTipoFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="ENTRADA">Entrada</option>
                    <option value="SAIDA">Saída</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="AJUSTE">Ajuste</option>
                  </select>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Quantidade</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Documento</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMovimentacoes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              Nenhuma movimentação encontrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredMovimentacoes.map((mov) => (
                            <TableRow key={mov.id}>
                              <TableCell>{formatDate(mov.createdAt)}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{mov.produto.nome}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {mov.produto.codigo}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={getTipoVariant(mov.tipo)}
                                  className="flex items-center gap-1 w-fit"
                                >
                                  {getTipoIcon(mov.tipo)}
                                  {mov.tipo}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{mov.quantidade}</p>
                                  <p className="text-muted-foreground">
                                    {mov.quantidadeAnterior} → {mov.quantidadeAtual}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>{formatCurrency(mov.valorTotal)}</TableCell>
                              <TableCell>{mov.responsavel.nome}</TableCell>
                              <TableCell>{mov.documentoReferencia || '-'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
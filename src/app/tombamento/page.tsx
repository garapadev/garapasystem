'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Archive, AlertTriangle, Calendar, Loader2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';

interface ItemTombamento {
  id: string;
  numeroTombamento: string;
  descricao: string;
  valorAquisicao: number;
  dataAquisicao: string;
  dataGarantia?: string;
  status: 'ATIVO' | 'INATIVO' | 'MANUTENCAO' | 'BAIXADO';
  localizacao: string;
  observacoes?: string;
  createdAt: string;
  produto?: {
    codigo: string;
    nome: string;
    categoria: {
      nome: string;
    };
  };
  fornecedor?: {
    nome: string;
  };
  centroCusto?: {
    codigo: string;
    nome: string;
  };
  responsavel?: {
    nome: string;
  };
}

interface MovimentacaoTombamento {
  id: string;
  tipo: 'AQUISICAO' | 'TRANSFERENCIA' | 'MANUTENCAO' | 'BAIXA';
  localizacaoOrigem?: string;
  localizacaoDestino?: string;
  observacoes?: string;
  createdAt: string;
  item: {
    numeroTombamento: string;
    descricao: string;
  };
  responsavel: {
    nome: string;
  };
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'ATIVO':
      return 'default';
    case 'INATIVO':
      return 'secondary';
    case 'MANUTENCAO':
      return 'destructive';
    case 'BAIXADO':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getTipoVariant = (tipo: string) => {
  switch (tipo) {
    case 'AQUISICAO':
      return 'default';
    case 'TRANSFERENCIA':
      return 'secondary';
    case 'MANUTENCAO':
      return 'destructive';
    case 'BAIXA':
      return 'outline';
    default:
      return 'secondary';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function TombamentoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [itens, setItens] = useState<ItemTombamento[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoTombamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [activeTab, setActiveTab] = useState('itens');

  useEffect(() => {
    fetchItens();
    fetchMovimentacoes();
  }, []);

  const fetchItens = async () => {
    try {
      const response = await fetch('/api/tombamento');
      if (response.ok) {
        const data = await response.json();
        setItens(data.itens || []);
      } else {
        toast.error('Erro ao carregar itens');
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      toast.error('Erro ao carregar itens');
    }
  };

  const fetchMovimentacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tombamento?tipo=movimentacoes');
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

  const filteredItens = itens.filter(item => {
    const matchesSearch = 
      item.numeroTombamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.localizacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.produto?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredMovimentacoes = movimentacoes.filter(mov => {
    const matchesSearch = 
      mov.item.numeroTombamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mov.responsavel.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === '' || mov.tipo === tipoFilter;
    
    return matchesSearch && matchesTipo;
  });

  // Alertas de garantia vencendo em 30 dias
  const alertasGarantia = itens.filter(item => {
    if (!item.dataGarantia || item.status === 'BAIXADO') return false;
    
    const hoje = new Date();
    const garantia = new Date(item.dataGarantia);
    const diasRestantes = Math.ceil((garantia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasRestantes <= 30 && diasRestantes >= 0;
  });

  const handleNovoItem = () => {
    router.push('/tombamento/novo-item');
  };

  const handleNovaMovimentacao = () => {
    router.push('/tombamento/nova-movimentacao');
  };

  const handleViewItem = (id: string) => {
    router.push(`/tombamento/${id}`);
  };

  const isGarantiaVencendo = (item: ItemTombamento) => {
    if (!item.dataGarantia || item.status === 'BAIXADO') return false;
    
    const hoje = new Date();
    const garantia = new Date(item.dataGarantia);
    const diasRestantes = Math.ceil((garantia.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    
    return diasRestantes <= 30 && diasRestantes >= 0;
  };

  return (
    <ProtectedRoute requiredPermissions={[{ recurso: 'tombamento', acao: 'read' }]}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Archive className="h-8 w-8" />
              Tombamento de Ativos
            </h1>
            <p className="text-muted-foreground">
              Gerencie patrimônio e movimentações de ativos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleNovaMovimentacao}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Movimentação
            </Button>
            <Button onClick={handleNovoItem} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Novo Item
            </Button>
          </div>
        </div>

        {alertasGarantia.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-5 w-5" />
                Alertas de Garantia
              </CardTitle>
              <CardDescription className="text-orange-700">
                {alertasGarantia.length} item(ns) com garantia vencendo em até 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alertasGarantia.slice(0, 3).map((item) => {
                  const diasRestantes = Math.ceil((new Date(item.dataGarantia!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {item.numeroTombamento} - {item.descricao}
                      </span>
                      <span className="text-orange-700">
                        {diasRestantes === 0 ? 'Vence hoje' : `${diasRestantes} dias restantes`}
                      </span>
                    </div>
                  );
                })}
                {alertasGarantia.length > 3 && (
                  <p className="text-sm text-orange-700">
                    E mais {alertasGarantia.length - 3} item(ns)...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="itens">Itens Tombados</TabsTrigger>
            <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
          </TabsList>

          <TabsContent value="itens" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Itens do Patrimônio</CardTitle>
                <CardDescription>
                  Visualize todos os itens tombados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por tombamento, descrição ou localização..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                  >
                    <option value="">Todos os status</option>
                    <option value="ATIVO">Ativo</option>
                    <option value="INATIVO">Inativo</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="BAIXADO">Baixado</option>
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
                          <TableHead>Tombamento</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Localização</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Garantia</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItens.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              Nenhum item encontrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredItens.map((item) => (
                            <TableRow key={item.id} className={isGarantiaVencendo(item) ? 'bg-orange-50' : ''}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {isGarantiaVencendo(item) && (
                                    <Calendar className="h-4 w-4 text-orange-500" />
                                  )}
                                  <span className="font-medium">{item.numeroTombamento}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.descricao}</p>
                                  {item.produto && (
                                    <p className="text-sm text-muted-foreground">
                                      {item.produto.codigo} - {item.produto.nome}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(item.status)}>
                                  {item.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{item.localizacao}</TableCell>
                              <TableCell>{formatCurrency(item.valorAquisicao)}</TableCell>
                              <TableCell>
                                {item.dataGarantia ? (
                                  <span className={isGarantiaVencendo(item) ? 'text-orange-600 font-medium' : ''}>
                                    {formatDate(item.dataGarantia)}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                {item.responsavel?.nome || '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewItem(item.id)}
                                  className="flex items-center gap-1"
                                >
                                  <Eye className="h-3 w-3" />
                                  Ver
                                </Button>
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
                <CardTitle>Movimentações de Ativos</CardTitle>
                <CardDescription>
                  Histórico de todas as movimentações realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar por tombamento ou responsável..."
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
                    <option value="AQUISICAO">Aquisição</option>
                    <option value="TRANSFERENCIA">Transferência</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="BAIXA">Baixa</option>
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
                          <TableHead>Item</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Origem</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Observações</TableHead>
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
                              <TableCell>{formatDateTime(mov.createdAt)}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{mov.item.numeroTombamento}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {mov.item.descricao}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getTipoVariant(mov.tipo)}>
                                  {mov.tipo}
                                </Badge>
                              </TableCell>
                              <TableCell>{mov.localizacaoOrigem || '-'}</TableCell>
                              <TableCell>{mov.localizacaoDestino || '-'}</TableCell>
                              <TableCell>{mov.responsavel.nome}</TableCell>
                              <TableCell>{mov.observacoes || '-'}</TableCell>
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
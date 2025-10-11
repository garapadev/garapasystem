'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Eye, Loader2, ShoppingCart, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';

interface SolicitacaoCompra {
  id: string;
  numero: string;
  descricao: string;
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';
  valorTotal: number;
  dataSolicitacao: string;
  solicitante: {
    nome: string;
  };
  centroCusto: {
    nome: string;
  };
  itens: Array<{
    id: string;
    quantidade: number;
    valorUnitario: number;
    produto: {
      nome: string;
      codigo: string;
    };
  }>;
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APROVADA':
      return 'default';
    case 'PENDENTE':
      return 'secondary';
    case 'REJEITADA':
      return 'destructive';
    case 'CANCELADA':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'APROVADA':
      return <CheckCircle className="h-4 w-4" />;
    case 'PENDENTE':
      return <Clock className="h-4 w-4" />;
    case 'REJEITADA':
      return <XCircle className="h-4 w-4" />;
    case 'CANCELADA':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
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

export default function ComprasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoCompra[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchSolicitacoes();
  }, []);

  const fetchSolicitacoes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/compras');
      if (response.ok) {
        const data = await response.json();
        setSolicitacoes(data.solicitacoes || []);
      } else {
        toast.error('Erro ao carregar solicitações de compra');
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      toast.error('Erro ao carregar solicitações de compra');
    } finally {
      setLoading(false);
    }
  };

  const filteredSolicitacoes = solicitacoes.filter(solicitacao => {
    const matchesSearch = 
      solicitacao.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      solicitacao.solicitante.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || solicitacao.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleNovasolicitacao = () => {
    router.push('/compras/nova');
  };

  const handleViewSolicitacao = (id: string) => {
    router.push(`/compras/${id}`);
  };

  const handleEditSolicitacao = (id: string) => {
    router.push(`/compras/${id}/editar`);
  };

  return (
    <ProtectedRoute requiredPermissions={[{ recurso: 'compras', acao: 'read' }]}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-8 w-8" />
              Compras
            </h1>
            <p className="text-muted-foreground">
              Gerencie solicitações e pedidos de compra
            </p>
          </div>
          <Button onClick={handleNovasolicitacao} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitações de Compra</CardTitle>
            <CardDescription>
              Lista de todas as solicitações de compra do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número, descrição ou solicitante..."
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
                <option value="PENDENTE">Pendente</option>
                <option value="APROVADA">Aprovada</option>
                <option value="REJEITADA">Rejeitada</option>
                <option value="CANCELADA">Cancelada</option>
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
                      <TableHead>Número</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Centro de Custo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSolicitacoes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhuma solicitação encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSolicitacoes.map((solicitacao) => (
                        <TableRow key={solicitacao.id}>
                          <TableCell className="font-medium">
                            {solicitacao.numero}
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate">
                              {solicitacao.descricao}
                            </div>
                          </TableCell>
                          <TableCell>{solicitacao.solicitante.nome}</TableCell>
                          <TableCell>{solicitacao.centroCusto.nome}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={getStatusVariant(solicitacao.status)}
                              className="flex items-center gap-1 w-fit"
                            >
                              {getStatusIcon(solicitacao.status)}
                              {solicitacao.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(solicitacao.valorTotal)}</TableCell>
                          <TableCell>{formatDate(solicitacao.dataSolicitacao)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewSolicitacao(solicitacao.id)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {solicitacao.status === 'PENDENTE' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSolicitacao(solicitacao.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
      </div>
    </ProtectedRoute>
  );
}
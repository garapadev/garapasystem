'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, XCircle, Clock, Edit, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SolicitacaoCompra {
  id: string;
  numero: string;
  descricao: string;
  justificativa: string;
  observacoes: string;
  status: 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'CANCELADA';
  valorTotal: number;
  dataSolicitacao: string;
  dataAprovacao?: string;
  motivoRejeicao?: string;
  solicitante: {
    id: string;
    nome: string;
    email: string;
  };
  aprovador?: {
    nome: string;
    email: string;
  };
  centroCusto: {
    codigo: string;
    nome: string;
  };
  itens: Array<{
    id: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    observacoes: string;
    produto: {
      codigo: string;
      nome: string;
      unidadeMedida: string;
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
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function SolicitacaoDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [solicitacao, setSolicitacao] = useState<SolicitacaoCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchSolicitacao(params.id as string);
    }
  }, [params.id]);

  const fetchSolicitacao = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/compras/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSolicitacao(data.solicitacao);
      } else {
        toast.error('Solicitação não encontrada');
        router.push('/compras');
      }
    } catch (error) {
      console.error('Erro ao buscar solicitação:', error);
      toast.error('Erro ao carregar solicitação');
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async () => {
    if (!solicitacao) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/compras/${solicitacao.id}/aprovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acao: 'APROVAR'
        })
      });

      if (response.ok) {
        toast.success('Solicitação aprovada com sucesso!');
        fetchSolicitacao(solicitacao.id);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao aprovar solicitação');
      }
    } catch (error) {
      console.error('Erro ao aprovar solicitação:', error);
      toast.error('Erro ao aprovar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejeitar = async () => {
    if (!solicitacao || !motivoRejeicao.trim()) {
      toast.error('Informe o motivo da rejeição');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/compras/${solicitacao.id}/aprovar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          acao: 'REJEITAR',
          motivoRejeicao
        })
      });

      if (response.ok) {
        toast.success('Solicitação rejeitada');
        fetchSolicitacao(solicitacao.id);
        setMotivoRejeicao('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao rejeitar solicitação');
      }
    } catch (error) {
      console.error('Erro ao rejeitar solicitação:', error);
      toast.error('Erro ao rejeitar solicitação');
    } finally {
      setActionLoading(false);
    }
  };

  const canApprove = () => {
    return solicitacao?.status === 'PENDENTE' && user?.id !== solicitacao?.solicitante.id;
  };

  const canEdit = () => {
    return solicitacao?.status === 'PENDENTE' && user?.id === solicitacao?.solicitante.id;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!solicitacao) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Solicitação não encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermissions={[{ recurso: 'compras', acao: 'read' }]}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
                Solicitação {solicitacao.numero}
              </h1>
              <p className="text-muted-foreground">
                Detalhes da solicitação de compra
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={getStatusVariant(solicitacao.status)}
              className="flex items-center gap-1"
            >
              {getStatusIcon(solicitacao.status)}
              {solicitacao.status}
            </Badge>
            {canEdit() && (
              <Button
                onClick={() => router.push(`/compras/${solicitacao.id}/editar`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Descrição
                    </Label>
                    <p className="text-sm">{solicitacao.descricao}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Centro de Custo
                    </Label>
                    <p className="text-sm">
                      {solicitacao.centroCusto.codigo} - {solicitacao.centroCusto.nome}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Solicitante
                    </Label>
                    <p className="text-sm">{solicitacao.solicitante.nome}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Data da Solicitação
                    </Label>
                    <p className="text-sm">{formatDate(solicitacao.dataSolicitacao)}</p>
                  </div>
                </div>

                {solicitacao.justificativa && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Justificativa
                    </Label>
                    <p className="text-sm">{solicitacao.justificativa}</p>
                  </div>
                )}

                {solicitacao.observacoes && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Observações
                    </Label>
                    <p className="text-sm">{solicitacao.observacoes}</p>
                  </div>
                )}

                {solicitacao.status === 'APROVADA' && solicitacao.aprovador && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Aprovado por
                      </Label>
                      <p className="text-sm">{solicitacao.aprovador.nome}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Data da Aprovação
                      </Label>
                      <p className="text-sm">
                        {solicitacao.dataAprovacao && formatDate(solicitacao.dataAprovacao)}
                      </p>
                    </div>
                  </div>
                )}

                {solicitacao.status === 'REJEITADA' && solicitacao.motivoRejeicao && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Motivo da Rejeição
                    </Label>
                    <p className="text-sm text-destructive">{solicitacao.motivoRejeicao}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Itens Solicitados</CardTitle>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {solicitacao.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.produto.nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.produto.codigo}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.quantidade} {item.produto.unidadeMedida}
                          </TableCell>
                          <TableCell>{formatCurrency(item.valorUnitario)}</TableCell>
                          <TableCell>{formatCurrency(item.valorTotal)}</TableCell>
                          <TableCell>{item.observacoes || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end mt-4">
                  <div className="text-lg font-semibold">
                    Total: {formatCurrency(solicitacao.valorTotal)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {canApprove() && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                  <CardDescription>
                    Aprovar ou rejeitar esta solicitação
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleAprovar}
                    disabled={actionLoading}
                    className="w-full flex items-center gap-2"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Aprovar
                  </Button>

                  <div className="space-y-2">
                    <Label htmlFor="motivoRejeicao">Motivo da Rejeição</Label>
                    <Textarea
                      id="motivoRejeicao"
                      value={motivoRejeicao}
                      onChange={(e) => setMotivoRejeicao(e.target.value)}
                      placeholder="Informe o motivo da rejeição..."
                      rows={3}
                    />
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={actionLoading || !motivoRejeicao.trim()}
                        className="w-full flex items-center gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Rejeitar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Rejeição</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja rejeitar esta solicitação de compra?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRejeitar}>
                          Rejeitar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
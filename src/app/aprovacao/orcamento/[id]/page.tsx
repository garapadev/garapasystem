'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, AlertCircle, FileText, Clock, Ban, Building2, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface OrcamentoPublico {
  id: string;
  numero: string;
  titulo: string;
  descricao?: string;
  observacoes?: string;
  status: string;
  valorTotal: number;
  dataValidade: string;
  createdAt: string;
  cliente: {
    nome: string;
    email: string;
  };
  itens: Array<{
    id: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    valorTotal: number;
    observacoes?: string;
  }>;
}

export default function AprovacaoOrcamentoPage() {
  const params = useParams();
  const router = useRouter();
  const [orcamento, setOrcamento] = useState<OrcamentoPublico | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  const id = params.id as string;

  useEffect(() => {
    const fetchOrcamento = async () => {
      try {
        const response = await fetch(`/api/orcamentos/aprovacao/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao carregar orçamento');
        }

        const data = await response.json();
        setOrcamento(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Erro ao carregar orçamento');
      } finally {
        setLoading(false);
      }
    };

    fetchOrcamento();
  }, [id]);

  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'ENVIADO':
        return 'default';
      case 'APROVADO':
        return 'default';
      case 'REJEITADO':
        return 'destructive';
      case 'EXPIRADO':
        return 'outline';
      case 'CANCELADO':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ENVIADO':
        return <Clock className="h-4 w-4" />;
      case 'APROVADO':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJEITADO':
        return <XCircle className="h-4 w-4" />;
      case 'EXPIRADO':
        return <AlertCircle className="h-4 w-4" />;
      case 'CANCELADO':
        return <Ban className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ENVIADO':
        return 'Aguardando Aprovação';
      case 'APROVADO':
        return 'Aprovado';
      case 'REJEITADO':
        return 'Rejeitado';
      case 'EXPIRADO':
        return 'Expirado';
      case 'CANCELADO':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleAprovacao = async (aprovado: boolean) => {
    try {
      setProcessando(true);

      const response = await fetch(`/api/orcamentos/aprovacao/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aprovado,
          observacoes: observacoes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar aprovação');
      }

      toast({
        title: 'Sucesso',
        description: `Orçamento ${aprovado ? 'aprovado' : 'rejeitado'} com sucesso`,
      });

      // Recarregar dados
      const updatedResponse = await fetch(`/api/orcamentos/aprovacao/${id}`);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setOrcamento(updatedData);
      }

      setObservacoes('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar aprovação',
        variant: 'destructive',
      });
    } finally {
      setProcessando(false);
    }
  };

  const isExpired = orcamento && new Date(orcamento.dataValidade) < new Date();
  const canApprove = orcamento && orcamento.status === 'ENVIADO' && !isExpired;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Orçamento não encontrado</h2>
          <p className="text-muted-foreground mb-4">
            {error || 'O orçamento solicitado não foi encontrado ou não está disponível para visualização.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Aprovação de Orçamento</h1>
          </div>
          <p className="text-muted-foreground">
            Revise os detalhes do orçamento e tome sua decisão
          </p>
        </div>

        <div className="space-y-6">
          {/* Status e Informações Básicas */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Orçamento {orcamento.numero}
                    <Badge variant={getStatusVariant(orcamento.status)} className="flex items-center gap-1">
                      {getStatusIcon(orcamento.status)}
                      {getStatusText(orcamento.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>{orcamento.titulo}</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(orcamento.valorTotal)}
                  </p>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cliente</p>
                    <p className="text-sm text-muted-foreground">{orcamento.cliente.nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data de Criação</p>
                    <p className="text-sm text-muted-foreground">{formatDate(orcamento.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle className={`h-4 w-4 ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">Válido até</p>
                    <p className={`text-sm ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formatDate(orcamento.dataValidade)}
                      {isExpired && ' (Expirado)'}
                    </p>
                  </div>
                </div>
              </div>

              {orcamento.descricao && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Descrição</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {orcamento.descricao}
                  </p>
                </div>
              )}

              {orcamento.observacoes && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">Observações</Label>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                    {orcamento.observacoes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens do Orçamento */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Orçamento</CardTitle>
              <CardDescription>
                {orcamento.itens.length} item(ns) incluído(s) neste orçamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-right">Valor Unitário</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orcamento.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.descricao}</p>
                          {item.observacoes && (
                            <p className="text-sm text-muted-foreground">{item.observacoes}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantidade}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.valorUnitario)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.valorTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    Total Geral: {formatCurrency(orcamento.valorTotal)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações de Aprovação */}
          {canApprove && (
            <Card>
              <CardHeader>
                <CardTitle>Decisão sobre o Orçamento</CardTitle>
                <CardDescription>
                  Aprove ou rejeite este orçamento. Você pode adicionar observações sobre sua decisão.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Adicione comentários sobre sua decisão..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAprovacao(true)}
                    disabled={processando}
                    className="flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Orçamento
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAprovacao(false)}
                    disabled={processando}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar Orçamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensagem para orçamentos já processados */}
          {!canApprove && (
            <Card>
              <CardContent className="text-center py-8">
                {orcamento.status === 'APROVADO' && (
                  <div className="text-green-600">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Orçamento Aprovado</h3>
                    <p className="text-muted-foreground">
                      Este orçamento já foi aprovado e está sendo processado.
                    </p>
                  </div>
                )}
                {orcamento.status === 'REJEITADO' && (
                  <div className="text-red-600">
                    <XCircle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Orçamento Rejeitado</h3>
                    <p className="text-muted-foreground">
                      Este orçamento foi rejeitado.
                    </p>
                  </div>
                )}
                {isExpired && (
                  <div className="text-orange-600">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Orçamento Expirado</h3>
                    <p className="text-muted-foreground">
                      Este orçamento expirou em {formatDate(orcamento.dataValidade)} e não pode mais ser aprovado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rodapé */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Em caso de dúvidas, entre em contato conosco através do e-mail: {orcamento.cliente.email}
          </p>
        </div>
      </div>
    </div>
  );
}
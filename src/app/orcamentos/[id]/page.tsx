'use client';

import { useParams, useRouter } from 'next/navigation';
import { useOrcamento, useAprovacaoOrcamento } from '@/hooks/useOrcamentos';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ArrowLeft, Edit, FileText, Clock, CheckCircle, XCircle, AlertCircle, Ban, Download, Send, Check, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function OrcamentoPage() {
  const params = useParams();
  const router = useRouter();
  const { canAccess } = useAuth();
  const { processarAprovacao, loading: loadingAprovacao } = useAprovacaoOrcamento();

  const id = params.id as string;
  const { orcamento, loading, error, refetch } = useOrcamento(id);

  // Funções auxiliares para status
  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'RASCUNHO':
        return 'secondary';
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
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RASCUNHO':
        return <FileText className="h-3 w-3" />;
      case 'ENVIADO':
        return <Clock className="h-3 w-3" />;
      case 'APROVADO':
        return <CheckCircle className="h-3 w-3" />;
      case 'REJEITADO':
        return <XCircle className="h-3 w-3" />;
      case 'EXPIRADO':
        return <AlertCircle className="h-3 w-3" />;
      case 'CANCELADO':
        return <Ban className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'RASCUNHO':
        return 'Rascunho';
      case 'ENVIADO':
        return 'Enviado';
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
      await processarAprovacao(id, aprovado);
      toast({
        title: 'Sucesso',
        description: `Orçamento ${aprovado ? 'aprovado' : 'rejeitado'} com sucesso`,
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao processar aprovação',
        variant: 'destructive',
      });
    }
  };

  if (!canAccess.orcamentos?.read) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para visualizar orçamentos.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (error || !orcamento) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive">{error || 'Orçamento não encontrado'}</p>
          <Button variant="outline" onClick={() => router.push('/orcamentos')} className="mt-2">
            Voltar para orçamentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredPermission={{
        recurso: 'orcamentos',
        acao: 'ler'
      }}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/orcamentos')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Orçamento {orcamento.numero}
              </h1>
              <p className="text-muted-foreground">
                {orcamento.titulo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(orcamento.status)} className="flex items-center gap-1">
              {getStatusIcon(orcamento.status)}
              {getStatusText(orcamento.status)}
            </Badge>
            {canAccess.orcamentos?.update && orcamento.status === 'RASCUNHO' && (
              <Button onClick={() => router.push(`/orcamentos/${id}/editar`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cliente</label>
                    <p className="text-sm">{orcamento.cliente.nome}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Ordem de Serviço</label>
                    <p className="text-sm">{orcamento.ordemServico.numero} - {orcamento.ordemServico.titulo}</p>
                  </div>
                  {orcamento.laudoTecnico && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Laudo Técnico</label>
                      <p className="text-sm">{orcamento.laudoTecnico.numero} - {orcamento.laudoTecnico.titulo}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Criado por</label>
                    <p className="text-sm">{orcamento.criador.nome}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                    <p className="text-sm">{formatDate(orcamento.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Data de Validade</label>
                    <p className="text-sm">{formatDate(orcamento.dataValidade)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                    <Badge variant={orcamento.geradoAutomaticamente ? 'default' : 'secondary'}>
                      {orcamento.geradoAutomaticamente ? 'Automático' : 'Manual'}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                    <p className="text-lg font-semibold">{formatCurrency(orcamento.valorTotal)}</p>
                  </div>
                </div>
                {orcamento.descricao && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                    <p className="text-sm whitespace-pre-wrap">{orcamento.descricao}</p>
                  </div>
                )}
                {orcamento.observacoes && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Observações</label>
                    <p className="text-sm whitespace-pre-wrap">{orcamento.observacoes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Itens do Orçamento */}
            <Card>
              <CardHeader>
                <CardTitle>Itens do Orçamento</CardTitle>
                <CardDescription>
                  {orcamento.itens.length} item(ns)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-right">Valor Unit.</TableHead>
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
                      Total: {formatCurrency(orcamento.valorTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ações */}
            {orcamento.status === 'ENVIADO' && canAccess.orcamentos?.approve && (
              <Card>
                <CardHeader>
                  <CardTitle>Aprovação</CardTitle>
                  <CardDescription>
                    Aprovar ou rejeitar este orçamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={() => handleAprovacao(true)}
                    disabled={loadingAprovacao}
                    className="w-full"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleAprovacao(false)}
                    disabled={loadingAprovacao}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Anexos */}
            {orcamento.anexos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Anexos</CardTitle>
                  <CardDescription>
                    {orcamento.anexos.length} arquivo(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {orcamento.anexos.map((anexo) => (
                    <div key={anexo.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{anexo.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {anexo.colaborador.nome} • {formatDate(anexo.createdAt)}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Histórico */}
            {orcamento.historico.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico</CardTitle>
                  <CardDescription>
                    Atividades recentes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orcamento.historico.map((item) => (
                    <div key={item.id} className="border-l-2 border-muted pl-3">
                      <p className="text-sm font-medium">{item.acao}</p>
                      <p className="text-sm text-muted-foreground">{item.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.colaborador.nome} • {formatDate(item.createdAt)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
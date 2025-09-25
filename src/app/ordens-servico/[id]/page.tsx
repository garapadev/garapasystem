'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2, Send, Play, Pause, CheckCircle, XCircle, FileText, User, Calendar, DollarSign, Clock, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useOrdemServico } from '@/hooks/useOrdensServico';
import { formatCurrency, getStatusVariant, getPriorityVariant, getStatusText, getPriorityText, formatDate, formatDateTime } from '@/lib/utils';

interface OrdemServicoDetailPageProps {
  params: {
    id: string;
  };
}

export default function OrdemServicoDetailPage({ params }: OrdemServicoDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { canAccess } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { ordemServico, loading, error, refetch } = useOrdemServico(params.id);

  if (!canAccess.ordens_servico.read) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para visualizar esta ordem de serviço.</p>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/ordens-servico/${params.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir ordem de serviço');
      }

      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço excluída com sucesso'
      });

      router.push('/ordens-servico');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir ordem de serviço',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (novoStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/ordens-servico/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: novoStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar status');
      }

      toast({
        title: 'Sucesso',
        description: 'Status atualizado com sucesso'
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar status',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendForApproval = async () => {
    setIsUpdatingStatus(true);
    try {
      const response = await fetch(`/api/ordens-servico/${params.id}/enviar-aprovacao`, {
        method: 'POST'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao enviar para aprovação');
      }

      toast({
        title: 'Sucesso',
        description: 'Ordem de serviço enviada para aprovação do cliente'
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao enviar para aprovação',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !ordemServico) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive">{error || 'Ordem de serviço não encontrada'}</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-2">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RASCUNHO':
        return <FileText className="h-4 w-4" />;
      case 'AGUARDANDO_APROVACAO':
        return <Clock className="h-4 w-4" />;
      case 'APROVADA':
        return <CheckCircle className="h-4 w-4" />;
      case 'EM_ANDAMENTO':
        return <Play className="h-4 w-4" />;
      case 'PAUSADA':
        return <Pause className="h-4 w-4" />;
      case 'CONCLUIDA':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELADA':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const canEdit = canAccess.ordens_servico.update && ['RASCUNHO', 'APROVADA', 'EM_ANDAMENTO', 'PAUSADA'].includes(ordemServico.status);
  const canDelete = canAccess.ordens_servico.delete && ordemServico.status === 'RASCUNHO';
  const canSendForApproval = canAccess.ordens_servico.update && ordemServico.status === 'RASCUNHO';
  const canChangeStatus = canAccess.ordens_servico.update && ['APROVADA', 'EM_ANDAMENTO', 'PAUSADA'].includes(ordemServico.status);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/ordens-servico">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Ordem de Serviço #{ordemServico.numero}
            </h1>
            <p className="text-muted-foreground">
              {ordemServico.titulo}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(ordemServico.status)} className="flex items-center gap-1">
            {getStatusIcon(ordemServico.status)}
            {getStatusText(ordemServico.status)}
          </Badge>
          <Badge variant={getPriorityVariant(ordemServico.prioridade)}>
            {getPriorityText(ordemServico.prioridade)}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground">Título</h4>
                <p className="text-sm">{ordemServico.titulo}</p>
              </div>
              {ordemServico.descricao && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Descrição</h4>
                  <p className="text-sm whitespace-pre-wrap">{ordemServico.descricao}</p>
                </div>
              )}
              {ordemServico.observacoes && (
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground">Observações</h4>
                  <p className="text-sm whitespace-pre-wrap">{ordemServico.observacoes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens da Ordem de Serviço */}
          {ordemServico.itens && ordemServico.itens.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Itens da Ordem de Serviço
                </CardTitle>
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
                    {ordemServico.itens.map((item, index) => (
                      <TableRow key={index}>
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
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.quantidade * item.valorUnitario)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Separator className="my-4" />
                <div className="flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Valor Total:</p>
                    <p className="text-lg font-semibold">{formatCurrency(ordemServico.valorTotal)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canEdit && (
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push(`/ordens-servico/${params.id}/editar`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              )}

              {canSendForApproval && (
                <Button 
                  className="w-full justify-start" 
                  onClick={handleSendForApproval}
                  disabled={isUpdatingStatus}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Aprovação
                </Button>
              )}

              {canChangeStatus && (
                <>
                  {ordemServico.status === 'APROVADA' && (
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleStatusChange('EM_ANDAMENTO')}
                      disabled={isUpdatingStatus}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Iniciar Execução
                    </Button>
                  )}

                  {ordemServico.status === 'EM_ANDAMENTO' && (
                    <>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => handleStatusChange('PAUSADA')}
                        disabled={isUpdatingStatus}
                      >
                        <Pause className="mr-2 h-4 w-4" />
                        Pausar
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        onClick={() => handleStatusChange('CONCLUIDA')}
                        disabled={isUpdatingStatus}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Concluir
                      </Button>
                    </>
                  )}

                  {ordemServico.status === 'PAUSADA' && (
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => handleStatusChange('EM_ANDAMENTO')}
                      disabled={isUpdatingStatus}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Retomar
                    </Button>
                  )}
                </>
              )}

              {canDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a ordem de serviço "{ordemServico.numero}"?
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="font-medium">{ordemServico.cliente.nome}</p>
                {ordemServico.cliente.email && (
                  <p className="text-sm text-muted-foreground">{ordemServico.cliente.email}</p>
                )}
                {ordemServico.cliente.telefone && (
                  <p className="text-sm text-muted-foreground">{ordemServico.cliente.telefone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Responsável */}
          {ordemServico.responsavel && (
            <Card>
              <CardHeader>
                <CardTitle>Responsável</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{ordemServico.responsavel.nome}</p>
                <p className="text-sm text-muted-foreground">{ordemServico.responsavel.email}</p>
              </CardContent>
            </Card>
          )}

          {/* Datas e Valores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="text-sm font-medium">{formatDate(ordemServico.createdAt)}</p>
              </div>
              {ordemServico.dataInicio && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Início</p>
                  <p className="text-sm font-medium">{formatDate(ordemServico.dataInicio)}</p>
                </div>
              )}
              {ordemServico.dataFim && (
                <div>
                  <p className="text-sm text-muted-foreground">Data de Fim Prevista</p>
                  <p className="text-sm font-medium">{formatDate(ordemServico.dataFim)}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-sm font-medium">{formatCurrency(ordemServico.valorTotal)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOrcamentos } from '@/hooks/useOrcamentos';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Plus, Search, Filter, Eye, Edit, Trash2, FileText, Clock, CheckCircle, XCircle, AlertCircle, Ban, Zap } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function OrcamentosPage() {
  const router = useRouter();
  const { user, canAccess } = useAuth();
  const { socket } = useSocket();

  // Estados para filtros
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [geradoAutomaticamenteFilter, setGeradoAutomaticamenteFilter] = useState<boolean | null>(null);

  // Hook para buscar orçamentos
  const { orcamentos, loading, error, meta, refetch } = useOrcamentos({
    page: currentPage,
    limit: pageSize,
    search: searchTerm || undefined,
    status: statusFilter || undefined,
    geradoAutomaticamente: geradoAutomaticamenteFilter || undefined,
  });

  // Handlers para filtros
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((value: string) => {
    setStatusFilter(value === 'all' ? null : value);
    setCurrentPage(1);
  }, []);

  const handleGeradoAutomaticamenteFilter = useCallback((value: string) => {
    setGeradoAutomaticamenteFilter(value === 'all' ? null : value === 'true');
    setCurrentPage(1);
  }, []);

  // Handler para exclusão
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/orcamentos/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir orçamento');
      }

      toast({
        title: 'Sucesso',
        description: 'Orçamento excluído com sucesso',
      });

      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir orçamento',
        variant: 'destructive',
      });
    }
  };

  // Funções auxiliares para status
  const getStatusVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'RASCUNHO':
        return 'secondary';
      case 'ENVIADO':
        return 'default';
      case 'APROVADO':
        return 'default'; // Verde não está disponível, usando default
      case 'REJEITADO':
        return 'destructive';
      case 'EXPIRADO':
        return 'outline'; // Amarelo não está disponível, usando outline
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

  if (!canAccess.orcamentos?.any) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredPermission={{
        recurso: 'orcamentos',
        acao: 'read'
      }}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Orçamentos</h1>
            <p className="text-muted-foreground">
              Gerencie os orçamentos da empresa
            </p>
          </div>
          {canAccess.orcamentos?.create && (
            <div className="flex gap-2">
              <Button onClick={() => router.push('/orcamentos/novo')}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Orçamento
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/orcamentos/gerar-automatico')}
              >
                <Zap className="mr-2 h-4 w-4" />
                Gerar Automático
              </Button>
            </div>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Buscar por número, título ou cliente..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="ENVIADO">Enviado</SelectItem>
                  <SelectItem value="APROVADO">Aprovado</SelectItem>
                  <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                  <SelectItem value="EXPIRADO">Expirado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={geradoAutomaticamenteFilter === null ? 'all' : geradoAutomaticamenteFilter.toString()} onValueChange={handleGeradoAutomaticamenteFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="true">Automático</SelectItem>
                  <SelectItem value="false">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle>Orçamentos</CardTitle>
            <CardDescription>
              {meta.total} orçamento(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-destructive">{error}</p>
                  <Button variant="outline" onClick={refetch} className="mt-2">
                    Tentar novamente
                  </Button>
                </div>
              </div>
            ) : orcamentos.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <p className="text-muted-foreground">Nenhum orçamento encontrado</p>
                  {canAccess.orcamentos?.create && (
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/orcamentos/novo')}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Criar primeiro orçamento
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>OS</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Total</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orcamentos.map((orcamento) => (
                      <TableRow key={orcamento.id}>
                        <TableCell className="font-medium">{orcamento.numero}</TableCell>
                        <TableCell>{orcamento.titulo}</TableCell>
                        <TableCell>{orcamento.cliente.nome}</TableCell>
                        <TableCell>{orcamento.ordemServico.numero}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(orcamento.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(orcamento.status)}
                            {getStatusText(orcamento.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={orcamento.geradoAutomaticamente ? 'default' : 'secondary'}>
                            {orcamento.geradoAutomaticamente ? 'Automático' : 'Manual'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(orcamento.valorTotal)}</TableCell>
                        <TableCell>{formatDate(orcamento.dataValidade)}</TableCell>
                        <TableCell>{formatDate(orcamento.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canAccess.orcamentos?.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/orcamentos/${orcamento.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {canAccess.orcamentos?.update && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/orcamentos/${orcamento.id}/editar`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canAccess.orcamentos?.delete && orcamento.status === 'RASCUNHO' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o orçamento "{orcamento.numero}"?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(orcamento.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {meta.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * pageSize) + 1} a {Math.min(currentPage * pageSize, meta.total)} de {meta.total} resultados
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="text-sm">
                        Página {currentPage} de {meta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === meta.totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
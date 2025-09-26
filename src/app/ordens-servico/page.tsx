'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, FileText, Clock, CheckCircle, XCircle, Pause, Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useOrdensServico } from '@/hooks/useOrdensServico';
import { formatCurrency, getStatusVariant, getPriorityVariant, getStatusText, getPriorityText, formatDate } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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

export default function OrdensServicoPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const { socket } = useSocket();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [prioridadeFilter, setPrioridadeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const { ordensServico, loading, error, meta, refetch } = useOrdensServico({
    page: currentPage,
    limit: pageSize,
    search: searchTerm,
    status: statusFilter,
    prioridade: prioridadeFilter
  });

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/ordens-servico/${id}`, {
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

      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao excluir ordem de serviço',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handlePrioridadeFilter = (value: string) => {
    setPrioridadeFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  if (!canAccess.ordens_servico.any) {
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
        recurso: 'ordens_servico',
        acao: 'read'
      }}
    >
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ordens de Serviço</h1>
            <p className="text-muted-foreground">
              Gerencie as ordens de serviço da empresa
            </p>
          </div>
          {canAccess.ordens_servico.create && (
            <Button onClick={() => router.push('/ordens-servico/nova')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Ordem de Serviço
            </Button>
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
                <SelectItem value="AGUARDANDO_APROVACAO">Aguardando Aprovação</SelectItem>
                <SelectItem value="APROVADA">Aprovada</SelectItem>
                <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                <SelectItem value="PAUSADA">Pausada</SelectItem>
                <SelectItem value="CONCLUIDA">Concluída</SelectItem>
                <SelectItem value="CANCELADA">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={prioridadeFilter || 'all'} onValueChange={handlePrioridadeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Prioridades</SelectItem>
                <SelectItem value="BAIXA">Baixa</SelectItem>
                <SelectItem value="MEDIA">Média</SelectItem>
                <SelectItem value="ALTA">Alta</SelectItem>
                <SelectItem value="URGENTE">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Ordens de Serviço</CardTitle>
          <CardDescription>
            {meta.total} ordem(ns) de serviço encontrada(s)
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
          ) : ordensServico.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-muted-foreground">Nenhuma ordem de serviço encontrada</p>
                {canAccess.ordens_servico.create && (
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/ordens-servico/nova')}
                    className="mt-2"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira ordem de serviço
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
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data Criação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordensServico.map((ordem, index) => (
                    <TableRow 
                      key={ordem.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                      }`}
                      onClick={() => {
                        if (canAccess.ordens_servico.read) {
                          router.push(`/ordens-servico/${ordem.id}`);
                        }
                      }}
                    >
                      <TableCell className="font-medium">{ordem.numero}</TableCell>
                      <TableCell>{ordem.titulo}</TableCell>
                      <TableCell>{ordem.cliente.nome}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(ordem.status)} className="flex items-center gap-1 w-fit">
                          {getStatusIcon(ordem.status)}
                          {getStatusText(ordem.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityVariant(ordem.prioridade)}>
                          {getPriorityText(ordem.prioridade)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(ordem.createdAt)}</TableCell>
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
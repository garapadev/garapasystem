'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileCheck, Search, Filter, Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLaudosTecnicos } from '@/hooks/useLaudosTecnicos';
import { formatDate, getStatusVariant } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'RASCUNHO':
      return <FileText className="h-4 w-4" />;
    case 'EM_ANALISE':
      return <Clock className="h-4 w-4" />;
    case 'AGUARDANDO_APROVACAO':
      return <AlertCircle className="h-4 w-4" />;
    case 'APROVADO':
      return <CheckCircle className="h-4 w-4" />;
    case 'REJEITADO':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'RASCUNHO':
      return 'Rascunho';
    case 'EM_ANALISE':
      return 'Em Análise';
    case 'AGUARDANDO_APROVACAO':
      return 'Aguardando Aprovação';
    case 'APROVADO':
      return 'Aprovado';
    case 'REJEITADO':
      return 'Rejeitado';
    default:
      return status;
  }
};

export default function LaudosTecnicosPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  const {
    laudos,
    loading,
    totalPages,
    totalCount,
    fetchLaudos,
    deleteLaudo
  } = useLaudosTecnicos({
    page: currentPage,
    pageSize,
    search: searchTerm,
    status: statusFilter
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleView = (laudoId: string) => {
    router.push(`/laudos-tecnicos/${laudoId}`);
  };

  const handleEdit = (laudoId: string) => {
    router.push(`/laudos-tecnicos/${laudoId}/editar`);
  };

  const handleDelete = async (laudoId: string) => {
    if (confirm('Tem certeza que deseja excluir este laudo técnico?')) {
      try {
        await deleteLaudo(laudoId);
        toast({
          title: 'Sucesso',
          description: 'Laudo técnico excluído com sucesso'
        });
        fetchLaudos();
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao excluir laudo técnico',
          variant: 'destructive'
        });
      }
    }
  };

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'laudos', acao: 'ler' }}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileCheck className="h-8 w-8" />
              Laudos Técnicos
            </h1>
            <p className="text-muted-foreground">
              Gerencie os laudos técnicos das ordens de serviço
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use os filtros abaixo para encontrar laudos específicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, título ou técnico..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                  <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                  <SelectItem value="AGUARDANDO_APROVACAO">Aguardando Aprovação</SelectItem>
                  <SelectItem value="APROVADO">Aprovado</SelectItem>
                  <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Laudos Técnicos</CardTitle>
            <CardDescription>
              {totalCount > 0 ? `${totalCount} laudo(s) encontrado(s)` : 'Nenhum laudo encontrado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : laudos.length === 0 ? (
              <div className="text-center py-8">
                <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum laudo encontrado</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter
                    ? 'Tente ajustar os filtros para encontrar laudos.'
                    : 'Os laudos técnicos são criados automaticamente através das ordens de serviço.'}
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Ordem de Serviço</TableHead>
                      <TableHead>Técnico</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laudos.map((laudo) => (
                      <TableRow key={laudo.id}>
                        <TableCell className="font-medium">
                          {laudo.numero}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {laudo.titulo}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => router.push(`/ordens-servico/${laudo.ordemServicoId}`)}
                          >
                            {laudo.ordemServico?.numero || laudo.ordemServicoId}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {laudo.tecnico?.nome || 'Não atribuído'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(laudo.status)} className="flex items-center gap-1 w-fit">
                            {getStatusIcon(laudo.status)}
                            {getStatusText(laudo.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatDate(laudo.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(laudo.id)}
                              title="Visualizar"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canAccess.laudos?.update && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(laudo.id)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canAccess.laudos?.delete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(laudo.id)}
                                title="Excluir"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
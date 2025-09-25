'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Eye, Shield, Loader2, Filter } from 'lucide-react';
import { usePermissoes } from '@/hooks/usePermissoes';
import { useRecursos } from '@/hooks/useRecursos';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { toast } from 'sonner';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

const getAcaoVariant = (acao: string) => {
  switch (acao) {
    case 'criar':
    case 'CREATE':
      return 'default';
    case 'editar':
    case 'UPDATE':
      return 'secondary';
    case 'excluir':
    case 'DELETE':
      return 'destructive';
    case 'ler':
    case 'READ':
      return 'outline';
    case 'gerenciar':
    case 'MANAGE':
      return 'default';
    case 'administrar':
    case 'ADMIN':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function PermissoesPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [recursoFilter, setRecursoFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  const { permissoes, loading, error, meta, refetch, deletePermissao } = usePermissoes({
    page: currentPage,
    limit,
    search: searchTerm || undefined,
    recurso: recursoFilter || undefined
  });

  // Buscar recursos dinamicamente
  const { recursos, loading: recursosLoading } = useRecursos();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRecursoFilter = (value: string) => {
    const filterValue = value === 'todos' ? '' : value;
    setRecursoFilter(filterValue);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRecursoFilter('');
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deletePermissao(id);
      toast.success('Permissão excluída com sucesso!');
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir permissão');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'permissoes', acao: 'ler' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Permissões</h1>
              <p className="text-muted-foreground">
                Gerencie as permissões do sistema (RBAC)
              </p>
            </div>
          </div>
          {canAccess.permissoes.create && (
            <Button onClick={() => router.push('/configuracoes/permissoes/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Permissão
            </Button>
          )}
        </div>

        {/* Card de busca e filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Permissões</CardTitle>
            <CardDescription>
              Busque permissões por nome, descrição, recurso ou ação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar permissões..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={recursoFilter || 'todos'} onValueChange={handleRecursoFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por recurso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os recursos</SelectItem>
                  {recursos.map((recurso) => (
                    <SelectItem key={recurso} value={recurso}>
                      {recurso === 'webmail' ? (
                        <span className="flex items-center">
                          <Badge variant="secondary" className="mr-2">Novo</Badge>
                          {recurso}
                        </span>
                      ) : (
                        recurso
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(searchTerm || recursoFilter) && (
                <Button variant="outline" onClick={clearFilters}>
                  <Filter className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando permissões...</span>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
         {error && (
           <Alert variant="destructive">
             <AlertDescription>
               Erro ao carregar permissões: {typeof error === 'string' ? error : 'Erro desconhecido'}
             </AlertDescription>
           </Alert>
         )}

        {/* Tabela de permissões */}
        {!loading && !error && (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Permissões</CardTitle>
              <CardDescription>
                {meta?.total || 0} permissões encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissoes && permissoes.length > 0 ? (
                      permissoes.map((permissao) => (
                        <TableRow key={permissao.id}>
                          <TableCell className="font-medium">
                            {permissao.nome}
                          </TableCell>
                          <TableCell>{permissao.descricao}</TableCell>
                          <TableCell className="capitalize">
                            {permissao.recurso}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getAcaoVariant(permissao.acao)}>
                              {permissao.acao}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDate(permissao.createdAt)}
                          </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push(`/configuracoes/permissoes/${permissao.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canAccess.permissoes.update && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/configuracoes/permissoes/${permissao.id}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canAccess.permissoes.delete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={deletingId === permissao.id}
                                >
                                  {deletingId === permissao.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a permissão "{permissao.nome}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(permissao.id)}
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Nenhuma permissão encontrada
                    </TableCell>
                  </TableRow>
                )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
             {meta && meta.totalPages > 1 && (
               <div className="flex items-center justify-between px-2 py-4">
                 <div className="text-sm text-muted-foreground">
                   Página {meta.page} de {meta.totalPages} ({meta.total} total)
                 </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, meta.totalPages))}
                    disabled={currentPage === meta.totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
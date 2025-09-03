'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Shield, Loader2, Users } from 'lucide-react';
import { usePerfis } from '@/hooks/usePerfis';
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

const getStatusVariant = (ativo: boolean) => {
  return ativo ? 'default' : 'secondary';
};

export default function PerfisPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  const { perfis, loading, error, meta, refetch, deletePerfil } = usePerfis({
    page: currentPage,
    limit,
    search: searchTerm || undefined
  });

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await deletePerfil(id);
      toast.success('Perfil excluído com sucesso!');
      refetch();
    } catch (error) {
      toast.error('Erro ao excluir perfil');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'perfis', acao: 'ler' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Perfis de Acesso</h1>
            <p className="text-muted-foreground">
              Gerencie os perfis de acesso e suas permissões
            </p>
          </div>
          {canAccess.perfis.create && (
            <Button onClick={() => router.push('/perfis/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Perfil
            </Button>
          )}
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando perfis...</span>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Erro ao carregar perfis: {typeof error === 'string' ? error : 'Erro desconhecido'}
            </AlertDescription>
          </Alert>
        )}

        {/* Tabela de perfis */}
        {!loading && !error && (
          <Card>
            <CardHeader>
              <CardTitle>Lista de Perfis</CardTitle>
              <CardDescription>
                {meta?.total || 0} perfis encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Colaboradores</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perfis && perfis.length > 0 ? (
                      perfis.map((perfil) => (
                        <TableRow key={perfil.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span>{perfil.nome}</span>
                            </div>
                          </TableCell>
                          <TableCell>{perfil.descricao || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(perfil.ativo)}>
                              {perfil.ativo ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{perfil._count?.colaboradores || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Shield className="h-4 w-4 text-muted-foreground" />
                              <span>{perfil._count?.permissoes || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatDate(perfil.createdAt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/perfis/${perfil.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canAccess.perfis.update && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => router.push(`/perfis/${perfil.id}/editar`)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canAccess.perfis.delete && (
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
                                        Tem certeza que deseja excluir o perfil "{perfil.nome}"?
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(perfil.id)}
                                        disabled={deletingId === perfil.id}
                                      >
                                        {deletingId === perfil.id ? 'Excluindo...' : 'Excluir'}
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
                        <TableCell colSpan={7} className="text-center py-8">
                          Nenhum perfil encontrado
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
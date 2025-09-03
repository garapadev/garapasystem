'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, UserCircle, Building2, Shield, Loader2 } from 'lucide-react';
import { useColaboradores, deleteColaborador } from '@/hooks/useColaboradores';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
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

export default function ColaboradoresPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const { emitEntityUpdate } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  const { colaboradores, loading, error, meta, refetch } = useColaboradores({
    page: currentPage,
    limit,
    search: searchTerm || undefined
  });

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const colaborador = colaboradores.find(c => c.id === id);
      await deleteColaborador(id, colaborador?.nome, emitEntityUpdate);
      toast.success('Colaborador excluído com sucesso!');
      refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao excluir colaborador';
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'colaboradores', acao: 'ler' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <UserCircle className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Colaboradores</h1>
              <p className="text-muted-foreground">
                Gerencie os colaboradores da empresa
              </p>
            </div>
          </div>
          {canAccess.colaboradores.create && (
            <Button onClick={() => router.push('/colaboradores/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Colaborador
            </Button>
          )}
        </div>

        {/* Card de busca e filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Colaboradores</CardTitle>
            <CardDescription>
              Busque colaboradores por nome, email ou cargo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar colaboradores..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de colaboradores */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Colaboradores</CardTitle>
            <CardDescription>
              {loading ? 'Carregando...' : `${meta.total} colaboradores encontrados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4">
                <AlertDescription>
                  {error}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refetch}
                    className="ml-2"
                  >
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando colaboradores...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Grupo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colaboradores.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Nenhum colaborador encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      colaboradores.map((colaborador) => (
                    <TableRow key={colaborador.id}>
                      <TableCell className="font-medium">
                        {colaborador.nome}
                      </TableCell>
                      <TableCell>{colaborador.email}</TableCell>
                      <TableCell>{colaborador.cargo}</TableCell>
                      <TableCell>
                        {colaborador.perfil && (
                          <Badge variant="outline">
                            {colaborador.perfil.nome}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {colaborador.grupoHierarquico && (
                          <Badge variant="secondary">
                            {colaborador.grupoHierarquico.nome}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={colaborador.ativo ? 'default' : 'secondary'}>
                          {colaborador.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {canAccess.colaboradores.read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/colaboradores/${colaborador.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {canAccess.colaboradores.update && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/colaboradores/${colaborador.id}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {canAccess.colaboradores.delete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled={deletingId === colaborador.id}
                                >
                                  {deletingId === colaborador.id ? (
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
                                    Tem certeza que deseja excluir o colaborador "{colaborador.nome}"? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(colaborador.id)}>
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
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination */}
            {!loading && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {meta.totalPages} ({meta.total} colaboradores)
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
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
          </CardContent>
        </Card>
      </div>

    </ProtectedRoute>
  );
}
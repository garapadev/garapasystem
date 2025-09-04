'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Users, Loader2 } from 'lucide-react';
import { useGruposHierarquicos, deleteGrupoHierarquico } from '@/hooks/useGruposHierarquicos';
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

export default function GruposHierarquicosPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const { emitEntityUpdate } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;

  const { grupos, loading, error, meta, refetch } = useGruposHierarquicos({
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
      const grupo = grupos.find(g => g.id === id);
      await deleteGrupoHierarquico(id, grupo?.nome, emitEntityUpdate);
      toast.success('Grupo hierárquico excluído com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir grupo hierárquico');
    } finally {
      setDeletingId(null);
    }
  };

  const buildHierarchy = (grupos: any[], parentId: string | null = null): any[] => {
    return grupos
      .filter(grupo => grupo.parentId === parentId)
      .map(grupo => ({
        ...grupo,
        children: buildHierarchy(grupos, grupo.id)
      }));
  };

  const renderGrupoRow = (grupo: any, level = 0) => {
    const indent = '  '.repeat(level);
    
    return (
      <React.Fragment key={grupo.id}>
        <TableRow>
          <TableCell className="font-medium">
            <span style={{ marginLeft: `${level * 20}px` }}>
              {indent}
              {grupo.nome}
            </span>
          </TableCell>
          <TableCell>{grupo.descricao}</TableCell>
          <TableCell>
            <Badge variant={grupo.ativo ? 'default' : 'secondary'}>
              {grupo.ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </TableCell>
          <TableCell>{grupo.parent?.nome || '-'}</TableCell>
          <TableCell>{grupo.childrenCount}</TableCell>
          <TableCell>{grupo.clientesCount}</TableCell>
          <TableCell>{grupo.colaboradoresCount}</TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/grupos-hierarquicos/${grupo.id}`)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canAccess.grupos.update && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push(`/grupos-hierarquicos/${grupo.id}/editar`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canAccess.grupos.delete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      disabled={deletingId === grupo.id}
                    >
                      {deletingId === grupo.id ? (
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
                        Tem certeza que deseja excluir o grupo "{grupo.nome}"? 
                        Esta ação não pode ser desfeita e todos os subgrupos também serão excluídos.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDelete(grupo.id)}
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
        {grupo.children && grupo.children.map((child: any) => renderGrupoRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const hierarchicalGrupos = buildHierarchy(grupos);

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'gruposHierarquicos', acao: 'ler' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grupos Hierárquicos</h1>
            <p className="text-muted-foreground">
              Gerencie a estrutura organizacional da empresa
            </p>
          </div>
          {canAccess.grupos.create && (
            <Button onClick={() => router.push('/grupos-hierarquicos/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Grupo
            </Button>
          )}
        </div>

        {/* Card de busca e filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Grupos</CardTitle>
            <CardDescription>
              Busque grupos por nome ou descrição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar grupos..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de grupos */}
        <Card>
          <CardHeader>
            <CardTitle>Estrutura Hierárquica</CardTitle>
            <CardDescription>
              {loading ? 'Carregando...' : `${meta.total} grupos encontrados`}
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
                <span className="ml-2">Carregando grupos...</span>
              </div>
            ) : (
              <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Superior</TableHead>
                    <TableHead>Subgrupos</TableHead>
                    <TableHead>Clientes</TableHead>
                    <TableHead>Colaboradores</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Nenhum grupo encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    hierarchicalGrupos.map((grupo) => renderGrupoRow(grupo))
                  )}
                </TableBody>
              </Table>
            </div>
            )}
            
            {/* Pagination */}
            {!loading && meta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {meta.totalPages} ({meta.total} grupos)
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
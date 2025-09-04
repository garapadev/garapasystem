'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Building2, Users, UserPlus, Calendar, Hash, Loader2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useGrupoHierarquico, deleteGrupoHierarquico } from '@/hooks/useGruposHierarquicos';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function GrupoHierarquicoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const id = params.id as string;
  const { grupo, loading, error } = useGrupoHierarquico(id);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!grupo) return;
    
    setIsDeleting(true);
    try {
      await deleteGrupoHierarquico(grupo.id);
      toast({
        title: 'Sucesso',
        description: 'Grupo hierárquico excluído com sucesso.',
      });
      router.push('/grupos-hierarquicos');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir grupo hierárquico.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando grupo hierárquico...</span>
        </div>
      </div>
    );
  }

  if (error || !grupo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Grupo não encontrado</h1>
          <p className="text-gray-600 mt-2">O grupo hierárquico que você está procurando não existe.</p>
        </div>
        <Link href="/grupos-hierarquicos">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Grupos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/grupos-hierarquicos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{grupo.nome}</h1>
              <p className="text-muted-foreground">
                Detalhes do grupo hierárquico
              </p>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/grupos-hierarquicos/${grupo.id}/editar`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button 
            variant="destructive" 
            onClick={handleDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Grupo
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Descrição:</span>
              <span>{grupo.descricao || 'Sem descrição'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Status:</span>
              <Badge variant={grupo.ativo ? 'default' : 'secondary'}>
                {grupo.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            {grupo.parent && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Grupo Superior:</span>
                <span>{grupo.parent.nome}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Criado em:</span>
              <span>{new Date(grupo.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span>Subgrupos</span>
              </div>
              <Badge variant="outline">{grupo.children?.length || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Clientes</span>
              </div>
              <Badge variant="outline">{grupo.clientes?.length || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <span>Colaboradores</span>
              </div>
              <Badge variant="outline">{grupo.colaboradores?.length || 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subgrupos */}
      {grupo.children && grupo.children.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Subgrupos</CardTitle>
            <CardDescription>
              Grupos que pertencem a este grupo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupo.children?.map((child) => (
                    <TableRow key={child.id}>
                      <TableCell className="font-medium">{child.nome}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/grupos-hierarquicos/${child.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes</CardTitle>
          <CardDescription>
            Clientes associados a este grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupo.clientes && grupo.clientes.length > 0 ? (
                  grupo.clientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/clientes/${cliente.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhum cliente associado a este grupo
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle>Colaboradores</CardTitle>
          <CardDescription>
            Colaboradores associados a este grupo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupo.colaboradores && grupo.colaboradores.length > 0 ? (
                  grupo.colaboradores.map((colaborador) => (
                    <TableRow key={colaborador.id}>
                      <TableCell className="font-medium">{colaborador.nome}</TableCell>
                      <TableCell>{colaborador.email}</TableCell>
                      <TableCell>{colaborador.cargo}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/colaboradores/${colaborador.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum colaborador associado a este grupo
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">ID:</span>
              <span>{grupo.id}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Data de Criação:</span>
              <span>{new Date(grupo.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo hierárquico "{grupo?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
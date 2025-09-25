'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Edit, Shield, Calendar, Hash, Users, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { usePerfil } from '@/hooks/usePerfis';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusVariant = (ativo: boolean) => {
  return ativo ? 'default' : 'secondary';
};

const getAcaoColor = (acao: string) => {
  const colors: Record<string, string> = {
    'criar': 'bg-green-100 text-green-800',
    'ler': 'bg-blue-100 text-blue-800',
    'editar': 'bg-yellow-100 text-yellow-800',
    'excluir': 'bg-red-100 text-red-800'
  };
  return colors[acao] || 'bg-gray-100 text-gray-800';
};

export default function PerfilPage() {
  const params = useParams();
  const { canAccess } = useAuth();
  const id = params.id as string;
  
  const { perfil, loading, error } = usePerfil(id);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ recurso: 'perfis', acao: 'ler' }}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando perfil...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !perfil) {
    return (
      <ProtectedRoute requiredPermission={{ recurso: 'perfis', acao: 'ler' }}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/perfis">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Perfil não encontrado</h1>
            </div>
          </div>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Perfil não encontrado'}
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'perfis', acao: 'ler' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/perfis">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{perfil.nome}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getStatusVariant(perfil.ativo)}>
                      {perfil.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {canAccess.perfis.update && (
            <Link href={`/perfis/${perfil.id}/editar`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Nome:</span>
                <span>{perfil.nome}</span>
              </div>
              {perfil.descricao && (
                <div className="space-y-1">
                  <span className="font-medium">Descrição:</span>
                  <p className="text-sm text-muted-foreground">{perfil.descricao}</p>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                <Badge variant={getStatusVariant(perfil.ativo)}>
                  {perfil.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Colaboradores:</span>
                <span>{perfil._count?.colaboradores || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Permissões:</span>
                <span>{perfil._count?.permissoes || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Permissões Associadas</CardTitle>
            <CardDescription>
              Lista de permissões atribuídas a este perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            {perfil.permissoes && perfil.permissoes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Recurso</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perfil.permissoes.map((item) => (
                      <TableRow key={item.permissao.id}>
                        <TableCell className="font-medium">
                          {item.permissao.nome}
                        </TableCell>
                        <TableCell>
                          {item.permissao.descricao || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.permissao.recurso}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAcaoColor(item.permissao.acao)}>
                            {item.permissao.acao}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/permissoes/${item.permissao.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma permissão associada a este perfil
              </div>
            )}
          </CardContent>
        </Card>

        {/* Colaboradores */}
        <Card>
          <CardHeader>
            <CardTitle>Colaboradores com este Perfil</CardTitle>
            <CardDescription>
              Lista de colaboradores que possuem este perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            {perfil.colaboradores && perfil.colaboradores.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {perfil.colaboradores.map((colaborador) => (
                      <TableRow key={colaborador.id}>
                        <TableCell className="font-medium">
                          {colaborador.nome}
                        </TableCell>
                        <TableCell>{colaborador.email}</TableCell>
                        <TableCell>{colaborador.cargo}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(colaborador.ativo)}>
                            {colaborador.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/colaboradores/${colaborador.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum colaborador possui este perfil
              </div>
            )}
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
                <span className="font-mono text-sm">{perfil.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Criado em:</span>
                <span>{formatDate(perfil.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Atualizado em:</span>
                <span>{formatDate(perfil.updatedAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
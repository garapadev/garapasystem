'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Edit, User, Calendar, Hash, Shield, Mail, Loader2, Eye } from 'lucide-react';
import Link from 'next/link';
import { useUsuario } from '@/hooks/useUsuarios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

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

const getUserInitials = (email: string, nome?: string) => {
  if (nome) {
    return nome
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email.charAt(0).toUpperCase();
};

export default function UsuarioPage() {
  const params = useParams();
  const { canAccess } = useAuth();
  const id = params.id as string;
  
  const { usuario, loading, error } = useUsuario(id);

  if (loading) {
    return (
      <ProtectedRoute requiredPermission={{ recurso: 'usuarios', acao: 'ler' }}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando usuário...</span>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !usuario) {
    return (
      <ProtectedRoute requiredPermission={{ recurso: 'usuarios', acao: 'ler' }}>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Link href="/usuarios">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Usuário não encontrado</h1>
            </div>
          </div>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Usuário não encontrado'}
            </AlertDescription>
          </Alert>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'usuarios', acao: 'ler' }}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/usuarios">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getUserInitials(usuario.email, usuario.nome)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {usuario.nome || usuario.email}
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant={getStatusVariant(usuario.ativo)}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {canAccess.usuarios.update && (
            <Link href={`/usuarios/${usuario.id}/editar`}>
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
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span>{usuario.email}</span>
              </div>
              {usuario.nome && (
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Nome:</span>
                  <span>{usuario.nome}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                <Badge variant={getStatusVariant(usuario.ativo)}>
                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              {usuario.ultimoLogin && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Último Login:</span>
                  <span>{formatDate(usuario.ultimoLogin)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Colaborador Associado */}
          <Card>
            <CardHeader>
              <CardTitle>Colaborador Associado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {usuario.colaborador ? (
                <>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Nome:</span>
                    <span>{usuario.colaborador.nome}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Email:</span>
                    <span>{usuario.colaborador.email}</span>
                  </div>
                  {usuario.colaborador.cargo && (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Cargo:</span>
                      <span>{usuario.colaborador.cargo}</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <Link href={`/colaboradores/${usuario.colaborador.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Colaborador
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum colaborador associado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

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
                <span className="font-mono text-sm">{usuario.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Criado em:</span>
                <span>{formatDate(usuario.createdAt)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Atualizado em:</span>
                <span>{formatDate(usuario.updatedAt)}</span>
              </div>
              {usuario.colaboradorId && (
                <div className="flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">ID do Colaborador:</span>
                  <span className="font-mono text-sm">{usuario.colaboradorId}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
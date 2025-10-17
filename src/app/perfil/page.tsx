'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserCircle, Mail, Phone, Building2, Shield, Calendar, Hash, Edit, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useColaborador } from '@/hooks/useColaboradores';

export default function MeuPerfilPage() {
  const { colaborador: currentColaborador, isAuthenticated } = useAuth() as any;
  const colaboradorId = currentColaborador?.id as string | undefined;
  const { colaborador, loading, error } = useColaborador(colaboradorId || '');

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>Você precisa estar autenticado para acessar seu perfil.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!colaboradorId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>Não foi possível identificar seu colaborador vinculado.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Carregando meu perfil...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>Erro ao carregar perfil: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>Perfil não encontrado.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <UserCircle className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
            <p className="text-muted-foreground">Visualize suas informações pessoais</p>
          </div>
        </div>
        <Link href={`/perfil/editar`}>
          <Button>
            <Edit className="mr-2 h-4 w-4" />
            Editar meus dados
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{colaborador.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{colaborador.telefone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Documento:</span>
              <span>{colaborador.documento}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-medium">Status:</span>
              <Badge variant={colaborador.ativo ? 'default' : 'secondary'}>
                {colaborador.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Informações Profissionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Cargo:</span>
              <span>{colaborador.cargo}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Admissão:</span>
              <span>{new Date(colaborador.dataAdmissao).toLocaleDateString('pt-BR')}</span>
            </div>
            {colaborador.perfil && (
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Perfil:</span>
                  <Badge variant="outline" className="ml-2">
                    {colaborador.perfil.nome}
                  </Badge>
                </div>
              </div>
            )}
            {colaborador.grupoHierarquico && (
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Grupo:</span>
                  <Badge variant="secondary" className="ml-2">
                    {colaborador.grupoHierarquico.nome}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
          <CardDescription>Dados técnicos vinculados ao seu cadastro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">ID:</span>
              <span>{colaborador.id}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Data de Cadastro:</span>
              <span>{new Date(colaborador.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
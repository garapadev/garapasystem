'use client';

import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Edit, UserCircle, Mail, Phone, Building2, Shield, Calendar, Hash, Briefcase, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useColaborador } from '@/hooks/useColaboradores';



export default function ColaboradorDetalhePage() {
  const params = useParams();
  const { colaborador, loading, error } = useColaborador(params.id as string);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">Carregando colaborador...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              Erro ao carregar colaborador: {error}
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (!colaborador) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Colaborador não encontrado.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/colaboradores">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <UserCircle className="h-6 w-6" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{colaborador.nome}</h1>
                <p className="text-muted-foreground">
                  Detalhes do colaborador
                </p>
              </div>
            </div>
          </div>
          <Link href={`/colaboradores/${colaborador.id}/editar`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
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
                <Briefcase className="h-4 w-4 text-muted-foreground" />
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

        {/* Perfil de Acesso */}
        {colaborador.perfil && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Perfil de Acesso</span>
              </CardTitle>
              <CardDescription>
                Informações sobre o perfil e permissões do colaborador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Perfil:</span>
                    <span className="ml-2">{colaborador.perfil.nome}</span>
                  </div>
                  <div>
                    <span className="font-medium">Descrição:</span>
                    <span className="ml-2">{colaborador.perfil.descricao}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Permissões do Perfil</h4>
                  <p className="text-sm text-gray-600">
                    Este perfil concede acesso às funcionalidades do sistema de acordo com as permissões associadas.
                    Para gerenciar as permissões, acesse a seção de Permissões do sistema.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grupo Hierárquico */}
        {colaborador.grupoHierarquico && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5" />
                <span>Grupo Hierárquico</span>
              </CardTitle>
              <CardDescription>
                Posição do colaborador na estrutura organizacional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Grupo:</span>
                    <span className="ml-2">{colaborador.grupoHierarquico.nome}</span>
                  </div>
                  <div>
                    <span className="font-medium">Descrição:</span>
                    <span className="ml-2">{colaborador.grupoHierarquico.descricao}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Informações sobre o Grupo</h4>
                  <p className="text-sm text-gray-600">
                    Este grupo faz parte da estrutura organizacional da empresa e pode ter subgrupos.
                    Colaboradores do mesmo grupo geralmente compartilham responsabilidades e metas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clientes Associados */}
        {colaborador.clientes?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Clientes Associados</CardTitle>
              <CardDescription>
                Clientes que estão sob responsabilidade deste colaborador
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
                    {colaborador.clientes?.length ? (
                      colaborador.clientes.map((cliente) => (
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
                          Nenhum cliente atribuído
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

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
    </MainLayout>
  );
}
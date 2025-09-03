'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Building2, Users, UserPlus, Calendar, Hash } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para exemplo
const mockGrupo = {
  id: '2',
  nome: 'Vendas',
  descricao: 'Equipe de vendas e comerciais',
  ativo: true,
  parent: { id: '1', nome: 'Diretoria' },
  children: [
    { id: '4', nome: 'Vendas Internas' },
    { id: '5', nome: 'Vendas Externas' }
  ],
  clientes: [
    { id: '1', nome: 'João Silva', email: 'joao@email.com' },
    { id: '2', nome: 'Empresa ABC', email: 'contato@abc.com' },
    { id: '3', nome: 'Maria Santos', email: 'maria@email.com' }
  ],
  colaboradores: [
    { id: '1', nome: 'Carlos Oliveira', email: 'carlos@empresa.com', cargo: 'Gerente de Vendas' },
    { id: '2', nome: 'Ana Costa', email: 'ana@empresa.com', cargo: 'Vendedor' },
    { id: '3', nome: 'Pedro Souza', email: 'pedro@empresa.com', cargo: 'Vendedor' }
  ],
  createdAt: '2024-01-20'
};

export default function GrupoHierarquicoDetalhePage() {
  const params = useParams();
  const [grupo, setGrupo] = useState(mockGrupo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando busca do grupo pelo ID
    const fetchGrupo = async () => {
      // Aqui você faria a chamada API para buscar o grupo
      // const response = await fetch(`/api/grupos-hierarquicos/${params.id}`);
      // const data = await response.json();
      
      // Por enquanto, usando dados mockados
      setTimeout(() => {
        setLoading(false);
      }, 500);
    };

    fetchGrupo();
  }, [params.id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div>Carregando...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
          <Link href={`/grupos-hierarquicos/${grupo.id}/editar`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
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
                <span>{grupo.descricao}</span>
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
                <Badge variant="outline">{grupo.children.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Clientes</span>
                </div>
                <Badge variant="outline">{grupo.clientes.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span>Colaboradores</span>
                </div>
                <Badge variant="outline">{grupo.colaboradores.length}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subgrupos */}
        {grupo.children.length > 0 && (
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
                    {grupo.children.map((child) => (
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
                  {grupo.clientes.map((cliente) => (
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
                  ))}
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
                  {grupo.colaboradores.map((colaborador) => (
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
                  ))}
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
      </div>
    </MainLayout>
  );
}
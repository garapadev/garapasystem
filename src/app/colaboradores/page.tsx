'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, UserCircle, Building2, Shield } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para exemplo
const mockColaboradores = [
  {
    id: '1',
    nome: 'Carlos Oliveira',
    email: 'carlos.oliveira@empresa.com',
    telefone: '(11) 99999-9999',
    documento: '123.456.789-00',
    cargo: 'Gerente de Vendas',
    dataAdmissao: '2023-01-15',
    ativo: true,
    perfil: { id: '2', nome: 'Gerente de Vendas' },
    grupoHierarquico: { id: '2', nome: 'Vendas' },
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    nome: 'Ana Costa',
    email: 'ana.costa@empresa.com',
    telefone: '(11) 88888-8888',
    documento: '987.654.321-00',
    cargo: 'Vendedora',
    dataAdmissao: '2023-03-20',
    ativo: true,
    perfil: { id: '3', nome: 'Vendedor' },
    grupoHierarquico: { id: '4', nome: 'Vendas Internas' },
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    nome: 'Pedro Souza',
    email: 'pedro.souza@empresa.com',
    telefone: '(11) 77777-7777',
    documento: '456.789.123-00',
    cargo: 'Desenvolvedor Senior',
    dataAdmissao: '2022-06-10',
    ativo: true,
    perfil: { id: '4', nome: 'Desenvolvedor' },
    grupoHierarquico: { id: '3', nome: 'TI' },
    createdAt: '2024-01-25'
  },
  {
    id: '4',
    nome: 'Maria Santos',
    email: 'maria.santos@empresa.com',
    telefone: '(11) 66666-6666',
    documento: '321.654.987-00',
    cargo: 'RH Analista',
    dataAdmissao: '2023-09-05',
    ativo: false,
    perfil: { id: '5', nome: 'RH' },
    grupoHierarquico: { id: '4', nome: 'RH' },
    createdAt: '2024-02-01'
  }
];

export default function ColaboradoresPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [colaboradores] = useState(mockColaboradores);

  const filteredColaboradores = colaboradores.filter(colaborador =>
    colaborador.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    colaborador.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
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
          <Link href="/colaboradores/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Colaborador
            </Button>
          </Link>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredColaboradores.length} colaboradores encontrados
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
                    <TableHead>Perfil</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredColaboradores.map((colaborador) => (
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
                          <Link href={`/colaboradores/${colaborador.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/colaboradores/${colaborador.id}/editar`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
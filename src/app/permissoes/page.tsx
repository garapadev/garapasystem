'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Shield } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para exemplo
const mockPermissoes = [
  {
    id: '1',
    nome: 'Criar Clientes',
    descricao: 'Permite criar novos clientes e leads',
    recurso: 'clientes',
    acao: 'criar',
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    nome: 'Editar Clientes',
    descricao: 'Permite editar informações de clientes existentes',
    recurso: 'clientes',
    acao: 'editar',
    createdAt: '2024-01-15'
  },
  {
    id: '3',
    nome: 'Excluir Clientes',
    descricao: 'Permite excluir clientes do sistema',
    recurso: 'clientes',
    acao: 'excluir',
    createdAt: '2024-01-15'
  },
  {
    id: '4',
    nome: 'Visualizar Clientes',
    descricao: 'Permite visualizar informações de clientes',
    recurso: 'clientes',
    acao: 'ler',
    createdAt: '2024-01-15'
  },
  {
    id: '5',
    nome: 'Gerenciar Colaboradores',
    descricao: 'Permite criar, editar e excluir colaboradores',
    recurso: 'colaboradores',
    acao: 'gerenciar',
    createdAt: '2024-01-20'
  },
  {
    id: '6',
    nome: 'Gerenciar Grupos',
    descricao: 'Permite criar, editar e excluir grupos hierárquicos',
    recurso: 'grupos',
    acao: 'gerenciar',
    createdAt: '2024-01-20'
  },
  {
    id: '7',
    nome: 'Administrar Sistema',
    descricao: 'Acesso completo ao sistema',
    recurso: 'sistema',
    acao: 'administrar',
    createdAt: '2024-01-10'
  }
];

const getAcaoColor = (acao: string) => {
  switch (acao) {
    case 'criar':
      return 'bg-green-100 text-green-800';
    case 'editar':
      return 'bg-blue-100 text-blue-800';
    case 'excluir':
      return 'bg-red-100 text-red-800';
    case 'ler':
      return 'bg-gray-100 text-gray-800';
    case 'gerenciar':
      return 'bg-purple-100 text-purple-800';
    case 'administrar':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function PermissoesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [permissoes] = useState(mockPermissoes);

  const filteredPermissoes = permissoes.filter(permissao =>
    permissao.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permissao.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permissao.recurso.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permissao.acao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Permissões</h1>
              <p className="text-muted-foreground">
                Gerencie as permissões do sistema (RBAC)
              </p>
            </div>
          </div>
          <Link href="/permissoes/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Permissão
            </Button>
          </Link>
        </div>

        {/* Card de busca e filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Permissões</CardTitle>
            <CardDescription>
              Busque permissões por nome, descrição, recurso ou ação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar permissões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Permissões</CardTitle>
            <CardDescription>
              {filteredPermissoes.length} permissões encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  {filteredPermissoes.map((permissao) => (
                    <TableRow key={permissao.id}>
                      <TableCell className="font-medium">
                        {permissao.nome}
                      </TableCell>
                      <TableCell>{permissao.descricao}</TableCell>
                      <TableCell className="capitalize">
                        {permissao.recurso}
                      </TableCell>
                      <TableCell>
                        <Badge className={getAcaoColor(permissao.acao)}>
                          {permissao.acao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/permissoes/${permissao.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/permissoes/${permissao.id}/editar`}>
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
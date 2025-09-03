'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para exemplo
const mockGrupos = [
  {
    id: '1',
    nome: 'Diretoria',
    descricao: 'Nível estratégico da empresa',
    ativo: true,
    parent: null,
    childrenCount: 2,
    clientesCount: 0,
    colaboradoresCount: 3,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    nome: 'Vendas',
    descricao: 'Equipe de vendas e comerciais',
    ativo: true,
    parent: 'Diretoria',
    childrenCount: 1,
    clientesCount: 45,
    colaboradoresCount: 8,
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    nome: 'TI',
    descricao: 'Departamento de tecnologia',
    ativo: true,
    parent: 'Diretoria',
    childrenCount: 0,
    clientesCount: 0,
    colaboradoresCount: 5,
    createdAt: '2024-01-25'
  },
  {
    id: '4',
    nome: 'Vendas Internas',
    descricao: 'Equipe de vendas internas',
    ativo: true,
    parent: 'Vendas',
    childrenCount: 0,
    clientesCount: 23,
    colaboradoresCount: 4,
    createdAt: '2024-02-01'
  }
];

export default function GruposHierarquicosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [grupos] = useState(mockGrupos);

  const filteredGrupos = grupos.filter(grupo =>
    grupo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grupo.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const buildHierarchy = (grupos: any[], parentId: string | null = null): any[] => {
    return grupos
      .filter(grupo => grupo.parent === parentId)
      .map(grupo => ({
        ...grupo,
        children: buildHierarchy(grupos, grupo.nome)
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
          <TableCell>{grupo.parent || '-'}</TableCell>
          <TableCell>{grupo.childrenCount}</TableCell>
          <TableCell>{grupo.clientesCount}</TableCell>
          <TableCell>{grupo.colaboradoresCount}</TableCell>
          <TableCell>
            <div className="flex items-center space-x-2">
              <Link href={`/grupos-hierarquicos/${grupo.id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/grupos-hierarquicos/${grupo.id}/editar`}>
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
        {grupo.children && grupo.children.map((child: any) => renderGrupoRow(child, level + 1))}
      </React.Fragment>
    );
  };

  const hierarchicalGrupos = buildHierarchy(filteredGrupos);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Grupos Hierárquicos</h1>
            <p className="text-muted-foreground">
              Gerencie a estrutura organizacional da empresa
            </p>
          </div>
          <Link href="/grupos-hierarquicos/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Grupo
            </Button>
          </Link>
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
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              {filteredGrupos.length} grupos encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  {hierarchicalGrupos.map((grupo) => renderGrupoRow(grupo))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para exemplo
const mockClientes = [
  {
    id: '1',
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-9999',
    tipo: 'PESSOA_FISICA',
    status: 'CLIENTE',
    valorPotencial: 15000,
    createdAt: '2024-01-15'
  },
  {
    id: '2',
    nome: 'Empresa ABC Ltda',
    email: 'contato@abc.com',
    telefone: '(11) 3333-3333',
    tipo: 'PESSOA_JURIDICA',
    status: 'LEAD',
    valorPotencial: 50000,
    createdAt: '2024-01-20'
  },
  {
    id: '3',
    nome: 'Maria Santos',
    email: 'maria.santos@email.com',
    telefone: '(11) 88888-8888',
    tipo: 'PESSOA_FISICA',
    status: 'PROSPECT',
    valorPotencial: 8000,
    createdAt: '2024-01-25'
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'CLIENTE':
      return 'bg-green-100 text-green-800';
    case 'LEAD':
      return 'bg-blue-100 text-blue-800';
    case 'PROSPECT':
      return 'bg-yellow-100 text-yellow-800';
    case 'INATIVO':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function ClientesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientes] = useState(mockClientes);

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie seus clientes e leads
            </p>
          </div>
          <Link href="/clientes/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </Link>
        </div>

        {/* Card de busca e filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Clientes</CardTitle>
            <CardDescription>
              Busque clientes por nome ou email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {filteredClientes.length} clientes encontrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor Potencial</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        {cliente.nome}
                      </TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.telefone}</TableCell>
                      <TableCell className="capitalize">
                        {cliente.tipo === 'PESSOA_FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(cliente.status)}>
                          {cliente.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {cliente.valorPotencial ? formatCurrency(cliente.valorPotencial) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/clientes/${cliente.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/clientes/${cliente.id}/editar`}>
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
'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCliente } from '@/hooks/useClientes';
import React from 'react';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'LEAD':
      return 'bg-blue-100 text-blue-800';
    case 'PROSPECT':
      return 'bg-yellow-100 text-yellow-800';
    case 'CLIENTE':
      return 'bg-green-100 text-green-800';
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

export default function ClienteDetalhePage() {
  const params = useParams();
  const { cliente, loading, error } = useCliente(params.id as string);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href="/clientes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Button>
        </Link>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p>Cliente não encontrado</p>
        <Link href="/clientes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Clientes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/clientes">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{cliente.nome}</h1>
            <p className="text-muted-foreground">{cliente.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(cliente.status)}>
            {cliente.status}
          </Badge>
          <Link href={`/clientes/${cliente.id}/editar`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
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
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{cliente.email}</span>
            </div>
            {cliente.telefone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.telefone}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Documento:</span>
              <span className="ml-2">{cliente.documento}</span>
            </div>
            <div>
              <span className="font-medium">Tipo:</span>
              <span className="ml-2">{cliente.tipo === 'PESSOA_FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Informações Comerciais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Comerciais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Status:</span>
              <Badge className={`ml-2 ${getStatusColor(cliente.status)}`}>
                {cliente.status}
              </Badge>
            </div>
            {cliente.valorPotencial && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Valor Potencial:</span>
                  <span className="ml-2">{formatCurrency(cliente.valorPotencial)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            {cliente.endereco ? (
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p>{cliente.endereco}</p>
                  {cliente.cidade && <p>{cliente.cidade}{cliente.estado && `, ${cliente.estado}`}</p>}
                  {cliente.cep && <p>{cliente.cep}</p>}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Endereço não informado</p>
            )}
            {cliente.grupoHierarquico && (
              <div className="flex items-center space-x-2 mt-4">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="font-medium">Grupo:</span>
                  <span className="ml-2">{cliente.grupoHierarquico.nome}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{cliente.observacoes || 'Nenhuma observação registrada'}</p>
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
            <div>
              <span className="font-medium">ID:</span>
              <span className="ml-2">{cliente.id}</span>
            </div>
            <div>
              <span className="font-medium">Data de Cadastro:</span>
              <span className="ml-2">{new Date(cliente.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
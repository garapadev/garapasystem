'use client';

import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, DollarSign, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCliente } from '@/hooks/useClientes';



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

export default function ClienteDetalhePage() {
  const params = useParams();
  const { cliente, loading, error } = useCliente(params.id as string);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  if (!cliente) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <p>Cliente não encontrado</p>
          <Link href="/clientes">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/clientes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{cliente.nome}</h1>
              <p className="text-muted-foreground">
                Detalhes do cliente
              </p>
            </div>
          </div>
          <Link href={`/clientes/${cliente.id}/editar`}>
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
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{cliente.telefone}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Documento:</span>
                <span>{cliente.documento}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Tipo:</span>
                <span className="capitalize">
                  {cliente.tipo === 'PESSOA_FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Status:</span>
                <Badge className={getStatusColor(cliente.status)}>
                  {cliente.status}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Valor Potencial:</span>
                <span>{cliente.valorPotencial ? formatCurrency(cliente.valorPotencial) : 'Não informado'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div>
                  <p>{cliente.endereco}</p>
                  <p>{cliente.cidade}, {cliente.estado}</p>
                  <p>{cliente.cep}</p>
                </div>
              </div>
              {cliente.grupoHierarquico && (
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="font-medium">Grupo:</span>
                    <span>{cliente.grupoHierarquico.nome}</span>
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
              <p className="whitespace-pre-wrap">{cliente.observacoes}</p>
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
    </MainLayout>
  );
}
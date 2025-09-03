'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2, DollarSign } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para exemplo
const mockCliente = {
  id: '1',
  nome: 'João Silva',
  email: 'joao.silva@email.com',
  telefone: '(11) 99999-9999',
  documento: '123.456.789-00',
  tipo: 'PESSOA_FISICA',
  status: 'CLIENTE',
  endereco: 'Rua das Flores, 123',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
  observacoes: 'Cliente importante, comprar produtos mensalmente',
  valorPotencial: 15000,
  createdAt: '2024-01-15',
  grupoHierarquico: {
    id: '1',
    nome: 'Vendas'
  }
};

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
  const [cliente, setCliente] = useState(mockCliente);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando busca do cliente pelo ID
    const fetchCliente = async () => {
      // Aqui você faria a chamada API para buscar o cliente
      // const response = await fetch(`/api/clientes/${params.id}`);
      // const data = await response.json();
      
      // Por enquanto, usando dados mockados
      setTimeout(() => {
        setLoading(false);
      }, 500);
    };

    fetchCliente();
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
                <span>{formatCurrency(cliente.valorPotencial)}</span>
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
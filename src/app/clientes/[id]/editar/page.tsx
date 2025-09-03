'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
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
  valorPotencial: '15000'
};

export default function EditarClientePage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState(mockCliente);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica para atualizar o cliente
    console.log('Atualizando cliente:', formData);
    // Simulando atualização e redirecionamento
    setTimeout(() => {
      router.push('/clientes');
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        <div className="flex items-center space-x-4">
          <Link href="/clientes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Cliente</h1>
            <p className="text-muted-foreground">
              Atualize as informações do cliente
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="documento">Documento</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={(e) => handleChange('documento', e.target.value)}
                    placeholder={formData.tipo === 'PESSOA_FISICA' ? 'CPF' : 'CNPJ'}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Classificação */}
            <Card>
              <CardHeader>
                <CardTitle>Classificação</CardTitle>
                <CardDescription>
                  Tipo e status do cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo} onValueChange={(value) => handleChange('tipo', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PESSOA_FISICA">Pessoa Física</SelectItem>
                      <SelectItem value="PESSOA_JURIDICA">Pessoa Jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="PROSPECT">Prospect</SelectItem>
                      <SelectItem value="CLIENTE">Cliente</SelectItem>
                      <SelectItem value="INATIVO">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="valorPotencial">Valor Potencial (R$)</Label>
                  <Input
                    id="valorPotencial"
                    type="number"
                    step="0.01"
                    value={formData.valorPotencial}
                    onChange={(e) => handleChange('valorPotencial', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Endereço */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>
                  Informações de endereço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => handleChange('cidade', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => handleChange('estado', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => handleChange('cep', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
                <CardDescription>
                  Informações adicionais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/clientes">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Atualizar Cliente
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
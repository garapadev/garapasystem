'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Plus, Search, Filter, Eye, Edit, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  status: string;
}

interface Colaborador {
  id: string;
  nome: string;
  email: string;
}

interface Etapa {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
}

interface Oportunidade {
  id: string;
  titulo: string;
  descricao?: string;
  valor?: number;
  probabilidade?: number;
  dataFechamento?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  cliente: Cliente;
  responsavel?: Colaborador;
  etapa: Etapa;
}



export default function NegociosPage() {
  const router = useRouter();
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEtapa, setSelectedEtapa] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [oportunidadesRes, etapasRes, clientesRes, colaboradoresRes] = await Promise.all([
        fetch('/api/negocios/oportunidades'),
        fetch('/api/negocios/etapas'),
        fetch('/api/clientes'),
        fetch('/api/colaboradores')
      ]);

      if (oportunidadesRes.ok) {
        const data = await oportunidadesRes.json();
        setOportunidades(data.oportunidades || []);
      }

      if (etapasRes.ok) {
        const etapasData = await etapasRes.json();
        setEtapas(etapasData.etapas || []);
      }

      if (clientesRes.ok) {
        const clientesData = await clientesRes.json();
        setClientes(clientesData.clientes || []);
      }

      if (colaboradoresRes.ok) {
        const colaboradoresData = await colaboradoresRes.json();
        setColaboradores(colaboradoresData.colaboradores || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };



  const filteredOportunidades = oportunidades.filter(oportunidade => {
    const matchesSearch = oportunidade.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         oportunidade.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEtapa = selectedEtapa === 'all' || oportunidade.etapa.id === selectedEtapa;
    return matchesSearch && matchesEtapa;
  });

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleViewOportunidade = (id: string) => {
    router.push(`/negocios/${id}`);
  };

  const handleEditOportunidade = (id: string) => {
    router.push(`/negocios/${id}/editar`);
  };

  const handleDeleteOportunidade = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oportunidade?')) {
      return;
    }

    try {
      const response = await fetch(`/api/negocios/oportunidades/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Oportunidade excluída com sucesso!');
        loadData(); // Recarregar dados
      } else {
        toast.error('Erro ao excluir oportunidade');
      }
    } catch (error) {
      console.error('Erro ao excluir oportunidade:', error);
      toast.error('Erro ao excluir oportunidade');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getEtapaColor = (cor: string) => {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-100 text-blue-800',
      'yellow': 'bg-yellow-100 text-yellow-800',
      'orange': 'bg-orange-100 text-orange-800',
      'green': 'bg-green-100 text-green-800',
      'red': 'bg-red-100 text-red-800',
      'gray': 'bg-gray-100 text-gray-800'
    };
    return colorMap[cor] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pipeline de Negócios</h1>
          <p className="text-gray-600">Gerencie suas oportunidades de vendas</p>
        </div>
        <Link href="/negocios/nova-oportunidade">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Oportunidade
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar oportunidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedEtapa} onValueChange={setSelectedEtapa}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as etapas</SelectItem>
                {etapas && Array.isArray(etapas) && etapas.map(etapa => (
                  <SelectItem key={etapa.id} value={etapa.id}>
                    {etapa.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'kanban')}>
        <TabsList>
          <TabsTrigger value="table">Visualização em Tabela</TabsTrigger>
          <TabsTrigger value="kanban">Visualização Kanban</TabsTrigger>
        </TabsList>

        {/* Table View */}
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>Oportunidades ({filteredOportunidades.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Título</th>
                      <th className="text-left p-4">Cliente</th>
                      <th className="text-left p-4">Etapa</th>
                      <th className="text-left p-4">Valor</th>
                      <th className="text-left p-4">Probabilidade</th>
                      <th className="text-left p-4">Responsável</th>
                      <th className="text-left p-4">Data Fechamento</th>
                      <th className="text-left p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOportunidades.map(oportunidade => (
                      <tr key={oportunidade.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{oportunidade.titulo}</div>
                            {oportunidade.descricao && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {oportunidade.descricao}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{oportunidade.cliente.nome}</div>
                            <div className="text-sm text-gray-500">{oportunidade.cliente.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getEtapaColor(oportunidade.etapa.cor)}>
                            {oportunidade.etapa.nome}
                          </Badge>
                        </td>
                        <td className="p-4">{formatCurrency(oportunidade.valor)}</td>
                        <td className="p-4">
                          {oportunidade.probabilidade ? `${oportunidade.probabilidade}%` : 'N/A'}
                        </td>
                        <td className="p-4">
                          {oportunidade.responsavel ? oportunidade.responsavel.nome : 'Não atribuído'}
                        </td>
                        <td className="p-4">{formatDate(oportunidade.dataFechamento)}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewOportunidade(oportunidade.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditOportunidade(oportunidade.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteOportunidade(oportunidade.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOportunidades.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma oportunidade encontrada
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kanban View */}
        <TabsContent value="kanban">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {etapas && Array.isArray(etapas) && etapas.map(etapa => {
              const oportunidadesEtapa = filteredOportunidades.filter(
                oportunidade => oportunidade.etapa.id === etapa.id
              );
              
              return (
                <Card key={etapa.id} className="min-h-96">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {etapa.nome}
                      </CardTitle>
                      <Badge variant="secondary">
                        {oportunidadesEtapa.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {oportunidadesEtapa.map(oportunidade => (
                      <Card key={oportunidade.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">{oportunidade.titulo}</h4>
                            <GripVertical className="h-4 w-4 text-gray-400" />
                          </div>
                          <div className="text-xs text-gray-600">
                            {oportunidade.cliente.nome}
                          </div>
                          {oportunidade.valor && (
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(oportunidade.valor)}
                            </div>
                          )}
                          {oportunidade.responsavel && (
                            <div className="text-xs text-gray-500">
                              {oportunidade.responsavel.nome}
                            </div>
                          )}
                          {oportunidade.probabilidade && (
                            <div className="text-xs">
                              <div className="flex items-center justify-between mb-1">
                                <span>Probabilidade</span>
                                <span>{oportunidade.probabilidade}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${oportunidade.probabilidade}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                    {oportunidadesEtapa.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8">
                        Nenhuma oportunidade
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
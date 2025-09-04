'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, User, Building, Target, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
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

interface HistoricoItem {
  id: string;
  acao: string;
  valorAntigo?: string;
  valorNovo?: string;
  observacoes?: string;
  createdAt: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
}

interface Oportunidade {
  id: string;
  titulo: string;
  descricao?: string;
  valor: number;
  probabilidade?: number;
  dataFechamento?: string;
  observacoes?: string;
  createdAt: string;
  updatedAt: string;
  cliente: Cliente;
  responsavel?: Colaborador;
  etapa: Etapa;
  historico: HistoricoItem[];
}

export default function VisualizarOportunidadePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const oportunidadeId = params.id as string;
  
  const [oportunidade, setOportunidade] = useState<Oportunidade | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOportunidade();
  }, [oportunidadeId]);

  const loadOportunidade = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/negocios/oportunidades/${oportunidadeId}`);
      
      if (response.ok) {
        const data = await response.json();
        setOportunidade(data);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar oportunidade",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao carregar oportunidade:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar oportunidade",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getEtapaColor = (cor: string) => {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-100 text-blue-800',
      'green': 'bg-green-100 text-green-800',
      'yellow': 'bg-yellow-100 text-yellow-800',
      'red': 'bg-red-100 text-red-800',
      'purple': 'bg-purple-100 text-purple-800',
      'orange': 'bg-orange-100 text-orange-800'
    };
    return colorMap[cor] || 'bg-gray-100 text-gray-800';
  };

  const handleEdit = () => {
    router.push(`/negocios/${oportunidadeId}/editar`);
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta oportunidade?')) {
      return;
    }

    try {
      const response = await fetch(`/api/negocios/oportunidades/${oportunidadeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Oportunidade excluída com sucesso!"
        });
        router.push('/negocios');
      } else {
        toast({
          title: "Erro",
          description: "Erro ao excluir oportunidade",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao excluir oportunidade:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir oportunidade",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!oportunidade) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Oportunidade não encontrada</p>
        <Link href="/negocios">
          <Button className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Negócios
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
          <Link href="/negocios">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{oportunidade.titulo}</h1>
            <p className="text-muted-foreground">
              Criada em {formatDate(oportunidade.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Principais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Informações Principais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Etapa:</span>
              <Badge className={getEtapaColor(oportunidade.etapa.cor)}>
                {oportunidade.etapa.nome}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Valor:</span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(oportunidade.valor)}
              </span>
            </div>
            
            {oportunidade.probabilidade && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Probabilidade:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${oportunidade.probabilidade}%` }}
                    ></div>
                  </div>
                  <span className="text-sm">{oportunidade.probabilidade}%</span>
                </div>
              </div>
            )}
            
            {oportunidade.dataFechamento && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data Fechamento:</span>
                <span className="flex items-center text-sm">
                  <Calendar className="mr-1 h-4 w-4" />
                  {formatDate(oportunidade.dataFechamento)}
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Última Atualização:</span>
              <span className="flex items-center text-sm text-gray-500">
                <Clock className="mr-1 h-4 w-4" />
                {formatDateTime(oportunidade.updatedAt)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cliente e Responsável */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Cliente e Responsável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Building className="mr-2 h-4 w-4" />
                Cliente
              </h4>
              <div className="pl-6 space-y-1">
                <p className="font-medium">{oportunidade.cliente.nome}</p>
                <p className="text-sm text-gray-500">{oportunidade.cliente.email}</p>
                {oportunidade.cliente.telefone && (
                  <p className="text-sm text-gray-500">{oportunidade.cliente.telefone}</p>
                )}
                <Badge variant="outline">{oportunidade.cliente.status}</Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <User className="mr-2 h-4 w-4" />
                Responsável
              </h4>
              <div className="pl-6">
                {oportunidade.responsavel ? (
                  <div className="space-y-1">
                    <p className="font-medium">{oportunidade.responsavel.nome}</p>
                    <p className="text-sm text-gray-500">{oportunidade.responsavel.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Não atribuído</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Descrição e Observações */}
      {(oportunidade.descricao || oportunidade.observacoes) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {oportunidade.descricao && (
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {oportunidade.descricao}
                </p>
              </div>
            )}
            
            {oportunidade.observacoes && (
              <div>
                <h4 className="font-medium mb-2">Observações</h4>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {oportunidade.observacoes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {oportunidade.historico && oportunidade.historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Alterações</CardTitle>
            <CardDescription>
              Registro de todas as alterações realizadas nesta oportunidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {oportunidade.historico.map((item) => (
                <div key={item.id} className="border-l-2 border-gray-200 pl-4 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium capitalize">{item.acao}</span>
                    <span className="text-sm text-gray-500">
                      {formatDateTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Por: {item.usuario?.nome || 'Usuário desconhecido'}
                  </p>
                  {item.valorNovo && (
                    <div className="text-sm">
                      <span className="text-gray-500">Novo valor: </span>
                      <span className="font-medium">{item.valorNovo}</span>
                    </div>
                  )}
                  {item.observacoes && (
                    <p className="text-sm text-gray-600 mt-1">
                      {item.observacoes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
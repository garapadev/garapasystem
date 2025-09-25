'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, User, FileText, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate, getPriorityText, getPriorityVariant } from '@/lib/utils';

interface OrdemServicoAprovacao {
  id: string;
  codigo: string;
  status: string;
  expiresAt: string;
  ordemServico: {
    id: string;
    numero: string;
    descricao: string;
    prioridade: string;
    status: string;
    dataVencimento?: string;
    cliente: {
      nome: string;
      email: string;
    };
    responsavel: {
      nome: string;
    };
    itens: Array<{
      id: string;
      descricao: string;
      quantidade: number;
      valor: number;
    }>;
  };
}

interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  website?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  logo?: string;
  corPrimaria?: string;
  ativa: boolean;
}

export default function AprovacaoPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [aprovacao, setAprovacao] = useState<OrdemServicoAprovacao | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const codigo = params.codigo as string;

  useEffect(() => {
    if (codigo) {
      fetchAprovacao();
      fetchEmpresa();
    }
  }, [codigo]);

  const fetchAprovacao = async () => {
    try {
      const response = await fetch(`/api/aprovacao/${codigo}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao carregar aprovação');
        return;
      }

      setAprovacao(data);
    } catch (error) {
      setError('Erro ao carregar aprovação');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmpresa = async () => {
    try {
      const response = await fetch('/api/configuracoes/empresa');
      if (response.ok) {
        const data = await response.json();
        setEmpresa(data);
      }
    } catch (error) {
      // Falha silenciosa - empresa é opcional
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const handleAprovacao = async (acao: 'APROVADA' | 'REJEITADA') => {
    if (!aprovacao) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/aprovacao/${codigo}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acao,
          observacoes: observacoes.trim() || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao processar aprovação',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Sucesso',
        description: `Ordem de serviço ${acao.toLowerCase()} com sucesso!`,
      });

      // Atualizar dados
      await fetchAprovacao();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar aprovação',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!aprovacao) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle>Aprovação não encontrada</CardTitle>
            <CardDescription>
              O código de aprovação não foi encontrado ou expirou.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { ordemServico } = aprovacao;
  const valorTotal = ordemServico.itens.reduce((total, item) => total + (item.quantidade * item.valor), 0);
  const isExpired = new Date(aprovacao.expiresAt) < new Date();
  const isProcessed = aprovacao.status !== 'PENDENTE';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Cabeçalho da Empresa */}
        {empresa && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {empresa.logo && (
                    <img 
                      src={empresa.logo} 
                      alt={empresa.nomeFantasia || empresa.razaoSocial}
                      className="h-16 w-16 object-contain"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: empresa.corPrimaria || '#1f2937' }}>
                      {empresa.nomeFantasia || empresa.razaoSocial}
                    </h2>
                    {empresa.cnpj && (
                      <p className="text-sm text-gray-600">
                        CNPJ: {empresa.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right text-sm text-gray-600">
                  {empresa.telefone && <p>{empresa.telefone}</p>}
                  {empresa.email && <p>{empresa.email}</p>}
                  {empresa.website && <p>{empresa.website}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Aprovação de Ordem de Serviço
          </h1>
          <p className="text-gray-600">
            Revise os detalhes abaixo e tome sua decisão
          </p>
        </div>

        <div className="grid gap-6">
          {/* Status da Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isProcessed ? (
                  aprovacao.status === 'APROVADA' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                Status da Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge 
                variant={
                  aprovacao.status === 'APROVADA' ? 'default' :
                  aprovacao.status === 'REJEITADA' ? 'destructive' : 'secondary'
                }
                className="text-sm"
              >
                {aprovacao.status === 'PENDENTE' ? 'Aguardando Aprovação' :
                 aprovacao.status === 'APROVADA' ? 'Aprovada' : 'Rejeitada'}
              </Badge>
              {isExpired && aprovacao.status === 'PENDENTE' && (
                <p className="text-red-600 text-sm mt-2">
                  ⚠️ Este link de aprovação expirou em {formatDate(aprovacao.expiresAt)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Detalhes da Ordem de Serviço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ordem de Serviço #{ordemServico.numero}
              </CardTitle>
              <CardDescription>
                Detalhes do serviço solicitado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Cliente</Label>
                  <p className="font-medium">{ordemServico.cliente.nome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                  <p className="font-medium">{ordemServico.responsavel.nome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Prioridade</Label>
                  <Badge variant={getPriorityVariant(ordemServico.prioridade)}>
                    {getPriorityText(ordemServico.prioridade)}
                  </Badge>
                </div>
                {ordemServico.dataVencimento && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Data de Vencimento</Label>
                    <p className="font-medium">{formatDate(ordemServico.dataVencimento)}</p>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                <p className="mt-1">{ordemServico.descricao}</p>
              </div>
            </CardContent>
          </Card>

          {/* Itens da Ordem de Serviço */}
          <Card>
            <CardHeader>
              <CardTitle>Itens do Serviço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ordemServico.itens.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-sm text-gray-600">
                        Quantidade: {item.quantidade} × {formatCurrency(item.valor)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(item.quantidade * item.valor)}</p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-blue-600">{formatCurrency(valorTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações de Aprovação */}
          {!isProcessed && !isExpired && (
            <Card>
              <CardHeader>
                <CardTitle>Tomar Decisão</CardTitle>
                <CardDescription>
                  Aprove ou rejeite esta ordem de serviço
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="observacoes">Observações (opcional)</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Adicione observações sobre sua decisão..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleAprovacao('APROVADA')}
                    disabled={submitting}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => handleAprovacao('REJEITADA')}
                    disabled={submitting}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileCheck, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  FileText,
  User,
  Calendar,
  Hash,
  Building
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatCurrency, getStatusVariant } from '@/lib/utils';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';

interface LaudoTecnico {
  id: string;
  numero: string;
  titulo: string;
  problemaRelatado: string;
  analiseProblema: string;
  diagnostico: string;
  solucaoRecomendada: string;
  observacoes?: string;
  status: 'RASCUNHO' | 'EM_ANALISE' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REJEITADO';
  ordemServicoId: string;
  tecnicoId: string;
  createdAt: string;
  updatedAt: string;
  ordemServico: {
    id: string;
    numero: string;
    titulo: string;
    cliente: {
      id: string;
      nome: string;
      email: string;
    };
  };
  tecnico: {
    id: string;
    nome: string;
    email: string;
  };
  itens: Array<{
    id: string;
    tipo: 'DIAGNOSTICO' | 'SOLUCAO' | 'RECOMENDACAO' | 'OBSERVACAO';
    descricao: string;
    quantidade?: number;
    valorUnitario?: number;
    valorTotal?: number;
  }>;
  anexos: Array<{
    id: string;
    nome: string;
    tipo: string;
    tamanho: number;
    url: string;
    categoria: string;
    createdAt: string;
  }>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'RASCUNHO':
      return <FileText className="h-4 w-4" />;
    case 'EM_ANALISE':
      return <Clock className="h-4 w-4" />;
    case 'AGUARDANDO_APROVACAO':
      return <AlertCircle className="h-4 w-4" />;
    case 'APROVADO':
      return <CheckCircle className="h-4 w-4" />;
    case 'REJEITADO':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'RASCUNHO':
      return 'Rascunho';
    case 'EM_ANALISE':
      return 'Em Análise';
    case 'AGUARDANDO_APROVACAO':
      return 'Aguardando Aprovação';
    case 'APROVADO':
      return 'Aprovado';
    case 'REJEITADO':
      return 'Rejeitado';
    default:
      return status;
  }
};

const getTipoItemText = (tipo: string) => {
  switch (tipo) {
    case 'DIAGNOSTICO':
      return 'Diagnóstico';
    case 'SOLUCAO':
      return 'Solução';
    case 'RECOMENDACAO':
      return 'Recomendação';
    case 'OBSERVACAO':
      return 'Observação';
    default:
      return tipo;
  }
};

export default function LaudoTecnicoPage() {
  const router = useRouter();
  const params = useParams();
  const { canAccess } = useAuth();
  const { toast } = useToast();
  
  const [laudo, setLaudo] = useState<LaudoTecnico | null>(null);
  const [loading, setLoading] = useState(true);

  const laudoId = params.id as string;

  useEffect(() => {
    if (laudoId) {
      fetchLaudo();
    }
  }, [laudoId]);

  const fetchLaudo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/laudos-tecnicos/${laudoId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar laudo técnico');
      }

      const data = await response.json();
      setLaudo(data);
    } catch (error) {
      console.error('Erro ao buscar laudo técnico:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao buscar laudo técnico',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/laudos-tecnicos/${laudoId}/editar`);
  };

  const handleDelete = async () => {
    if (confirm('Tem certeza que deseja excluir este laudo técnico?')) {
      try {
        const response = await fetch(`/api/laudos-tecnicos/${laudoId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao excluir laudo técnico');
        }

        toast({
          title: 'Sucesso',
          description: 'Laudo técnico excluído com sucesso'
        });

        router.push('/laudos-tecnicos');
      } catch (error) {
        toast({
          title: 'Erro',
          description: error instanceof Error ? error.message : 'Erro ao excluir laudo técnico',
          variant: 'destructive'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!laudo) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Laudo não encontrado</h1>
          <Button onClick={() => router.push('/laudos-tecnicos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Laudos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'laudos', acao: 'ler' }}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/laudos-tecnicos')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileCheck className="h-8 w-8" />
                Laudo Técnico #{laudo.numero}
              </h1>
              <p className="text-muted-foreground">
                {laudo.titulo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(laudo.status)} className="flex items-center gap-1">
              {getStatusIcon(laudo.status)}
              {getStatusText(laudo.status)}
            </Badge>
            {canAccess.laudos?.update && laudo.status !== 'APROVADO' && (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {canAccess.laudos?.delete && laudo.status !== 'APROVADO' && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Número:</span>
                    <span>{laudo.numero}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Criado em:</span>
                    <span>{formatDate(laudo.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Técnico:</span>
                    <span>{laudo.tecnico.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cliente:</span>
                    <span>{laudo.ordemServico.cliente.nome}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problema Relatado */}
            <Card>
              <CardHeader>
                <CardTitle>Problema Relatado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{laudo.problemaRelatado}</p>
              </CardContent>
            </Card>

            {/* Análise do Problema */}
            <Card>
              <CardHeader>
                <CardTitle>Análise do Problema</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{laudo.analiseProblema}</p>
              </CardContent>
            </Card>

            {/* Diagnóstico */}
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{laudo.diagnostico}</p>
              </CardContent>
            </Card>

            {/* Solução Recomendada */}
            <Card>
              <CardHeader>
                <CardTitle>Solução Recomendada</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{laudo.solucaoRecomendada}</p>
              </CardContent>
            </Card>

            {/* Observações */}
            {laudo.observacoes && (
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{laudo.observacoes}</p>
                </CardContent>
              </Card>
            )}

            {/* Itens do Laudo */}
            {laudo.itens.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Itens do Laudo</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Valor Unitário</TableHead>
                        <TableHead>Valor Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {laudo.itens.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Badge variant="outline">
                              {getTipoItemText(item.tipo)}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.descricao}</TableCell>
                          <TableCell>{item.quantidade || '-'}</TableCell>
                          <TableCell>
                            {item.valorUnitario ? formatCurrency(item.valorUnitario) : '-'}
                          </TableCell>
                          <TableCell>
                            {item.valorTotal ? formatCurrency(item.valorTotal) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ordem de Serviço */}
            <Card>
              <CardHeader>
                <CardTitle>Ordem de Serviço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Número:</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto ml-2"
                      onClick={() => router.push(`/ordens-servico/${laudo.ordemServicoId}`)}
                    >
                      {laudo.ordemServico.numero}
                    </Button>
                  </div>
                  <div>
                    <span className="font-medium">Título:</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {laudo.ordemServico.titulo}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Anexos */}
            {laudo.anexos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Anexos</CardTitle>
                  <CardDescription>
                    {laudo.anexos.length} arquivo(s)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {laudo.anexos.map((anexo) => (
                      <div key={anexo.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{anexo.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {anexo.categoria} • {(anexo.tamanho / 1024).toFixed(1)} KB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(anexo.url, '_blank')}
                        >
                          Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
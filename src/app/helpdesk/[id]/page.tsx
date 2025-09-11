'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Edit, 
  Send, 
  Clock, 
  User, 
  Mail, 
  Calendar,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  XCircle,
  Paperclip,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useTicket } from '@/hooks/useHelpdesk';

// Mock data - será substituído por dados reais da API
const mockTicket = {
  id: 1,
  numero: 'HD-2024-001',
  assunto: 'Problema com login no sistema',
  descricao: 'O usuário não consegue fazer login no sistema. Aparece a mensagem "Credenciais inválidas" mesmo com a senha correta. Já tentamos resetar a senha mas o problema persiste.',
  cliente: {
    id: 1,
    nome: 'João Silva',
    email: 'joao@email.com',
    avatar: null
  },
  departamento: {
    id: 1,
    nome: 'Suporte Técnico'
  },
  status: 'aberto',
  prioridade: 'alta',
  responsavel: {
    id: 1,
    nome: 'Maria Santos',
    email: 'maria@empresa.com',
    avatar: null
  },
  criadoEm: new Date('2024-01-15T10:30:00'),
  atualizadoEm: new Date('2024-01-15T14:20:00'),
  mensagens: [
    {
      id: 1,
      conteudo: 'Ticket criado automaticamente a partir do email recebido.',
      autor: {
        id: 0,
        nome: 'Sistema',
        tipo: 'sistema'
      },
      criadoEm: new Date('2024-01-15T10:30:00'),
      tipo: 'sistema'
    },
    {
      id: 2,
      conteudo: 'Olá João, recebemos sua solicitação e já estamos investigando o problema. Vou verificar os logs do sistema e retorno em breve.',
      autor: {
        id: 1,
        nome: 'Maria Santos',
        tipo: 'colaborador'
      },
      criadoEm: new Date('2024-01-15T11:15:00'),
      tipo: 'resposta'
    },
    {
      id: 3,
      conteudo: 'Obrigado pelo retorno! Fico no aguardo da solução.',
      autor: {
        id: 1,
        nome: 'João Silva',
        tipo: 'cliente'
      },
      criadoEm: new Date('2024-01-15T11:45:00'),
      tipo: 'resposta'
    }
  ]
};

const statusConfig = {
  aberto: { label: 'Aberto', color: 'bg-blue-100 text-blue-800', icon: Clock },
  em_andamento: { label: 'Em Andamento', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  resolvido: { label: 'Resolvido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  fechado: { label: 'Fechado', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  media: { label: 'Média', color: 'bg-blue-100 text-blue-800' },
  alta: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-800' }
};

export default function TicketPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  const [novaMensagem, setNovaMensagem] = useState('');
  const [novoStatus, setNovoStatus] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const { ticket, mensagens, loading, fetchTicket, sendMessage, updateStatus } = useTicket(ticketId);

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId, fetchTicket]);

  const StatusIcon = statusConfig[ticket?.status as keyof typeof statusConfig]?.icon || Clock;

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    setSendingMessage(true);
    try {
      await sendMessage({
        conteudo: novaMensagem,
        isInterno: false
      });
      
      setNovaMensagem('');
      toast.success('Mensagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleAlterarStatus = async (status: string) => {
    if (!status || status === ticket?.status) return;

    setUpdatingStatus(true);
    try {
      await updateStatus(status);
      setNovoStatus('');
      toast.success('Status atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status. Tente novamente.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getAvatarFallback = (nome: string) => {
    return nome.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getMensagemStyle = (tipo: string) => {
    switch (tipo) {
      case 'sistema':
        return 'bg-gray-50 border-gray-200 text-gray-600';
      case 'resposta':
        return 'bg-white border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/helpdesk">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/helpdesk">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ticket não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/helpdesk">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{ticket?.numero}</h1>
            <p className="text-muted-foreground">{ticket?.assunto}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/helpdesk/${ticket?.id}/editar`}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Informações do Ticket */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{ticket?.descricao}</p>
            </CardContent>
          </Card>

          {/* Mensagens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Histórico de Mensagens ({mensagens?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mensagens?.map((mensagem, index) => (
                <div key={mensagem.id}>
                  <div className={`p-4 rounded-lg border ${getMensagemStyle(mensagem.tipo || 'resposta')}`}>
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" />
                        <AvatarFallback className="text-xs">
                          {getAvatarFallback(mensagem.remetenteNome || 'Sistema')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{mensagem.remetenteNome || 'Sistema'}</span>
                            <Badge variant="outline" className="text-xs">
                              {mensagem.isInterno ? 'Interno' : 'Público'}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(mensagem.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{mensagem.conteudo}</p>
                      </div>
                    </div>
                  </div>
                  {index < (mensagens?.length || 0) - 1 && <Separator className="my-4" />}
                </div>
              )) || (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma mensagem encontrada.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Nova Mensagem */}
          <Card>
            <CardHeader>
              <CardTitle>Adicionar Resposta</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEnviarMensagem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    placeholder="Digite sua resposta..."
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    rows={4}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Button type="button" variant="outline" size="sm">
                    <Paperclip className="mr-2 h-4 w-4" />
                    Anexar Arquivo
                  </Button>
                  <Button type="submit" disabled={sendingMessage || !novaMensagem.trim()}>
                    {sendingMessage ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Resposta
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com informações */}
        <div className="space-y-6">
          {/* Status e Prioridade */}
          <Card>
            <CardHeader>
              <CardTitle>Status e Prioridade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status Atual</Label>
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[ticket?.status as keyof typeof statusConfig]?.color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig[ticket?.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Alterar Status</Label>
                <div className="flex gap-2">
                  <Select value={novoStatus} onValueChange={setNovoStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alterar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aberto">Aberto</SelectItem>
                      <SelectItem value="em_andamento">Em Andamento</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => handleAlterarStatus(novoStatus)} 
                    disabled={!novoStatus || novoStatus === ticket?.status || updatingStatus}
                    size="sm"
                  >
                    {updatingStatus ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      'Atualizar'
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Badge className={prioridadeConfig[ticket?.prioridade as keyof typeof prioridadeConfig]?.color}>
                  {prioridadeConfig[ticket?.prioridade as keyof typeof prioridadeConfig]?.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={''} />
                  <AvatarFallback>
                    {getAvatarFallback(ticket?.solicitanteNome || 'Cliente')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{ticket?.solicitanteNome}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {ticket?.solicitanteEmail}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Responsável */}
          <Card>
            <CardHeader>
              <CardTitle>Responsável</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket?.responsavel ? (
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={''} />
                    <AvatarFallback>
                      {getAvatarFallback(ticket.responsavel.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{ticket.responsavel.nome}</p>
                    <p className="text-sm text-muted-foreground">{ticket.departamento?.nome}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Não atribuído</p>
              )}
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Temporais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Criado em</p>
                  <p className="text-muted-foreground">
                    {format(new Date(ticket?.createdAt || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Última atualização</p>
                  <p className="text-muted-foreground">
                    {format(new Date(ticket?.updatedAt || ''), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/helpdesk/RichTextEditor';
import ObserversModule from '@/components/helpdesk/ObserversModule';
import TicketTimeline from '@/components/helpdesk/TicketTimeline';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Building, 
  AlertTriangle, 
  Send, 
  Eye,
  Edit3,
  History
} from 'lucide-react';
import { useHelpdeskTicket } from '@/hooks/useHelpdeskTicket';
import { useColaboradores } from '@/hooks/useColaboradores';
import { useHelpdeskDepartamentos } from '@/hooks/useHelpdeskDepartamentos';
import { HelpdeskTicket, HelpdeskMensagem } from '@/hooks/useHelpdesk';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Colaborador {
  id: string;
  nome: string;
  email: string;
}

interface TicketObserver {
  id: string;
  email: string;
  nome?: string;
  tipo: 'colaborador' | 'email';
}

const priorityColors = {
  BAIXA: 'bg-green-100 text-green-800 border-green-200',
  MEDIA: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ALTA: 'bg-orange-100 text-orange-800 border-orange-200',
  URGENTE: 'bg-red-100 text-red-800 border-red-200'
};

const statusColors = {
  ABERTO: 'bg-blue-100 text-blue-800 border-blue-200',
  EM_ANDAMENTO: 'bg-purple-100 text-purple-800 border-purple-200',
  AGUARDANDO_CLIENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  RESOLVIDO: 'bg-green-100 text-green-800 border-green-200',
  FECHADO: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityLabels = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente'
};

const statusLabels = {
  ABERTO: 'Aberto',
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  RESOLVIDO: 'Resolvido',
  FECHADO: 'Fechado'
};

export default function TicketViewPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  
  const { ticket, loading, error, updateTicket, addMessage, refreshTicket } = useHelpdeskTicket(ticketId);
  const { data: colaboradoresData } = useColaboradores();
  const { departamentos } = useHelpdeskDepartamentos();
  const colaboradores = colaboradoresData?.data || [];
  
  const [isEditing, setIsEditing] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [observers, setObservers] = useState<Array<{
    id: string;
    email: string;
    name?: string;
    type: 'manual' | 'colaborador';
  }>>([]);
  
  // Timeline events (exemplo - em produção viria da API)
  const timelineEvents = [
    {
      id: '1',
      type: 'created' as const,
      timestamp: new Date(Date.now() - 86400000 * 2), // 2 dias atrás
      author: {
        id: 'user1',
        name: 'Sistema',
        email: 'sistema@empresa.com'
      },
      data: {}
    },
    {
      id: '2',
      type: 'assigned' as const,
      timestamp: new Date(Date.now() - 86400000 * 1), // 1 dia atrás
      author: {
        id: 'user2',
        name: 'João Silva',
        email: 'joao@empresa.com'
      },
      data: {
        newValue: 'Maria Santos'
      }
    },
    {
      id: '3',
      type: 'priority_change' as const,
      timestamp: new Date(Date.now() - 3600000 * 6), // 6 horas atrás
      author: {
        id: 'user3',
        name: 'Maria Santos',
        email: 'maria@empresa.com'
      },
      data: {
        oldValue: 'Baixa',
        newValue: 'Alta'
      }
    },
    {
      id: '4',
      type: 'message' as const,
      timestamp: new Date(Date.now() - 3600000 * 2), // 2 horas atrás
      author: {
        id: 'user4',
        name: 'Cliente',
        email: 'cliente@exemplo.com'
      },
      data: {
        message: 'Obrigado pela resposta rápida. O problema ainda persiste, mas agora entendo melhor a situação.'
      }
    }
  ];
  const [editData, setEditData] = useState({
    prioridade: '',
    status: '',
    responsavelId: ''
  });
  
  useEffect(() => {
    if (ticket) {
      setEditData({
        prioridade: ticket.prioridade,
        status: ticket.status,
        responsavelId: ticket.responsavel?.id || ''
      });
    }
  }, [ticket]);
  
  const handleUpdateTicket = async () => {
    try {
      await updateTicket(editData);
      setIsEditing(false);
      toast.success('Ticket atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar ticket');
    }
  };
  
  const handleSendResponse = async () => {
    if (!responseContent.trim()) {
      toast.error('Digite uma resposta');
      return;
    }
    
    try {
      await addMessage({
        conteudo: responseContent,
        tipoConteudo: 'HTML',
        remetenteNome: 'Sistema', // Será substituído pelo nome do usuário logado
        remetenteEmail: 'sistema@empresa.com', // Será substituído pelo email do usuário logado
        isInterno: false
      });
      
      setResponseContent('');
      toast.success('Resposta enviada com sucesso!');
      
      // Notificar observadores
      await notifyObservers();
    } catch (error) {
      toast.error('Erro ao enviar resposta');
    }
  };
  

  
  const notifyObservers = async () => {
    // Implementar notificação por email para observadores
    console.log('Notificando observadores:', observers);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-lg font-medium text-gray-900">Ticket não encontrado</p>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Ticket #{ticket.numero}
            </h1>
            <p className="text-sm text-gray-500">
              Criado {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge className={priorityColors[ticket.prioridade]}>
            {priorityLabels[ticket.prioridade]}
          </Badge>
          <Badge className={statusColors[ticket.status]}>
            {statusLabels[ticket.status]}
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações do Ticket */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Detalhes do Ticket</span>
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancelar' : 'Editar'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Assunto</Label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                  {ticket.assunto}
                </p>
              </div>
              
              {/* Controles Editáveis */}
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <Label htmlFor="prioridade">Prioridade</Label>
                    <Select
                      value={editData.prioridade}
                      onValueChange={(value) => setEditData({...editData, prioridade: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BAIXA">Baixa</SelectItem>
                        <SelectItem value="MEDIA">Média</SelectItem>
                        <SelectItem value="ALTA">Alta</SelectItem>
                        <SelectItem value="URGENTE">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editData.status}
                      onValueChange={(value) => setEditData({...editData, status: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ABERTO">Aberto</SelectItem>
                        <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                        <SelectItem value="AGUARDANDO_CLIENTE">Aguardando Cliente</SelectItem>
                        <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                        <SelectItem value="FECHADO">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="responsavel">Responsável</Label>
                    <Select
                      value={editData.responsavelId}
                      onValueChange={(value) => setEditData({...editData, responsavelId: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum</SelectItem>
                        {colaboradores.map((colaborador) => (
                          <SelectItem key={colaborador.id} value={colaborador.id}>
                            {colaborador.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-3 flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleUpdateTicket}>
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Prioridade</Label>
                    <div className="mt-1">
                      <Badge className={priorityColors[ticket.prioridade]}>
                        {priorityLabels[ticket.prioridade]}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="mt-1">
                      <Badge className={statusColors[ticket.status]}>
                        {statusLabels[ticket.status]}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Responsável</Label>
                    <p className="mt-1 text-sm text-gray-900">
                      {ticket.responsavel ? ticket.responsavel.nome : 'Não atribuído'}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Conteúdo Original (IMAP) - Somente Leitura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Conteúdo Original (IMAP)</span>
                <Badge variant="secondary" className="ml-2">Somente Leitura</Badge>
              </CardTitle>
              <CardDescription>
                Conteúdo original recuperado via IMAP - protegido contra edição
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 min-h-[200px]">
                <div className="prose prose-sm max-w-none">
                  {ticket.descricao ? (
                    <div dangerouslySetInnerHTML={{ __html: ticket.descricao }} />
                  ) : (
                    <p className="text-gray-500 italic">Nenhum conteúdo original disponível</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Editor de Resposta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Edit3 className="h-5 w-5" />
                <span>Nova Resposta</span>
              </CardTitle>
              <CardDescription>
                Compose uma resposta para este ticket
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={responseContent}
                onChange={setResponseContent}
                placeholder="Digite sua resposta aqui..."
                className="min-h-[200px]"
              />
              <div className="flex justify-end">
                <Button onClick={handleSendResponse} disabled={!responseContent.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Resposta
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Histórico de Mensagens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Histórico de Mensagens</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {ticket.mensagens && ticket.mensagens.length > 0 ? (
                    ticket.mensagens.map((mensagem: HelpdeskMensagem, index: number) => (
                      <div key={mensagem.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getInitials(mensagem.remetenteNome)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{mensagem.remetenteNome}</p>
                              <p className="text-xs text-gray-500">{mensagem.remetenteEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {mensagem.isInterno && (
                              <Badge variant="secondary" className="text-xs">
                                Interno
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(new Date(mensagem.createdAt), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        <div className="prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: mensagem.conteudo }} />
                        </div>
                        {mensagem.anexos && mensagem.anexos.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-gray-500 mb-1">Anexos:</p>
                            <div className="flex flex-wrap gap-2">
                              {mensagem.anexos.map((anexo) => (
                                <Badge key={anexo.id} variant="outline" className="text-xs">
                                  {anexo.nomeArquivo}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">Nenhuma mensagem ainda</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações do Solicitante */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Solicitante</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{ticket.solicitanteNome}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{ticket.solicitanteEmail}</span>
              </div>
              {ticket.solicitanteTelefone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{ticket.solicitanteTelefone}</span>
                </div>
              )}
              {ticket.cliente && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500 mb-1">Cliente Vinculado:</p>
                  <p className="text-sm font-medium">{ticket.cliente.nome}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Informações do Departamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Departamento</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium">{departamentos.find(d => d.id === ticket.departamentoId)?.nome || 'N/A'}</p>
              {departamentos.find(d => d.id === ticket.departamentoId)?.descricao && (
                <p className="text-xs text-gray-500 mt-1">{departamentos.find(d => d.id === ticket.departamentoId)?.descricao}</p>
              )}
            </CardContent>
          </Card>
          
          {/* Módulo de Observadores */}
           <ObserversModule
             observers={observers}
             onChange={setObservers}
             colaboradores={colaboradores}
             ticketId={ticketId}
             className=""
           />
           
           {/* Timeline de Alterações */}
           <TicketTimeline
             events={timelineEvents}
             className="mt-6"
           />
          
          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Cronologia</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Criado</p>
                <p className="text-sm">
                  {new Date(ticket.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500">Última Atualização</p>
                <p className="text-sm">
                  {new Date(ticket.updatedAt).toLocaleString('pt-BR')}
                </p>
              </div>
              
              {ticket.dataUltimaResposta && (
                <div>
                  <p className="text-xs text-gray-500">Última Resposta</p>
                  <p className="text-sm">
                    {new Date(ticket.dataUltimaResposta).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              
              {ticket.dataFechamento && (
                <div>
                  <p className="text-xs text-gray-500">Fechado</p>
                  <p className="text-sm">
                    {new Date(ticket.dataFechamento).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
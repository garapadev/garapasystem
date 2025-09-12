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
import { TicketHistoryLog } from '@/components/helpdesk/TicketHistoryLog';
import { StatusTicket } from '@/components/helpdesk/StatusTicket';
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
import { GrupoHierarquicoCard } from '@/components/helpdesk/GrupoHierarquicoCard';

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
  const { colaboradores } = useColaboradores();
  const { departamentos } = useHelpdeskDepartamentos();
  
  const [responseContent, setResponseContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [observers, setObservers] = useState<Array<{
    id: string;
    email: string;
    name?: string;
    type: 'manual' | 'colaborador';
  }>>([]);
  
  // Buscar observadores do ticket
  useEffect(() => {
    const fetchObservers = async () => {
      try {
        const response = await fetch(`/api/helpdesk/tickets/${ticketId}/observers`);
        if (response.ok) {
          const data = await response.json();
          setObservers(data.observers || []);
        }
      } catch (error) {
        console.error('Erro ao buscar observadores:', error);
      }
    };
    
    if (ticketId) {
      fetchObservers();
    }
  }, [ticketId]);
  
  // Estado para eventos do timeline
  const [timelineEvents, setTimelineEvents] = useState([]);
  
  // Buscar eventos do timeline
  useEffect(() => {
    const fetchTimelineEvents = async () => {
      try {
        const response = await fetch(`/api/helpdesk/tickets/${ticketId}/logs`);
        if (response.ok) {
          const data = await response.json();
          // Converter logs para formato do timeline
          const events = data.logs.map((log: any) => ({
            id: log.id,
            type: getTimelineEventType(log.tipo),
            timestamp: new Date(log.createdAt),
            author: {
              id: log.autorId || 'system',
              name: log.autorNome || 'Sistema',
              email: log.autorEmail || 'sistema@empresa.com'
            },
            data: {
              oldValue: log.valorAnterior,
              newValue: log.valorNovo,
              message: log.descricao
            }
          }));
          setTimelineEvents(events);
        }
      } catch (error) {
        console.error('Erro ao buscar eventos do timeline:', error);
      }
    };
    
    if (ticketId) {
      fetchTimelineEvents();
    }
  }, [ticketId]);
  
  const getTimelineEventType = (acao: string) => {
    switch (acao) {
      case 'CRIACAO': return 'created';
      case 'STATUS_ALTERADO': return 'status_change';
      case 'PRIORIDADE_ALTERADA': return 'priority_change';
      case 'RESPONSAVEL_ALTERADO': return 'assigned';
      case 'MENSAGEM_ADICIONADA': return 'message';
      case 'OBSERVADOR_ADICIONADO': return 'observer_added';
      case 'OBSERVADOR_REMOVIDO': return 'observer_removed';
      default: return 'created';
    }
  };
  const handleTicketUpdate = (updatedTicket: any) => {
    // O hook useHelpdeskTicket já atualiza o estado do ticket automaticamente
    // Esta função é chamada pelo StatusTicket após uma atualização bem-sucedida
    refreshTicket();
    
    // Recarregar timeline após atualização
    const fetchTimelineEvents = async () => {
      try {
        const response = await fetch(`/api/helpdesk/tickets/${ticketId}/logs`);
        if (response.ok) {
          const data = await response.json();
          const events = data.logs.map((log: any) => ({
            id: log.id,
            type: getTimelineEventType(log.tipo),
            timestamp: new Date(log.createdAt),
            author: {
              id: log.autorId || 'system',
              name: log.autorNome || 'Sistema',
              email: log.autorEmail || 'sistema@empresa.com'
            },
            data: {
              oldValue: log.valorAnterior,
              newValue: log.valorNovo,
              message: log.descricao
            }
          }));
          setTimelineEvents(events);
        }
      } catch (error) {
        console.error('Erro ao buscar eventos do timeline:', error);
      }
    };
    
    fetchTimelineEvents();
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
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Detalhes do Ticket</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Assunto</Label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md border">
                  {ticket.assunto}
                </p>
              </div>
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
          
          {/* Card do Grupo Hierárquico */}
           <GrupoHierarquicoCard 
             ticket={{
               id: ticket.id,
               numero: ticket.numero.toString(),
               assunto: ticket.assunto,
               departamento: {
                 id: ticket.departamento.id,
                 nome: ticket.departamento.nome,
                 cor: '#6B7280',
                 grupoHierarquicoId: departamentos.find(d => d.id === ticket.departamento.id)?.grupoHierarquico?.id,
                 grupoHierarquico: departamentos.find(d => d.id === ticket.departamento.id)?.grupoHierarquico ? {
                   id: departamentos.find(d => d.id === ticket.departamento.id)?.grupoHierarquico?.id || '',
                   nome: departamentos.find(d => d.id === ticket.departamento.id)?.grupoHierarquico?.nome || '',
                   ativo: true
                 } : undefined
               }
             }}
             onEncaminhar={async (novoGrupoId: string, observacao: string) => {
               try {
                 // Implementar lógica de encaminhamento do ticket para novo grupo
                 console.log('Encaminhando ticket para grupo:', novoGrupoId, 'Observação:', observacao);
                 toast.success('Ticket encaminhado com sucesso!');
                 await refreshTicket();
               } catch (error) {
                 toast.error('Erro ao encaminhar ticket');
               }
             }}
           />
          
          {/* Status do Ticket */}
          <StatusTicket
            ticket={ticket}
            colaboradores={colaboradores}
            onTicketUpdate={handleTicketUpdate}
            className="mb-6"
          />
          
          {/* Histórico de Alterações */}
          <TicketHistoryLog
            ticketId={ticketId}
            className="mb-6"
          />
          
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
'use client';

import { useState, useEffect } from 'react';
import { useClientIntegration } from '@/hooks/useClientIntegration';
import { Cliente } from '@prisma/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  CalendarDays,
  Clock,
  Mail,
  Phone,
  Ticket,
  TrendingUp,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientHistoryPanelProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose?: () => void;
}

interface TicketWithDetails {
  id: string;
  numero: string;
  assunto: string;
  descricao?: string;
  prioridade: string;
  status: string;
  dataAbertura: Date | string;
  dataFechamento?: Date | string | null;
  departamento?: {
    id: string;
    nome: string;
  };
  responsavel?: {
    id: string;
    nome: string;
  };
  _count?: {
    mensagens: number;
  };
}

interface ClientStats {
  total: number;
  abertos: number;
  fechados: number;
  emAndamento: number;
  taxaResolucao: number;
  tempoMedioResolucao?: number;
  prioridadeMedia?: string;
}

export function ClientHistoryPanel({ cliente, isOpen, onClose }: ClientHistoryPanelProps) {
  const { getClientTicketHistory, getClientTicketStats, isLoading } = useClientIntegration();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [activeTab, setActiveTab] = useState('tickets');

  useEffect(() => {
    if (cliente?.id && isOpen) {
      loadClientData();
    }
  }, [cliente?.id, isOpen]);

  const loadClientData = async () => {
    if (!cliente?.id) return;
    
    try {
      const [ticketHistory, ticketStats] = await Promise.all([
        getClientTicketHistory(cliente.id),
        getClientTicketStats(cliente.id)
      ]);
      
      setTickets(ticketHistory as TicketWithDetails[]);
      setStats(ticketStats);
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVIDO':
      case 'FECHADO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'EM_ANDAMENTO':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'AGUARDANDO_CLIENTE':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIA':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BAIXA':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const formatDuration = (start: Date | string, end?: Date | string | null) => {
    if (!end) return 'Em andamento';
    
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    }
    return `${diffHours}h`;
  };

  if (!isOpen || !cliente) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">{cliente.nome}</CardTitle>
              <CardDescription className="flex items-center space-x-4 mt-1">
                {cliente.email && (
                  <span className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{cliente.email}</span>
                  </span>
                )}
                {cliente.telefone && (
                  <span className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{cliente.telefone}</span>
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="tickets" className="mt-6">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum ticket encontrado para este cliente.</p>
                  </div>
                ) : (
                  tickets.map((ticket) => (
                    <Card key={ticket.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {getStatusIcon(ticket.status)}
                              <span className="font-medium">#{ticket.numero}</span>
                              <Badge className={getPriorityColor(ticket.prioridade)}>
                                {ticket.prioridade}
                              </Badge>
                              <Badge variant="outline">
                                {ticket.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            <h4 className="font-semibold text-lg mb-2">{ticket.assunto}</h4>
                            
                            {ticket.descricao && (
                              <p className="text-gray-600 mb-3 line-clamp-2">
                                {ticket.descricao}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <CalendarDays className="h-4 w-4" />
                                <span>Aberto: {formatDate(ticket.dataAbertura)}</span>
                              </span>
                              
                              {ticket.dataFechamento && (
                                <span className="flex items-center space-x-1">
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Fechado: {formatDate(ticket.dataFechamento)}</span>
                                </span>
                              )}
                              
                              <span className="flex items-center space-x-1">
                                <Clock className="h-4 w-4" />
                                <span>Duração: {formatDuration(ticket.dataAbertura, ticket.dataFechamento)}</span>
                              </span>
                            </div>
                            
                            {ticket.departamento && (
                              <div className="mt-2">
                                <Badge variant="secondary">
                                  {ticket.departamento.nome}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-right">
                            {ticket._count?.mensagens && (
                              <Badge variant="outline" className="mb-2">
                                {ticket._count.mensagens} mensagens
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Ticket className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Total de Tickets</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Resolvidos</p>
                        <p className="text-2xl font-bold">{stats.fechados}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Em Andamento</p>
                        <p className="text-2xl font-bold">{stats.emAndamento}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Resolução</p>
                        <p className="text-2xl font-bold">{stats.taxaResolucao.toFixed(1)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {tickets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma atividade encontrada.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    {tickets
                      .sort((a, b) => new Date(b.dataAbertura).getTime() - new Date(a.dataAbertura).getTime())
                      .map((ticket, index) => (
                        <div key={ticket.id} className="relative flex items-start space-x-4 pb-6">
                          <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-blue-500 rounded-full">
                            {getStatusIcon(ticket.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium">#{ticket.numero}</span>
                              <Badge className={getPriorityColor(ticket.prioridade)}>
                                {ticket.prioridade}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">
                              {ticket.assunto}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(ticket.dataAbertura)}
                              {ticket.dataFechamento && (
                                <span> • Resolvido em {formatDuration(ticket.dataAbertura, ticket.dataFechamento)}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
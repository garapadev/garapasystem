'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Plus, 
  Filter, 
  Mail, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Calendar,
  Tag,
  Settings,
  RefreshCw,
  Send,
  Eye,
  EyeOff,
  Edit,
  Trash2
} from 'lucide-react';
import { GrupoHierarquicoCard } from './GrupoHierarquicoCard';

// Interfaces
interface Ticket {
  id: string;
  numero: string;
  assunto: string;
  status: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDO' | 'FECHADO';
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  departamento: {
    id: string;
    nome: string;
    cor?: string;
    grupoHierarquicoId?: string;
    grupoHierarquico?: {
      id: string;
      nome: string;
      descricao?: string;
      ativo: boolean;
      parentId?: string;
      parent?: {
        id: string;
        nome: string;
        descricao?: string;
        ativo: boolean;
      };
    };
  };
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
  solicitanteEmail?: string;
  solicitanteNome?: string;
  solicitanteTelefone?: string;
  dataAbertura: string;
  dataFechamento?: string;
  dataUltimaResposta?: string;
  createdAt: string;
  updatedAt: string;
  mensagens?: Message[];
  _count: {
    mensagens: number;
    anexos?: number;
  };
}

interface Message {
  id: string;
  conteudo: string;
  tipoConteudo: 'TEXTO' | 'HTML';
  visibilidade: 'PUBLICA' | 'INTERNA';
  criadoEm: string;
  editadoEm?: string;
  remetenteNome?: string;
  remetenteEmail?: string;
  autor?: {
    id: string;
    nome: string;
    email: string;
  };
  anexos?: {
    id: string;
    nomeArquivo: string;
    tamanho: number;
    tipoMime: string;
  }[];
}

interface Department {
  id: string;
  nome: string;
  cor: string;
  ativo: boolean;
  _count?: {
    tickets: number;
  };
}

interface TicketCardProps {
  id: string;
  numero: string;
  assunto: string;
  departamento: {
    id: string;
    nome: string;
    cor: string;
  };
}

interface CreateTicketData {
  assunto: string;
  conteudo: string;
  departamentoId: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  solicitanteEmail?: string;
  solicitanteNome?: string;
}

interface EditingTicketState {
  id?: string;
  assunto?: string;
  status?: 'ABERTO' | 'EM_ANDAMENTO' | 'AGUARDANDO_CLIENTE' | 'RESOLVIDO' | 'FECHADO';
  prioridade?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  // departamentoId removido - tickets devem permanecer no departamento original
  responsavelId?: string;
  solicitanteEmail?: string;
  solicitanteNome?: string;
}

interface TicketManagerProps {
  className?: string;
}

export function TicketManager({ className }: TicketManagerProps) {
  const { toast } = useToast();
  
  // Estados
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Estados de diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  // Estados de formulários
  const [createForm, setCreateForm] = useState<CreateTicketData>({
    assunto: '',
    conteudo: '',
    departamentoId: '',
    prioridade: 'MEDIA'
  });
  const [newMessage, setNewMessage] = useState('');
  const [messageVisibility, setMessageVisibility] = useState<'PUBLICA' | 'INTERNA'>('PUBLICA');
  const [isCreating, setIsCreating] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EditingTicketState | null>(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const itemsPerPage = 20;

  // Funções de API
  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(departmentFilter !== 'all' && { departamentoId: departmentFilter }),
        ...(priorityFilter !== 'all' && { prioridade: priorityFilter })
      });
      
      const response = await fetch(`/api/helpdesk/tickets?${params}&includeGrupoHierarquico=true`);
      if (!response.ok) throw new Error('Erro ao buscar tickets');
      
      const data = await response.json();
      setTickets(data.tickets);
      setTotalPages(data.pagination.pages);
      setTotalTickets(data.pagination.total);
    } catch (error) {
      console.error('Erro ao buscar tickets:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar tickets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, departmentFilter, priorityFilter, toast]);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/helpdesk/departamentos');
      if (!response.ok) throw new Error('Erro ao buscar departamentos');
      
      const data = await response.json();
      setDepartments(data.departamentos);
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (ticketId: string) => {
    try {
      const response = await fetch(`/api/helpdesk/tickets/${ticketId}/messages`);
      if (!response.ok) throw new Error('Erro ao buscar mensagens');
      
      const data = await response.json();
      setMessages(data.mensagens);
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar mensagens',
        variant: 'destructive'
      });
    }
  }, [toast]);

  const encaminharTicket = async (ticketId: string, novoGrupoId: string, observacao: string) => {
    try {
      const response = await fetch(`/api/helpdesk/tickets/${ticketId}/encaminhar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grupoHierarquicoId: novoGrupoId,
          observacao
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao encaminhar ticket');
      }
      
      toast({
        title: "Sucesso",
        description: "Ticket encaminhado com sucesso",
      });
    } catch (error) {
      console.error('Erro ao encaminhar ticket:', error);
      toast({
        title: "Erro",
        description: "Erro ao encaminhar ticket",
        variant: "destructive",
      });
      throw error;
    }
  };

  const createTicket = async () => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/helpdesk/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar ticket');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Ticket criado com sucesso'
      });
      
      setShowCreateDialog(false);
      setCreateForm({
        assunto: '',
        conteudo: '',
        departamentoId: '',
        prioridade: 'MEDIA'
      });
      
      await fetchTickets();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;
    
    setIsSendingMessage(true);
    try {
      const response = await fetch(`/api/helpdesk/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: newMessage,
          visibilidade: messageVisibility,
          tipoConteudo: 'TEXTO'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar mensagem');
      }
      
      const newMsg = await response.json();
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      toast({
        title: 'Sucesso',
        description: 'Mensagem enviada com sucesso'
      });
      
      // Atualizar lista de tickets
      fetchTickets();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Função para abrir edição de ticket
  const openEditTicket = (ticket: Ticket) => {
    setEditingTicket({
      id: ticket.id,
      assunto: ticket.assunto,
      status: ticket.status,
      prioridade: ticket.prioridade,
      // departamentoId removido - tickets permanecem no departamento original
      responsavelId: ticket.responsavel?.id,
      solicitanteEmail: ticket.solicitanteEmail,
      solicitanteNome: ticket.solicitanteNome
    });
    setShowEditDialog(true);
  };

  // Função para atualizar ticket
  const updateTicket = async () => {
    if (!editingTicket?.id) return;
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/helpdesk/tickets/${editingTicket.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assunto: editingTicket.assunto,
          status: editingTicket.status,
          prioridade: editingTicket.prioridade,
          // departamentoId removido - tickets permanecem no departamento original
          responsavelId: editingTicket.responsavelId,
          solicitanteEmail: editingTicket.solicitanteEmail,
          solicitanteNome: editingTicket.solicitanteNome
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar ticket');
      }
      
      toast({
        title: "Ticket atualizado",
        description: "As alterações foram salvas com sucesso.",
      });
      
      setShowEditDialog(false);
      setEditingTicket(null);
      fetchTickets();
      
      // Se o ticket estava sendo visualizado, atualizar também
      if (selectedTicket?.id === editingTicket.id) {
        const updatedTicket = await response.json();
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o ticket.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/helpdesk/tickets?id=${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar ticket');
      }
      
      await fetchTickets();
      
      toast({
        title: 'Sucesso',
        description: 'Status do ticket atualizado'
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([fetchTickets(), fetchDepartments()]);
    setRefreshing(false);
  };

  // Efeitos
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket, fetchMessages]);

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    const colors = {
      'ABERTO': 'bg-blue-100 text-blue-800',
      'EM_ANDAMENTO': 'bg-yellow-100 text-yellow-800',
      'AGUARDANDO_CLIENTE': 'bg-orange-100 text-orange-800',
      'RESOLVIDO': 'bg-green-100 text-green-800',
      'FECHADO': 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'BAIXA': 'bg-green-100 text-green-800',
      'MEDIA': 'bg-blue-100 text-blue-800',
      'ALTA': 'bg-orange-100 text-orange-800',
      'URGENTE': 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) return '-';
      return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abertos</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tickets.filter(t => t.status === 'ABERTO').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {tickets.filter(t => t.status === 'EM_ANDAMENTO').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tickets.filter(t => t.status === 'RESOLVIDO').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Tickets do Helpdesk</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Ticket</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="assunto">Assunto</Label>
                        <Input
                          id="assunto"
                          value={createForm.assunto}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, assunto: e.target.value }))}
                          placeholder="Assunto do ticket"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="departamento">Departamento</Label>
                        <Select
                          value={createForm.departamentoId}
                          onValueChange={(value) => setCreateForm(prev => ({ ...prev, departamentoId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map(dept => (
                              <SelectItem key={dept.id} value={dept.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: dept.cor }}
                                  />
                                  {dept.nome}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prioridade">Prioridade</Label>
                        <Select
                          value={createForm.prioridade}
                          onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, prioridade: value }))}
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
                      <div className="space-y-2">
                        <Label htmlFor="email">Email do Solicitante</Label>
                        <Input
                          id="email"
                          type="email"
                          value={createForm.solicitanteEmail || ''}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, solicitanteEmail: e.target.value }))}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Solicitante</Label>
                      <Input
                        id="nome"
                        value={createForm.solicitanteNome || ''}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, solicitanteNome: e.target.value }))}
                        placeholder="Nome completo"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="conteudo">Descrição</Label>
                      <Textarea
                        id="conteudo"
                        value={createForm.conteudo}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, conteudo: e.target.value }))}
                        placeholder="Descreva o problema ou solicitação..."
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={createTicket}
                        disabled={loading || !createForm.assunto || !createForm.conteudo || !createForm.departamentoId}
                      >
                        {loading ? 'Criando...' : 'Criar Ticket'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar tickets por número, assunto ou solicitante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                 <Button
                   variant="outline"
                   onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                 >
                   <Filter className="h-4 w-4 mr-2" />
                   Filtros {showAdvancedFilters ? 'Simples' : 'Avançados'}
                 </Button>
                 
                 <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                   <DialogTrigger asChild>
                     <Button>
                       <Plus className="h-4 w-4 mr-2" />
                       Novo Ticket
                     </Button>
                   </DialogTrigger>
                 </Dialog>
               </div>
            </div>
            
            {/* Filtros avançados */}
            {showAdvancedFilters && (
              <Card className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="ABERTO">Aberto</SelectItem>
                        <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                        <SelectItem value="AGUARDANDO_CLIENTE">Aguardando Cliente</SelectItem>
                        <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                        <SelectItem value="FECHADO">Fechado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Prioridade</Label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as prioridades" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as Prioridades</SelectItem>
                        <SelectItem value="BAIXA">Baixa</SelectItem>
                        <SelectItem value="MEDIA">Média</SelectItem>
                        <SelectItem value="ALTA">Alta</SelectItem>
                        <SelectItem value="URGENTE">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Departamento</Label>
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os departamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Departamentos</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: dept.cor }}
                              />
                              {dept.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Ações</Label>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setDepartmentFilter('all');
                        setPriorityFilter('all');
                      }}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Tabela de tickets */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando tickets...</span>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">Ticket</th>
                      <th className="text-left p-4 font-medium text-gray-900">Assunto</th>
                      <th className="text-left p-4 font-medium text-gray-900">Solicitante</th>
                      <th className="text-left p-4 font-medium text-gray-900">Departamento / Grupo</th>
                      <th className="text-left p-4 font-medium text-gray-900">Status</th>
                      <th className="text-left p-4 font-medium text-gray-900">Prioridade</th>
                      <th className="text-left p-4 font-medium text-gray-900">Data</th>
                      <th className="text-left p-4 font-medium text-gray-900">Mensagens</th>
                      <th className="text-left p-4 font-medium text-gray-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr 
                        key={ticket.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          window.location.href = `/helpdesk/tickets/${ticket.id}`;
                        }}
                      >
                        <td className="p-4">
                          <Badge variant="outline">#{ticket.numero}</Badge>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900 truncate max-w-xs" title={ticket.assunto}>
                            {ticket.assunto}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {ticket.solicitanteNome && (
                              <div className="font-medium text-gray-900">{ticket.solicitanteNome}</div>
                            )}
                            {ticket.solicitanteEmail && (
                              <div className="text-gray-500">{ticket.solicitanteEmail}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: ticket.departamento.cor }}
                              />
                              <span className="text-sm text-gray-900">{ticket.departamento.nome}</span>
                            </div>
                            {ticket.departamento.grupoHierarquico && (
                              <div className="text-xs text-gray-500 ml-5">
                                {ticket.departamento.grupoHierarquico.parent && (
                                  <span>{ticket.departamento.grupoHierarquico.parent.nome} → </span>
                                )}
                                {ticket.departamento.grupoHierarquico.nome}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge className={getPriorityColor(ticket.prioridade)}>
                            {ticket.prioridade}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">
                            {formatDate(ticket.dataAbertura || ticket.createdAt)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            {ticket._count.mensagens > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {ticket._count.mensagens}
                              </div>
                            )}
                            {ticket._count.anexos && ticket._count.anexos > 0 && (
                              <div className="flex items-center gap-1">
                                <Paperclip className="h-4 w-4" />
                                {ticket._count.anexos}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditTicket(ticket);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {tickets.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum ticket encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edição de ticket */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Ticket</DialogTitle>
          </DialogHeader>
          {editingTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-assunto">Assunto</Label>
                  <Input
                    id="edit-assunto"
                    value={editingTicket.assunto || ''}
                    onChange={(e) => setEditingTicket(prev => ({ ...prev, assunto: e.target.value }))}
                    placeholder="Assunto do ticket"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingTicket.status}
                    onValueChange={(value) => setEditingTicket(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
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
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-prioridade">Prioridade</Label>
                  <Select
                    value={editingTicket.prioridade}
                    onValueChange={(value) => setEditingTicket(prev => ({ ...prev, prioridade: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BAIXA">Baixa</SelectItem>
                      <SelectItem value="MEDIA">Média</SelectItem>
                      <SelectItem value="ALTA">Alta</SelectItem>
                      <SelectItem value="URGENTE">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Campo de departamento removido - tickets permanecem no departamento original */}
                {/* Para transferir tickets entre departamentos, use a funcionalidade de encaminhamento */}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome do Solicitante</Label>
                  <Input
                    id="edit-nome"
                    value={editingTicket.solicitanteNome || ''}
                    onChange={(e) => setEditingTicket(prev => ({ ...prev, solicitanteNome: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email do Solicitante</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingTicket.solicitanteEmail || ''}
                    onChange={(e) => setEditingTicket(prev => ({ ...prev, solicitanteEmail: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditingTicket(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={updateTicket}
                  disabled={isUpdating || !editingTicket.assunto}
                >
                  {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de visualização/edição de ticket */}
      <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <Badge variant="outline">#{selectedTicket.numero}</Badge>
                    {selectedTicket.assunto}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {selectedTicket.status.replace('_', ' ')}
                    </Badge>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
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
                </div>
              </DialogHeader>
              
              <Tabs defaultValue="messages" className="w-full">
                <TabsList>
                  <TabsTrigger value="messages">Mensagens</TabsTrigger>
                  <TabsTrigger value="details">Detalhes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="messages" className="space-y-4">
                  {/* Lista de mensagens */}
                  <div className="max-h-96 overflow-y-auto space-y-4 border rounded-lg p-4">
                    {messages.map(message => (
                      <div key={message.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <strong>
                              {message.autor?.nome || message.remetenteNome || 'Sistema'}
                            </strong>
                            {message.visibilidade === 'INTERNA' && (
                              <Badge variant="secondary" className="text-xs">
                                <EyeOff className="h-3 w-3 mr-1" />
                                Interna
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(message.criadoEm)}
                            {message.editadoEm && ' (editado)'}
                          </span>
                        </div>
                        <div className="text-sm whitespace-pre-wrap">
                          {message.conteudo}
                        </div>
                        {message.anexos && message.anexos.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {message.anexos.map(anexo => (
                              <Badge key={anexo.id} variant="outline" className="text-xs">
                                <Paperclip className="h-3 w-3 mr-1" />
                                {anexo.nomeArquivo}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {messages.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma mensagem ainda</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Formulário de nova mensagem */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center gap-2">
                      <Label>Nova mensagem:</Label>
                      <Select
                        value={messageVisibility}
                        onValueChange={(value: any) => setMessageVisibility(value)}
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PUBLICA">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Pública
                            </div>
                          </SelectItem>
                          <SelectItem value="INTERNA">
                            <div className="flex items-center gap-1">
                              <EyeOff className="h-3 w-3" />
                              Interna
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      rows={3}
                    />
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        size="sm"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Enviar
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Card de Grupo Hierárquico */}
                    <GrupoHierarquicoCard 
                      ticket={{
                        ...selectedTicket,
                        departamento: {
                          ...selectedTicket.departamento,
                          cor: selectedTicket.departamento.cor || '#6B7280'
                        }
                      }}
                      onEncaminhar={async (novoGrupoId: string, observacao: string) => {
                        // Implementar lógica de encaminhamento
                        await encaminharTicket(selectedTicket.id, novoGrupoId, observacao);
                        // Recarregar dados do ticket
                        await fetchTickets();
                        if (selectedTicket) {
                          const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
                          if (updatedTicket) {
                            setSelectedTicket(updatedTicket);
                          }
                        }
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    
                    <div>
                      <Label className="text-sm font-medium">Prioridade</Label>
                      <Badge className={`${getPriorityColor(selectedTicket.prioridade)} mt-1`}>
                        {selectedTicket.prioridade}
                      </Badge>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Criado em</Label>
                      <p className="text-sm mt-1">{formatDate(selectedTicket.dataAbertura || selectedTicket.createdAt)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Atualizado em</Label>
                      <p className="text-sm mt-1">{formatDate(selectedTicket.updatedAt)}</p>
                    </div>
                    
                    {selectedTicket.solicitanteNome && (
                      <div>
                        <Label className="text-sm font-medium">Solicitante</Label>
                        <p className="text-sm mt-1">{selectedTicket.solicitanteNome}</p>
                      </div>
                    )}
                    
                    {selectedTicket.solicitanteEmail && (
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm mt-1">{selectedTicket.solicitanteEmail}</p>
                      </div>
                    )}
                    
                    {selectedTicket.responsavel && (
                      <div>
                        <Label className="text-sm font-medium">Responsável</Label>
                        <p className="text-sm mt-1">{selectedTicket.responsavel.nome}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de criação de ticket */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto *</Label>
              <Input
                id="assunto"
                value={createForm.assunto}
                onChange={(e) => setCreateForm(prev => ({ ...prev, assunto: e.target.value }))}
                placeholder="Descreva brevemente o problema"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento *</Label>
                <Select
                  value={createForm.departamentoId}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, departamentoId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: dept.cor }}
                          />
                          {dept.nome}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select
                  value={createForm.prioridade}
                  onValueChange={(value) => setCreateForm(prev => ({ ...prev, prioridade: value as any }))}
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
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome-remetente">Nome do Solicitante</Label>
                <Input
                  id="nome-remetente"
                  value={createForm.solicitanteNome || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, solicitanteNome: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email-remetente">Email do Solicitante</Label>
                <Input
                  id="email-remetente"
                  type="email"
                  value={createForm.solicitanteEmail || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, solicitanteEmail: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="conteudo">Descrição *</Label>
              <Textarea
                id="conteudo"
                value={createForm.conteudo}
                onChange={(e) => setCreateForm(prev => ({ ...prev, conteudo: e.target.value }))}
                placeholder="Descreva detalhadamente o problema ou solicitação"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateDialog(false);
                  setCreateForm({
                    assunto: '',
                    conteudo: '',
                    departamentoId: '',
                    prioridade: 'MEDIA'
                  });
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={createTicket}
                disabled={isCreating || !createForm.assunto || !createForm.conteudo || !createForm.departamentoId}
              >
                {isCreating ? 'Criando...' : 'Criar Ticket'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Settings, Save, X, AlertCircle, User, Flag, CheckCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HelpdeskTicket {
  id: string;
  status: string;
  prioridade: string;
  responsavelId?: string;
  responsavel?: {
    id: string;
    nome: string;
    email: string;
  };
}

interface Colaborador {
  id: string;
  nome: string;
  email: string;
}

interface QuickEditControlsProps {
  ticket: HelpdeskTicket;
  onTicketUpdate: (updatedTicket: HelpdeskTicket) => void;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'ABERTO', label: 'Aberto', color: 'bg-blue-500' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento', color: 'bg-yellow-500' },
  { value: 'AGUARDANDO_CLIENTE', label: 'Aguardando Cliente', color: 'bg-orange-500' },
  { value: 'RESOLVIDO', label: 'Resolvido', color: 'bg-green-500' },
  { value: 'FECHADO', label: 'Fechado', color: 'bg-gray-500' }
];

const PRIORIDADE_OPTIONS = [
  { value: 'BAIXA', label: 'Baixa', color: 'bg-green-500' },
  { value: 'MEDIA', label: 'Média', color: 'bg-yellow-500' },
  { value: 'ALTA', label: 'Alta', color: 'bg-orange-500' },
  { value: 'URGENTE', label: 'Urgente', color: 'bg-red-500' }
];

export function QuickEditControls({ ticket, onTicketUpdate, className }: QuickEditControlsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loadingColaboradores, setLoadingColaboradores] = useState(false);
  
  // Estados para os valores editáveis
  const [editStatus, setEditStatus] = useState(ticket.status);
  const [editPrioridade, setEditPrioridade] = useState(ticket.prioridade);
  const [editResponsavelId, setEditResponsavelId] = useState(ticket.responsavelId || '');

  // Buscar colaboradores quando entrar em modo de edição
  useEffect(() => {
    if (isEditing && colaboradores.length === 0) {
      fetchColaboradores();
    }
  }, [isEditing]);

  // Atualizar estados quando o ticket mudar
  useEffect(() => {
    setEditStatus(ticket.status);
    setEditPrioridade(ticket.prioridade);
    setEditResponsavelId(ticket.responsavelId || '');
  }, [ticket]);

  const fetchColaboradores = async () => {
    try {
      setLoadingColaboradores(true);
      const response = await fetch('/api/colaboradores?limit=100');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar colaboradores');
      }
      
      const data = await response.json();
      setColaboradores(data.colaboradores || []);
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de colaboradores',
        variant: 'destructive'
      });
    } finally {
      setLoadingColaboradores(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updateData: any = {};
      
      if (editStatus !== ticket.status) {
        updateData.status = editStatus;
      }
      
      if (editPrioridade !== ticket.prioridade) {
        updateData.prioridade = editPrioridade;
      }
      
      if (editResponsavelId !== (ticket.responsavelId || '')) {
        updateData.responsavelId = editResponsavelId || null;
      }
      
      // Se não há mudanças, apenas sair do modo de edição
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }
      
      const response = await fetch(`/api/helpdesk/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar ticket');
      }
      
      const updatedTicket = await response.json();
      onTicketUpdate(updatedTicket);
      setIsEditing(false);
      
      toast({
        title: 'Sucesso',
        description: 'Ticket atualizado com sucesso',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erro ao atualizar ticket:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o ticket',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditStatus(ticket.status);
    setEditPrioridade(ticket.prioridade);
    setEditResponsavelId(ticket.responsavelId || '');
    setIsEditing(false);
  };

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  };

  const getPrioridadeConfig = (prioridade: string) => {
    return PRIORIDADE_OPTIONS.find(opt => opt.value === prioridade) || PRIORIDADE_OPTIONS[1];
  };

  const getResponsavelNome = (responsavelId: string) => {
    if (!responsavelId) return 'Não atribuído';
    const colaborador = colaboradores.find(c => c.id === responsavelId);
    return colaborador?.nome || ticket.responsavel?.nome || 'Desconhecido';
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            STATUS TICKET
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs"
            >
              Editar
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                onClick={handleSave}
                size="sm"
                variant="default"
                className="h-6 px-2 text-xs"
                disabled={loading}
              >
                <Save className="h-3 w-3 mr-1" />
                Salvar
              </Button>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-gray-700">Status do Ticket</span>
          </div>
          {!isEditing ? (
            <Badge 
              variant="outline" 
              className={cn(
                'text-white border-0',
                getStatusConfig(ticket.status).color
              )}
            >
              {getStatusConfig(ticket.status).label}
            </Badge>
          ) : (
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger className="h-11 border-2 hover:border-blue-300 transition-colors">
                <SelectValue />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="py-3">
                    <div className="flex items-center space-x-3">
                      <div className={cn('w-3 h-3 rounded-full', option.color)} />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Separator />

        {/* Prioridade */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-gray-700">Prioridade</span>
          </div>
          {!isEditing ? (
            <Badge 
              variant="outline" 
              className={cn(
                'text-white border-0',
                getPrioridadeConfig(ticket.prioridade).color
              )}
            >
              {getPrioridadeConfig(ticket.prioridade).label}
            </Badge>
          ) : (
            <Select value={editPrioridade} onValueChange={setEditPrioridade}>
              <SelectTrigger className="h-11 border-2 hover:border-blue-300 transition-colors">
                <SelectValue />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                {PRIORIDADE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value} className="py-3">
                    <div className="flex items-center space-x-3">
                      <div className={cn('w-3 h-3 rounded-full', option.color)} />
                      <span className="font-medium">{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Separator />

        {/* Responsável */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-gray-700">Responsável</span>
          </div>
          {!isEditing ? (
            <div className="text-sm text-foreground">
              {ticket.responsavel?.nome || 'Não atribuído'}
            </div>
          ) : (
            <Select 
              value={editResponsavelId} 
              onValueChange={setEditResponsavelId}
              disabled={loadingColaboradores}
            >
              <SelectTrigger className="h-11 border-2 hover:border-blue-300 transition-colors">
                <SelectValue placeholder="Selecionar responsável" />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent className="min-w-[200px]">
                <SelectItem value="" className="py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-medium text-gray-600">Não atribuído</span>
                  </div>
                </SelectItem>
                {colaboradores.map(colaborador => (
                  <SelectItem key={colaborador.id} value={colaborador.id} className="py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">
                          {colaborador.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium">{colaborador.nome}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isEditing && (
          <div className="pt-2">
            <div className="text-xs text-muted-foreground">
              💡 As alterações serão registradas no histórico do ticket
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
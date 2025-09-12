'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, AlertCircle, User, Flag, ChevronDown } from 'lucide-react';
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

interface StatusTicketProps {
  ticket: HelpdeskTicket;
  colaboradores: Colaborador[];
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

export function StatusTicket({ ticket, colaboradores, onTicketUpdate, className }: StatusTicketProps) {
  const [loading, setLoading] = useState(false);

  const getStatusConfig = (status: string) => {
    return STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
  };

  const getPrioridadeConfig = (prioridade: string) => {
    return PRIORIDADE_OPTIONS.find(opt => opt.value === prioridade) || PRIORIDADE_OPTIONS[1];
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === ticket.status) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/helpdesk/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }
      
      const updatedTicket = await response.json();
      onTicketUpdate(updatedTicket);
      
      toast.success('Status atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const handlePrioridadeChange = async (newPrioridade: string) => {
    if (newPrioridade === ticket.prioridade) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/helpdesk/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prioridade: newPrioridade })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar prioridade');
      }
      
      const updatedTicket = await response.json();
      onTicketUpdate(updatedTicket);
      
      toast.success('Prioridade atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar prioridade:', error);
      toast.error('Erro ao atualizar prioridade');
    } finally {
      setLoading(false);
    }
  };

  const handleResponsavelChange = async (newResponsavelId: string) => {
    const actualResponsavelId = newResponsavelId === 'unassigned' ? null : newResponsavelId;
    if (actualResponsavelId === ticket.responsavelId) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/helpdesk/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ responsavelId: actualResponsavelId })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar responsável');
      }
      
      const updatedTicket = await response.json();
      onTicketUpdate(updatedTicket);
      
      toast.success('Responsável atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar responsável:', error);
      toast.error('Erro ao atualizar responsável');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          STATUS TICKET
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-gray-700">Status do Ticket</span>
          </div>
          <Select 
            value={ticket.status} 
            onValueChange={handleStatusChange}
            disabled={loading}
          >
            <SelectTrigger className="h-11 border-2 hover:border-blue-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={cn('w-3 h-3 rounded-full', getStatusConfig(ticket.status).color)} />
                <span className="font-medium">{getStatusConfig(ticket.status).label}</span>
              </div>
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
        </div>

        <Separator />

        {/* Prioridade */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-gray-700">Prioridade</span>
          </div>
          <Select 
            value={ticket.prioridade} 
            onValueChange={handlePrioridadeChange}
            disabled={loading}
          >
            <SelectTrigger className="h-11 border-2 hover:border-blue-300 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={cn('w-3 h-3 rounded-full', getPrioridadeConfig(ticket.prioridade).color)} />
                <span className="font-medium">{getPrioridadeConfig(ticket.prioridade).label}</span>
              </div>
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
        </div>

        <Separator />

        {/* Responsável */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-gray-700">Responsável</span>
          </div>
          <Select 
            value={ticket.responsavelId || 'unassigned'} 
            onValueChange={handleResponsavelChange}
            disabled={loading}
          >
            <SelectTrigger className="h-11 border-2 hover:border-blue-300 transition-colors">
              <div className="flex items-center space-x-3">
                {ticket.responsavel ? (
                  <>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-600">
                        {ticket.responsavel.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium">{ticket.responsavel.nome}</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="font-medium text-gray-600">Não atribuído</span>
                  </>
                )}
              </div>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectTrigger>
            <SelectContent className="min-w-[200px]">
              <SelectItem value="unassigned" className="py-3">
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
        </div>

        <div className="pt-2">
          <div className="text-xs text-muted-foreground">
            💡 As alterações são salvas automaticamente
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default StatusTicket;
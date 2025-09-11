'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Clock,
  User,
  MessageSquare,
  Edit,
  Flag,
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  Play,
  UserPlus,
  Mail
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  id: string;
  type: 'created' | 'status_change' | 'priority_change' | 'assigned' | 'message' | 'observer_added' | 'observer_removed';
  timestamp: Date;
  author: {
    id: string;
    name: string;
    email?: string;
  };
  data: {
    oldValue?: string;
    newValue?: string;
    message?: string;
    observerEmail?: string;
  };
}

interface TicketTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const getEventIcon = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'created':
      return <Play className="h-4 w-4" />;
    case 'status_change':
      return <CheckCircle className="h-4 w-4" />;
    case 'priority_change':
      return <Flag className="h-4 w-4" />;
    case 'assigned':
      return <User className="h-4 w-4" />;
    case 'message':
      return <MessageSquare className="h-4 w-4" />;
    case 'observer_added':
    case 'observer_removed':
      return <UserPlus className="h-4 w-4" />;
    default:
      return <Edit className="h-4 w-4" />;
  }
};

const getEventColor = (type: TimelineEvent['type']) => {
  switch (type) {
    case 'created':
      return 'bg-green-500';
    case 'status_change':
      return 'bg-blue-500';
    case 'priority_change':
      return 'bg-orange-500';
    case 'assigned':
      return 'bg-purple-500';
    case 'message':
      return 'bg-gray-500';
    case 'observer_added':
      return 'bg-teal-500';
    case 'observer_removed':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const getEventDescription = (event: TimelineEvent) => {
  switch (event.type) {
    case 'created':
      return 'Ticket criado';
    case 'status_change':
      return `Status alterado de "${event.data.oldValue}" para "${event.data.newValue}"`;
    case 'priority_change':
      return `Prioridade alterada de "${event.data.oldValue}" para "${event.data.newValue}"`;
    case 'assigned':
      return event.data.newValue 
        ? `Ticket atribuído para ${event.data.newValue}`
        : 'Atribuição removida';
    case 'message':
      return 'Nova mensagem adicionada';
    case 'observer_added':
      return `Observador adicionado: ${event.data.observerEmail}`;
    case 'observer_removed':
      return `Observador removido: ${event.data.observerEmail}`;
    default:
      return 'Alteração realizada';
  }
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export function TicketTimeline({ events, className }: TicketTimelineProps) {
  // Ordenar eventos por data (mais recente primeiro)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Histórico de Alterações
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma alteração registrada ainda</p>
          </div>
        ) : (
          <div className="relative">
            {/* Linha vertical da timeline */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />
            
            <div className="space-y-6">
              {sortedEvents.map((event, index) => (
                <div key={event.id} className="relative flex items-start gap-4">
                  {/* Ícone do evento */}
                  <div className={cn(
                    'relative z-10 flex h-12 w-12 items-center justify-center rounded-full text-white',
                    getEventColor(event.type)
                  )}>
                    {getEventIcon(event.type)}
                  </div>
                  
                  {/* Conteúdo do evento */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(event.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{event.author.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span title={format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}>
                          {formatDistanceToNow(new Date(event.timestamp), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      <p className="text-sm text-foreground">
                        {getEventDescription(event)}
                      </p>
                      
                      {/* Conteúdo adicional para mensagens */}
                      {event.type === 'message' && event.data.message && (
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {event.data.message}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TicketTimeline;
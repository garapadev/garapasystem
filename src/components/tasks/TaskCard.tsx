'use client';

import { Task } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, User, Building, Briefcase, MoreHorizontal, MessageSquare, Paperclip } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  onView: (task: Task) => void;
}

const statusColors = {
  PENDENTE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-800 border-blue-200',
  CONCLUIDA: 'bg-green-100 text-green-800 border-green-200',
  CANCELADA: 'bg-red-100 text-red-800 border-red-200',
};

const priorityColors = {
  BAIXA: 'bg-gray-100 text-gray-800 border-gray-200',
  MEDIA: 'bg-orange-100 text-orange-800 border-orange-200',
  ALTA: 'bg-red-100 text-red-800 border-red-200',
  URGENTE: 'bg-purple-100 text-purple-800 border-purple-200',
};

const statusLabels = {
  PENDENTE: 'Pendente',
  EM_ANDAMENTO: 'Em Andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

const priorityLabels = {
  BAIXA: 'Baixa',
  MEDIA: 'Média',
  ALTA: 'Alta',
  URGENTE: 'Urgente',
};

export function TaskCard({ task, onEdit, onDelete, onView }: TaskCardProps) {
  const formatDate = (date: string | Date | null) => {
    if (!date) return null;
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return null;
    }
  };

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return null;
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return null;
    }
  };

  const isOverdue = () => {
    if (!task.dataVencimento || task.status === 'CONCLUIDA' || task.status === 'CANCELADA') {
      return false;
    }
    return new Date(task.dataVencimento) < new Date();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={cn(
      'hover:shadow-md transition-shadow cursor-pointer',
      isOverdue() && 'border-red-300 bg-red-50'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 
              className="font-semibold text-lg truncate hover:text-blue-600 transition-colors"
              onClick={() => onView(task)}
            >
              {task.titulo}
            </h3>
            {task.descricao && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.descricao}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(task)}>
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(task)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(task.id)}
                className="text-red-600"
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <Badge 
            variant="outline" 
            className={statusColors[task.status]}
          >
            {statusLabels[task.status]}
          </Badge>
          
          <Badge 
            variant="outline" 
            className={priorityColors[task.prioridade]}
          >
            {priorityLabels[task.prioridade]}
          </Badge>

          {isOverdue() && (
            <Badge variant="destructive">
              Vencida
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Datas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {task.dataInicio && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Início: {formatDate(task.dataInicio)}</span>
              </div>
            )}
            
            {task.dataVencimento && (
              <div className={cn(
                "flex items-center gap-2",
                isOverdue() ? "text-red-600" : "text-muted-foreground"
              )}>
                <Clock className="h-4 w-4" />
                <span>Vence: {formatDateTime(task.dataVencimento)}</span>
              </div>
            )}
          </div>

          {/* Responsável */}
          {task.responsavel && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(task.responsavel.nome)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {task.responsavel.nome}
              </span>
            </div>
          )}

          {/* Cliente e Negócio */}
          <div className="space-y-1">
            {task.cliente && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building className="h-4 w-4" />
                <span>{task.cliente.nome}</span>
              </div>
            )}
            
            {task.negocio && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{task.negocio.titulo}</span>
              </div>
            )}
          </div>

          {/* Informações adicionais */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Criada em {formatDate(task.criadoEm)}
            </div>
            
            {task.atualizadoEm && task.atualizadoEm !== task.criadoEm && (
              <div className="text-xs text-muted-foreground">
                Atualizada em {formatDate(task.atualizadoEm)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
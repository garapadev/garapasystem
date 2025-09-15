'use client';

import { Task } from '@/hooks/useTasks';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  ChevronLeft, 
  ChevronRight, 
  Grid3X3, 
  List, 
  Calendar,
  Clock,
  User,
  Building,
  Briefcase,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalTasks: number;
  viewMode: 'grid' | 'list' | 'table';
  onPageChange: (page: number) => void;
  onViewModeChange: (mode: 'grid' | 'list' | 'table') => void;
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

export function TaskList({
  tasks,
  loading,
  currentPage,
  totalPages,
  totalTasks,
  viewMode,
  onPageChange,
  onViewModeChange,
  onEdit,
  onDelete,
  onView,
}: TaskListProps) {
  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return '-';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const isOverdue = (task: Task) => {
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

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-muted-foreground">
          Mostrando {Math.min((currentPage - 1) * 10 + 1, totalTasks)} a{' '}
          {Math.min(currentPage * 10, totalTasks)} de {totalTasks} tarefas
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {startPage > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="text-muted-foreground">...</span>}
            </>
          )}
          
          {pages.map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-muted-foreground">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-muted-foreground">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Nenhuma tarefa encontrada</h3>
            <p>Não há tarefas que correspondam aos filtros aplicados.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles de visualização */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''} encontrada{totalTasks !== 1 ? 's' : ''}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onViewModeChange('table')}
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo baseado no modo de visualização */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
            />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <Card key={task.id} className={cn(
              'hover:shadow-md transition-shadow cursor-pointer',
              isOverdue(task) && 'border-red-300 bg-red-50'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 
                        className="font-medium truncate hover:text-blue-600 transition-colors"
                        onClick={() => onView(task)}
                      >
                        {task.titulo}
                      </h3>
                      
                      <div className="flex gap-2">
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

                        {isOverdue(task) && (
                          <Badge variant="destructive">
                            Vencida
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                      {task.responsavel && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{task.responsavel.nome}</span>
                        </div>
                      )}
                      
                      {task.dataVencimento && (
                        <div className={cn(
                          "flex items-center gap-1",
                          isOverdue(task) && "text-red-600"
                        )}>
                          <Clock className="h-4 w-4" />
                          <span>{formatDateTime(task.dataVencimento)}</span>
                        </div>
                      )}
                      
                      {task.cliente && (
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span>{task.cliente.nome}</span>
                        </div>
                      )}
                    </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => (
                <TableRow 
                  key={task.id} 
                  className={cn(
                    'cursor-pointer hover:bg-muted/50',
                    isOverdue(task) && 'bg-red-50'
                  )}
                  onClick={() => onView(task)}
                >
                  <TableCell className="font-medium">
                    <div>
                      <div className="truncate max-w-[200px]">{task.titulo}</div>
                      {task.descricao && (
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {task.descricao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={statusColors[task.status]}
                    >
                      {statusLabels[task.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={priorityColors[task.prioridade]}
                    >
                      {priorityLabels[task.prioridade]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.responsavel ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(task.responsavel.nome)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="truncate max-w-[120px]">{task.responsavel.nome}</span>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className={cn(
                    isOverdue(task) && "text-red-600 font-medium"
                  )}>
                    {formatDateTime(task.dataVencimento || null)}
                  </TableCell>
                  <TableCell>
                    <span className="truncate max-w-[120px]">
                      {task.cliente?.nome || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Paginação */}
      {renderPagination()}
    </div>
  );
}
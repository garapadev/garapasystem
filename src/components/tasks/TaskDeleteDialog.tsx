'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskDeleteDialogProps {
  task: any;
  onConfirm: (taskId: string) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TaskDeleteDialog({
  task,
  onConfirm,
  trigger,
  open,
  onOpenChange
}: TaskDeleteDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  const handleConfirm = () => {
    onConfirm(task.id);
    handleOpenChange(false);
  };

  const dialogOpen = open !== undefined ? open : isOpen;

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'URGENTE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'ALTA':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAIXA':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONCLUIDA':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'EM_ANDAMENTO':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PAUSADA':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CANCELADA':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div>
                  <strong>Título:</strong> {task.titulo}
                </div>
                
                {task.descricao && (
                  <div>
                    <strong>Descrição:</strong> {task.descricao}
                  </div>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getPrioridadeColor(task.prioridade)}>
                    {task.prioridade}
                  </Badge>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                {task.responsavel && (
                  <div>
                    <strong>Responsável:</strong> {task.responsavel.nome}
                  </div>
                )}
                
                {task.cliente && (
                  <div>
                    <strong>Cliente:</strong> {task.cliente.nome}
                  </div>
                )}
                
                {task.dataVencimento && (
                  <div>
                    <strong>Vencimento:</strong> {new Date(task.dataVencimento).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Excluir Tarefa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
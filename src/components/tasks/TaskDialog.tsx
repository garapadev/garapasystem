'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskForm } from './TaskForm';
import { CreateTaskData, UpdateTaskData } from '@/hooks/useTasks';

interface TaskDialogProps {
  task?: any;
  onSubmit: (data: CreateTaskData | UpdateTaskData) => void;
  clientes: any[];
  colaboradores: any[];
  negocios: any[];
  isEditing?: boolean;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TaskDialog({
  task,
  onSubmit,
  clientes,
  colaboradores,
  negocios,
  isEditing = false,
  trigger,
  open,
  onOpenChange
}: TaskDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setIsOpen(newOpen);
    }
  };

  const handleSubmit = (data: CreateTaskData | UpdateTaskData) => {
    onSubmit(data);
    handleOpenChange(false);
  };

  const handleCancel = () => {
    handleOpenChange(false);
  };

  const dialogOpen = open !== undefined ? open : isOpen;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações da tarefa abaixo.'
              : 'Preencha as informações para criar uma nova tarefa.'
            }
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          task={task}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          clientes={clientes}
          colaboradores={colaboradores}
          negocios={negocios}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
}
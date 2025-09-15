'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { useClientes } from '@/hooks/useClientes';
import { useColaboradores } from '@/hooks/useColaboradores';
import { useNegocios } from '@/hooks/useNegocios';
import { TaskForm } from '@/components/tasks/TaskForm';
import { toast } from 'sonner';

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;
  
  const { tasks, updateTask, fetchTasks } = useTasks();
  const { clientes, refetch: refetchClientes } = useClientes();
  const { colaboradores, refetch: refetchColaboradores } = useColaboradores();
  const { oportunidades: negocios, refreshOportunidades } = useNegocios();

  const [task, setTask] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Buscar dados necessários
        await Promise.all([
          refetchClientes(),
          refetchColaboradores(),
          refreshOportunidades(),
          fetchTasks({}, 1, 1000) // Buscar todas as tarefas para encontrar a específica
        ]);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados necessários');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (tasks && tasks.length > 0 && taskId) {
      const foundTask = tasks.find(t => t.id.toString() === taskId);
      if (foundTask) {
        setTask(foundTask);
      } else {
        // Se não encontrou a tarefa, buscar especificamente
        fetchTaskById();
      }
    }
  }, [tasks, taskId]);

  const fetchTaskById = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const taskData = await response.json();
        setTask(taskData);
      } else {
        toast.error('Tarefa não encontrada');
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Erro ao buscar tarefa:', error);
      toast.error('Erro ao carregar tarefa');
      router.push('/tasks');
    }
  };

  const handleUpdateTask = async (data: any) => {
    if (!task) return;
    
    setIsSubmitting(true);
    try {
      const success = await updateTask(task.id, data);
      if (success) {
        toast.success('Tarefa atualizada com sucesso!');
        router.push('/tasks');
      } else {
        toast.error('Erro ao atualizar tarefa. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast.error('Erro ao atualizar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/tasks');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Carregando tarefa...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Tarefa não encontrada</p>
            <Button onClick={() => router.push('/tasks')}>Voltar para Tarefas</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/tasks')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Tarefa</h1>
          <p className="text-gray-600 mt-1">
            Atualize as informações da tarefa: {task.titulo}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Tarefa</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm
            task={task}
            onSubmit={handleUpdateTask}
            onCancel={handleCancel}
            clientes={clientes}
            colaboradores={colaboradores}
            negocios={negocios}
            isEditing={true}
          />
        </CardContent>
      </Card>
    </div>
  );
}
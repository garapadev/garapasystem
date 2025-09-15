'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { useClientes } from '@/hooks/useClientes';
import { useColaboradores } from '@/hooks/useColaboradores';
import { useNegocios } from '@/hooks/useNegocios';
import { TaskForm } from '@/components/tasks/TaskForm';
import { toast } from 'sonner';

export default function NewTaskPage() {
  const router = useRouter();
  const { createTask } = useTasks();
  const { clientes, refetch: refetchClientes } = useClientes();
  const { colaboradores, refetch: refetchColaboradores } = useColaboradores();
  const { oportunidades: negocios, refreshOportunidades } = useNegocios();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    refetchClientes();
    refetchColaboradores();
    refreshOportunidades();
  }, []);

  const handleCreateTask = async (data: any) => {
    setIsSubmitting(true);
    try {
      const success = await createTask(data);
      if (success) {
        toast.success('Tarefa criada com sucesso!');
        router.push('/tasks');
      } else {
        toast.error('Erro ao criar tarefa. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/tasks');
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Nova Tarefa</h1>
          <p className="text-gray-600 mt-1">
            Preencha os dados para criar uma nova tarefa
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
            onSubmit={handleCreateTask}
            onCancel={handleCancel}
            clientes={clientes}
            colaboradores={colaboradores}
            negocios={negocios}
            isEditing={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
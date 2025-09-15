'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Mail } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEmailToTask, EmailTaskData } from '@/hooks/useEmailToTask';
import { toast } from 'sonner';

interface EmailToTaskDialogProps {
  emailId: string;
  emailSubject?: string;
  onTaskCreated?: (task: any) => void;
  children?: React.ReactNode;
}

export function EmailToTaskDialog({ 
  emailId, 
  emailSubject, 
  onTaskCreated,
  children 
}: EmailToTaskDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<EmailTaskData>({
    emailId,
    titulo: emailSubject ? `Email: ${emailSubject}` : '',
    prioridade: 'MEDIA'
  });
  const [assignees, setAssignees] = useState<Array<{ id: string; nome: string; email: string }>>([]);
  const [clients, setClients] = useState<Array<{ id: string; nome: string; email: string }>>([]);
  const [isAlreadyTask, setIsAlreadyTask] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { loading, error, checkEmailTask, createTaskFromEmail } = useEmailToTask();

  // Carregar dados quando o diálogo abrir
  useEffect(() => {
    if (open && emailId) {
      loadEmailTaskData();
    }
  }, [open, emailId]);

  const loadEmailTaskData = async () => {
    const result = await checkEmailTask(emailId);
    if (result) {
      setIsAlreadyTask(result.isAlreadyTask);
      setAssignees(result.assignees);
      setClients(result.clients);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAlreadyTask) {
      toast.error('Este email já foi transformado em tarefa');
      return;
    }

    const result = await createTaskFromEmail(formData);
    
    if (result?.success) {
      toast.success('Tarefa criada com sucesso!');
      onTaskCreated?.(result.task);
      setOpen(false);
      // Reset form
      setFormData({
        emailId,
        titulo: emailSubject ? `Email: ${emailSubject}` : '',
        prioridade: 'MEDIA'
      });
    } else {
      toast.error(result?.error || 'Erro ao criar tarefa');
    }
  };

  const updateFormData = (field: keyof EmailTaskData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Transformar em Tarefa
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transformar Email em Tarefa</DialogTitle>
        </DialogHeader>

        {isAlreadyTask && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Este email já foi transformado em tarefa.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="titulo">Título da Tarefa</Label>
              <Input
                id="titulo"
                value={formData.titulo || ''}
                onChange={(e) => updateFormData('titulo', e.target.value)}
                placeholder="Digite o título da tarefa"
                required
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ''}
                onChange={(e) => updateFormData('descricao', e.target.value)}
                placeholder="Descrição adicional da tarefa"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select
                value={formData.prioridade}
                onValueChange={(value) => updateFormData('prioridade', value)}
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

            <div>
              <Label>Data de Vencimento</Label>
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dataVencimento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dataVencimento ? (
                      format(formData.dataVencimento, "PPP", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dataVencimento}
                    onSelect={(date) => {
                      updateFormData('dataVencimento', date);
                      setDatePickerOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="responsavel">Responsável</Label>
              <Select
                value={formData.responsavelId || ''}
                onValueChange={(value) => updateFormData('responsavelId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      {assignee.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cliente">Cliente (Opcional)</Label>
              <Select
                value={formData.clienteId || ''}
                onValueChange={(value) => updateFormData('clienteId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum cliente</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || isAlreadyTask}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Tarefa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
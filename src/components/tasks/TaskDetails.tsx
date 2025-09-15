'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, User, Building, Briefcase, MessageSquare, Paperclip, Download, Trash2, Plus, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Task, TaskComment, TaskAttachment } from '@/hooks/useTasks';

interface TaskDetailsProps {
  task: Task;
  onAddComment: (content: string) => void;
  onUploadAttachment: (file: File) => void;
  onDownloadAttachment: (attachmentId: string) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  isLoading?: boolean;
}

export function TaskDetails({
  task,
  onAddComment,
  onUploadAttachment,
  onDownloadAttachment,
  onDeleteAttachment,
  onEdit,
  onDelete,
  isLoading = false
}: TaskDetailsProps) {
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsAddingComment(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUploadAttachment(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PENDENTE: 'outline',
      EM_ANDAMENTO: 'default',
      CONCLUIDA: 'secondary',
      CANCELADA: 'destructive'
    };
    
    const labels: Record<string, string> = {
      PENDENTE: 'Pendente',
      EM_ANDAMENTO: 'Em Andamento',
      CONCLUIDA: 'Concluída',
      CANCELADA: 'Cancelada'
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (prioridade: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      BAIXA: 'outline',
      MEDIA: 'secondary',
      ALTA: 'default',
      URGENTE: 'destructive'
    };
    
    const labels: Record<string, string> = {
      BAIXA: 'Baixa',
      MEDIA: 'Média',
      ALTA: 'Alta',
      URGENTE: 'Urgente'
    };

    return (
      <Badge variant={variants[prioridade] || 'outline'}>
        {labels[prioridade] || prioridade}
      </Badge>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Não definida';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatDateTime = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{task.titulo}</h1>
          <div className="flex items-center gap-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.prioridade)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descrição */}
          {task.descricao && (
            <Card>
              <CardHeader>
                <CardTitle>Descrição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{task.descricao}</p>
              </CardContent>
            </Card>
          )}

          {/* Comentários */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentários ({task.comentarios?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de Comentários */}
              <ScrollArea className="h-64">
                <div className="space-y-4">
                  {task.comentarios?.map((comment: TaskComment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {getInitials(comment.autor?.nome || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.autor?.nome || 'Usuário'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(comment.criadoEm)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.conteudo}</p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum comentário ainda
                    </p>
                  )}
                </div>
              </ScrollArea>

              <Separator />

              {/* Adicionar Comentário */}
              <div className="space-y-3">
                <Textarea
                  placeholder="Adicione um comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isAddingComment}
                    size="sm"
                  >
                    {isAddingComment ? 'Adicionando...' : 'Adicionar Comentário'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Anexos ({task.anexos?.length || 0})
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <div className="space-y-2">
                {task.anexos?.map((attachment: TaskAttachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{attachment.nomeArquivo}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(attachment.tamanhoBytes)} • {formatDateTime(attachment.criadoEm)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadAttachment(attachment.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o anexo "{attachment.nomeArquivo}"?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteAttachment(attachment.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                )) || (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum anexo
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações Gerais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data de Início</p>
                    <p className="text-sm text-muted-foreground">{formatDate(task.dataInicio || null)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data de Vencimento</p>
                    <p className="text-sm text-muted-foreground">{formatDate(task.dataVencimento || null)}</p>
                  </div>
                </div>

                {task.dataConclusao && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Data de Conclusão</p>
                      <p className="text-sm text-muted-foreground">{formatDate(task.dataConclusao)}</p>
                    </div>
                  </div>
                )}

                {(task.estimativaHoras || task.horasGastas) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Tempo</p>
                      <p className="text-sm text-muted-foreground">
                        {task.horasGastas || 0}h / {task.estimativaHoras || 0}h
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Atribuições */}
          <Card>
            <CardHeader>
              <CardTitle>Atribuições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {task.criadoPor && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Criado por</p>
                    <p className="text-sm text-muted-foreground">{task.criadoPor.nome}</p>
                  </div>
                </div>
              )}

              {task.responsavel && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Responsável</p>
                    <p className="text-sm text-muted-foreground">{task.responsavel.nome}</p>
                  </div>
                </div>
              )}

              {task.cliente && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Cliente</p>
                    <p className="text-sm text-muted-foreground">{task.cliente.nome}</p>
                  </div>
                </div>
              )}

              {task.negocio && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Negócio</p>
                    <p className="text-sm text-muted-foreground">{task.negocio.titulo}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recorrência */}
          {task.recorrencia && (
            <Card>
              <CardHeader>
                <CardTitle>Recorrência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Tipo:</span> {task.recorrencia.tipo}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Intervalo:</span> {task.recorrencia.intervalo}
                  </p>
                  {task.recorrencia.diasSemana && task.recorrencia.diasSemana.length > 0 && (
                    <p className="text-sm">
                      <span className="font-medium">Dias:</span> {task.recorrencia.diasSemana.join(', ')}
                    </p>
                  )}
                  {task.recorrencia.diaMes && (
                    <p className="text-sm">
                      <span className="font-medium">Dia do mês:</span> {task.recorrencia.diaMes}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs de Atividade */}
          {task.logs && task.logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {task.logs.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="text-xs">
                        <p className="font-medium">{log.acao}</p>
                        <p className="text-muted-foreground">
                          {log.autor?.nome} • {formatDateTime(log.criadoEm)}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
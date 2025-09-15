'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTaskComments } from '@/hooks/useTaskComments';
import { MessageSquare, Clock, User, Lock, Globe, Send, History } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const {
    comments,
    auditLogs,
    loading,
    error,
    fetchComments,
    fetchAuditTrail,
    createComment
  } = useTaskComments(taskId);

  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
    fetchAuditTrail();
  }, [fetchComments, fetchAuditTrail]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;
    
    setSubmitting(true);
    
    const success = await createComment({
      conteudo: newComment.trim(),
      isInterno: isInternal
    });
    
    if (success) {
      setNewComment('');
      setIsInternal(false);
    }
    
    setSubmitting(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: ptBR
    });
  };

  const getLogTypeColor = (tipo: string) => {
    switch (tipo) {
      case 'CRIACAO':
        return 'bg-green-100 text-green-800';
      case 'STATUS_ALTERADO':
        return 'bg-blue-100 text-blue-800';
      case 'PRIORIDADE_ALTERADA':
        return 'bg-orange-100 text-orange-800';
      case 'RESPONSAVEL_ALTERADO':
        return 'bg-purple-100 text-purple-800';
      case 'COMENTARIO_ADICIONADO':
        return 'bg-gray-100 text-gray-800';
      case 'CONCLUSAO':
        return 'bg-green-100 text-green-800';
      case 'CANCELAMENTO':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comentários e Histórico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="comments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Comentários ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico ({auditLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="space-y-4">
            {/* Formulário para novo comentário */}
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <Textarea
                placeholder="Adicione um comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px]"
                disabled={submitting}
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="internal-comment"
                    checked={isInternal}
                    onCheckedChange={setIsInternal}
                    disabled={submitting}
                  />
                  <Label htmlFor="internal-comment" className="flex items-center gap-1">
                    {isInternal ? (
                      <>
                        <Lock className="h-3 w-3" />
                        Comentário interno
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3" />
                        Comentário público
                      </>
                    )}
                  </Label>
                </div>
                
                <Button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {submitting ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>
            </form>

            <Separator />

            {/* Lista de comentários */}
            <ScrollArea className="h-[400px]">
              {loading && comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando comentários...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum comentário ainda. Seja o primeiro a comentar!
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-lg border">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(comment.autor.nome)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.autor.nome}
                          </span>
                          <Badge
                            variant={comment.isInterno ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {comment.isInterno ? (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Interno
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3 mr-1" />
                                Público
                              </>
                            )}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {comment.conteudo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ScrollArea className="h-[500px]">
              {loading && auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando histórico...
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum registro no histórico.
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 p-3 rounded-lg border">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(log.autor.nome)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {log.autor.nome}
                          </span>
                          <Badge className={`text-xs ${getLogTypeColor(log.tipo)}`}>
                            {log.tipo.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-700">
                          {log.descricao}
                        </p>
                        
                        {(log.valorAnterior || log.valorNovo) && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {log.valorAnterior && (
                              <div>Valor anterior: {log.valorAnterior}</div>
                            )}
                            {log.valorNovo && (
                              <div>Novo valor: {log.valorNovo}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
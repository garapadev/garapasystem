'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, User, FileText, AlertCircle, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TicketLog {
  id: string;
  tipo: string;
  descricao: string;
  valorAnterior?: string;
  valorNovo?: string;
  autorNome: string;
  autorEmail: string;
  createdAt: string;
  autor?: {
    id: string;
    nome: string;
    email: string;
  };
}

interface TicketHistoryLogProps {
  ticketId: string;
  className?: string;
}

const LOG_TYPE_CONFIG = {
  CRIACAO: {
    icon: FileText,
    color: 'bg-blue-500',
    label: 'Criação',
    variant: 'default' as const
  },
  STATUS_ALTERADO: {
    icon: AlertCircle,
    color: 'bg-yellow-500',
    label: 'Status',
    variant: 'secondary' as const
  },
  PRIORIDADE_ALTERADA: {
    icon: AlertCircle,
    color: 'bg-orange-500',
    label: 'Prioridade',
    variant: 'destructive' as const
  },
  RESPONSAVEL_ALTERADO: {
    icon: User,
    color: 'bg-purple-500',
    label: 'Responsável',
    variant: 'outline' as const
  },
  ASSUNTO_ALTERADO: {
    icon: FileText,
    color: 'bg-indigo-500',
    label: 'Assunto',
    variant: 'secondary' as const
  },
  DESCRICAO_ALTERADA: {
    icon: FileText,
    color: 'bg-indigo-500',
    label: 'Descrição',
    variant: 'secondary' as const
  },
  MENSAGEM_ADICIONADA: {
    icon: FileText,
    color: 'bg-green-500',
    label: 'Mensagem',
    variant: 'default' as const
  },
  FECHAMENTO: {
    icon: CheckCircle,
    color: 'bg-green-600',
    label: 'Fechamento',
    variant: 'default' as const
  },
  REABERTURA: {
    icon: RotateCcw,
    color: 'bg-blue-600',
    label: 'Reabertura',
    variant: 'default' as const
  }
};

export function TicketHistoryLog({ ticketId, className }: TicketHistoryLogProps) {
  const [logs, setLogs] = useState<TicketLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchLogs = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/helpdesk/tickets/${ticketId}/logs?page=${pageNum}&limit=20`
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar histórico');
      }

      const data = await response.json();
      
      if (append) {
        setLogs(prev => [...prev, ...data.logs]);
      } else {
        setLogs(data.logs);
      }
      
      setHasMore(data.pagination.page < data.pagination.pages);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchLogs(page + 1, true);
    }
  };

  const refresh = () => {
    setPage(1);
    fetchLogs(1, false);
  };

  useEffect(() => {
    if (ticketId) {
      fetchLogs();
    }
  }, [ticketId]);

  const getLogConfig = (tipo: string) => {
    return LOG_TYPE_CONFIG[tipo as keyof typeof LOG_TYPE_CONFIG] || {
      icon: FileText,
      color: 'bg-gray-500',
      label: 'Alteração',
      variant: 'outline' as const
    };
  };

  const formatLogTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true, locale: ptBR }),
      absolute: date.toLocaleString('pt-BR')
    };
  };

  if (error) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            Histórico de Alterações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <Button onClick={refresh} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico de Alterações
          </div>
          <Button
            onClick={refresh}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            disabled={loading}
          >
            <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Carregando...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma alteração registrada
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {logs.map((log, index) => {
                const config = getLogConfig(log.tipo);
                const Icon = config.icon;
                const timeInfo = formatLogTime(log.createdAt);

                return (
                  <div key={log.id} className="relative">
                    {index < logs.length - 1 && (
                      <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />
                    )}
                    
                    <div className="flex gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full text-white flex-shrink-0',
                        config.color
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={config.variant} className="text-xs">
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground" title={timeInfo.absolute}>
                            {timeInfo.relative}
                          </span>
                        </div>
                        
                        <p className="text-sm text-foreground leading-relaxed">
                          {log.descricao}
                        </p>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{log.autorNome}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {hasMore && (
                <div className="text-center pt-2">
                  <Button
                    onClick={loadMore}
                    size="sm"
                    variant="ghost"
                    disabled={loading}
                    className="text-xs"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin mr-2" />
                        Carregando...
                      </>
                    ) : (
                      'Carregar mais'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, Square, RotateCcw, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface WorkerStatus {
  isInitialized: boolean;
  isRunning: boolean;
  syncInterval: number;
  timestamp: string;
}

interface WorkerResponse {
  success: boolean;
  data?: WorkerStatus;
  message?: string;
  error?: string;
}

export function WorkerControl() {
  const [status, setStatus] = useState<WorkerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Buscar status inicial
  useEffect(() => {
    fetchStatus();
    
    // Atualizar status a cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/worker');
      const data: WorkerResponse = await response.json();
      
      if (data.success && data.data) {
        setStatus(data.data);
        setLastUpdate(new Date());
      } else {
        console.error('Erro ao buscar status:', data.error);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action: string) => {
    try {
      setActionLoading(action);
      
      const response = await fetch('/api/helpdesk/worker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      
      const data: WorkerResponse = await response.json();
      
      if (data.success) {
        toast.success(data.message || `Ação '${action}' executada com sucesso`);
        if (data.data) {
          setStatus(data.data);
        }
        await fetchStatus(); // Atualizar status
      } else {
        toast.error(data.error || `Erro ao executar ação '${action}'`);
      }
    } catch (error) {
      console.error('Erro na ação:', error);
      toast.error('Erro de conexão');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = () => {
    if (!status) return <Badge variant="secondary">Carregando...</Badge>;
    
    if (status.isRunning) {
      return (
        <Badge variant="default" className="bg-green-500">
          <Activity className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      );
    } else if (status.isInitialized) {
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Inicializado
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Parado
        </Badge>
      );
    }
  };

  const formatInterval = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Worker de Processamento de Emails
            </CardTitle>
            <CardDescription>
              Gerencia o processamento automático de emails do helpdesk
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status detalhado */}
        {status && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              {status.isInitialized ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">
                {status.isInitialized ? 'Inicializado' : 'Não inicializado'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {status.isRunning ? (
                <Activity className="w-4 h-4 text-green-500 animate-pulse" />
              ) : (
                <Square className="w-4 h-4 text-gray-500" />
              )}
              <span className="text-sm">
                {status.isRunning ? 'Em execução' : 'Parado'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                Intervalo: {formatInterval(status.syncInterval)}
              </span>
            </div>
          </div>
        )}
        
        {/* Controles */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => executeAction('start')}
            disabled={actionLoading !== null || (status?.isRunning ?? false)}
            size="sm"
            className="flex items-center gap-2"
          >
            {actionLoading === 'start' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Iniciar
          </Button>
          
          <Button
            onClick={() => executeAction('stop')}
            disabled={actionLoading !== null || !(status?.isRunning ?? true)}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            {actionLoading === 'stop' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            Parar
          </Button>
          
          <Button
            onClick={() => executeAction('restart')}
            disabled={actionLoading !== null}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {actionLoading === 'restart' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Reiniciar
          </Button>
          
          <Button
            onClick={fetchStatus}
            disabled={loading}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            Atualizar
          </Button>
        </div>
        
        {/* Informações adicionais */}
        <Alert>
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <p><strong>Funcionalidade:</strong> Processa emails automaticamente criando tickets no helpdesk</p>
              <p><strong>Última atualização:</strong> {lastUpdate.toLocaleString('pt-BR')}</p>
              {status && (
                <p><strong>Status do servidor:</strong> {new Date(status.timestamp).toLocaleString('pt-BR')}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
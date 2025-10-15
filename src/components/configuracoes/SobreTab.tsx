'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Server, 
  Smartphone, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VersionInfo {
  app: {
    name: string;
    version: string;
  };
  api: {
    version: string;
    status: string;
    endpoints: {
      total: number;
    };
    database?: string;
  };
  timestamp?: string;
}

export default function SobreTab() {
  const { toast } = useToast();
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVersionInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/version');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar informações de versão');
      }
      
      const data = await response.json();
      setVersionInfo(data);
    } catch (error) {
      console.error('Erro ao buscar informações de versão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as informações de versão.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  useEffect(() => {
    fetchVersionInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!versionInfo) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Não foi possível carregar as informações do sistema.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações da Aplicação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Informações da Aplicação
          </CardTitle>
          <CardDescription>
            Nome e versão atuais da aplicação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nome</p>
              <p className="text-lg font-semibold">{versionInfo.app.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Versão</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  v{versionInfo.app.version}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações da API */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Informações da API
          </CardTitle>
          <CardDescription>
            Versão e status de saúde da API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Versão da API</p>
              <Badge variant="outline" className="text-sm">
                v{versionInfo.api.version}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="flex items-center gap-2">
                {versionInfo.api.status === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm capitalize">{versionInfo.api.status}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Endpoints</p>
              <p className="text-sm">{versionInfo.api.endpoints.total}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Banco de Dados</p>
              <p className="text-sm">{versionInfo.api.database || 'desconhecido'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Removidos: cards de Atualizações e Funcionalidades Disponíveis para manter apenas dados essenciais e reais */}

      {/* Informações de Debug */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Informações de Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            Última atualização: {formatDate(versionInfo.timestamp || new Date().toISOString())}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
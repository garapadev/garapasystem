'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Loader2, 
  Server, 
  Smartphone, 
  Download, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VersionInfo {
  app: {
    name: string;
    version: string;
    buildDate: string;
    description: string;
  };
  api: {
    version: string;
    status: string;
    endpoints: {
      total: number;
      authenticated: number;
      public: number;
    };
  };
  system: {
    node: string;
    platform: string;
    arch: string;
    uptime: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    environment: string;
  };
  updates: {
    available: boolean;
    latestVersion: string;
    currentVersion: string;
    releaseNotes: string;
    lastChecked?: string;
    releaseDate?: string;
    severity?: string;
    downloadUrl?: string;
    error?: string;
    changelog?: string[];
  };
  features?: {
    [key: string]: string;
  };
  timestamp?: string;
}

export default function SobreTab() {
  const { toast } = useToast();
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

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

  const checkForUpdates = async () => {
    try {
      setChecking(true);
      await fetchVersionInfo(); // Recarrega as informações
      toast({
        title: 'Verificação concluída',
        description: 'Informações de atualização foram verificadas.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao verificar atualizações.',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
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
            Detalhes sobre a versão atual do sistema
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
            <div>
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="text-sm">{versionInfo.app.description}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Build</p>
              <p className="text-sm">{formatDate(versionInfo.app.buildDate)}</p>
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
            Status e detalhes da API do sistema
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
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm capitalize">{versionInfo.api.status}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Endpoints</p>
              <p className="text-sm">{versionInfo.api.endpoints.total}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Endpoints Autenticados</p>
              <p className="text-sm">{versionInfo.api.endpoints.authenticated}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verificação de Atualizações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Atualizações
          </CardTitle>
          <CardDescription>
            Verificar e gerenciar atualizações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {versionInfo.updates.error ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {versionInfo.updates.error}
              </AlertDescription>
            </Alert>
          ) : versionInfo.updates.available ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    Nova versão disponível: v{versionInfo.updates.latestVersion}
                  </p>
                  <p className="text-sm">{versionInfo.updates.releaseNotes}</p>
                  {versionInfo.updates.releaseDate && (
                    <p className="text-xs text-muted-foreground">
                      Lançada em: {formatDate(versionInfo.updates.releaseDate)}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>Você está usando a versão mais recente do sistema.</p>
                  <p className="text-sm">{versionInfo.updates.releaseNotes}</p>
                  {versionInfo.updates.changelog && versionInfo.updates.changelog.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium mb-2">Últimas melhorias:</p>
                      <ul className="text-xs space-y-1">
                        {versionInfo.updates.changelog.map((item, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-green-500 mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Última verificação</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(versionInfo.updates.lastChecked)}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkForUpdates}
              disabled={checking}
            >
              {checking ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Verificar Atualizações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades do Sistema */}
      {versionInfo.features && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Funcionalidades Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(versionInfo.features).map(([key, description]) => (
                <div key={key} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
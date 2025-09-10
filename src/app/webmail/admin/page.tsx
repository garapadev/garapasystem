'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  Settings,
  RefreshCw,
  Search,
  TestTube,
  Mail,
  Server,
  Database,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface SyncStatus {
  isRunning: boolean;
  lastSync?: string;
  nextSync?: string;
}

interface ConsistencyStatus {
  hasInconsistencies: boolean;
  inconsistencies: number;
  totalFolders: number;
  lastCheck?: string;
}

export default function WebmailAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isRunning: false });
  const [consistencyStatus, setConsistencyStatus] = useState<ConsistencyStatus | null>(null);
  const [isCheckingConsistency, setIsCheckingConsistency] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (session) {
      loadAdminData();
    }
  }, [session]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        checkAutoSyncStatus(),
        checkConsistency()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados administrativos:', error);
      toast.error('Erro ao carregar dados administrativos');
    } finally {
      setLoading(false);
    }
  };

  const checkAutoSyncStatus = async () => {
    try {
      const response = await fetch('/api/email-sync/auto');
      if (response.ok) {
        const data = await response.json();
        setAutoSyncEnabled(data.isActive);
        setSyncStatus({
          isRunning: data.isRunning,
          lastSync: data.lastSync,
          nextSync: data.nextSync
        });
      }
    } catch (error) {
      console.error('Erro ao verificar status de auto-sync:', error);
    }
  };

  const checkConsistency = async () => {
    try {
      setIsCheckingConsistency(true);
      const response = await fetch('/api/email-sync/consistency');
      if (response.ok) {
        const data = await response.json();
        setConsistencyStatus(data);
      }
    } catch (error) {
      console.error('Erro ao verificar consistência:', error);
      toast.error('Erro ao verificar consistência das pastas');
    } finally {
      setIsCheckingConsistency(false);
    }
  };

  const toggleAutoSync = async () => {
    try {
      const response = await fetch('/api/email-sync/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !autoSyncEnabled })
      });
      
      if (response.ok) {
        setAutoSyncEnabled(!autoSyncEnabled);
        toast.success(`Auto-sync ${!autoSyncEnabled ? 'ativado' : 'desativado'}`);
      } else {
        toast.error('Erro ao alterar auto-sync');
      }
    } catch (error) {
      console.error('Erro ao alterar auto-sync:', error);
      toast.error('Erro ao alterar auto-sync');
    }
  };

  const syncEmails = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/email-sync', { method: 'POST' });
      
      if (response.ok) {
        toast.success('Sincronização iniciada');
        await checkAutoSyncStatus();
      } else {
        toast.error('Erro ao iniciar sincronização');
      }
    } catch (error) {
      console.error('Erro ao sincronizar emails:', error);
      toast.error('Erro ao sincronizar emails');
    } finally {
      setSyncing(false);
    }
  };

  const fixConsistency = async () => {
    try {
      setIsCheckingConsistency(true);
      const response = await fetch('/api/email-sync/consistency/fix', { method: 'POST' });
      
      if (response.ok) {
        toast.success('Correção de consistência iniciada');
        await checkConsistency();
      } else {
        toast.error('Erro ao corrigir inconsistências');
      }
    } catch (error) {
      console.error('Erro ao corrigir consistências:', error);
      toast.error('Erro ao corrigir inconsistências');
    } finally {
      setIsCheckingConsistency(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      setIsSendingTest(true);
      const response = await fetch('/api/emails/test-send', { method: 'POST' });
      
      if (response.ok) {
        toast.success('Email de teste enviado com sucesso!');
      } else {
        const error = await response.text();
        toast.error(`Erro ao enviar email de teste: ${error}`);
      }
    } catch (error) {
      console.error('Erro ao enviar email de teste:', error);
      toast.error('Erro ao enviar email de teste');
    } finally {
      setIsSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando administração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={() => router.push('/webmail')}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Administração do Webmail</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status de Sincronização */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status Atual */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                syncStatus.isRunning ? 'bg-green-500 animate-pulse' : 
                autoSyncEnabled ? 'bg-blue-500' : 'bg-gray-400'
              }`} />
              <span className="text-sm">
                {syncStatus.isRunning ? 'Sincronizando...' : 
                 autoSyncEnabled ? 'Auto-sync ativo' : 'Auto-sync inativo'}
              </span>
            </div>
            
            {syncStatus.lastSync && (
              <div className="text-sm text-muted-foreground">
                Última sync: {new Date(syncStatus.lastSync).toLocaleString()}
              </div>
            )}
            
            {syncStatus.nextSync && autoSyncEnabled && (
              <div className="text-sm text-muted-foreground">
                Próxima sync: {new Date(syncStatus.nextSync).toLocaleString()}
              </div>
            )}

            <Separator />

            {/* Controles */}
            <div className="space-y-2">
              <Button
                onClick={toggleAutoSync}
                variant={autoSyncEnabled ? "default" : "outline"}
                className="w-full flex items-center gap-2"
              >
                <Activity className="h-4 w-4" />
                {autoSyncEnabled ? 'Desativar Auto-Sync' : 'Ativar Auto-Sync'}
              </Button>
              
              <Button
                onClick={syncEmails}
                disabled={syncing}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status de Consistência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Consistência das Pastas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {consistencyStatus ? (
              <>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    consistencyStatus.hasInconsistencies ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <span className="text-sm">
                    {consistencyStatus.hasInconsistencies 
                      ? `${consistencyStatus.inconsistencies} inconsistências encontradas` 
                      : 'Todas as pastas estão consistentes'}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {consistencyStatus.totalFolders} pastas verificadas
                </div>
                
                {consistencyStatus.lastCheck && (
                  <div className="text-sm text-muted-foreground">
                    Última verificação: {new Date(consistencyStatus.lastCheck).toLocaleString()}
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Button
                    onClick={checkConsistency}
                    disabled={isCheckingConsistency}
                    variant="outline"
                    className="w-full flex items-center gap-2"
                  >
                    <Search className={`h-4 w-4 ${isCheckingConsistency ? 'animate-spin' : ''}`} />
                    {isCheckingConsistency ? 'Verificando...' : 'Verificar Consistência'}
                  </Button>
                  
                  {consistencyStatus.hasInconsistencies && (
                    <Button
                      onClick={fixConsistency}
                      disabled={isCheckingConsistency}
                      className="w-full flex items-center gap-2"
                    >
                      <Settings className={`h-4 w-4 ${isCheckingConsistency ? 'animate-spin' : ''}`} />
                      Corrigir Inconsistências
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Clique em "Verificar Consistência" para analisar as pastas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ferramentas de Teste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Ferramentas de Teste
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Teste a configuração de email e conectividade SMTP.
            </p>
            
            <Button
              onClick={sendTestEmail}
              disabled={isSendingTest}
              className="w-full flex items-center gap-2"
            >
              <Mail className={`h-4 w-4 ${isSendingTest ? 'animate-pulse' : ''}`} />
              {isSendingTest ? 'Enviando...' : 'Enviar Email de Teste'}
            </Button>
          </CardContent>
        </Card>

        {/* Configurações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Configurações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Gerencie as configurações de email e servidor.
            </p>
            
            <Button
              onClick={() => router.push('/webmail/config')}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Configurar Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
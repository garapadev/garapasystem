'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Clock, Wifi, WifiOff, QrCode } from 'lucide-react';
import { ConnectionStatus } from '@/components/whatsapp/ConnectionStatus';
import { WhatsAppAuth } from '@/components/whatsapp/WhatsAppAuth';

interface SessionData {
  session: string;
  status: 'disconnected' | 'connecting' | 'qr_required' | 'connected' | 'inChat';
  qrCode?: string;
  phoneNumber?: string;
  lastActivity?: Date;
}

export default function WhatsAppChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showAuth, setShowAuth] = useState(false);

  const fetchSessionData = async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch('/api/gazapi/getSessionStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session: session.user.email,
          sessionKey: `key_${session.user.email}`
        }),
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        setSessionData(data.data);
        // Se não estiver conectado, mostrar tela de autenticação
        if (data.data.status === 'disconnected' || data.data.status === 'qr_required') {
          setShowAuth(true);
        }
      } else {
        setError(data.message || 'Erro ao buscar dados da sessão');
        setShowAuth(true);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da sessão:', err);
      setError('Erro de conexão');
      setShowAuth(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSessionData();
    }
  }, [status]);

  // Polling para monitorar status de conexão
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email && !showAuth) {
      console.log('[WhatsAppChat] Iniciando polling de status');
      
      const interval = setInterval(() => {
        console.log('[WhatsAppChat] Verificando status...');
        fetchSessionData();
      }, 3000); // Verificar a cada 3 segundos
      
      return () => {
        console.log('[WhatsAppChat] Parando polling de status');
        clearInterval(interval);
      };
    }
  }, [status, session?.user?.email, showAuth]);

  // Função para conectar WhatsApp
  const handleConnect = async () => {
    if (!session?.user?.email) {
      setError('Email não encontrado na sessão');
      return;
    }

    console.log('[WhatsAppChat] Iniciando conexão para email:', session.user.email);
    setError('');

    // Mostrar tela de autenticação
    setShowAuth(true);
  };

  // Função chamada quando a conexão for bem-sucedida
  const handleConnectionSuccess = () => {
    setShowAuth(false);
    fetchSessionData(); // Atualizar dados da sessão
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  // Mostrar tela de autenticação se necessário
  if (showAuth && session?.user?.email) {
    return (
      <WhatsAppAuth 
        colaboradorId={session.user.email}
        onConnectionSuccess={handleConnectionSuccess}
      />
    );
  }

  // Se estiver conectado, mostrar a interface do chat
  if (sessionData?.status === 'connected' || sessionData?.status === 'inChat') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/whatsapp')}
                >
                  Voltar
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">WhatsApp Chat</h1>
                  <p className="text-gray-600">Gerencie suas conversas do WhatsApp</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Conectado</span>
              </div>
            </div>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Nenhuma conversa ativa</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Contatos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Contatos sincronizados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {sessionData?.status === 'connected' ? 'Conectado' : 
                     sessionData?.status === 'inChat' ? 'Em Chat' :
                     sessionData?.status === 'connecting' ? 'Conectando...' :
                     'Desconectado'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Status da conexão WhatsApp
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Chat Interface Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Interface do Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    WhatsApp Conectado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Sua conta do WhatsApp está conectada e pronta para uso.
                  </p>
                  <p className="text-sm text-gray-500">
                    A interface do chat será implementada em breve.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Se não estiver conectado, mostrar tela de conexão
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <ConnectionStatus
          status={sessionData?.status as any || 'not_connected'}
          message={error || 'Conecte-se ao WhatsApp para começar'}
          onConnect={handleConnect}
          onBack={() => router.push('/whatsapp')}
          isLoading={isLoading}
          error={error}
        />
      </div>


    </div>
  );
}
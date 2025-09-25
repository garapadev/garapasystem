'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Clock, Loader2, RefreshCw, Smartphone, Settings } from 'lucide-react';

import { ContactsList } from '@/components/whatsapp/ContactsList';
import { ChatWindow } from '@/components/whatsapp/ChatWindow';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import { useToast } from '@/hooks/use-toast';

interface SessionData {
  status: 'not_connected' | 'connecting' | 'qr_required' | 'connected' | 'inChat';
  qrCode?: string;
}

interface Contact {
  jid: string;
  pushName: string;
  fullName: string;
  firstName: string;
  businessName: string;
  found: boolean;
  id?: string;
  name?: string;
  phone?: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isGroup?: boolean;
}

export default function WhatsAppChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { configuracoes, loading: configLoading } = useConfiguracoes();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [colaboradorData, setColaboradorData] = useState<{id: string; nome: string} | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [apiConfig, setApiConfig] = useState<{apiUrl: string; adminToken: string} | null>(null);

  // Carregar configurações da API
  useEffect(() => {
    if (configuracoes && configuracoes.length > 0) {
      const apiUrl = configuracoes.find(config => config.chave === 'wuzapi_url')?.valor || '';
      const adminToken = configuracoes.find(config => config.chave === 'wuzapi_admin_token')?.valor || '';
      
      if (apiUrl && adminToken) {
        // Normalizar URL removendo barra final se existir
        const normalizedApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
        setApiConfig({ apiUrl: normalizedApiUrl, adminToken });
      } else {
        setError('Configurações da API WhatsApp não encontradas. Configure em Configurações > API WhatsApp');
      }
    }
  }, [configuracoes]);

  // Carregar dados do colaborador quando autenticado
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchColaboradorData = async () => {
        try {
          const response = await fetch('/api/colaboradores/me');
          if (response.ok) {
            const result = await response.json();
            setColaboradorData(result.data);
            setUserId(result.data.id.toString());
          }
        } catch (error) {
          console.error('Erro ao carregar dados do colaborador:', error);
        }
      };
      
      fetchColaboradorData();
    } else {
      // TEMPORÁRIO: Usar userId fixo para teste quando não autenticado
      const adminUserId = 'cmfbc2udu000ho010hyr18voe';
      setUserId(adminUserId);
      setColaboradorData({
         id: adminUserId,
         nome: 'Administrador do Sistema'
       });
    }
  }, [status]);

  // Criar sessão automaticamente ao carregar a página
  useEffect(() => {
    if (userId && status === 'authenticated' && apiConfig) {
      createSession();
    }
  }, [userId, status, apiConfig]);

  // Polling para verificar status da sessão
  useEffect(() => {
    if (sessionData?.status === 'qr_required' || sessionData?.status === 'connecting') {
      const interval = setInterval(checkSessionStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [sessionData?.status]);

  const createSession = async () => {
    if (!apiConfig || !userId || !colaboradorData) return;

    setIsLoading(true);
    setError('');

    try {
      
      // Primeiro, verificar se o usuário já existe
      const getUsersResponse = await fetch('/api/wuzapi/admin/users', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!getUsersResponse.ok) {
        throw new Error('Falha ao verificar usuários existentes');
      }

      const usersData = await getUsersResponse.json();
      
      // Limpar usuários duplicados ou não conectados com tokens relacionados ao colaborador atual
      const currentUserToken = colaboradorData.id.toString();
      const usersToClean = usersData.data?.filter((user: any) => {
        // Remover usuários não conectados que tenham tokens relacionados ao colaborador atual
        return !user.connected && (
          user.token === currentUserToken || 
          user.token === `token_${currentUserToken}` ||
          user.name === colaboradorData.nome
        );
      });

      // Deletar usuários duplicados/não conectados
      for (const userToDelete of usersToClean || []) {
        try {
          await fetch(`/api/wuzapi/admin/users/${userToDelete.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log(`Usuário duplicado removido: ${userToDelete.id}`);
        } catch (deleteError) {
          console.warn(`Erro ao deletar usuário ${userToDelete.id}:`, deleteError);
        }
      }

      // Verificar se existe um usuário conectado após a limpeza
      const remainingUsers = usersData.data?.filter((user: any) => 
        !usersToClean?.some((deleted: any) => deleted.id === user.id)
      );
      const existingUser = remainingUsers?.find((user: any) => 
        user.name === colaboradorData.nome || user.token === currentUserToken
      );

      if (!existingUser) {
        
        // Criar instância na API wuzapi conforme especificação
        const createInstanceResponse = await fetch('/api/wuzapi/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: colaboradorData.nome,
            token: colaboradorData.id.toString(),
            webhook: `${window.location.origin}/api/webhooks/whatsapp`,
            events: "message,status,qr",
            proxyConfig: {
              enabled: false
            },
            s3Config: {
              enabled: false
            }
          })
        });

        if (!createInstanceResponse.ok) {
          const errorText = await createInstanceResponse.text();
          throw new Error(`Falha ao criar instância na API wuzapi: ${errorText}`);
        }
        
        // Armazenar o token do usuário na tabela do colaborador
        try {
          const updateTokenResponse = await fetch('/api/colaboradores/whatsapp-token', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              whatsappToken: colaboradorData.id.toString(),
              whatsappInstanceName: colaboradorData.nome
            })
          });

          if (!updateTokenResponse.ok) {
            console.warn('Falha ao armazenar token do WhatsApp no colaborador');
          }
        } catch (tokenError) {
          console.warn('Erro ao armazenar token do WhatsApp:', tokenError);
        }
      }

      // Verificar status primeiro
      try {
        const sessionStatus = await checkSessionStatus();
        
        // Se a sessão já está conectada ou conectada mas não logada, não precisa conectar novamente
        if (sessionStatus === 'connected' || sessionStatus === 'connected_but_not_logged') {
          return;
        }
        
        // Se sessionStatus é 'not_connected' ou null, continua para conectar
      } catch (statusError) {
        // Erro real ao verificar status, continua para tentar conectar
        console.warn('Erro ao verificar status da sessão:', statusError);
      }

      // Conectar à sessão apenas se não estiver conectada
      
      const connectResponse = await fetch('/api/wuzapi/session/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': colaboradorData.id.toString(),
        },
        body: JSON.stringify({
          Subscribe: ["Message"],
          Immediate: false
        })
      });

      if (!connectResponse.ok) {
        const errorText = await connectResponse.text();
        
        // Se o erro for "already connected", isso é na verdade um sucesso
        if (errorText.includes('already connected')) {
          await checkSessionStatus();
          return;
        }
        
        throw new Error(`Falha ao conectar à sessão: ${errorText}`);
      }

      const connectData = await connectResponse.json();

      // Verificar status após conexão
      await checkSessionStatus();

    } catch (err) {
      console.error('Erro ao criar sessão:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast({
        title: 'Erro ao conectar',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSessionStatus = async () => {
    if (!apiConfig || !userId) return null;

    try {
      const response = await fetch('/api/wuzapi/session/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': userId.toString()
        }
      });

      if (!response.ok) {
        console.warn(`Erro ao verificar status da sessão: ${response.status}`);
        return 'not_connected';
      }

      const data = await response.json();

      if (data.status === 'connected') {
        setSessionData(data);
        setIsLoading(false);
        return 'connected';
      } else if (data.status === 'connected_but_not_logged') {
        // Sessão conectada mas não logada - mostrar QR code
        setSessionData(data);
        setIsLoading(false);
        await fetchQRCode();
        return 'connected_but_not_logged';
      } else {
        // Não conectada - retorna o status em vez de lançar erro
        return 'not_connected';
      }
    } catch (error) {
      console.warn('Erro ao verificar status da sessão:', error);
      // Em caso de erro de rede ou outro problema, assumir que não está conectada
      return 'not_connected';
    }
  };

  const fetchQRCode = async () => {
    if (!apiConfig || !colaboradorData) return;

    try {
      const response = await fetch('/api/wuzapi/session/qr', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': colaboradorData.id.toString(),
        }
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar QR code');
      }

      const data = await response.json();

      if (data.data && data.data.QRCode) {
        setSessionData({ 
          status: 'qr_required', 
          qrCode: data.data.QRCode 
        });
      }

    } catch (err) {
      console.error('Erro ao buscar QR code:', err);
      setError(err instanceof Error ? err.message : 'Erro ao buscar QR code');
    }
  };

  const handleRefresh = () => {
    setSessionData(null);
    setError('');
    createSession();
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

  // Mostrar QR Code se necessário
  if (sessionData?.status === 'qr_required' && sessionData.qrCode) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="text-center">
            <div className="mb-8">
              <h1 className="text-3xl font-light text-gray-800 mb-2">
                Use o WhatsApp no seu computador
              </h1>
              <p className="text-gray-600">
                Escaneie o código com o seu telefone para conectar
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <Card className="p-8 bg-white shadow-sm border">
                <CardContent className="p-0">
                  <img 
                    src={sessionData.qrCode}
                    alt="QR Code do WhatsApp"
                    className="w-64 h-64 object-contain"
                    style={{
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="max-w-md mx-auto">
              <div className="flex items-start space-x-4 text-left mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-medium text-gray-600">1</span>
                </div>
                <div>
                  <p className="text-gray-800 font-medium">Abra o WhatsApp no seu telefone</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 text-left mb-6">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-medium text-gray-600">2</span>
                </div>
                <div>
                  <p className="text-gray-800 font-medium">
                    Toque em <strong>Menu</strong> ou <strong>Configurações</strong> e selecione <strong>Dispositivos conectados</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 text-left mb-8">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-medium text-gray-600">3</span>
                </div>
                <div>
                  <p className="text-gray-800 font-medium">
                    Toque em <strong>Conectar um dispositivo</strong> e escaneie este código QR
                  </p>
                </div>
              </div>

              <Button 
                onClick={handleRefresh} 
                variant="outline" 
                disabled={isLoading}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isLoading ? 'Atualizando...' : 'Atualizar código QR'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar tela de carregamento/conectando
  if (isLoading || sessionData?.status === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            {isLoading ? 'Inicializando...' : 'Conectando...'}
          </h2>
          <p className="text-gray-600">
            {isLoading ? 'Preparando sua sessão do WhatsApp' : 'Aguarde enquanto estabelecemos a conexão'}
          </p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver
  if (error) {
    const isConfigError = error.includes('Configurações da API WhatsApp não encontradas');
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {isConfigError ? (
              <Settings className="w-10 h-10 text-red-600" />
            ) : (
              <MessageSquare className="w-10 h-10 text-red-600" />
            )}
          </div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            {isConfigError ? 'Configuração necessária' : 'Erro na conexão'}
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            {isConfigError ? (
              <Button 
                onClick={() => router.push('/configuracoes/whatsapp-api')} 
                className="px-8"
              >
                <Settings className="w-4 h-4 mr-2" />
                Ir para Configurações
              </Button>
            ) : (
              <Button onClick={handleRefresh} variant="outline" className="px-8">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            )}
            {!isConfigError && (
              <Button 
                onClick={() => router.push('/configuracoes/whatsapp-api')} 
                variant="ghost" 
                className="px-8"
              >
                <Settings className="w-4 h-4 mr-2" />
                Verificar Configurações
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Interface principal do chat (quando conectado)
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

            {/* Chat Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
              {/* Sidebar com Lista de Contatos */}
              <div className="lg:col-span-1">
                <ContactsList
                  userId={userId}
                  onContactSelect={setSelectedContact}
                  selectedContact={selectedContact}
                />
              </div>

              {/* Área Principal do Chat */}
              <div className="lg:col-span-2">
                <ChatWindow
                  userId={userId}
                  selectedContact={selectedContact}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado padrão - não conectado
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="w-10 h-10 text-gray-600" />
        </div>
        <h2 className="text-2xl font-light text-gray-800 mb-2">
          WhatsApp não conectado
        </h2>
        <p className="text-gray-600 mb-6">
          Clique no botão abaixo para conectar sua conta do WhatsApp
        </p>
        <Button onClick={createSession} disabled={isLoading}>
          <Smartphone className="w-4 h-4 mr-2" />
          Conectar WhatsApp
        </Button>
      </div>
    </div>
  );
}
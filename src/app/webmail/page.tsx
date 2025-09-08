'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Mail, 
  Search, 
  Inbox, 
  Send, 
  Archive, 
  Trash2, 
  Star, 
  Reply, 
  ReplyAll, 
  Forward,
  Settings,
  RefreshCw,
  Plus,
  MailOpen,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Edit,
  TestTube
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailFolder {
  id: string;
  name: string;
  path: string;
  unreadCount: number;
  totalCount: number;
  specialUse?: string;
}

interface Email {
  id: string;
  messageId: string;
  subject: string;
  from: Array<{ name?: string; address: string }>;
  to: Array<{ name?: string; address: string }>;
  date: string;
  isRead: boolean;
  isFlagged: boolean;
  hasAttachments: boolean;
  preview: string;
  size: number;
}

interface EmailConfig {
  id: string;
  email: string;
  displayName?: string;
  ativo: boolean;
  lastSync?: string;
}

export default function WebmailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{
    isActive: boolean;
    isRunning: boolean;
    lastSync?: string;
  }>({ isActive: false, isRunning: false });
  const [consistencyStatus, setConsistencyStatus] = useState<{
    hasInconsistencies: boolean;
    totalFolders: number;
    inconsistencies: number;
    lastCheck?: string;
  } | null>(null);
  const [isCheckingConsistency, setIsCheckingConsistency] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    if (session?.user) {
      loadEmailConfig();
    }
  }, [session]);

  useEffect(() => {
    if (emailConfig) {
      loadFolders();
    }
  }, [emailConfig]);

  useEffect(() => {
    if (selectedFolder) {
      setCurrentPage(1);
      loadEmails();
    }
  }, [selectedFolder, searchTerm]);

  useEffect(() => {
    if (selectedFolder) {
      loadEmails();
    }
  }, [currentPage]);

  // Verificar status da sincronização automática
  useEffect(() => {
    if (!emailConfig) return;
    
    checkAutoSyncStatus();
    checkConsistency();
    
    // Verificar status a cada 30 segundos
    const statusInterval = setInterval(() => {
      checkAutoSyncStatus();
    }, 30 * 1000);
    
    // Verificar consistência a cada 10 minutos
    const consistencyInterval = setInterval(() => {
      checkConsistency();
    }, 10 * 60 * 1000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(consistencyInterval);
    };
  }, [emailConfig]);

  // Auto-sync manual (fallback)
  useEffect(() => {
    if (!emailConfig || autoSyncEnabled) return;
    
    const interval = setInterval(() => {
      syncEmails();
    }, 3 * 60 * 1000); // 3 minutos
    
    return () => clearInterval(interval);
  }, [emailConfig, autoSyncEnabled]);

  const loadEmailConfig = async () => {
    try {
      const response = await fetch('/api/email-config');
      if (response.ok) {
        const config = await response.json();
        setEmailConfig(config);
      } else if (response.status === 404) {
        setShowConfig(true);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configuração de email');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await fetch('/api/email-folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
        
        // Selecionar INBOX por padrão se não há pasta selecionada
        if (!selectedFolder && data.folders?.length > 0) {
          const inbox = data.folders.find((f: EmailFolder) => 
            f.specialUse === '\\Inbox' || f.name.toLowerCase() === 'inbox'
          );
          if (inbox) {
            setSelectedFolder(inbox.id);
          } else {
            setSelectedFolder(data.folders[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pastas:', error);
    }
  };

  const loadEmails = async () => {
    if (!selectedFolder) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        folderId: selectedFolder,
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/emails?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAutoSyncStatus = async () => {
    try {
      const response = await fetch('/api/email-sync/auto');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus({
          isActive: data.isActive,
          isRunning: data.isRunning,
          lastSync: data.lastSync
        });
        setAutoSyncEnabled(data.isActive);
      }
    } catch (error) {
      console.error('Erro ao verificar status da sincronização:', error);
    }
  };

  const checkConsistency = async () => {
    setIsCheckingConsistency(true);
    try {
      const response = await fetch('/api/email-sync/consistency');
      if (response.ok) {
        const data = await response.json();
        setConsistencyStatus({
          hasInconsistencies: data.report.hasInconsistencies,
          totalFolders: data.report.totalFolders,
          inconsistencies: data.report.inconsistencies.length,
          lastCheck: data.timestamp
        });
      }
    } catch (error) {
      console.error('Erro ao verificar consistência:', error);
    } finally {
      setIsCheckingConsistency(false);
    }
  };

  const fixConsistency = async () => {
    setIsCheckingConsistency(true);
    try {
      const response = await fetch('/api/email-sync/consistency', {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        setConsistencyStatus({
          hasInconsistencies: false,
          totalFolders: data.report.totalFolders,
          inconsistencies: 0,
          lastCheck: data.timestamp
        });
        // Recarregar emails após correção
        await loadEmails();
      }
    } catch (error) {
      console.error('Erro ao corrigir inconsistências:', error);
    } finally {
      setIsCheckingConsistency(false);
    }
  };

  const sendTestEmail = async () => {
    if (!emailConfig) return;
    
    setIsSendingTest(true);
    try {
      const response = await fetch('/api/emails/test-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: 'ronaldodavi@gmail.com',
          subject: 'Teste de Envio - GarapaSystem Webmail',
          message: 'Este é um e-mail de teste para verificar a funcionalidade completa do sistema de envio.'
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success(`E-mail de teste enviado com sucesso para ronaldodavi@gmail.com!`);
        console.log('Detalhes do envio:', result.details);
      } else {
        toast.error(`Erro ao enviar e-mail de teste: ${result.error || 'Erro desconhecido'}`);
        console.error('Erro no envio:', result);
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail de teste:', error);
      toast.error('Erro ao enviar e-mail de teste');
    } finally {
      setIsSendingTest(false);
    }
  };

  const toggleAutoSync = async () => {
    try {
      const response = await fetch('/api/email-sync/auto', {
        method: autoSyncEnabled ? 'DELETE' : 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAutoSyncEnabled(!autoSyncEnabled);
        toast.success(data.message);
        checkAutoSyncStatus();
      } else {
        toast.error('Erro ao alterar sincronização automática');
      }
    } catch (error) {
      console.error('Erro na sincronização automática:', error);
      toast.error('Erro ao alterar sincronização automática');
    }
  };

  const syncEmails = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/email-sync', {
        method: 'POST'
      });
      
      if (response.ok) {
        toast.success('Sincronização iniciada');
        // Recarregar emails após alguns segundos
        setTimeout(() => {
          loadEmails();
          loadFolders();
          checkAutoSyncStatus();
        }, 3000);
      } else {
        toast.error('Erro ao sincronizar emails');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro ao sincronizar emails');
    } finally {
      setSyncing(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/mark-read`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setEmails(emails.map(email => 
          email.id === emailId ? { ...email, isRead: true } : email
        ));
        
        // Atualizar contadores das pastas
        setFolders(folders.map(folder => {
          if (folder.id === selectedFolder) {
            return {
              ...folder,
              unreadCount: Math.max(0, folder.unreadCount - 1)
            };
          }
          return folder;
        }));
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markAsRead(email.id);
    }
  };

  const handleReply = () => {
    if (selectedEmail) {
      router.push(`/webmail/compose?mode=reply&emailId=${selectedEmail.id}`);
    }
  };

  const handleForward = () => {
    if (selectedEmail) {
      router.push(`/webmail/compose?mode=forward&emailId=${selectedEmail.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // A busca é feita na API, não precisamos filtrar localmente

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando webmail...</p>
        </div>
      </div>
    );
  }

  if (showConfig || !emailConfig) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração de Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Você precisa configurar sua conta de email antes de usar o webmail.
            </p>
            <Button 
              onClick={() => window.location.href = '/webmail/config'}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Configurar Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Pastas */}
      <div className="w-64 border-r bg-muted/10">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5" />
            <span className="font-semibold">Webmail</span>
          </div>
          
          <div className="space-y-2 mb-4">
            <Button 
              onClick={() => router.push('/webmail/compose')}
              className="w-full"
            >
              <Edit className="h-4 w-4 mr-2" />
              Novo Email
            </Button>
            
            <div className="space-y-2">
              {/* Status da Sincronização */}
              <div className="text-xs text-muted-foreground px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    syncStatus.isRunning ? 'bg-green-500 animate-pulse' : 
                    autoSyncEnabled ? 'bg-blue-500' : 'bg-gray-400'
                  }`} />
                  <span>
                    {syncStatus.isRunning ? 'Sincronizando...' : 
                     autoSyncEnabled ? 'Auto-sync ativo' : 'Auto-sync inativo'}
                  </span>
                </div>
                {syncStatus.lastSync && (
                  <div className="mt-1 text-xs">
                    Última sync: {new Date(syncStatus.lastSync).toLocaleTimeString()}
                  </div>
                )}
              </div>
              
              {/* Status de Consistência */}
              {consistencyStatus && (
                <div className="text-xs text-muted-foreground px-2 mt-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      consistencyStatus.hasInconsistencies ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span>
                      {consistencyStatus.hasInconsistencies 
                        ? `${consistencyStatus.inconsistencies} inconsistências` 
                        : 'Pastas consistentes'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs">
                    {consistencyStatus.totalFolders} pastas verificadas
                  </div>
                </div>
              )}
              
              {/* Controles de Sincronização */}
              <div className="flex gap-2">
                <Button
                  onClick={toggleAutoSync}
                  size="sm"
                  variant={autoSyncEnabled ? "default" : "outline"}
                  className="flex items-center gap-2 flex-1"
                >
                  <RefreshCw className={`h-4 w-4 ${syncStatus.isRunning ? 'animate-spin' : ''}`} />
                  {autoSyncEnabled ? 'Auto ON' : 'Auto OFF'}
                </Button>
                
                <Button
                  onClick={syncEmails}
                  disabled={syncing}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  Sync
                </Button>
              </div>
              
              {/* Controles de Consistência */}
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={checkConsistency}
                  disabled={isCheckingConsistency}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 flex-1"
                >
                  <Search className={`h-4 w-4 ${isCheckingConsistency ? 'animate-spin' : ''}`} />
                  Verificar
                </Button>
                
                {consistencyStatus?.hasInconsistencies && (
                  <Button
                    onClick={fixConsistency}
                    disabled={isCheckingConsistency}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings className={`h-4 w-4 ${isCheckingConsistency ? 'animate-spin' : ''}`} />
                    Corrigir
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => setShowConfig(true)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                
                <Button
                  onClick={sendTestEmail}
                  disabled={isSendingTest}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                >
                  <TestTube className={`h-4 w-4 ${isSendingTest ? 'animate-pulse' : ''}`} />
                  {isSendingTest ? 'Enviando...' : 'Teste Email'}
                </Button>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            {emailConfig.email}
          </div>
          
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1">
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-auto p-2"
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <div className="flex items-center gap-2 w-full">
                    {folder.specialUse === '\\Inbox' || folder.path === 'INBOX' ? (
                      <Inbox className="h-4 w-4" />
                    ) : folder.specialUse === '\\Sent' ? (
                      <Send className="h-4 w-4" />
                    ) : folder.specialUse === '\\Trash' ? (
                      <Trash2 className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                    <span className="flex-1 text-left text-sm">{folder.name}</span>
                    {folder.unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {folder.unreadCount}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Lista de Emails */}
      <div className="w-96 border-r">
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-1 p-2">
            {emails.map((email) => (
              <Card 
                key={email.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedEmail?.id === email.id ? 'bg-muted' : ''
                } ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                onClick={() => handleEmailClick(email)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {email.from[0]?.name?.charAt(0) || email.from[0]?.address.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm truncate ${
                          !email.isRead ? 'font-semibold' : 'font-normal'
                        }`}>
                          {email.from[0]?.name || email.from[0]?.address}
                        </span>
                        <div className="flex items-center gap-1">
                          {email.hasAttachments && <Paperclip className="h-3 w-3 text-gray-400" />}
                          {email.isFlagged && <Star className="h-3 w-3 text-yellow-500" />}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(email.date)}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`text-sm truncate mb-1 ${
                        !email.isRead ? 'font-medium' : 'font-normal'
                      }`}>
                        {email.subject || '(sem assunto)'}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground truncate">
                          {email.preview || 'Sem prévia disponível'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatSize(email.size)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {emails.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'Nenhum email encontrado' : 'Nenhum email nesta pasta'}
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* Paginação */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Visualização do Email */}
      <div className="flex-1">
        {selectedEmail ? (
          <div className="h-full flex flex-col">
            {/* Header do Email */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold">
                  {selectedEmail.subject || '(sem assunto)'}
                </h1>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleReply}>
                    <Reply className="h-4 w-4 mr-1" />
                    Responder
                  </Button>
                  <Button size="sm" variant="outline">
                    <ReplyAll className="h-4 w-4 mr-1" />
                    Resp. Todos
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleForward}>
                    <Forward className="h-4 w-4 mr-1" />
                    Encaminhar
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {(selectedEmail.from[0]?.name || selectedEmail.from[0]?.address)?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {selectedEmail.from[0]?.name || selectedEmail.from[0]?.address || 'Remetente desconhecido'}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <span>Para: </span>
                  {selectedEmail.to.map(t => t.name || t.address).join(', ') || 'Destinatário desconhecido'}
                </div>
                
                <div className="text-sm text-muted-foreground">
                  {new Date(selectedEmail.date).toLocaleString('pt-BR')}
                  {selectedEmail.hasAttachments && (
                    <span className="ml-4 flex items-center">
                      <Paperclip className="h-3 w-3 mr-1" />
                      Anexos
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Conteúdo do Email */}
            <ScrollArea className="flex-1 p-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedEmail.preview || 'Conteúdo não disponível'}
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  <p>Para visualizar o conteúdo completo do email, implemente a API de detalhes do email.</p>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione um email para visualizar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
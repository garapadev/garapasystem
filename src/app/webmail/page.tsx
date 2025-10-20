'use client';

import React from 'react';
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
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { EmailToTaskDialog } from '@/components/tasks/EmailToTaskDialog';


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
  body?: string;
  bodyType?: 'html' | 'text';
}

interface EmailConfig {
  id: string;
  email: string;
  displayName?: string;
  ativo: boolean;
  lastSync?: string;
}

export default function WebmailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
  const [folders, setFolders] = useState<EmailFolder[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loadingEmailContent, setLoadingEmailContent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [testEmailTo, setTestEmailTo] = useState('');
  
  // Estados de loading para botões de ação
  const [loadingActions, setLoadingActions] = useState<{
    [emailId: string]: {
      flag?: boolean;
      read?: boolean;
      delete?: boolean;
    }
  }>({});

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadEmailConfig();
    } else if (status === 'unauthenticated') {
       router.push('/auth/login');
    }
  }, [session, status, router]);

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
      // Encontrar a pasta selecionada para obter o path
      const folder = folders.find(f => f.id === selectedFolder);
      if (!folder) {
        console.error('Pasta não encontrada');
        return;
      }
      
      const params = new URLSearchParams({
        folder: folder.path, // Usar o path da pasta em vez do ID
        limit: '20',
        offset: ((currentPage - 1) * 20).toString()
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/emails?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
        // Calcular total de páginas baseado na paginação retornada
        const totalPages = Math.ceil((data.pagination?.total || 0) / 20);
        setTotalPages(totalPages);
      }
    } catch (error) {
      console.error('Erro ao carregar emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (emailId: string, options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    
    // Prevenir cliques duplicados
    if (loadingActions[emailId]?.read) return;
    
    // Definir loading state
    setLoadingActions(prev => ({
      ...prev,
      [emailId]: { ...prev[emailId], read: true }
    }));
    
    try {
      const response = await fetch(`/api/emails/${emailId}/read`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setEmails(emails.map(email => 
          email.id === emailId ? { ...email, isRead: true } : email
        ));
        
        // Atualizar contador da pasta
        setFolders(folders.map(folder => 
          folder.id === selectedFolder 
            ? { ...folder, unreadCount: Math.max(0, folder.unreadCount - 1) }
            : folder
        ));

        // Atualizar estado do email selecionado, se aplicável
        setSelectedEmail(prev => prev && prev.id === emailId ? { ...prev, isRead: true } : prev);

        if (!silent) {
          try {
            const data = await response.json();
            if (data?.message) {
              toast.success(data.message);
            } else {
              toast.success('Email marcado como lido');
            }
          } catch {
            if (!silent) toast.success('Email marcado como lido');
          }
        }
      } else {
        const err = await response.json().catch(() => ({}));
        if (!silent) toast.error((err as any)?.error || 'Erro ao marcar como lido');
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
      if (!silent) toast.error('Erro ao marcar como lido');
    } finally {
      // Limpar loading state
      setLoadingActions(prev => ({
        ...prev,
        [emailId]: { ...prev[emailId], read: false }
      }));
    }
  };

  const markAsUnread = async (emailId: string) => {
    // Prevenir cliques duplicados
    if (loadingActions[emailId]?.read) return;
    
    // Definir loading state
    setLoadingActions(prev => ({
      ...prev,
      [emailId]: { ...prev[emailId], read: true }
    }));
    
    try {
      const response = await fetch(`/api/emails/${emailId}/unread`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        setEmails(emails.map(email => 
          email.id === emailId ? { ...email, isRead: false } : email
        ));
        
        // Atualizar contador da pasta
        setFolders(folders.map(folder => 
          folder.id === selectedFolder 
            ? { ...folder, unreadCount: folder.unreadCount + 1 }
            : folder
        ));

        // Atualizar estado do email selecionado, se aplicável
        setSelectedEmail(prev => prev && prev.id === emailId ? { ...prev, isRead: false } : prev);

        try {
          const data = await response.json();
          if (data?.message) {
            toast.success(data.message);
          } else {
            toast.success('Email marcado como não lido');
          }
        } catch {
          toast.success('Email marcado como não lido');
        }
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error((err as any)?.error || 'Erro ao marcar como não lido');
      }
    } catch (error) {
      console.error('Erro ao marcar como não lido:', error);
      toast.error('Erro ao marcar como não lido');
    } finally {
      // Limpar loading state
      setLoadingActions(prev => ({
        ...prev,
        [emailId]: { ...prev[emailId], read: false }
      }));
    }
  };

  const toggleFlag = async (emailId: string) => {
    // Prevenir cliques duplicados
    if (loadingActions[emailId]?.flag) return;
    
    // Definir loading state
    setLoadingActions(prev => ({
      ...prev,
      [emailId]: { ...prev[emailId], flag: true }
    }));
    
    try {
      const email = emails.find(e => e.id === emailId);
      if (!email) return;
      
      const newFlagged = !email.isFlagged;
      const response = await fetch(`/api/emails/${emailId}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged: newFlagged })
      });
      
      if (response.ok) {
        setEmails(emails.map(e => 
          e.id === emailId ? { ...e, isFlagged: newFlagged } : e
        ));
  
        // Atualizar estado do email selecionado, se aplicável
        setSelectedEmail(prev => prev && prev.id === emailId ? { ...prev, isFlagged: newFlagged } : prev);
  
        toast.success(newFlagged ? 'Favorito adicionado' : 'Favorito removido');
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error((err as any)?.error || 'Erro ao atualizar favorito');
      }
    } catch (error) {
      console.error('Erro ao alterar flag:', error);
      toast.error('Erro ao atualizar favorito');
    } finally {
      // Limpar loading state
      setLoadingActions(prev => ({
        ...prev,
        [emailId]: { ...prev[emailId], flag: false }
      }));
    }
  };

  const moveToFolder = async (emailId: string, targetFolderId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: targetFolderId })
      });
      
      if (response.ok) {
        // Remover email da lista atual
        setEmails(emails.filter(e => e.id !== emailId));
        
        // Atualizar contadores das pastas
        const email = emails.find(e => e.id === emailId);
        if (email) {
          setFolders(folders.map(folder => {
            if (folder.id === selectedFolder) {
              return {
                ...folder,
                totalCount: folder.totalCount - 1,
                unreadCount: email.isRead ? folder.unreadCount : Math.max(0, folder.unreadCount - 1)
              };
            }
            if (folder.id === targetFolderId) {
              return {
                ...folder,
                totalCount: folder.totalCount + 1,
                unreadCount: email.isRead ? folder.unreadCount : folder.unreadCount + 1
              };
            }
            return folder;
          }));
        }
        
        toast.success('Email movido com sucesso');
      }
    } catch (error) {
      console.error('Erro ao mover email:', error);
      toast.error('Erro ao mover email');
    }
  };

  const deleteEmail = async (emailId: string) => {
    // Prevenir cliques duplicados
    if (loadingActions[emailId]?.delete) return;
    
    // Confirmação antes de mover para Lixeira
    const confirmed = window.confirm('Deseja mover este email para a Lixeira?');
    if (!confirmed) return;
    
    // Definir loading state
    setLoadingActions(prev => ({
      ...prev,
      [emailId]: { ...prev[emailId], delete: true }
    }));
    
    try {
      // Encontrar a pasta Lixeira
      const trashFolder = folders.find(folder => 
        folder.specialUse === '\\Trash' || 
        folder.name.toLowerCase().includes('trash') ||
        folder.name.toLowerCase().includes('lixeira') ||
        folder.path.toLowerCase().includes('trash')
      );
      
      if (!trashFolder) {
        toast.error('Pasta Lixeira não encontrada');
        return;
      }
      
      // Mover email para a lixeira em vez de deletar permanentemente
      await moveToFolder(emailId, trashFolder.id);
      
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
      
      toast.success('Email movido para a lixeira');
    } catch (error) {
      console.error('Erro ao mover email para lixeira:', error);
      toast.error('Erro ao mover email para lixeira');
    } finally {
      // Limpar loading state
      setLoadingActions(prev => ({
        ...prev,
        [emailId]: { ...prev[emailId], delete: false }
      }));
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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getEmailSender = (email: Email) => {
    if (email.from && email.from.length > 0) {
      return email.from[0].name || email.from[0].address;
    }
    return 'Remetente desconhecido';
  };

  const getFolderIcon = (folder: EmailFolder) => {
    switch (folder.specialUse) {
      case '\\Inbox':
        return <Inbox className="h-4 w-4" />;
      case '\\Sent':
        return <Send className="h-4 w-4" />;
      case '\\Archive':
        return <Archive className="h-4 w-4" />;
      case '\\Trash':
        return <Trash2 className="h-4 w-4" />;
      case '\\Junk':
        return <Mail className="h-4 w-4" />;
      case '\\Drafts':
        return <Edit className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getFolderDisplayName = (folder: EmailFolder) => {
    // Traduzir nomes das pastas para português brasileiro na UI
    // mantendo os identificadores originais no sistema
    switch (folder.specialUse) {
      case '\\Inbox':
        return 'Caixa de Entrada';
      case '\\Sent':
        return 'Enviados';
      case '\\Archive':
        return 'Arquivo';
      case '\\Trash':
        return 'Lixeira';
      case '\\Junk':
        return 'Spam';
      case '\\Drafts':
        return 'Rascunhos';
      default:
        // Para pastas personalizadas, verificar nomes comuns em inglês
        const lowerName = folder.name.toLowerCase();
        switch (lowerName) {
          case 'inbox':
            return 'Caixa de Entrada';
          case 'sent':
          case 'sent items':
          case 'sent mail':
            return 'Enviados';
          case 'drafts':
            return 'Rascunhos';
          case 'trash':
          case 'deleted':
          case 'deleted items':
            return 'Lixeira';
          case 'archive':
          case 'archived':
            return 'Arquivo';
          case 'spam':
          case 'junk':
          case 'junk mail':
            return 'Spam';
          case 'outbox':
            return 'Caixa de Saída';
          default:
            return folder.name; // Manter nome original para pastas personalizadas
        }
    }
  }











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
      <div className="container mx-auto p-0 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Configure sua conta de email para começar a usar o webmail.
            </p>
            <Button onClick={() => router.push('/webmail/admin')}>
              Configurar Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (<div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-0 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Webmail
            </h1>
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => router.push('/webmail/admin')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                title="Administração do Webmail"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={() => router.push('/webmail/compose')}
            className="w-full flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Escrever
          </Button>
        </div>

        {/* Folders */}
        <ScrollArea className="flex-1">
          <div className="p-0">
            <div className="space-y-0">
              {/* Filtrar e exibir apenas as pastas essenciais */}
              {folders
                .filter(folder => {
                  // Filtrar apenas pastas essenciais
                  const essentialFolders = ['\\Inbox', '\\Sent', '\\Drafts', '\\Trash', '\\Junk'];
                  if (folder.specialUse && essentialFolders.includes(folder.specialUse)) {
                    return true;
                  }
                  // Verificar por nomes comuns para pastas sem specialUse
                  const lowerName = folder.name.toLowerCase();
                  return (
                    lowerName === 'inbox' ||
                    lowerName === 'sent' ||
                    lowerName === 'sent items' ||
                    lowerName === 'sent mail' ||
                    lowerName === 'drafts' ||
                    lowerName === 'trash' ||
                    lowerName === 'deleted' ||
                    lowerName === 'deleted items' ||
                    lowerName === 'spam' ||
                    lowerName === 'junk' ||
                    lowerName === 'junk mail'
                  );
                })
                .sort((a, b) => {
                  // Ordem específica: Inbox, Sent, Drafts, Trash, Spam
                  const getOrder = (folder) => {
                    if (folder.specialUse === '\\Inbox' || folder.name.toLowerCase() === 'inbox') return 1;
                    if (folder.specialUse === '\\Sent' || ['sent', 'sent items', 'sent mail'].includes(folder.name.toLowerCase())) return 2;
                    if (folder.specialUse === '\\Drafts' || folder.name.toLowerCase() === 'drafts') return 3;
                    if (folder.specialUse === '\\Trash' || ['trash', 'deleted', 'deleted items'].includes(folder.name.toLowerCase())) return 4;
                    if (folder.specialUse === '\\Junk' || ['spam', 'junk', 'junk mail'].includes(folder.name.toLowerCase())) return 5;
                    return 6;
                  };
                  return getOrder(a) - getOrder(b);
                })
                .map((folder) => (
                  <Button
                    key={folder.id}
                    onClick={() => setSelectedFolder(folder.id)}
                    variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                    className="w-full justify-start h-auto p-1"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {getFolderIcon(folder)}
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{getFolderDisplayName(folder)}</div>
                        {(folder.unreadCount > 0 || folder.totalCount > 0) && (
                          <div className="text-xs text-muted-foreground">
                            {folder.unreadCount > 0 && (
                              <span className="font-semibold">{folder.unreadCount} não lidas</span>
                            )}
                            {folder.unreadCount > 0 && folder.totalCount > 0 && ' • '}
                            {folder.totalCount > 0 && (
                              <span>{folder.totalCount} total</span>
                            )}
                          </div>
                        )}
                      </div>
                      {folder.unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5">
                          {folder.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Button>
                ))
              }
            </div>
            

          </div>
        </ScrollArea>

        {/* User Info */}
        <div className="p-0 border-t border-gray-200">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {emailConfig?.displayName?.[0] || emailConfig?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">
                {emailConfig?.displayName || emailConfig?.email || 'Usuário'}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {emailConfig?.email || ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Search Bar */}
        <div className="p-0 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
            <Input
              placeholder="Pesquisar emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>


        <div className="flex flex-1">
          {/* Email List */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            <ScrollArea className="flex-1 p-0">
              {loading ? (
                <div className="p-4 text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Carregando emails...</p>
                </div>
              ) : emails.length === 0 ? (
                <div className="p-4 text-center">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum email encontrado' : 'Nenhum email nesta pasta'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      onClick={async () => {
                        setSelectedEmail(email);
                        if (!email.isRead) {
                          markAsRead(email.id, { silent: true });
                        }
                        
                        // Carregar conteúdo completo do email
                        setLoadingEmailContent(true);
                        try {
                          const response = await fetch(`/api/emails/${email.id}`);
                          if (response.ok) {
                            const fullEmail = await response.json();
                            setSelectedEmail({
                              ...email,
                              body: fullEmail.body,
                              bodyType: fullEmail.bodyType
                            });
                          }
                        } catch (error) {
                          console.error('Erro ao carregar conteúdo do email:', error);
                        } finally {
                          setLoadingEmailContent(false);
                        }
                      }}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedEmail?.id === email.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      } ${!email.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="space-y-1">
                        {/* Remetente e indicadores */}
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate ${
                            !email.isRead ? 'font-bold' : 'font-medium'
                          }`}>
                            {getEmailSender(email)}
                          </span>
                          <div className="flex items-center gap-1 ml-2">
                            {email.hasAttachments && (
                              <Paperclip className="h-3 w-3 text-gray-400" />
                            )}
                            {email.isFlagged && (
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            )}
                            {!email.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                        
                        {/* Assunto */}
                        <div className={`text-sm truncate ${
                          !email.isRead ? 'font-bold text-gray-900' : 'text-gray-700'
                        }`}>
                          {email.subject || '(sem assunto)'}
                        </div>
                        
                        {/* Data */}
                        <div className="text-xs text-muted-foreground">
                          {formatDate(email.date)}
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-2 border-t border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                    >
                      <ChevronLeft className="h-3 w-3" />
                      <span className="text-xs">Anterior</span>
                    </Button>
                    
                    <span className="text-xs text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                    
                    <Button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                    >
                      <span className="text-xs">Próxima</span>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Email Content */}
            <div className="flex-1 bg-white">
              {selectedEmail ? (
                <div className="h-full flex flex-col">
                  {/* Email Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold mb-2">
                          {selectedEmail.subject || '(sem assunto)'}
                        </h2>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div>
                            <strong>De:</strong> {getEmailSender(selectedEmail)}
                          </div>
                          <div>
                            <strong>Para:</strong> {selectedEmail.to.map(t => t.name || t.address).join(', ')}
                          </div>
                          <div>
                            <strong>Data:</strong> {new Date(selectedEmail.date).toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Email Actions */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          onClick={() => toggleFlag(selectedEmail.id)}
                          variant="ghost"
                          size="sm"
                          className={`p-1.5 ${selectedEmail.isFlagged ? 'text-yellow-500' : 'text-gray-500'}`}
                          title="Favoritar"
                          disabled={loadingActions[selectedEmail.id]?.flag}
                        >
                          {loadingActions[selectedEmail.id]?.flag ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Star className={`h-4 w-4 ${selectedEmail.isFlagged ? 'fill-current' : ''}`} />
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => selectedEmail.isRead ? markAsUnread(selectedEmail.id) : markAsRead(selectedEmail.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 text-gray-500"
                          title={selectedEmail.isRead ? "Marcar como não lido" : "Marcar como lido"}
                          disabled={loadingActions[selectedEmail.id]?.read}
                        >
                          {loadingActions[selectedEmail.id]?.read ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <MailOpen className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => router.push(`/webmail/compose?reply=${selectedEmail.id}`)}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 text-gray-500"
                          title="Responder"
                        >
                          <Reply className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => router.push(`/webmail/compose?replyAll=${selectedEmail.id}`)}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 text-gray-500"
                          title="Responder a todos"
                        >
                          <ReplyAll className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          onClick={() => router.push(`/webmail/compose?forward=${selectedEmail.id}`)}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 text-gray-500"
                          title="Encaminhar"
                        >
                          <Forward className="h-4 w-4" />
                        </Button>
                        
                        <EmailToTaskDialog
                          emailId={selectedEmail.id}
                          emailSubject={selectedEmail.subject}
                          onTaskCreated={(task) => {
                            toast.success('Tarefa criada com sucesso!');
                          }}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5 text-gray-500"
                            title="Transformar em Tarefa"
                          >
                            <CheckSquare className="h-4 w-4" />
                          </Button>
                        </EmailToTaskDialog>
                        
                        <Button
                          onClick={() => deleteEmail(selectedEmail.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1.5 text-red-600 hover:text-red-700"
                          title="Mover para Lixeira"
                          disabled={loadingActions[selectedEmail.id]?.delete}
                        >
                          {loadingActions[selectedEmail.id]?.delete ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Email Body */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingEmailContent ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                        <span className="ml-3 text-muted-foreground">Carregando conteúdo...</span>
                      </div>
                    ) : (
                      <div className="prose max-w-none text-sm">
                        {selectedEmail.body ? (
                          selectedEmail.bodyType === 'html' ? (
                            <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
                          ) : (
                            <pre className="whitespace-pre-wrap font-sans">{selectedEmail.body}</pre>
                          )
                        ) : (
                          <div className="text-center text-muted-foreground italic py-8">Conteúdo do email não disponível</div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <Mail className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg text-muted-foreground">Selecione um email para visualizar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
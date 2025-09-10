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
  Edit
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
  const [showConfig, setShowConfig] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  const markAsRead = async (emailId: string) => {
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
      }
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const markAsUnread = async (emailId: string) => {
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
      }
    } catch (error) {
      console.error('Erro ao marcar como não lido:', error);
    }
  };

  const toggleFlag = async (emailId: string) => {
    try {
      const email = emails.find(e => e.id === emailId);
      if (!email) return;
      
      const response = await fetch(`/api/emails/${emailId}/flag`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flagged: !email.isFlagged })
      });
      
      if (response.ok) {
        setEmails(emails.map(e => 
          e.id === emailId ? { ...e, isFlagged: !e.isFlagged } : e
        ));
      }
    } catch (error) {
      console.error('Erro ao alterar flag:', error);
    }
  };

  const moveToFolder = async (emailId: string, targetFolderId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/move`, {
        method: 'PATCH',
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
    try {
      const response = await fetch(`/api/emails/${emailId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const email = emails.find(e => e.id === emailId);
        setEmails(emails.filter(e => e.id !== emailId));
        
        // Atualizar contador da pasta
        if (email) {
          setFolders(folders.map(folder => 
            folder.id === selectedFolder 
              ? { 
                  ...folder, 
                  totalCount: folder.totalCount - 1,
                  unreadCount: email.isRead ? folder.unreadCount : Math.max(0, folder.unreadCount - 1)
                }
              : folder
          ));
        }
        
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null);
        }
        
        toast.success('Email excluído com sucesso');
      }
    } catch (error) {
      console.error('Erro ao excluir email:', error);
      toast.error('Erro ao excluir email');
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
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

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
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Configure sua conta de email para começar a usar o webmail.
            </p>
            <Button onClick={() => router.push('/webmail/config')}>
              Configurar Email
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Webmail
            </h1>
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
          <div className="p-2">
            <div className="space-y-1">
              {folders.map((folder) => (
                <Button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  variant={selectedFolder === folder.id ? "secondary" : "ghost"}
                  className="w-full justify-start h-auto p-3"
                >
                  <div className="flex items-center gap-3 w-full">
                    {getFolderIcon(folder)}
                    <div className="flex-1 text-left">
                      <div className="font-medium">{folder.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {folder.unreadCount > 0 && (
                          <span className="font-semibold">{folder.unreadCount} não lidas • </span>
                        )}
                        {folder.totalCount} total
                      </div>
                    </div>
                    {folder.unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {folder.unreadCount}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              {/* Administração */}
              <div className="space-y-2">
                <Button
                  onClick={() => router.push('/webmail/admin')}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 w-full"
                  title="Administração do Webmail"
                >
                  <Settings className="h-4 w-4" />
                  Administração
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {emailConfig?.displayName?.[0] || emailConfig?.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
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
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Email List */}
          <div className="w-1/3 bg-white border-r border-gray-200">
            <ScrollArea className="h-full">
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
                      onClick={() => {
                        setSelectedEmail(email);
                        if (!email.isRead) {
                          markAsRead(email.id);
                        }
                      }}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedEmail?.id === email.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                      } ${!email.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm truncate ${
                              !email.isRead ? 'font-semibold' : 'font-medium'
                            }`}>
                              {getEmailSender(email)}
                            </span>
                            <div className="flex items-center gap-1 ml-auto">
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
                          <div className={`text-sm mb-1 truncate ${
                            !email.isRead ? 'font-semibold' : ''
                          }`}>
                            {email.subject || '(sem assunto)'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate mb-2">
                            {email.preview}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{formatDate(email.date)}</span>
                            <span>{formatSize(email.size)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
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
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
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
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => toggleFlag(selectedEmail.id)}
                        variant="outline"
                        size="sm"
                        className={selectedEmail.isFlagged ? 'text-yellow-600' : ''}
                        title="Favoritar"
                      >
                        <Star className={`h-4 w-4 ${selectedEmail.isFlagged ? 'fill-current' : ''}`} />
                      </Button>
                      
                      <Button
                        onClick={() => selectedEmail.isRead ? markAsUnread(selectedEmail.id) : markAsRead(selectedEmail.id)}
                        variant="outline"
                        size="sm"
                        title="Marcar como lido"
                      >
                        <MailOpen className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={() => router.push(`/webmail/compose?reply=${selectedEmail.id}`)}
                        variant="outline"
                        size="sm"
                        title="Responder"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={() => router.push(`/webmail/compose?replyAll=${selectedEmail.id}`)}
                        variant="outline"
                        size="sm"
                        title="Responder a todos"
                      >
                        <ReplyAll className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={() => router.push(`/webmail/compose?forward=${selectedEmail.id}`)}
                        variant="outline"
                        size="sm"
                        title="Encaminhar"
                      >
                        <Forward className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        onClick={() => deleteEmail(selectedEmail.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <ScrollArea className="flex-1 p-6">
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.preview }} />
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
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
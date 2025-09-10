'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Reply, 
  ReplyAll, 
  Forward, 
  Trash2, 
  Archive,
  Star,
  StarOff,
  Download,
  Calendar,
  User,
  Clock,
  Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  contentId?: string;
}

interface EmailData {
  id: string;
  messageId: string;
  subject: string;
  from: Array<{ name?: string; address: string }>;
  to: Array<{ name?: string; address: string }>;
  cc?: Array<{ name?: string; address: string }>;
  bcc?: Array<{ name?: string; address: string }>;
  date: string;
  body: string;
  bodyType: 'text' | 'html';
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  attachments: EmailAttachment[];
  folder: {
    id: string;
    name: string;
    path: string;
  };
}

export default function EmailViewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState<EmailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const getFolderDisplayName = (folderName: string) => {
    // Traduzir nomes das pastas para português brasileiro na UI
    const lowerName = folderName.toLowerCase();
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
        return folderName; // Manter nome original para pastas personalizadas
    }
  };

  const emailId = params.id as string;

  useEffect(() => {
    if (session?.user && emailId) {
      loadEmail();
    }
  }, [session, emailId]);

  const loadEmail = async () => {
    try {
      const response = await fetch(`/api/emails/${emailId}`);
      if (response.ok) {
        const emailData = await response.json();
        setEmail(emailData);
        
        // Marcar como lido se não estiver
        if (!emailData.isRead) {
          markAsRead();
        }
      } else {
        toast.error('Erro ao carregar email');
        router.push('/webmail');
      }
    } catch (error) {
      console.error('Erro ao carregar email:', error);
      toast.error('Erro ao carregar email');
      router.push('/webmail');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/emails/${emailId}/mark-read`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Erro ao marcar como lido:', error);
    }
  };

  const handleAction = async (action: string) => {
    setActionLoading(action);
    try {
      switch (action) {
        case 'star':
          await toggleStar();
          break;
        case 'archive':
          await archiveEmail();
          break;
        case 'delete':
          await deleteEmail();
          break;
        case 'reply':
          router.push(`/webmail/compose?reply=${emailId}`);
          break;
        case 'replyAll':
          router.push(`/webmail/compose?replyAll=${emailId}`);
          break;
        case 'forward':
          router.push(`/webmail/compose?forward=${emailId}`);
          break;
      }
    } catch (error) {
      console.error(`Erro ao executar ação ${action}:`, error);
      toast.error('Erro ao executar ação');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleStar = async () => {
    try {
      const response = await fetch(`/api/emails/${emailId}/star`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ starred: !email?.isStarred })
      });

      if (response.ok) {
        setEmail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
        toast.success(email?.isStarred ? 'Estrela removida' : 'Email marcado com estrela');
      } else {
        toast.error('Erro ao alterar estrela');
      }
    } catch (error) {
      console.error('Erro ao alterar estrela:', error);
      toast.error('Erro ao alterar estrela');
    }
  };

  const archiveEmail = async () => {
    try {
      const response = await fetch(`/api/emails/${emailId}/archive`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Email arquivado');
        router.push('/webmail');
      } else {
        toast.error('Erro ao arquivar email');
      }
    } catch (error) {
      console.error('Erro ao arquivar email:', error);
      toast.error('Erro ao arquivar email');
    }
  };

  const deleteEmail = async () => {
    if (!confirm('Tem certeza que deseja mover este email para a lixeira?')) {
      return;
    }

    try {
      // Primeiro, buscar as pastas disponíveis para encontrar a lixeira
      const foldersResponse = await fetch('/api/email-folders');
      if (!foldersResponse.ok) {
        toast.error('Erro ao buscar pastas');
        return;
      }
      
      const foldersData = await foldersResponse.json();
      const folders = foldersData.folders || [];
      
      // Encontrar a pasta Lixeira
      const trashFolder = folders.find((folder: any) => 
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
      const response = await fetch(`/api/emails/${emailId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: trashFolder.id })
      });

      if (response.ok) {
        toast.success('Email movido para a lixeira');
        router.push('/webmail');
      } else {
        toast.error('Erro ao mover email para lixeira');
      }
    } catch (error) {
      console.error('Erro ao mover email para lixeira:', error);
      toast.error('Erro ao mover email para lixeira');
    }
  };

  const downloadAttachment = async (attachment: EmailAttachment) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/attachments/${attachment.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Anexo baixado');
      } else {
        toast.error('Erro ao baixar anexo');
      }
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
      toast.error('Erro ao baixar anexo');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const parseEmailAddresses = (addresses: Array<{ name?: string; address: string }>) => {
    return addresses.map(addr => ({
      name: addr.name || addr.address,
      email: addr.address
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Carregando email...</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">Email não encontrado</p>
          <Button onClick={() => router.push('/webmail')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Webmail
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header com ações */}
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/webmail')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('star')}
            disabled={actionLoading === 'star'}
            title="Favoritar"
          >
            {email.isStarred ? (
              <StarOff className="h-4 w-4" />
            ) : (
              <Star className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('reply')}
            disabled={!!actionLoading}
          >
            <Reply className="h-4 w-4 mr-2" />
            Responder
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('replyAll')}
            disabled={!!actionLoading}
          >
            <ReplyAll className="h-4 w-4 mr-2" />
            Resp. Todos
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('forward')}
            disabled={!!actionLoading}
          >
            <Forward className="h-4 w-4 mr-2" />
            Encaminhar
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('archive')}
            disabled={actionLoading === 'archive'}
            title="Arquivar"
          >
            <Archive className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAction('delete')}
            disabled={actionLoading === 'delete'}
            title="Mover para Lixeira"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Conteúdo do email */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Assunto */}
            <div className="flex items-start justify-between">
              <h1 className="text-2xl font-bold pr-4">{email.subject}</h1>
              <div className="flex items-center gap-2 flex-shrink-0">
                {email.isStarred && (
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                )}
                {email.isImportant && (
                  <Badge variant="destructive">Importante</Badge>
                )}
                <Badge variant="outline">{getFolderDisplayName(email.folder.name)}</Badge>
              </div>
            </div>
            
            {/* Informações do remetente */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {email.from.map(addr => addr.name || addr.address).join(', ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {email.from.map(addr => addr.address).join(', ')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {format(new Date(email.date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR
                  })}
                </p>
              </div>
              
              {/* Destinatários */}
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Para: </span>
                  <span className="text-sm">
                    {email.to.map(addr => addr.address).join(', ')}
                  </span>
                </div>
                
                {email.cc && email.cc.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">CC: </span>
                    <span className="text-sm">
                      {email.cc.map(addr => addr.address).join(', ')}
                    </span>
                  </div>
                )}
                
                {email.bcc && email.bcc.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">CCO: </span>
                    <span className="text-sm">
                      {email.bcc.map(addr => addr.address).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Anexos */}
          {email.attachments && email.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Anexos ({email.attachments.length})
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {email.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadAttachment(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Separator className="mt-6" />
            </div>
          )}
          
          {/* Corpo do email */}
          <div className="prose prose-sm max-w-none">
            {email.bodyType === 'html' ? (
              <div 
                dangerouslySetInnerHTML={{ __html: email.body }}
                className="email-content"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {email.body}
              </pre>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Ações rápidas no final */}
      <div className="flex justify-center gap-3 mt-6">
        <Button
          onClick={() => handleAction('reply')}
          disabled={!!actionLoading}
        >
          <Reply className="h-4 w-4 mr-2" />
          Responder
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleAction('replyAll')}
          disabled={!!actionLoading}
        >
          <ReplyAll className="h-4 w-4 mr-2" />
          Responder a Todos
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleAction('forward')}
          disabled={!!actionLoading}
        >
          <Forward className="h-4 w-4 mr-2" />
          Encaminhar
        </Button>
      </div>
    </div>
  );
}
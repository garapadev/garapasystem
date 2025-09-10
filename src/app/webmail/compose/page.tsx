'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  ArrowLeft, 
  Paperclip, 
  X,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const composeEmailSchema = z.object({
  to: z.string().min(1, 'Destinatário é obrigatório'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
  subject: z.string().min(1, 'Assunto é obrigatório'),
  body: z.string().min(1, 'Corpo do email é obrigatório'),
  isHtml: z.boolean()
});

type ComposeEmailForm = z.infer<typeof composeEmailSchema>;

interface EmailAttachment {
  id: string;
  file: File;
  name: string;
  size: number;
}

function ComposePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [formData, setFormData] = useState<ComposeEmailForm>({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    isHtml: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Parâmetros para resposta/encaminhamento
  const replyId = searchParams.get('reply') || searchParams.get('replyTo');
  const replyAllId = searchParams.get('replyAll');
  const forwardId = searchParams.get('forward');

  useEffect(() => {
    if (session?.user && (replyId || replyAllId || forwardId)) {
      loadOriginalEmail();
    }
  }, [session, replyId, replyAllId, forwardId]);

  const loadOriginalEmail = async () => {
    try {
      const emailId = replyId || replyAllId || forwardId;
      const response = await fetch(`/api/emails/${emailId}`);
      
      if (response.ok) {
        const email = await response.json();
        
        if (replyId) {
          // Responder apenas ao remetente
          const fromAddresses = Array.isArray(email.from) 
            ? email.from.map(f => {
                if (typeof f === 'string') return f;
                if (typeof f === 'object' && f !== null) {
                  return f.address || '';
                }
                return '';
              }).filter(addr => addr).join(', ')
            : (typeof email.from === 'string' ? email.from : 
               (typeof email.from === 'object' && email.from !== null ? 
                (email.from.address || '') : ''));
          setFormData({
            to: fromAddresses,
            cc: '',
            bcc: '',
            subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
            body: `\n\n--- Mensagem original ---\nDe: ${fromAddresses}\nData: ${new Date(email.date).toLocaleString()}\nAssunto: ${email.subject}\n\n${email.body}`,
            isHtml: false
          });
        } else if (replyAllId) {
          // Responder a todos
          const fromAddresses = Array.isArray(email.from) 
            ? email.from.map(f => {
                if (typeof f === 'string') return f;
                if (typeof f === 'object' && f !== null) {
                  return f.address || '';
                }
                return '';
              }).filter(addr => addr).join(', ')
            : (typeof email.from === 'string' ? email.from : 
               (typeof email.from === 'object' && email.from !== null ? 
                (email.from.address || '') : ''));
          const ccAddresses = Array.isArray(email.to) 
            ? email.to.filter(t => {
                const emailAddr = typeof t === 'string' ? t : 
                  (typeof t === 'object' && t !== null ? t.address : '');
                return emailAddr !== session?.user?.email;
              }).map(t => {
                if (typeof t === 'string') return t;
                if (typeof t === 'object' && t !== null) {
                  return t.address || '';
                }
                return '';
              }).filter(addr => addr).join(', ')
            : '';
          setFormData({
            to: fromAddresses,
            cc: ccAddresses,
            bcc: '',
            subject: email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`,
            body: `\n\n--- Mensagem original ---\nDe: ${fromAddresses}\nData: ${new Date(email.date).toLocaleString()}\nAssunto: ${email.subject}\n\n${email.body}`,
            isHtml: false
          });
          setShowCc(true);
        } else if (forwardId) {
          // Encaminhar
          setFormData({
            to: '',
            cc: '',
            bcc: '',
            subject: email.subject.startsWith('Fwd: ') ? email.subject : `Fwd: ${email.subject}`,
            body: `\n\n--- Mensagem encaminhada ---\nDe: ${email.from.map(f => f.name || f.address).join(', ')}\nPara: ${email.to.map(t => t.name || t.address).join(', ')}\nData: ${new Date(email.date).toLocaleString()}\nAssunto: ${email.subject}\n\n${email.body}`,
            isHtml: false
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar email original:', error);
      toast.error('Erro ao carregar email original');
    }
  };

  const handleInputChange = (field: keyof ComposeEmailForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    try {
      composeEmailSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: EmailAttachment[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Limite de 10MB por arquivo
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} é muito grande (máximo 10MB)`);
        continue;
      }
      
      newAttachments.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size
      });
    }
    
    setAttachments(prev => [...prev, ...newAttachments]);
    event.target.value = ''; // Limpar input
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('to', formData.to);
      formDataToSend.append('cc', formData.cc || '');
      formDataToSend.append('bcc', formData.bcc || '');
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('body', formData.body);
      formDataToSend.append('isHtml', formData.isHtml.toString());
      formDataToSend.append('isDraft', 'true');
      
      // Adicionar anexos
      attachments.forEach((attachment, index) => {
        formDataToSend.append(`attachment_${index}`, attachment.file);
      });

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('Rascunho salvo com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar rascunho');
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      toast.error('Erro ao salvar rascunho');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('to', formData.to);
      formDataToSend.append('cc', formData.cc || '');
      formDataToSend.append('bcc', formData.bcc || '');
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('body', formData.body);
      formDataToSend.append('isHtml', formData.isHtml.toString());
      formDataToSend.append('isDraft', 'false');
      
      // Adicionar anexos
      attachments.forEach((attachment, index) => {
        formDataToSend.append(`attachment_${index}`, attachment.file);
      });

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        toast.success('Email enviado com sucesso!');
        router.push('/webmail');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar email');
      }
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email');
    } finally {
      setLoading(false);
    }
  };

  const insertTextAtCursor = (text: string) => {
    const textarea = document.getElementById('email-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = formData.body.substring(0, start) + text + formData.body.substring(end);
      handleInputChange('body', newValue);
      
      // Restaurar posição do cursor
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/webmail')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Novo Email</h1>
            <p className="text-muted-foreground">
              {replyId && 'Respondendo email'}
              {replyAllId && 'Respondendo a todos'}
              {forwardId && 'Encaminhando email'}
              {!replyId && !replyAllId && !forwardId && 'Compor nova mensagem'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={loading || saving}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compor Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Destinatários */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="to">Para *</Label>
              <Input
                id="to"
                type="email"
                value={formData.to}
                onChange={(e) => handleInputChange('to', e.target.value)}
                placeholder="destinatario@exemplo.com"
                className={errors.to ? 'border-red-500' : ''}
              />
              {errors.to && (
                <p className="text-sm text-red-500 mt-1">{errors.to}</p>
              )}
            </div>
            
            {/* Botões para mostrar CC/BCC */}
            <div className="flex gap-2">
              {!showCc && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCc(true)}
                  title="Adicionar cópia (CC) - Destinatários visíveis para todos"
                >
                  + CC
                </Button>
              )}
              {!showBcc && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                  title="Adicionar cópia oculta (BCC) - Destinatários não visíveis para outros"
                >
                  + BCC
                </Button>
              )}
            </div>
            
            {/* Campo CC */}
            {showCc && (
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="cc" className="flex-shrink-0">CC</Label>
                  <Input
                    id="cc"
                    type="email"
                    value={formData.cc}
                    onChange={(e) => handleInputChange('cc', e.target.value)}
                    placeholder="copia@exemplo.com"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCc(false);
                      handleInputChange('cc', '');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {/* Campo BCC */}
            {showBcc && (
              <div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="bcc" className="flex-shrink-0">BCC</Label>
                  <Input
                    id="bcc"
                    type="email"
                    value={formData.bcc}
                    onChange={(e) => handleInputChange('bcc', e.target.value)}
                    placeholder="copia-oculta@exemplo.com"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBcc(false);
                      handleInputChange('bcc', '');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Assunto */}
          <div>
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Assunto do email"
              className={errors.subject ? 'border-red-500' : ''}
            />
            {errors.subject && (
              <p className="text-sm text-red-500 mt-1">{errors.subject}</p>
            )}
          </div>
          
          <Separator />
          
          {/* Anexos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Anexos</Label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar Arquivo
                </Button>
              </div>
            </div>
            
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          {/* Modo HTML */}
          <div className="flex items-center space-x-2">
            <Switch
              id="html-mode"
              checked={isHtmlMode}
              onCheckedChange={(checked) => {
                setIsHtmlMode(checked);
                handleInputChange('isHtml', checked);
              }}
            />
            <Label htmlFor="html-mode">Modo HTML</Label>
          </div>
          
          {/* Barra de ferramentas (apenas no modo texto) */}
          {!isHtmlMode && (
            <div className="flex items-center gap-1 p-2 border rounded-lg bg-muted/50">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertTextAtCursor('**texto em negrito**')}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertTextAtCursor('*texto em itálico*')}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertTextAtCursor('[link](http://exemplo.com)')}
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => insertTextAtCursor('\n- Item da lista\n')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Corpo do email */}
          <div>
            <Label htmlFor="email-body">Mensagem *</Label>
            <Textarea
              id="email-body"
              value={formData.body}
              onChange={(e) => handleInputChange('body', e.target.value)}
              placeholder={isHtmlMode ? 'Digite sua mensagem em HTML...' : 'Digite sua mensagem...'}
              className={`min-h-[300px] ${errors.body ? 'border-red-500' : ''}`}
            />
            {errors.body && (
              <p className="text-sm text-red-500 mt-1">{errors.body}</p>
            )}
            {isHtmlMode && (
              <p className="text-xs text-muted-foreground mt-1">
                Você pode usar tags HTML para formatar sua mensagem.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Ações finais */}
      <div className="flex justify-between items-center mt-6">
        <Button 
          variant="outline" 
          onClick={() => router.push('/webmail')}
        >
          Cancelar
        </Button>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || loading}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSend}
            disabled={loading || saving}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ComposePageContent />
    </Suspense>
  );
}
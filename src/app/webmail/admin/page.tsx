'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Server, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  TestTube,
  Send,
  Loader2,
  Bug
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

const emailConfigSchema = z.object({
  email: z.string().email('Email inválido'),
  displayName: z.string().optional(),
  password: z.string().min(1, 'Senha é obrigatória'),
  imapHost: z.string().min(1, 'Host IMAP é obrigatório'),
  imapPort: z.number().min(1).max(65535, 'Porta IMAP inválida'),
  imapSecure: z.boolean(),
  smtpHost: z.string().min(1, 'Host SMTP é obrigatório'),
  smtpPort: z.number().min(1).max(65535, 'Porta SMTP inválida'),
  smtpSecure: z.boolean(),
});

type EmailConfigForm = z.infer<typeof emailConfigSchema>;

export default function WebmailAdminConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [formData, setFormData] = useState<EmailConfigForm>({
    email: '',
    displayName: '',
    password: '',
    imapHost: '',
    imapPort: 993,
    imapSecure: true,
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      loadExistingConfig();
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'loading') {
      // aguardando sessão
    } else {
      setLoading(false);
    }
  }, [session, status, router]);

  const loadExistingConfig = async () => {
    try {
      const response = await fetch('/api/email-config', { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const config = result.data;
          setHasExistingConfig(true);
          setFormData(prev => ({
            ...prev,
            email: config.email || '',
            displayName: config.displayName || '',
            password: '', // não carregar senha
            imapHost: config.imapHost || '',
            imapPort: config.imapPort || 993,
            imapSecure: config.imapSecure ?? true,
            smtpHost: config.smtpHost || '',
            smtpPort: config.smtpPort || 587,
            smtpSecure: config.smtpSecure ?? false,
          }));
        } else {
          setHasExistingConfig(false);
        }
      } else {
        setHasExistingConfig(false);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      setHasExistingConfig(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EmailConfigForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const validateForm = () => {
    try {
      // Validar somente campos visíveis
      emailConfigSchema.parse({
        email: formData.email,
        displayName: formData.displayName,
        password: formData.password,
        imapHost: formData.imapHost,
        imapPort: formData.imapPort,
        imapSecure: formData.imapSecure,
        smtpHost: formData.smtpHost,
        smtpPort: formData.smtpPort,
        smtpSecure: formData.smtpSecure,
      });
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

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
      };

      const response = await fetch('/api/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('Configuração salva com sucesso!');
        router.push('/webmail');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!hasExistingConfig) return;
    if (!confirm('Tem certeza que deseja excluir a configuração de email?')) {
      return;
    }
    try {
      const response = await fetch('/api/email-config', { method: 'DELETE' });
      if (response.ok) {
        toast.success('Configuração excluída com sucesso!');
        router.push('/webmail');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao excluir configuração');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir configuração');
    }
  };

  const runEmailTest = async (testType: 'imap' | 'smtp' | 'send' | 'full') => {
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário antes de testar');
      return;
    }
    setTesting(true);
    setTestResults(null);
    try {
      const response = await fetch('/api/emails/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, testType }),
      });
      const result = await response.json();
      setTestResults(result);
      if (result.success) {
        toast.success(`Teste ${testType.toUpperCase()} realizado com sucesso!`);
      } else {
        toast.error(`Falha no teste ${testType.toUpperCase()}: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro no teste:', error);
      toast.error('Erro ao executar teste');
      setTestResults({ success: false, error: 'Erro de conexão' });
    } finally {
      setTesting(false);
    }
  };

  const getCommonProviders = () => {
    return [
      { name: 'Gmail', imap: { host: 'imap.gmail.com', port: 993, secure: true }, smtp: { host: 'smtp.gmail.com', port: 587, secure: false } },
      { name: 'Outlook/Hotmail', imap: { host: 'outlook.office365.com', port: 993, secure: true }, smtp: { host: 'smtp-mail.outlook.com', port: 587, secure: false } },
      { name: 'Yahoo', imap: { host: 'imap.mail.yahoo.com', port: 993, secure: true }, smtp: { host: 'smtp.mail.yahoo.com', port: 587, secure: false } },
    ];
  };

  const applyProviderSettings = (provider: any) => {
    setFormData(prev => ({
      ...prev,
      imapHost: provider.imap.host,
      imapPort: provider.imap.port,
      imapSecure: provider.imap.secure,
      smtpHost: provider.smtp.host,
      smtpPort: provider.smtp.port,
      smtpSecure: provider.smtp.secure,
    }));
    toast.success(`Configurações do ${provider.name} aplicadas!`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Mail className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push('/webmail')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Administração e Configuração do Webmail</h1>
          <p className="text-muted-foreground">Gerencie sua conta e conectividade IMAP/SMTP</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informações da Conta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder="seu@email.com" className={errors.email ? 'border-red-500' : ''} />
                  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="displayName">Nome de Exibição</Label>
                  <Input id="displayName" value={formData.displayName} onChange={(e) => handleInputChange('displayName', e.target.value)} placeholder="Seu Nome" />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Senha *</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder={hasExistingConfig ? 'Deixe em branco para manter a senha atual' : 'Sua senha'} className={errors.password ? 'border-red-500' : ''} />
                  <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Configurações IMAP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Servidor IMAP (Recebimento)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label htmlFor="imapHost">Host IMAP *</Label>
                  <Input id="imapHost" value={formData.imapHost} onChange={(e) => handleInputChange('imapHost', e.target.value)} placeholder="imap.exemplo.com" className={errors.imapHost ? 'border-red-500' : ''} />
                  {errors.imapHost && <p className="text-sm text-red-500 mt-1">{errors.imapHost}</p>}
                </div>
                <div>
                  <Label htmlFor="imapPort">Porta *</Label>
                  <Input id="imapPort" type="number" value={formData.imapPort} onChange={(e) => handleInputChange('imapPort', parseInt(e.target.value) || 993)} className={errors.imapPort ? 'border-red-500' : ''} />
                  {errors.imapPort && <p className="text-sm text-red-500 mt-1">{errors.imapPort}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="imapSecure" checked={formData.imapSecure} onCheckedChange={(checked) => handleInputChange('imapSecure', checked)} />
                <Label htmlFor="imapSecure" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Usar SSL/TLS
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Configurações SMTP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Servidor SMTP (Envio)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <Label htmlFor="smtpHost">Host SMTP *</Label>
                  <Input id="smtpHost" value={formData.smtpHost} onChange={(e) => handleInputChange('smtpHost', e.target.value)} placeholder="smtp.exemplo.com" className={errors.smtpHost ? 'border-red-500' : ''} />
                  {errors.smtpHost && <p className="text-sm text-red-500 mt-1">{errors.smtpHost}</p>}
                </div>
                <div>
                  <Label htmlFor="smtpPort">Porta *</Label>
                  <Input id="smtpPort" type="number" value={formData.smtpPort} onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)} className={errors.smtpPort ? 'border-red-500' : ''} />
                  {errors.smtpPort && <p className="text-sm text-red-500 mt-1">{errors.smtpPort}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="smtpSecure" checked={formData.smtpSecure} onCheckedChange={(checked) => handleInputChange('smtpSecure', checked)} />
                <Label htmlFor="smtpSecure" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Usar STARTTLS
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Provedores Comuns e Testes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provedores Comuns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {getCommonProviders().map((provider) => (
                <Button key={provider.name} variant="outline" className="w-full justify-start" onClick={() => applyProviderSettings(provider)}>
                  {String(provider.name)}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Testes de Conectividade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Testes de Conectividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => runEmailTest('imap')} disabled={testing} className="text-xs">
                  {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'IMAP'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => runEmailTest('smtp')} disabled={testing} className="text-xs">
                  {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'SMTP'}
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => runEmailTest('send')} disabled={testing} className="w-full text-xs">
                {testing ? (<><Loader2 className="h-3 w-3 animate-spin mr-1" />Testando...</>) : (<><Send className="h-3 w-3 mr-1" />Enviar Email Teste</>)}
              </Button>
              <Button variant="default" size="sm" onClick={() => runEmailTest('full')} disabled={testing} className="w-full text-xs">
                {testing ? (<><Loader2 className="h-3 w-3 animate-spin mr-1" />Testando...</>) : (<><TestTube className="h-3 w-3 mr-1" />Teste Completo</>)}
              </Button>
              {testResults && (
                <div className="mt-3">
                  <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full text-xs">
                    <Bug className="h-3 w-3 mr-1" />
                    {showDebug ? 'Ocultar' : 'Ver'} Debug
                  </Button>
                  {showDebug && (
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                      <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32">{JSON.stringify(testResults, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <ul className="space-y-1 mt-2">
                    <li>• Use senhas de aplicativo quando disponível</li>
                    <li>• Verifique se IMAP está habilitado na sua conta</li>
                    <li>• Para Gmail, ative a autenticação de 2 fatores</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t">
        <div>
          {hasExistingConfig && (
            <Button variant="destructive" onClick={handleDelete}>Excluir Configuração</Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/webmail')}>Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Salvando...</>) : (<><Save className="h-4 w-4 mr-2" />Salvar Configuração</>)}
          </Button>
        </div>
      </div>
    </div>
  );
}
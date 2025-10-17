'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, UserCircle, Loader2, Eye, EyeOff, Key } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useColaborador, updateColaborador } from '@/hooks/useColaboradores';
import { useToast } from '@/hooks/use-toast';
import { updateUsuario } from '@/hooks/useUsuarios';

export default function EditarMeuPerfilPage() {
  const router = useRouter();
  const { user, colaborador: currentColaborador } = useAuth() as any;
  const colaboradorId = currentColaborador?.id as string | undefined;
  const usuarioId = user?.id as string | undefined;
  const { colaborador, loading, error } = useColaborador(colaboradorId || '');
  const { toast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    cargo: '',
    dataAdmissao: '',
    // Campos de senha
    novaSenha: '',
    confirmarSenha: '',
    alterarSenha: false,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (colaborador) {
      setFormData(prev => ({
        ...prev,
        nome: colaborador.nome,
        email: colaborador.email,
        telefone: colaborador.telefone || '',
        documento: colaborador.documento || '',
        cargo: colaborador.cargo,
        dataAdmissao: colaborador.dataAdmissao,
      }));
    }
  }, [colaborador]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    // Validar senhas se alterarSenha for true
    if (formData.alterarSenha) {
      if (!formData.novaSenha || formData.novaSenha.length < 6) {
        setErrorMsg('Nova senha deve ter pelo menos 6 caracteres');
        setSubmitting(false);
        return;
      }
      if (formData.novaSenha !== formData.confirmarSenha) {
        setErrorMsg('Confirmação de senha não confere');
        setSubmitting(false);
        return;
      }
      if (!usuarioId) {
        setErrorMsg('Não foi possível identificar seu usuário vinculado.');
        setSubmitting(false);
        return;
      }
    }

    try {
      const payload: any = {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
        dataAdmissao: formData.dataAdmissao,
        ...(formData.telefone && { telefone: formData.telefone }),
        ...(formData.documento && { documento: formData.documento }),
      };

      // Atualiza somente dados do colaborador
      await updateColaborador(colaboradorId!, payload);

      // Se solicitar troca de senha, usa API de usuários
      if (formData.alterarSenha) {
        await updateUsuario(usuarioId!, {
          email: formData.email,
          nome: formData.nome,
          senha: formData.novaSenha,
        });
      }

      toast({ title: 'Sucesso!', description: 'Dados atualizados com sucesso.' });
      router.push('/perfil');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar dados';
      setErrorMsg(message);
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!colaboradorId) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>Não foi possível identificar seu colaborador vinculado.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>Erro ao carregar dados: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <UserCircle className="h-6 w-6" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Meu Perfil</h1>
            <p className="text-muted-foreground">Edite seus dados cadastrais e senha</p>
          </div>
        </div>
        <Link href="/perfil">
          <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      {errorMsg && (
        <Alert variant="destructive">
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Atualize seus dados pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={formData.telefone} onChange={(e) => handleChange('telefone', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="documento">Documento</Label>
                <Input id="documento" value={formData.documento} onChange={(e) => handleChange('documento', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="cargo">Cargo</Label>
                <Input id="cargo" value={formData.cargo} onChange={(e) => handleChange('cargo', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                <Input id="dataAdmissao" type="date" value={formData.dataAdmissao} onChange={(e) => handleChange('dataAdmissao', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alteração de Senha */}
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
            <CardDescription>Altere sua senha pessoal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="alterarSenha" checked={formData.alterarSenha as any} onCheckedChange={(checked) => handleChange('alterarSenha', Boolean(checked))} />
              <Label htmlFor="alterarSenha">Ativar</Label>
            </div>
            {formData.alterarSenha && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <div className="relative">
                    <Input id="novaSenha" type={showPassword ? 'text' : 'password'} value={formData.novaSenha} onChange={(e) => handleChange('novaSenha', e.target.value)} />
                    <Button type="button" variant="ghost" className="absolute right-2 top-1" onClick={() => setShowPassword(v => !v)}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmarSenha">Confirmar Senha</Label>
                  <Input id="confirmarSenha" type="password" value={formData.confirmarSenha} onChange={(e) => handleChange('confirmarSenha', e.target.value)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
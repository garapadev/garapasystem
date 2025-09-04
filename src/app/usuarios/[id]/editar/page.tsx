'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useUsuario, updateUsuario } from '@/hooks/useUsuarios';
import { useColaboradores } from '@/hooks/useColaboradores';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface FormData {
  email: string;
  nome: string;
  ativo: boolean;
  colaboradorId: string | null;
}

export default function EditarUsuarioPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const usuarioId = params.id as string;
  const { usuario, loading: usuarioLoading, error: usuarioError, refetch } = useUsuario(usuarioId);
  const { colaboradores, loading: colaboradoresLoading } = useColaboradores({ ativo: 'true' });
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    nome: '',
    ativo: true,
    colaboradorId: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preencher formulário quando usuário for carregado
  useEffect(() => {
    if (usuario) {
      setFormData({
        email: usuario.email,
        nome: usuario.nome || '',
        ativo: usuario.ativo,
        colaboradorId: usuario.colaboradorId || null
      });
    }
  }, [usuario]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }
    
    if (!formData.email.includes('@')) {
      setError('Email deve ter um formato válido');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await updateUsuario(usuarioId, {
        email: formData.email.trim(),
        nome: formData.nome.trim() || null,
        ativo: formData.ativo,
        colaboradorId: formData.colaboradorId
      });
      
      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso!',
      });
      
      router.push(`/usuarios/${usuarioId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (usuarioLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Carregando usuário...</span>
        </div>
      </div>
    );
  }

  if (usuarioError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Erro</h2>
          <p className="text-muted-foreground">{usuarioError}</p>
          <Button onClick={() => router.push('/usuarios')}>Voltar</Button>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Usuário não encontrado</h2>
          <Button onClick={() => router.push('/usuarios')}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'usuarios', acao: 'editar' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/usuarios/${usuarioId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Usuário</h1>
              <p className="text-muted-foreground">
                Atualize as informações do usuário
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Informações Básicas */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>
                    Defina as informações principais do usuário
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Digite o email do usuário"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Digite o nome do usuário (opcional)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="colaborador">Colaborador Associado</Label>
                    <Select
                      value={formData.colaboradorId || ''}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        colaboradorId: value || null 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um colaborador (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhum colaborador</SelectItem>
                        {colaboradores?.map((colaborador) => (
                          <SelectItem key={colaborador.id} value={colaborador.id}>
                            {colaborador.nome} - {colaborador.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {colaboradoresLoading && (
                      <p className="text-sm text-muted-foreground">Carregando colaboradores...</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                    />
                    <Label htmlFor="ativo">Usuário ativo</Label>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Resumo */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.email || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Nome</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.nome || 'Não informado'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      <Badge variant={formData.ativo ? 'default' : 'secondary'}>
                        {formData.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Colaborador</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.colaboradorId 
                        ? colaboradores?.find(c => c.id === formData.colaboradorId)?.nome || 'Carregando...'
                        : 'Nenhum colaborador associado'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col space-y-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push(`/usuarios/${usuarioId}`)}
                  className="w-full"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
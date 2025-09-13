'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, UserCircle, Building2, Shield, Loader2, Eye, EyeOff, Key } from 'lucide-react';
import Link from 'next/link';
import { useColaborador, updateColaborador } from '@/hooks/useColaboradores';
import { usePerfis } from '@/hooks/usePerfis';
import { useGruposHierarquicos } from '@/hooks/useGruposHierarquicos';
import { useToast } from '@/hooks/use-toast';



export default function EditarColaboradorPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    cargo: '',
    dataAdmissao: '',
    ativo: true,
    perfilId: '',
    grupoHierarquicoId: '',
    // Campos para gerenciamento do usuário
    novaSenha: '',
    confirmarSenha: '',
    alterarSenha: false,
    // Campos para criação de novo usuário
    criarUsuario: false,
    senhaNovoUsuario: '',
    confirmarSenhaNovoUsuario: ''
  });

  const { colaborador, loading, error: fetchError } = useColaborador(params.id as string);
  const { perfis, loading: perfisLoading } = usePerfis({ page: 1, limit: 100 });
  const { grupos, loading: gruposLoading } = useGruposHierarquicos({ page: 1, limit: 100 });

  useEffect(() => {
    if (colaborador) {
      console.log('Dados do colaborador:', colaborador);
      console.log('perfilId:', colaborador.perfilId);
      console.log('grupoHierarquicoId:', colaborador.grupoHierarquicoId);
      
      setFormData({
        nome: colaborador.nome,
        email: colaborador.email,
        telefone: colaborador.telefone || '',
        documento: colaborador.documento || '',
        cargo: colaborador.cargo,
        dataAdmissao: colaborador.dataAdmissao,
        ativo: colaborador.ativo,
        perfilId: colaborador.perfilId ? String(colaborador.perfilId) : '',
        grupoHierarquicoId: colaborador.grupoHierarquicoId ? String(colaborador.grupoHierarquicoId) : '',
        // Campos para gerenciamento do usuário
        novaSenha: '',
        confirmarSenha: '',
        alterarSenha: false,
        // Campos para criação de novo usuário
        criarUsuario: false,
        senhaNovoUsuario: '',
        confirmarSenhaNovoUsuario: ''
      });
    }
  }, [colaborador]);

  // Força re-renderização dos selects quando dados estão prontos
  const [selectKey, setSelectKey] = useState(0);
  
  useEffect(() => {
    if (!perfisLoading && !gruposLoading && perfis && grupos && formData.perfilId && formData.grupoHierarquicoId) {
      console.log('=== FORÇANDO RE-RENDERIZAÇÃO DOS SELECTS ===');
      console.log('Perfil ID:', formData.perfilId);
      console.log('Grupo ID:', formData.grupoHierarquicoId);
      setSelectKey(prev => prev + 1);
    }
  }, [perfisLoading, gruposLoading, perfis, grupos, formData.perfilId, formData.grupoHierarquicoId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Validar senhas se alterarSenha for true
    if (formData.alterarSenha) {
      if (!formData.novaSenha || formData.novaSenha.length < 6) {
        setError('Nova senha deve ter pelo menos 6 caracteres');
        setSubmitting(false);
        return;
      }

      if (formData.novaSenha !== formData.confirmarSenha) {
        setError('Confirmação de senha não confere');
        setSubmitting(false);
        return;
      }
    }

    // Validar senhas se criarUsuario for true
    if (formData.criarUsuario) {
      if (!formData.senhaNovoUsuario || formData.senhaNovoUsuario.length < 6) {
        setError('Senha do novo usuário deve ter pelo menos 6 caracteres');
        setSubmitting(false);
        return;
      }

      if (formData.senhaNovoUsuario !== formData.confirmarSenhaNovoUsuario) {
        setError('Confirmação de senha do novo usuário não confere');
        setSubmitting(false);
        return;
      }
    }

    try {
      const colaboradorData = {
        nome: formData.nome,
        email: formData.email,
        cargo: formData.cargo,
        dataAdmissao: formData.dataAdmissao,
        ativo: formData.ativo,
        ...(formData.telefone && { telefone: formData.telefone }),
        ...(formData.documento && { documento: formData.documento }),
        ...(formData.perfilId && { perfilId: formData.perfilId }),
        ...(formData.grupoHierarquicoId && { grupoHierarquicoId: formData.grupoHierarquicoId }),
        ...(formData.alterarSenha && {
          novaSenha: formData.novaSenha,
          alterarSenha: true
        }),
        ...(formData.criarUsuario && {
          senhaNovoUsuario: formData.senhaNovoUsuario,
          criarUsuario: true
        })
      };

      await updateColaborador(params.id as string, colaboradorData);
      
      toast({
        title: "Sucesso!",
        description: "Colaborador atualizado com sucesso.",
      });
      
      router.push('/colaboradores');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar colaborador';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-gray-600">Carregando colaborador...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Erro ao carregar colaborador: {fetchError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="flex items-center justify-center h-64">
        <Alert className="max-w-md">
          <AlertDescription>
            Colaborador não encontrado.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/colaboradores">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <UserCircle className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Colaborador</h1>
              <p className="text-muted-foreground">
                Atualize as informações do colaborador
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Pessoais</CardTitle>
                <CardDescription>
                  Dados básicos do colaborador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => handleChange('telefone', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="documento">CPF</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={(e) => handleChange('documento', e.target.value)}
                    placeholder="000.000.000-00"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações Profissionais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Profissionais</CardTitle>
                <CardDescription>
                  Dados profissionais e organizacionais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => handleChange('cargo', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                  <Input
                    id="dataAdmissao"
                    type="date"
                    value={formData.dataAdmissao}
                    onChange={(e) => handleChange('dataAdmissao', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ativo">Status</Label>
                  <Select 
                    value={formData.ativo ? 'true' : 'false'} 
                    onValueChange={(value) => handleChange('ativo', value === 'true')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Ativo</SelectItem>
                      <SelectItem value="false">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Permissões e Acesso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Perfil de Acesso</span>
                </CardTitle>
                <CardDescription>
                  Define as permissões do colaborador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="perfilId">Perfil</Label>
                  {perfisLoading ? (
                    <div className="flex items-center space-x-2 h-9 px-3 py-2 border rounded-md bg-gray-50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-500">Carregando perfis...</span>
                    </div>
                  ) : (
                    <Select key={`perfil-${selectKey}-${formData.perfilId}`} value={formData.perfilId} onValueChange={(value) => handleChange('perfilId', value)}>
                      <SelectTrigger>
                        <SelectValue>
                          {formData.perfilId ? 
                            perfis?.find(p => String(p.id) === formData.perfilId)?.nome || 'Selecione um perfil'
                            : 'Selecione um perfil'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {perfis?.map((perfil) => (
                        <SelectItem key={perfil.id} value={String(perfil.id)}>
                          {perfil.nome}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                {/* Gerenciamento de Usuário */}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Key className="h-4 w-4" />
                    <h4 className="font-medium">Usuário de Acesso</h4>
                  </div>
                  
                  {colaborador?.usuarios && colaborador.usuarios.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p>Email: {colaborador.usuarios[0].email}</p>
                        <p>Status: {colaborador.usuarios[0].ativo ? 'Ativo' : 'Inativo'}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="alterarSenha"
                          checked={formData.alterarSenha}
                          onChange={(e) => handleChange('alterarSenha', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="alterarSenha" className="text-sm font-medium">
                          Alterar senha de acesso
                        </Label>
                      </div>
                      
                      {formData.alterarSenha && (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="novaSenha">Nova Senha *</Label>
                            <div className="relative">
                              <Input
                                id="novaSenha"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.novaSenha}
                                onChange={(e) => handleChange('novaSenha', e.target.value)}
                                placeholder="Digite a nova senha"
                                required={formData.alterarSenha}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
                            <Input
                              id="confirmarSenha"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.confirmarSenha}
                              onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                              placeholder="Confirme a nova senha"
                              required={formData.alterarSenha}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          <strong>Este colaborador não possui uma conta de usuário.</strong>
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Você pode criar uma nova conta de acesso para que ele possa fazer login no sistema.
                          O email <strong>{formData.email}</strong> será usado como nome de usuário.
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="criarUsuario"
                          checked={formData.criarUsuario}
                          onChange={(e) => handleChange('criarUsuario', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="criarUsuario" className="text-sm font-medium">
                          Criar nova conta de usuário
                        </Label>
                      </div>
                      
                      {formData.criarUsuario && (
                        <div className="space-y-3">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Criando nova conta:</strong>
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                              Email/Usuário: <strong>{formData.email}</strong>
                            </p>
                            <p className="text-sm text-blue-700">
                              Defina uma senha segura para o colaborador acessar o sistema.
                            </p>
                          </div>
                          
                          <div>
                            <Label htmlFor="senhaNovoUsuario">Senha *</Label>
                            <div className="relative">
                              <Input
                                id="senhaNovoUsuario"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.senhaNovoUsuario}
                                onChange={(e) => handleChange('senhaNovoUsuario', e.target.value)}
                                placeholder="Digite a senha para o novo usuário"
                                required={formData.criarUsuario}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmarSenhaNovoUsuario">Confirmar Senha *</Label>
                            <Input
                              id="confirmarSenhaNovoUsuario"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.confirmarSenhaNovoUsuario}
                              onChange={(e) => handleChange('confirmarSenhaNovoUsuario', e.target.value)}
                              placeholder="Confirme a senha"
                              required={formData.criarUsuario}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Informações sobre Perfis e Acesso</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• O perfil define as permissões do colaborador</li>
                    <li>• Perfis são criados na seção de Permissões</li>
                    <li>• Um colaborador só pode ter um perfil</li>
                    <li>• Se houver usuário associado, você pode alterar a senha aqui</li>
                    <li>• Se não houver usuário, você pode criar uma nova conta de acesso</li>
                    <li>• O email do colaborador será usado como nome de usuário</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Organização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Grupo Hierárquico</span>
                </CardTitle>
                <CardDescription>
                  Posição do colaborador na estrutura organizacional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="grupoHierarquicoId">Grupo</Label>
                  {gruposLoading ? (
                    <div className="flex items-center space-x-2 h-9 px-3 py-2 border rounded-md bg-gray-50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-gray-500">Carregando grupos...</span>
                    </div>
                  ) : (
                    <Select key={`grupo-${selectKey}-${formData.grupoHierarquicoId}`} value={formData.grupoHierarquicoId} onValueChange={(value) => handleChange('grupoHierarquicoId', value)}>
                      <SelectTrigger>
                        <SelectValue>
                          {formData.grupoHierarquicoId ? 
                            grupos?.find(g => String(g.id) === formData.grupoHierarquicoId)?.nome || 'Selecione um grupo'
                            : 'Selecione um grupo'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {grupos?.map((grupo) => (
                        <SelectItem key={grupo.id} value={String(grupo.id)}>
                          {grupo.nome}
                        </SelectItem>
                      ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Informações sobre Grupos</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• O grupo define a posição na organização</li>
                    <li>• Grupos são criados na seção de Grupos Hierárquicos</li>
                    <li>• Ajuda na organização e filtragem de colaboradores</li>
                    <li>• Pode ser usado para atribuir clientes e metas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exibir erro se houver */}
          {(error || fetchError) && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{error || fetchError}</AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/colaboradores">
              <Button variant="outline" disabled={submitting}>Cancelar</Button>
            </Link>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Atualizar Colaborador
                </>
              )}
            </Button>
          </div>
        </form>
    </div>
  );
}
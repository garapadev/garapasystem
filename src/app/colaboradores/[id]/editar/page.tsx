'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, UserCircle, Building2, Shield, Loader2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    documento: '',
    cargo: '',
    dataAdmissao: '',
    ativo: true,
    perfilId: '',
    grupoHierarquicoId: ''
  });

  const { colaborador, loading, error: fetchError } = useColaborador(params.id as string);
  const { perfis, loading: perfisLoading } = usePerfis({ page: 1, limit: 100 });
  const { grupos, loading: gruposLoading } = useGruposHierarquicos({ page: 1, limit: 100 });

  useEffect(() => {
    if (colaborador) {
      setFormData({
        nome: colaborador.nome,
        email: colaborador.email,
        telefone: colaborador.telefone || '',
        documento: colaborador.documento || '',
        cargo: colaborador.cargo,
        dataAdmissao: colaborador.dataAdmissao,
        ativo: colaborador.ativo,
        perfilId: colaborador.perfilId || '',
        grupoHierarquicoId: colaborador.grupoHierarquicoId || ''
      });
    }
  }, [colaborador]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

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
        ...(formData.grupoHierarquicoId && { grupoHierarquicoId: formData.grupoHierarquicoId })
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
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-gray-600">Carregando colaborador...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (fetchError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              Erro ao carregar colaborador: {fetchError}
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  if (!colaborador) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertDescription>
              Colaborador não encontrado.
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
                  <Select value={formData.perfilId} onValueChange={(value) => handleChange('perfilId', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {perfis?.map((perfil) => (
                      <SelectItem key={perfil.id} value={perfil.id}>
                        {perfil.nome}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Informações sobre Perfis</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• O perfil define as permissões do colaborador</li>
                    <li>• Perfis são criados na seção de Permissões</li>
                    <li>• Um colaborador só pode ter um perfil</li>
                    <li>• As permissões podem ser alteradas a qualquer momento</li>
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
                  <Select value={formData.grupoHierarquicoId} onValueChange={(value) => handleChange('grupoHierarquicoId', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos?.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id}>
                        {grupo.nome}
                      </SelectItem>
                    ))}
                    </SelectContent>
                  </Select>
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
    </MainLayout>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, UserCircle, Building2, Shield, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createColaborador } from '@/hooks/useColaboradores';
import { usePerfis } from '@/hooks/usePerfis';
import { useGruposHierarquicos } from '@/hooks/useGruposHierarquicos';
import { useToast } from '@/hooks/use-toast';



export default function NovoColaboradorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const { perfis, loading: perfisLoading } = usePerfis({ page: 1, limit: 100 });
  const { grupos, loading: gruposLoading } = useGruposHierarquicos({ page: 1, limit: 100 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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

      await createColaborador(colaboradorData);
      
      toast({
        title: "Sucesso!",
        description: "Colaborador criado com sucesso.",
      });
      
      router.push('/colaboradores');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar colaborador';
      setError(errorMessage);
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
              <h1 className="text-3xl font-bold tracking-tight">Novo Colaborador</h1>
              <p className="text-muted-foreground">
                Cadastre um novo colaborador na empresa
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
                      <SelectValue placeholder="Selecione o perfil de acesso" />
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
                      <SelectValue placeholder="Selecione o grupo hierárquico" />
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
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/colaboradores">
              <Button variant="outline" disabled={loading}>Cancelar</Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Colaborador
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
  );
}
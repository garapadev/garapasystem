'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, UserCircle, Building2, Shield } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para exemplo
const mockColaborador = {
  id: '1',
  nome: 'Carlos Oliveira',
  email: 'carlos.oliveira@empresa.com',
  telefone: '(11) 99999-9999',
  documento: '123.456.789-00',
  cargo: 'Gerente de Vendas',
  dataAdmissao: '2023-01-15',
  ativo: true,
  perfilId: '2',
  grupoHierarquicoId: '2',
  createdAt: '2024-01-15'
};

// Dados mockados para perfis e grupos
const mockPerfis = [
  { id: '1', nome: 'Administrador' },
  { id: '2', nome: 'Gerente de Vendas' },
  { id: '3', nome: 'Vendedor' },
  { id: '4', nome: 'Desenvolvedor' },
  { id: '5', nome: 'RH' },
];

const mockGrupos = [
  { id: '1', nome: 'Diretoria' },
  { id: '2', nome: 'Vendas' },
  { id: '3', nome: 'TI' },
  { id: '4', nome: 'RH' },
  { id: '5', nome: 'Vendas Internas' },
];

export default function EditarColaboradorPage() {
  const params = useParams();
  const router = useRouter();
  const [formData, setFormData] = useState(mockColaborador);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando busca do colaborador pelo ID
    const fetchColaborador = async () => {
      // Aqui você faria a chamada API para buscar o colaborador
      // const response = await fetch(`/api/colaboradores/${params.id}`);
      // const data = await response.json();
      
      // Por enquanto, usando dados mockados
      setTimeout(() => {
        setLoading(false);
      }, 500);
    };

    fetchColaborador();
  }, [params.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica para atualizar o colaborador
    console.log('Atualizando colaborador:', formData);
    // Simulando atualização e redirecionamento
    setTimeout(() => {
      router.push('/colaboradores');
    }, 1000);
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
          <div>Carregando...</div>
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
                      {mockPerfis.map((perfil) => (
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
                      {mockGrupos.map((grupo) => (
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

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/colaboradores">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Atualizar Colaborador
            </Button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
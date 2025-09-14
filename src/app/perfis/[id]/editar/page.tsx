'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { usePerfil, updatePerfil } from '@/hooks/usePerfis';
import { useAllPermissoes } from '@/hooks/usePermissoes';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Interface para Permissao do hook
interface Permissao {
  id: string;
  nome: string;
  descricao?: string;
  recurso: string;
  acao: string;
  ativo: boolean;
  perfis?: {
    perfil: {
      id: string;
      nome: string;
      descricao?: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  nome: string;
  descricao: string;
  ativo: boolean;
  permissoesIds: string[];
}

export default function EditarPerfilPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { canAccess } = useAuth();
  const perfilId = params.id as string;
  
  const { perfil, loading: perfilLoading, error: perfilError } = usePerfil(perfilId);
  const { permissoes: todasPermissoes, loading: permissoesLoading } = useAllPermissoes();
  
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    descricao: '',
    ativo: true,
    permissoesIds: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchPermissoes, setSearchPermissoes] = useState('');

  // Atualizar form quando perfil for carregado
  useEffect(() => {
    if (perfil) {
      setFormData({
        nome: perfil.nome,
        descricao: perfil.descricao || '',
        ativo: perfil.ativo,
        permissoesIds: perfil.permissoes?.map(p => p.permissao.id) || []
      });
    }
  }, [perfil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await updatePerfil(perfilId, formData);
      
      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!'
      });
      
      router.push('/perfis');
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao atualizar perfil',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePermissaoToggle = (permissaoId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissoesIds: checked 
        ? [...prev.permissoesIds, permissaoId]
        : prev.permissoesIds.filter(id => id !== permissaoId)
    }));
  };

  const handleSelectAllPermissoes = () => {
    const filteredPermissoes = getFilteredPermissoes();
    const allSelected = filteredPermissoes.every(p => formData.permissoesIds.includes(p.id));
    
    if (allSelected) {
      // Desmarcar todas as permissões filtradas
      setFormData(prev => ({
        ...prev,
        permissoesIds: prev.permissoesIds.filter(id => 
          !filteredPermissoes.some(p => p.id === id)
        )
      }));
    } else {
      // Marcar todas as permissões filtradas
      const newIds = filteredPermissoes.map(p => p.id);
      setFormData(prev => ({
        ...prev,
        permissoesIds: [...new Set([...prev.permissoesIds, ...newIds])]
      }));
    }
  };

  const getFilteredPermissoes = () => {
    if (!searchPermissoes) return todasPermissoes;
    
    return todasPermissoes.filter(permissao => 
      permissao.nome.toLowerCase().includes(searchPermissoes.toLowerCase()) ||
      permissao.recurso.toLowerCase().includes(searchPermissoes.toLowerCase()) ||
      permissao.acao.toLowerCase().includes(searchPermissoes.toLowerCase())
    );
  };

  const groupedPermissoes = getFilteredPermissoes().reduce((acc, permissao) => {
    if (!acc[permissao.recurso]) {
      acc[permissao.recurso] = [];
    }
    acc[permissao.recurso].push(permissao);
    return acc;
  }, {} as Record<string, Permissao[]>);

  if (perfilLoading || permissoesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Carregando...</div>
      </div>
    );
  }

  if (perfilError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Erro</h2>
          <p className="text-muted-foreground">{perfilError}</p>
          <Button onClick={() => router.push('/perfis')}>Voltar</Button>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Perfil não encontrado</h2>
          <Button onClick={() => router.push('/perfis')}>Voltar</Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'perfis', acao: 'criar' }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/perfis">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Editar Perfil</h1>
              <p className="text-muted-foreground">
                Atualize as informações do perfil
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
                    Defina as informações principais do perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Digite o nome do perfil"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Digite uma descrição para o perfil"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                    />
                    <Label htmlFor="ativo">Perfil ativo</Label>
                  </div>
                </CardContent>
              </Card>

              {/* Permissões */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Permissões</CardTitle>
                      <CardDescription>
                        Selecione as permissões que este perfil terá
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {formData.permissoesIds.length} selecionadas
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Buscar permissões..."
                      value={searchPermissoes}
                      onChange={(e) => setSearchPermissoes(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllPermissoes}
                    >
                      {getFilteredPermissoes().every(p => formData.permissoesIds.includes(p.id))
                        ? 'Desmarcar Todas'
                        : 'Marcar Todas'
                      }
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {Object.entries(groupedPermissoes).map(([recurso, permissoes]) => (
                      <div key={recurso} className="space-y-2">
                        <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                          {recurso}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {permissoes.map((permissao) => (
                            <div key={permissao.id} className="flex items-center space-x-2 p-2 border rounded">
                              <Checkbox
                                id={permissao.id}
                                checked={formData.permissoesIds.includes(permissao.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissaoToggle(permissao.id, checked as boolean)
                                }
                              />
                              <div className="flex-1 min-w-0">
                                <Label 
                                  htmlFor={permissao.id} 
                                  className="text-sm font-medium cursor-pointer"
                                >
                                  {permissao.nome}
                                </Label>
                                <p className="text-xs text-muted-foreground truncate">
                                  {permissao.acao}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {getFilteredPermissoes().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma permissão encontrada
                    </div>
                  )}
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
                    <Label className="text-sm font-medium">Permissões</Label>
                    <p className="text-sm text-muted-foreground">
                      {formData.permissoesIds.length} selecionadas
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col space-y-2">
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/perfis')}
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
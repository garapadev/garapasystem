'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createGrupoHierarquico, useAllGruposHierarquicos } from '@/hooks/useGruposHierarquicos';
import { useToast } from '@/hooks/use-toast';

export default function NovoGrupoHierarquicoPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { grupos, loading: gruposLoading } = useAllGruposHierarquicos();
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
    parentId: 'none'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createGrupoHierarquico({
        nome: formData.nome,
        descricao: formData.descricao || undefined,
        ativo: formData.ativo,
        parentId: formData.parentId === 'none' ? undefined : formData.parentId
      });

      toast({
        title: "Sucesso",
        description: "Grupo hierárquico criado com sucesso.",
      });

      router.push('/grupos-hierarquicos');
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      setError('Erro ao criar grupo hierárquico. Tente novamente.');
      toast({
        title: "Erro",
        description: "Erro ao criar grupo hierárquico.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/grupos-hierarquicos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Building2 className="h-6 w-6" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Novo Grupo Hierárquico</h1>
              <p className="text-muted-foreground">
                Crie um novo grupo na estrutura organizacional
              </p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais do grupo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    rows={3}
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

            {/* Hierarquia */}
            <Card>
              <CardHeader>
                <CardTitle>Hierarquia</CardTitle>
                <CardDescription>
                  Posição do grupo na estrutura organizacional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="parentId">Grupo Superior</Label>
                  <Select value={formData.parentId} onValueChange={(value) => handleChange('parentId', value)} disabled={gruposLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={gruposLoading ? "Carregando grupos..." : "Selecione o grupo superior (opcional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum (Grupo Raiz)</SelectItem>
                      {grupos?.map((grupo) => (
                        <SelectItem key={grupo.id} value={grupo.id}>
                          {grupo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Informações sobre Hierarquia</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Se não selecionar um grupo superior, este será um grupo raiz</li>
                    <li>• Grupos raiz não possuem superiores</li>
                    <li>• Você pode criar subgrupos dentro de grupos existentes</li>
                    <li>• A hierarquia é usada para organizar colaboradores e clientes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/grupos-hierarquicos">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting || gruposLoading}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {isSubmitting ? 'Salvando...' : 'Salvar Grupo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
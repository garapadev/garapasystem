'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Trash2, Save, FileText, Loader2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useLaudoTecnico, ItemLaudo } from '@/hooks/useLaudoTecnico';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LaudoFormData {
  diagnostico: string;
  solucaoRecomendada: string;
  observacoes?: string;
  gerarOrcamentoAutomatico: boolean;
  itens: ItemLaudo[];
}

export default function EditarLaudoTecnico() {
  const router = useRouter();
  const params = useParams();
  const { canAccess } = useAuth();
  const { laudo, fetchLaudo, updateLaudo, loading, saving } = useLaudoTecnico(params.id as string);
  const { toast } = useToast();

  const [formData, setFormData] = useState<LaudoFormData>({
    diagnostico: '',
    solucaoRecomendada: '',
    observacoes: '',
    gerarOrcamentoAutomatico: false,
    itens: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (params.id) {
      fetchLaudo();
    }
  }, [params.id, fetchLaudo]);

  useEffect(() => {
    if (laudo) {
      setFormData({
        diagnostico: laudo.diagnostico || '',
        solucaoRecomendada: laudo.solucaoRecomendada || '',
        observacoes: laudo.observacoes || '',
        gerarOrcamentoAutomatico: laudo.gerarOrcamentoAutomatico || false,
        itens: laudo.itens || []
      });
    }
  }, [laudo]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.diagnostico.trim()) {
      newErrors.diagnostico = 'Diagnóstico é obrigatório';
    }
    if (!formData.solucaoRecomendada.trim()) {
      newErrors.solucaoRecomendada = 'Solução recomendada é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Erro de validação',
        description: 'Por favor, corrija os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await updateLaudo(params.id as string, formData);
      toast({
        title: 'Sucesso',
        description: 'Laudo técnico atualizado com sucesso!'
      });
      router.push(`/laudos-tecnicos/${params.id}`);
    } catch (error) {
      console.error('Erro ao atualizar laudo:', error);
    }
  };

  const addItem = () => {
    const newItem: ItemLaudo = {
      descricao: '',
      tipo: 'DIAGNOSTICO',
      valorUnitario: 0,
      quantidade: 1,
      valorTotal: 0
    };
    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, newItem]
    }));
  };

  const updateItem = (index: number, field: keyof ItemLaudo, value: any) => {
    const updatedItens = [...formData.itens];
    updatedItens[index] = { ...updatedItens[index], [field]: value };
    
    // Recalcular valor total
    if (field === 'valorUnitario' || field === 'quantidade') {
      const valorUnitario = updatedItens[index].valorUnitario || 0;
      const quantidade = updatedItens[index].quantidade || 1;
      updatedItens[index].valorTotal = valorUnitario * quantidade;
    }
    
    setFormData(prev => ({ ...prev, itens: updatedItens }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const getTipoLabel = (tipo: string) => {
    const tipos = {
      DIAGNOSTICO: 'Diagnóstico',
      SOLUCAO: 'Solução',
      RECOMENDACAO: 'Recomendação',
      OBSERVACAO: 'Observação'
    };
    return tipos[tipo as keyof typeof tipos] || tipo;
  };

  const getTipoBadgeVariant = (tipo: string) => {
    const variants = {
      DIAGNOSTICO: 'default',
      SOLUCAO: 'secondary',
      RECOMENDACAO: 'outline',
      OBSERVACAO: 'destructive'
    };
    return variants[tipo as keyof typeof variants] || 'default';
  };

  const valorTotalItens = formData.itens.reduce((total, item) => total + (item.valorTotal || 0), 0);

  // Verificar se o laudo pode ser editado
  const canEdit = laudo?.status === 'RASCUNHO' && canAccess.laudos?.update;

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando laudo...</span>
        </div>
      </div>
    );
  }

  if (!laudo) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Laudo não encontrado</h1>
          <Button onClick={() => router.push('/laudos-tecnicos')}>
            Voltar para Laudos
          </Button>
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Não é possível editar este laudo</h1>
          <p className="text-muted-foreground mb-4">
            {laudo.status !== 'RASCUNHO' 
              ? 'Apenas laudos em rascunho podem ser editados.' 
              : 'Você não tem permissão para editar laudos.'}
          </p>
          <Button onClick={() => router.push(`/laudos-tecnicos/${params.id}`)}>
            Voltar para Visualização
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'laudos', acao: 'editar' }}>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/laudos-tecnicos/${params.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Laudo Técnico</h1>
            <p className="text-muted-foreground">
              Editando laudo #{laudo.id} - OS #{laudo.ordemServicoId}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Laudo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnostico">Diagnóstico *</Label>
                <Textarea
                  id="diagnostico"
                  value={formData.diagnostico}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnostico: e.target.value }))}
                  placeholder="Diagnóstico técnico"
                  rows={3}
                  className={errors.diagnostico ? 'border-red-500' : ''}
                />
                {errors.diagnostico && (
                  <p className="text-sm text-red-500">{errors.diagnostico}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="solucaoRecomendada">Solução Recomendada *</Label>
                <Textarea
                  id="solucaoRecomendada"
                  value={formData.solucaoRecomendada}
                  onChange={(e) => setFormData(prev => ({ ...prev, solucaoRecomendada: e.target.value }))}
                  placeholder="Solução recomendada para o problema"
                  rows={3}
                  className={errors.solucaoRecomendada ? 'border-red-500' : ''}
                />
                {errors.solucaoRecomendada && (
                  <p className="text-sm text-red-500">{errors.solucaoRecomendada}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Observações adicionais (opcional)"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="gerarOrcamentoAutomatico"
                  checked={formData.gerarOrcamentoAutomatico}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, gerarOrcamentoAutomatico: checked as boolean }))
                  }
                />
                <Label htmlFor="gerarOrcamentoAutomatico">
                  Gerar orçamento automaticamente após aprovação
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Itens do Laudo */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Itens do Laudo</CardTitle>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {formData.itens.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum item adicionado. Clique em "Adicionar Item" para começar.
                </p>
              ) : (
                <div className="space-y-4">
                  {formData.itens.map((item, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={getTipoBadgeVariant(item.tipo) as any}>
                          {getTipoLabel(item.tipo)}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={item.tipo}
                            onValueChange={(value) => updateItem(index, 'tipo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DIAGNOSTICO">Diagnóstico</SelectItem>
                              <SelectItem value="SOLUCAO">Solução</SelectItem>
                              <SelectItem value="RECOMENDACAO">Recomendação</SelectItem>
                              <SelectItem value="OBSERVACAO">Observação</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Input
                            value={item.descricao}
                            onChange={(e) => updateItem(index, 'descricao', e.target.value)}
                            placeholder="Descrição do item"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Valor Unitário</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.valorUnitario || 0}
                            onChange={(e) => updateItem(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
                            placeholder="0,00"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantidade || 1}
                            onChange={(e) => updateItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                            placeholder="1"
                          />
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          Valor Total: <span className="font-medium">
                            R$ {(item.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}

                  {formData.itens.length > 0 && (
                    <>
                      <Separator />
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          Total Geral: R$ {valorTotalItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/laudos-tecnicos/${params.id}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
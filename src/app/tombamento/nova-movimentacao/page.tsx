'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Search } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ItemTombamento {
  id: string;
  numeroTombamento: string;
  descricao: string;
  localizacao: string;
  status: string;
}

interface MovimentacaoFormData {
  itemId: string;
  tipo: 'TRANSFERENCIA' | 'MANUTENCAO' | 'BAIXA';
  localizacaoOrigem: string;
  localizacaoDestino: string;
  observacoes: string;
}

export default function NovaMovimentacaoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itens, setItens] = useState<ItemTombamento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<ItemTombamento | null>(null);

  const [formData, setFormData] = useState<MovimentacaoFormData>({
    itemId: '',
    tipo: 'TRANSFERENCIA',
    localizacaoOrigem: '',
    localizacaoDestino: '',
    observacoes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchItens();
  }, []);

  const fetchItens = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tombamento?status=ATIVO');
      if (response.ok) {
        const data = await response.json();
        setItens(data.itens || []);
      } else {
        toast.error('Erro ao carregar itens');
      }
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      toast.error('Erro ao carregar itens');
    } finally {
      setLoading(false);
    }
  };

  const filteredItens = itens.filter(item =>
    item.numeroTombamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleItemSelect = (item: ItemTombamento) => {
    setSelectedItem(item);
    setFormData(prev => ({
      ...prev,
      itemId: item.id,
      localizacaoOrigem: item.localizacao
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.itemId) {
      newErrors.itemId = 'Item é obrigatório';
    }
    if (!formData.tipo) {
      newErrors.tipo = 'Tipo de movimentação é obrigatório';
    }
    if (!formData.localizacaoOrigem) {
      newErrors.localizacaoOrigem = 'Localização de origem é obrigatória';
    }
    if (formData.tipo === 'TRANSFERENCIA' && !formData.localizacaoDestino) {
      newErrors.localizacaoDestino = 'Localização de destino é obrigatória para transferência';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os campos obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/tombamento/movimentacoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          responsavelId: user?.id
        })
      });

      if (response.ok) {
        toast.success('Movimentação criada com sucesso!');
        router.push('/tombamento');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar movimentação');
      }
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      toast.error('Erro ao criar movimentação');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/tombamento');
  };

  return (
    <ProtectedRoute requiredPermissions={[{ recurso: 'tombamento', acao: 'create' }]}>
      <div className="container mx-auto py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Movimentação</h1>
            <p className="text-muted-foreground">
              Registre uma nova movimentação de ativo
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seleção de Item */}
          <Card>
            <CardHeader>
              <CardTitle>Selecionar Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredItens.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedItem?.id === item.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleItemSelect(item)}
                    >
                      <div className="font-medium">{item.numeroTombamento}</div>
                      <div className="text-sm text-muted-foreground">{item.descricao}</div>
                      <div className="text-xs text-muted-foreground">
                        Localização: {item.localizacao}
                      </div>
                    </div>
                  ))}
                  {filteredItens.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item encontrado
                    </div>
                  )}
                </div>
              )}
              {errors.itemId && (
                <p className="text-sm text-destructive">{errors.itemId}</p>
              )}
            </CardContent>
          </Card>

          {/* Formulário de Movimentação */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Movimentação</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Movimentação *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: 'TRANSFERENCIA' | 'MANUTENCAO' | 'BAIXA') =>
                      setFormData(prev => ({ ...prev, tipo: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                      <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                      <SelectItem value="BAIXA">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipo && (
                    <p className="text-sm text-destructive">{errors.tipo}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="localizacaoOrigem">Localização de Origem *</Label>
                  <Input
                    id="localizacaoOrigem"
                    value={formData.localizacaoOrigem}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, localizacaoOrigem: e.target.value }))
                    }
                    placeholder="Localização atual do item"
                    disabled={!!selectedItem}
                  />
                  {errors.localizacaoOrigem && (
                    <p className="text-sm text-destructive">{errors.localizacaoOrigem}</p>
                  )}
                </div>

                {formData.tipo === 'TRANSFERENCIA' && (
                  <div className="space-y-2">
                    <Label htmlFor="localizacaoDestino">Localização de Destino *</Label>
                    <Input
                      id="localizacaoDestino"
                      value={formData.localizacaoDestino}
                      onChange={(e) =>
                        setFormData(prev => ({ ...prev, localizacaoDestino: e.target.value }))
                      }
                      placeholder="Nova localização do item"
                    />
                    {errors.localizacaoDestino && (
                      <p className="text-sm text-destructive">{errors.localizacaoDestino}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, observacoes: e.target.value }))
                    }
                    placeholder="Observações sobre a movimentação..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || !selectedItem}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Movimentação
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
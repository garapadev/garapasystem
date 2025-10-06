'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Modulo {
  id: string;
  nome: string;
  titulo: string;
  ativo: boolean;
  core: boolean;
  icone?: string;
  ordem: number;
  permissao?: string;
  rota?: string;
  categoria?: string;
  descricao?: string;
}

interface ModuloDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modulo?: Modulo | null;
  onSuccess: () => void;
}

const categorias = [
  'Core',
  'CRM',
  'ERP',
  'Comunicação',
  'Suporte',
  'Relatórios',
  'Configurações',
  'Integrações',
  'Outros'
];

const icones = [
  '📊', '👥', '⚙️', '📧', '🎫', '💬', '📋', '💰', '🔧',
  '📈', '📉', '🏢', '👤', '🔒', '🌐', '📱', '💻', '🔔',
  '📁', '🗂️', '📝', '📊', '🎯', '🚀', '⭐', '🔍', '📞'
];

export function ModuloDialog({ open, onOpenChange, modulo, onSuccess }: ModuloDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    titulo: '',
    ativo: true,
    core: false,
    icone: '',
    ordem: 0,
    permissao: '',
    rota: '',
    categoria: 'none',
    descricao: ''
  });

  const isEditing = !!modulo;

  useEffect(() => {
    if (modulo) {
      setFormData({
        nome: modulo.nome,
        titulo: modulo.titulo,
        ativo: modulo.ativo,
        core: modulo.core,
        icone: modulo.icone || '',
        ordem: modulo.ordem,
        permissao: modulo.permissao || '',
        rota: modulo.rota || '',
        categoria: modulo.categoria || '',
        descricao: ''
      });
    } else {
      setFormData({
        nome: '',
        titulo: '',
        ativo: true,
        core: false,
        icone: '',
        ordem: 0,
        permissao: '',
        rota: '',
        categoria: 'none',
        descricao: ''
      });
    }
  }, [modulo, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim() || !formData.titulo.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome e título são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/modulos/${modulo.id}` : '/api/modulos';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          nome: formData.nome.toLowerCase().replace(/\s+/g, '-'),
          ordem: Number(formData.ordem) || 0,
          categoria: formData.categoria === 'none' ? '' : formData.categoria,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar módulo');
      }

      toast({
        title: 'Sucesso',
        description: `Módulo ${isEditing ? 'atualizado' : 'criado'} com sucesso`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar módulo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar módulo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNomeChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      nome: value,
      rota: value ? `/${value.toLowerCase().replace(/\s+/g, '-')}` : ''
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Módulo' : 'Novo Módulo'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Edite as informações do módulo abaixo.'
              : 'Preencha as informações para criar um novo módulo.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Dashboard"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Sistema *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Ex: dashboard"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rota">Rota</Label>
            <Input
              id="rota"
              value={formData.rota}
              onChange={(e) => setFormData(prev => ({ ...prev, rota: e.target.value }))}
              placeholder="Ex: /dashboard"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria || "none"}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma categoria</SelectItem>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem</Label>
              <Input
                id="ordem"
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData(prev => ({ ...prev, ordem: Number(e.target.value) }))}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permissao">Permissão</Label>
            <Input
              id="permissao"
              value={formData.permissao}
              onChange={(e) => setFormData(prev => ({ ...prev, permissao: e.target.value }))}
              placeholder="Ex: admin.modulos.view"
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2 p-4 border rounded-lg max-h-32 overflow-y-auto">
              {icones.map((icone, index) => (
                <button
                  key={index}
                  type="button"
                  className={`p-2 text-lg hover:bg-accent rounded transition-colors ${
                    formData.icone === icone ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, icone }))}
                >
                  {icone}
                </button>
              ))}
            </div>
            {formData.icone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Selecionado:</span>
                <span className="text-lg">{formData.icone}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, icone: '' }))}
                >
                  Remover
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
              <Label htmlFor="ativo">Módulo ativo</Label>
            </div>

            {!isEditing && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="core"
                  checked={formData.core}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, core: checked }))}
                />
                <Label htmlFor="core">Módulo core (não pode ser removido)</Label>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              placeholder="Descrição opcional do módulo..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Atualizar' : 'Criar'} Módulo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Plus, 
  Search, 
  Settings, 
  Trash2, 
  Edit, 
  Eye,
  Filter,
  MoreHorizontal,
  Power,
  PowerOff
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ModuloDialog } from '@/components/configuracoes/ModuloDialog';
import { ModuloDeleteDialog } from '@/components/configuracoes/ModuloDeleteDialog';

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
  createdAt: string;
  updatedAt: string;
  logs?: Array<{
    id: string;
    acao: string;
    detalhes: string;
    createdAt: string;
    autor?: {
      id: string;
      nome: string;
    };
  }>;
}

export default function ModulosPage() {
  const { toast } = useToast();
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAtivo, setFilterAtivo] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterCore, setFilterCore] = useState<string>('all');
  const [selectedModulos, setSelectedModulos] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingModulo, setEditingModulo] = useState<Modulo | null>(null);
  const [deletingModulo, setDeletingModulo] = useState<Modulo | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  const fetchModulos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/modulos');
      if (!response.ok) throw new Error('Erro ao carregar módulos');
      
      const data = await response.json();
      setModulos(data.data || []);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar módulos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModulos();
  }, []);

  const handleToggleAtivo = async (modulo: Modulo) => {
    if (modulo.core && modulo.ativo) {
      toast({
        title: 'Ação não permitida',
        description: 'Módulos core não podem ser desativados',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/modulos/${modulo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !modulo.ativo }),
      });

      if (!response.ok) throw new Error('Erro ao atualizar módulo');

      const updatedModulo = await response.json();
      setModulos(prev => prev.map(m => m.id === modulo.id ? updatedModulo : m));
      
      toast({
        title: 'Sucesso',
        description: `Módulo ${updatedModulo.ativo ? 'ativado' : 'desativado'} com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar módulo',
        variant: 'destructive',
      });
    }
  };

  const handleBatchAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedModulos.length === 0) {
      toast({
        title: 'Nenhum módulo selecionado',
        description: 'Selecione pelo menos um módulo para continuar',
        variant: 'destructive',
      });
      return;
    }

    setBatchLoading(true);
    try {
      const response = await fetch('/api/modulos/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          moduleIds: selectedModulos,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro na operação em lote');
      }

      const result = await response.json();
      
      toast({
        title: 'Sucesso',
        description: result.message,
      });

      setSelectedModulos([]);
      await fetchModulos();
    } catch (error: any) {
      console.error('Erro na operação em lote:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro na operação em lote',
        variant: 'destructive',
      });
    } finally {
      setBatchLoading(false);
    }
  };

  const handleEdit = (modulo: Modulo) => {
    setEditingModulo(modulo);
    setDialogOpen(true);
  };

  const handleDelete = (modulo: Modulo) => {
    setDeletingModulo(modulo);
    setDeleteDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setEditingModulo(null);
    fetchModulos();
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setDeletingModulo(null);
    fetchModulos();
  };

  const filteredModulos = modulos.filter(modulo => {
    const matchesSearch = modulo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         modulo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (modulo.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAtivo = filterAtivo === '' || filterAtivo === 'all' || modulo.ativo.toString() === filterAtivo;
    const matchesCategoria = filterCategoria === '' || filterCategoria === 'all' || modulo.categoria === filterCategoria;
    const matchesCore = filterCore === '' || filterCore === 'all' || modulo.core.toString() === filterCore;

    return matchesSearch && matchesAtivo && matchesCategoria && matchesCore;
  });

  const categorias = Array.from(new Set(
    modulos
      .map(m => m.categoria)
      .filter(categoria => categoria && typeof categoria === 'string' && categoria.trim() !== '')
  ));

  // Debug logs
  console.log('Debug - modulos:', modulos.length);
  console.log('Debug - categorias brutas:', modulos.map(m => m.categoria));
  console.log('Debug - categorias filtradas:', categorias);
  console.log('Debug - filterCategoria:', filterCategoria);

  const toggleSelectAll = () => {
    if (selectedModulos.length === filteredModulos.length) {
      setSelectedModulos([]);
    } else {
      setSelectedModulos(filteredModulos.map(m => m.id));
    }
  };

  const toggleSelectModulo = (moduloId: string) => {
    setSelectedModulos(prev => 
      prev.includes(moduloId) 
        ? prev.filter(id => id !== moduloId)
        : [...prev, moduloId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Módulos do Sistema</h1>
          <p className="text-muted-foreground">
            Gerencie os módulos disponíveis no sistema
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Módulo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar módulos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, título ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterAtivo} onValueChange={setFilterAtivo}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Ativo</SelectItem>
                <SelectItem value="false">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categorias
                  .filter(categoria => categoria && typeof categoria === 'string' && categoria.trim() !== '')
                  .map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCore} onValueChange={setFilterCore}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="true">Core</SelectItem>
                <SelectItem value="false">Opcional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedModulos.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedModulos.length} módulo(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('activate')}
                  disabled={batchLoading}
                >
                  <Power className="h-4 w-4 mr-2" />
                  Ativar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBatchAction('deactivate')}
                  disabled={batchLoading}
                >
                  <PowerOff className="h-4 w-4 mr-2" />
                  Desativar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBatchAction('delete')}
                  disabled={batchLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedModulos.length === filteredModulos.length && filteredModulos.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModulos.map((modulo) => (
                <TableRow key={modulo.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedModulos.includes(modulo.id)}
                      onCheckedChange={() => toggleSelectModulo(modulo.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{modulo.titulo}</div>
                      <div className="text-sm text-muted-foreground">{modulo.nome}</div>
                      {modulo.rota && (
                        <div className="text-xs text-muted-foreground">{modulo.rota}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={modulo.ativo}
                        onCheckedChange={() => handleToggleAtivo(modulo)}
                        disabled={modulo.core && modulo.ativo}
                      />
                      <Badge variant={modulo.ativo ? 'default' : 'secondary'}>
                        {modulo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={modulo.core ? 'destructive' : 'outline'}>
                      {modulo.core ? 'Core' : 'Opcional'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {modulo.categoria || 'Sem categoria'}
                    </Badge>
                  </TableCell>
                  <TableCell>{modulo.ordem}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {modulo.permissao || 'Nenhuma'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(modulo)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        {!modulo.core && (
                          <DropdownMenuItem 
                            onClick={() => handleDelete(modulo)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ModuloDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        modulo={editingModulo}
        onSuccess={handleDialogSuccess}
      />

      <ModuloDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        modulo={deletingModulo}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
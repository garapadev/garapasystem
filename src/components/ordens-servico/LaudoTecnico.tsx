'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Plus, Trash2, Save, Send, Calculator, User, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLaudoTecnico, type LaudoFormData, type ItemLaudo } from '@/hooks/useLaudoTecnico';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface LaudoTecnicoProps {
  ordemServicoId: string;
  onLaudoUpdate?: () => void;
}

export default function LaudoTecnico({ ordemServicoId, onLaudoUpdate }: LaudoTecnicoProps) {
  console.log('LaudoTecnico renderizando com ordemServicoId:', ordemServicoId);
  const [editing, setEditing] = useState(false);
  const { user } = useAuth();
  const {
    laudo,
    loading,
    saving,
    fetchLaudo,
    createLaudo,
    updateLaudo,
    concluirLaudo,
    gerarOrcamento,
    deleteLaudo
  } = useLaudoTecnico(ordemServicoId);

  // Estado do formulário
  const [formData, setFormData] = useState<LaudoFormData>({
    diagnostico: '',
    solucaoRecomendada: '',
    observacoes: '',
    gerarOrcamentoAutomatico: false,
    itens: []
  });

  const [novoItem, setNovoItem] = useState<ItemLaudo>({
    descricao: '',
    tipo: 'DIAGNOSTICO'
  });

  // Carregar laudo ao montar o componente
  useEffect(() => {
    fetchLaudo();
  }, [fetchLaudo]);

  // Atualizar formulário quando laudo carrega
  useEffect(() => {
    if (laudo) {
      setFormData({
        diagnostico: laudo.diagnostico,
        solucaoRecomendada: laudo.solucaoRecomendada,
        observacoes: laudo.observacoes || '',
        gerarOrcamentoAutomatico: laudo.gerarOrcamentoAutomatico,
        itens: laudo.itens
      });
    }
  }, [laudo]);

  const handleSave = async () => {
    try {
      if (laudo?.id) {
        await updateLaudo(laudo.id, formData);
      } else {
        await createLaudo(formData);
      }
      setEditing(false);
      onLaudoUpdate?.();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleConcluir = async () => {
    if (!laudo?.id) return;
    
    try {
      await concluirLaudo(laudo.id);
      onLaudoUpdate?.();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleGerarOrcamento = async () => {
    if (!laudo?.id) return;
    
    try {
      await gerarOrcamento(laudo.id);
      onLaudoUpdate?.();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleDelete = async () => {
    if (!laudo?.id) return;
    
    try {
      await deleteLaudo(laudo.id);
      onLaudoUpdate?.();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const adicionarItem = () => {
    if (!novoItem.descricao.trim()) return;

    const item: ItemLaudo = {
      ...novoItem,
      valorTotal: novoItem.valorUnitario && novoItem.quantidade 
        ? novoItem.valorUnitario * novoItem.quantidade 
        : undefined
    };

    setFormData(prev => ({
      ...prev,
      itens: [...prev.itens, item]
    }));

    setNovoItem({
      descricao: '',
      tipo: 'DIAGNOSTICO'
    });
  };

  const removerItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      RASCUNHO: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Rascunho' },
      CONCLUIDO: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Concluído' },
      APROVADO: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprovado' },
      REJEITADO: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejeitado' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Laudo Técnico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Carregando laudo técnico...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!laudo && !editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Laudo Técnico
          </CardTitle>
          <CardDescription>
            Nenhum laudo técnico foi criado para esta ordem de serviço.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setEditing(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Criar Laudo Técnico
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle>Laudo Técnico</CardTitle>
            {laudo && getStatusBadge(laudo.status)}
          </div>
          <div className="flex items-center gap-2">
            {laudo && laudo.status === 'RASCUNHO' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                >
                  {editing ? 'Cancelar' : 'Editar'}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Laudo Técnico</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este laudo técnico? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
        {laudo && (
          <CardDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {laudo.tecnico.nome}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDateTime(laudo.createdAt)}
            </span>
            {laudo.dataFinalizacao && (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Finalizado em {formatDateTime(laudo.dataFinalizacao)}
              </span>
            )}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {editing ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diagnostico">Diagnóstico *</Label>
                <Textarea
                  id="diagnostico"
                  placeholder="Descreva o diagnóstico do problema..."
                  value={formData.diagnostico}
                  onChange={(e) => setFormData(prev => ({ ...prev, diagnostico: e.target.value }))}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="solucao">Solução Recomendada *</Label>
                <Textarea
                  id="solucao"
                  placeholder="Descreva a solução recomendada..."
                  value={formData.solucaoRecomendada}
                  onChange={(e) => setFormData(prev => ({ ...prev, solucaoRecomendada: e.target.value }))}
                  rows={4}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais..."
                value={formData.observacoes}
                onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="gerar-orcamento"
                checked={formData.gerarOrcamentoAutomatico}
                onChange={(e) => setFormData(prev => ({ ...prev, gerarOrcamentoAutomatico: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <Label htmlFor="gerar-orcamento">Gerar orçamento automaticamente</Label>
            </div>

            {/* Seção de Itens */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-medium">Itens do Laudo</h4>
              </div>

              {/* Adicionar novo item */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 p-4 border rounded-lg bg-gray-50">
                <div className="md:col-span-2">
                  <Input
                    placeholder="Descrição do item"
                    value={novoItem.descricao}
                    onChange={(e) => setNovoItem(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>
                <div>
                  <Select
                    value={novoItem.tipo}
                    onValueChange={(value: any) => setNovoItem(prev => ({ ...prev, tipo: value }))}
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
                {formData.gerarOrcamentoAutomatico && (
                  <>
                    <div>
                      <Input
                        type="number"
                        placeholder="Qtd"
                        value={novoItem.quantidade || ''}
                        onChange={(e) => setNovoItem(prev => ({ 
                          ...prev, 
                          quantidade: e.target.value ? Number(e.target.value) : undefined 
                        }))}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        placeholder="Valor Unit."
                        value={novoItem.valorUnitario || ''}
                        onChange={(e) => setNovoItem(prev => ({ 
                          ...prev, 
                          valorUnitario: e.target.value ? Number(e.target.value) : undefined 
                        }))}
                      />
                    </div>
                  </>
                )}
                <div>
                  <Button onClick={adicionarItem} size="sm" className="w-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Lista de itens */}
              {formData.itens.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      {formData.gerarOrcamentoAutomatico && (
                        <>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Valor Unit.</TableHead>
                          <TableHead>Total</TableHead>
                        </>
                      )}
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.tipo.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        {formData.gerarOrcamentoAutomatico && (
                          <>
                            <TableCell>{item.quantidade || '-'}</TableCell>
                            <TableCell>{item.valorUnitario ? formatCurrency(item.valorUnitario) : '-'}</TableCell>
                            <TableCell>{item.valorTotal ? formatCurrency(item.valorTotal) : '-'}</TableCell>
                          </>
                        )}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerItem(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {formData.gerarOrcamentoAutomatico && formData.itens.length > 0 && (
                <div className="flex justify-end">
                  <div className="text-lg font-semibold">
                    Total: {formatCurrency(
                      formData.itens.reduce((total, item) => total + (item.valorTotal || 0), 0)
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        ) : laudo ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Diagnóstico</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{laudo.diagnostico}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Solução Recomendada</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{laudo.solucaoRecomendada}</p>
              </div>
            </div>

            {laudo.observacoes && (
              <div>
                <h4 className="font-medium mb-2">Observações</h4>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{laudo.observacoes}</p>
              </div>
            )}

            {laudo.itens.length > 0 && (
              <div>
                <h4 className="font-medium mb-4">Itens do Laudo</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      {laudo.gerarOrcamentoAutomatico && (
                        <>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Valor Unit.</TableHead>
                          <TableHead>Total</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laudo.itens.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.tipo.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        {laudo.gerarOrcamentoAutomatico && (
                          <>
                            <TableCell>{item.quantidade || '-'}</TableCell>
                            <TableCell>{item.valorUnitario ? formatCurrency(item.valorUnitario) : '-'}</TableCell>
                            <TableCell>{item.valorTotal ? formatCurrency(item.valorTotal) : '-'}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {laudo.gerarOrcamentoAutomatico && laudo.valorTotalOrcamento && (
                  <div className="flex justify-end mt-4">
                    <div className="text-lg font-semibold">
                      Total do Orçamento: {formatCurrency(laudo.valorTotalOrcamento)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {laudo.status === 'RASCUNHO' && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(true)}>
                  Editar
                </Button>
                <Button onClick={handleConcluir} disabled={saving}>
                  <Send className="w-4 h-4 mr-2" />
                  {saving ? 'Concluindo...' : 'Concluir Laudo'}
                </Button>
              </div>
            )}

            {laudo.status === 'CONCLUIDO' && laudo.gerarOrcamentoAutomatico && (
              <div className="flex justify-end">
                <Button onClick={handleGerarOrcamento} disabled={saving}>
                  <Calculator className="w-4 h-4 mr-2" />
                  {saving ? 'Gerando...' : 'Gerar Orçamento'}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { LaudoTecnico };
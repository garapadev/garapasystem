'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAllGruposHierarquicos } from '@/hooks/useGruposHierarquicos';
import { 
  Building2, 
  ArrowRight, 
  Send, 
  ChevronRight,
  Users,
  MapPin
} from 'lucide-react';

interface GrupoHierarquico {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  parentId?: string;
  parent?: GrupoHierarquico;
  children?: GrupoHierarquico[];
}

interface Department {
  id: string;
  nome: string;
  cor: string;
  grupoHierarquicoId?: string;
  grupoHierarquico?: GrupoHierarquico;
}

interface GrupoHierarquicoCardProps {
  ticket: {
    id: string;
    numero: string;
    assunto: string;
    departamento: Department;
  };
  onEncaminhar?: (novoGrupoId: string, observacao: string) => Promise<void>;
}

export function GrupoHierarquicoCard({ ticket, onEncaminhar }: GrupoHierarquicoCardProps) {
  const { toast } = useToast();
  const { grupos, loading: loadingGrupos } = useAllGruposHierarquicos();
  const [showEncaminharDialog, setShowEncaminharDialog] = useState(false);
  const [novoGrupoId, setNovoGrupoId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isEncaminhando, setIsEncaminhando] = useState(false);

  const grupoAtual = ticket.departamento.grupoHierarquico;

  // Função para construir a hierarquia completa do grupo
  const buildHierarchyPath = (grupo: GrupoHierarquico | undefined): string[] => {
    if (!grupo) return [];
    
    const path = [grupo.nome];
    if (grupo.parent) {
      path.unshift(...buildHierarchyPath(grupo.parent));
    }
    return path;
  };

  // Função para filtrar grupos disponíveis para encaminhamento
  const getGruposDisponiveis = () => {
    if (!grupos) return [];
    
    // Filtrar grupos ativos e diferentes do atual
    return grupos.filter(grupo => 
      grupo.ativo && 
      grupo.id !== grupoAtual?.id
    );
  };

  const handleEncaminhar = async () => {
    if (!novoGrupoId || !onEncaminhar) return;

    try {
      setIsEncaminhando(true);
      await onEncaminhar(novoGrupoId, observacao);
      
      toast({
        title: "Ticket encaminhado",
        description: "O ticket foi encaminhado com sucesso para o novo grupo.",
      });
      
      setShowEncaminharDialog(false);
      setNovoGrupoId('');
      setObservacao('');
    } catch (error) {
      toast({
        title: "Erro ao encaminhar",
        description: "Não foi possível encaminhar o ticket. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsEncaminhando(false);
    }
  };

  const hierarchyPath = buildHierarchyPath(grupoAtual);
  const gruposDisponiveis = getGruposDisponiveis();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-blue-600" />
          Grupo Hierárquico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hierarquia do Grupo Atual */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Hierarquia Atual</Label>
          {grupoAtual ? (
            <div className="space-y-2">
              {/* Caminho da hierarquia */}
              <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                <MapPin className="h-4 w-4" />
                {hierarchyPath.length > 0 ? (
                  hierarchyPath.map((nome, index) => (
                    <React.Fragment key={index}>
                      <span className={index === hierarchyPath.length - 1 ? 'font-medium text-gray-900' : ''}>
                        {nome}
                      </span>
                      {index < hierarchyPath.length - 1 && (
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <span className="font-medium text-gray-900">{grupoAtual.nome}</span>
                )}
              </div>
              
              {/* Informações do grupo atual */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">{grupoAtual.nome}</h4>
                  <Badge variant="outline" className="text-blue-700 border-blue-300">
                    <Users className="h-3 w-3 mr-1" />
                    Grupo Atual
                  </Badge>
                </div>
                {grupoAtual.descricao && (
                  <p className="text-sm text-blue-700">{grupoAtual.descricao}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-sm text-gray-600">Departamento sem grupo hierárquico definido</p>
            </div>
          )}
        </div>

        {/* Departamento Associado */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Departamento</Label>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: ticket.departamento.cor }}
            />
            <span className="text-sm font-medium">{ticket.departamento.nome}</span>
          </div>
        </div>

        {/* Botão de Encaminhamento */}
        {onEncaminhar && gruposDisponiveis.length > 0 && (
          <div className="pt-2 border-t">
            <Dialog open={showEncaminharDialog} onOpenChange={setShowEncaminharDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Encaminhar para Outro Grupo
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Encaminhar Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="novoGrupo">Novo Grupo Hierárquico</Label>
                    <Select value={novoGrupoId} onValueChange={setNovoGrupoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grupo de destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {gruposDisponiveis.map((grupo) => (
                          <SelectItem key={grupo.id} value={grupo.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {grupo.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="observacao">Observação (opcional)</Label>
                    <Textarea
                      id="observacao"
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                      placeholder="Adicione uma observação sobre o encaminhamento..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowEncaminharDialog(false)}
                      disabled={isEncaminhando}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleEncaminhar}
                      disabled={!novoGrupoId || isEncaminhando}
                    >
                      {isEncaminhando ? 'Encaminhando...' : (
                        <>
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Encaminhar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';

interface Modulo {
  id: string;
  nome: string;
  titulo: string;
  ativo: boolean;
  core: boolean;
  icone?: string;
  categoria?: string;
}

interface ModuloDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modulo?: Modulo | null;
  onSuccess: () => void;
}

export function ModuloDeleteDialog({ open, onOpenChange, modulo, onSuccess }: ModuloDeleteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!modulo) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/modulos/${modulo.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir módulo');
      }

      toast({
        title: 'Sucesso',
        description: 'Módulo excluído com sucesso',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao excluir módulo:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir módulo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O módulo será permanentemente removido do sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center space-x-3">
              {modulo.icone && (
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-lg">{modulo.icone}</span>
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium">{modulo.titulo}</div>
                <div className="text-sm text-muted-foreground">{modulo.nome}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={modulo.ativo ? 'default' : 'secondary'}>
                    {modulo.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant={modulo.core ? 'destructive' : 'outline'}>
                    {modulo.core ? 'Core' : 'Opcional'}
                  </Badge>
                  {modulo.categoria && (
                    <Badge variant="outline">
                      {modulo.categoria}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {modulo.core && (
            <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium text-destructive">Atenção: Módulo Core</div>
                  <div className="text-muted-foreground">
                    Este é um módulo core do sistema. A exclusão pode afetar o funcionamento de outras funcionalidades.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o módulo <strong>{modulo.titulo}</strong>?
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Excluir Módulo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Copy, Edit, Trash2, Eye, EyeOff, Key } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function ApiKeysSection() {
  const { apiKeys, loading, deleteApiKey, toggleApiKeyStatus } = useApiKeys();
  const router = useRouter();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Chave copiada para a área de transferência');
    } catch (error) {
      toast.error('Erro ao copiar chave');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta chave de API?')) {
      const result = await deleteApiKey(id);
      if (result) {
        toast.success('Chave de API excluída com sucesso!');
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleApiKeyStatus(id, !currentStatus);
    if (result) {
      toast.success(`Chave ${!currentStatus ? 'ativada' : 'desativada'} com sucesso!`);
    }
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const displayedApiKeys = apiKeys.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Chaves de API</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as chaves de API para integração com sistemas externos.
          </p>
        </div>
        <Link href="/chaves-api/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Chave
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando chaves de API...</p>
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
          <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma chave de API configurada</h3>
          <p className="text-muted-foreground mb-4">
            Crie sua primeira chave de API para começar a integrar com sistemas externos.
          </p>
          <Link href="/chaves-api/nova">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Chave
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Uso</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedApiKeys.map((apiKey) => (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.nome}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {showKeys[apiKey.id] ? apiKey.chave : maskApiKey(apiKey.chave)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                        >
                          {showKeys[apiKey.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.chave)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={apiKey.ativo}
                          onCheckedChange={() => handleToggleStatus(apiKey.id, apiKey.ativo)}
                        />
                        <Badge variant={apiKey.ativo ? 'default' : 'secondary'}>
                          {apiKey.ativo ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {apiKey.ultimoUso
                        ? format(new Date(apiKey.ultimoUso), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      {apiKey.expiresAt
                        ? format(new Date(apiKey.expiresAt), 'dd/MM/yyyy', { locale: ptBR })
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/chaves-api/${apiKey.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(apiKey.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {apiKeys.length > 5 && (
            <div className="text-center">
              <Link href="/chaves-api">
                <Button variant="outline">
                  Ver Todas as Chaves ({apiKeys.length})
                </Button>
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
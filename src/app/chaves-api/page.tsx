'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Plus, MoreHorizontal, Edit, Trash2, Key, Search, CheckCircle, XCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { useApiKeys } from '@/hooks/useApiKeys';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function getStatusIcon(status: boolean) {
  return status ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
}

export default function ChavesApiPage() {
  const { apiKeys, loading, deleteApiKey, toggleApiKeyStatus } = useApiKeys();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const handleDeleteApiKey = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta chave de API? Esta ação não pode ser desfeita.')) {
      await deleteApiKey(id);
    }
  };

  const toggleKeyVisibility = (id: string) => {
    const newVisibleKeys = new Set(visibleKeys);
    if (newVisibleKeys.has(id)) {
      newVisibleKeys.delete(id);
    } else {
      newVisibleKeys.add(id);
    }
    setVisibleKeys(newVisibleKeys);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Chave copiada para a área de transferência');
    } catch (error) {
      toast.error('Erro ao copiar chave');
    }
  };

  const maskApiKey = (key: string) => {
    if (!key || key.length <= 8) return key || '';
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  const filteredApiKeys = apiKeys.filter(apiKey => 
    apiKey.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Chaves de API</h1>
            <p className="text-muted-foreground">
              Gerencie as chaves de API para integração com sistemas externos.
            </p>
          </div>
          <div className="animate-pulse bg-muted h-10 w-32 rounded"></div>
        </div>
        <div className="animate-pulse bg-muted h-64 rounded"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chaves de API</h1>
          <p className="text-muted-foreground">
            Gerencie as chaves de API para integração com sistemas externos.
          </p>
        </div>
        <Link href="/chaves-api/nova">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Chave de API
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar chaves de API..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {filteredApiKeys.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Key className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm ? 'Nenhuma chave encontrada' : 'Nenhuma chave de API criada'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'Tente ajustar os termos de busca.'
              : 'Crie chaves de API para permitir integração com sistemas externos.'
            }
          </p>
          {!searchTerm && (
            <Link href="/chaves-api/nova">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Chave
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Chave</TableHead>
                <TableHead>Permissões</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Último Uso</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApiKeys.map((apiKey) => {
                const permissoes = Array.isArray(apiKey.permissoes) 
                  ? apiKey.permissoes 
                  : JSON.parse(apiKey.permissoes || '[]');
                const isVisible = visibleKeys.has(apiKey.id);
                
                return (
                  <TableRow key={apiKey.id}>
                    <TableCell className="font-medium">{apiKey.nome}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      <span className="text-muted-foreground">-</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                          {isVisible ? apiKey.chave : maskApiKey(apiKey.chave)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleKeyVisibility(apiKey.id)}
                          className="h-6 w-6 p-0"
                        >
                          {isVisible ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.chave)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {permissoes.slice(0, 2).map((permissao: string) => (
                          <Badge key={permissao} variant="secondary" className="text-xs">
                            {permissao}
                          </Badge>
                        ))}
                        {permissoes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{permissoes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(apiKey.ativo)}
                        <span className={apiKey.ativo ? 'text-green-600' : 'text-red-600'}>
                          {apiKey.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(apiKey.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground">
                        {apiKey.ultimoUso 
                          ? format(new Date(apiKey.ultimoUso), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                          : 'Nunca'
                        }
                      </span>
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
                          <DropdownMenuItem onClick={() => toggleApiKeyStatus(apiKey.id, !apiKey.ativo)}>
                            {apiKey.ativo ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Ativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(apiKey.chave)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar Chave
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteApiKey(apiKey.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
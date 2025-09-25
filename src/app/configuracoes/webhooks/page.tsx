'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Plus, MoreHorizontal, Edit, Trash2, Play, CheckCircle, XCircle, Clock, Webhook, Search } from 'lucide-react';
import { useWebhooks } from '@/hooks/useWebhooks';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const WEBHOOK_EVENTS = [
  { value: 'cliente.criado', label: 'Cliente Criado' },
  { value: 'cliente.atualizado', label: 'Cliente Atualizado' },
  { value: 'oportunidade.criada', label: 'Oportunidade Criada' },
  { value: 'oportunidade.atualizada', label: 'Oportunidade Atualizada' },
  { value: 'oportunidade.fechada', label: 'Oportunidade Fechada' },
  { value: 'usuario.criado', label: 'Usuário Criado' },
  { value: 'usuario.atualizado', label: 'Usuário Atualizado' },
];

function getEventLabel(value: string) {
  const event = WEBHOOK_EVENTS.find(e => e.value === value);
  return event ? event.label : value;
}

function getStatusIcon(status: boolean) {
  return status ? (
    <CheckCircle className="h-4 w-4 text-green-500" />
  ) : (
    <XCircle className="h-4 w-4 text-red-500" />
  );
}

export default function WebhooksPage() {
  const { webhooks, loading, deleteWebhook, toggleWebhookStatus } = useWebhooks();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const handleDeleteWebhook = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta configuração de webhook?')) {
      await deleteWebhook(id);
    }
  };

  const filteredWebhooks = webhooks.filter(webhook =>
    webhook.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    webhook.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando webhooks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks para receber notificações de eventos do sistema.
          </p>
        </div>
        <Link href="/configuracoes/webhooks/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Webhook
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar webhooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredWebhooks.length === 0 ? (
        <div className="text-center py-12">
          <Webhook className="mx-auto h-12 w-12 mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhum webhook encontrado</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Nenhum webhook corresponde à sua busca.' : 'Você ainda não configurou nenhum webhook.'}
          </p>
          <Link href="/configuracoes/webhooks/novo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Webhook
            </Button>
          </Link>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Envio</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWebhooks.map((webhook) => {
                const eventos = Array.isArray(webhook.eventos) 
                  ? webhook.eventos 
                  : JSON.parse(webhook.eventos || '[]');
                
                return (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.nome}</TableCell>
                    <TableCell className="max-w-xs truncate" title={webhook.url}>
                      {webhook.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {eventos.map((evento: string) => (
                          <Badge key={evento} variant="secondary" className="text-xs">
                            {getEventLabel(evento)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(webhook.ativo)}
                        <span className={webhook.ativo ? 'text-green-600' : 'text-red-600'}>
                          {webhook.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Nunca</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/configuracoes/webhooks/${webhook.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleWebhookStatus(webhook.id, !webhook.ativo)}>
                            {webhook.ativo ? (
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
                          <DropdownMenuItem>
                            <Play className="mr-2 h-4 w-4" />
                            Testar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteWebhook(webhook.id)}
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
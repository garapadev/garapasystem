'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { useClientes, deleteCliente } from '@/hooks/useClientes';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'CLIENTE':
      return 'default';
    case 'LEAD':
      return 'outline';
    case 'PROSPECT':
      return 'secondary';
    case 'INATIVO':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function ClientesPage() {
  const router = useRouter();
  const { canAccess } = useAuth();
  const { emitEntityUpdate } = useSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const limit = 10;
  
  const { clientes, loading, error, meta, refetch } = useClientes({
    page: currentPage,
    limit,
    search: searchTerm
  });

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      const cliente = clientes.find(c => c.id === id);
      await deleteCliente(id, cliente?.nome, emitEntityUpdate);
      toast.success('Cliente excluído com sucesso!');
      refetch();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  return (
    <ProtectedRoute requiredPermission={{ recurso: 'clientes', acao: 'ler' }}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie seus clientes e leads
            </p>
          </div>
          {canAccess.clientes.create && (
            <Button onClick={() => router.push('/clientes/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          )}
        </div>

        {/* Card de busca e filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtrar Clientes</CardTitle>
            <CardDescription>
              Busque clientes por nome ou email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              {loading ? 'Carregando...' : `${meta.total} clientes encontrados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-md">
                <p className="text-red-800">
                  {error}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refetch}
                    className="ml-2"
                  >
                    Tentar novamente
                  </Button>
                </p>
              </div>
            )}
            
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando clientes...</span>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor Potencial</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Nenhum cliente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientes.map((cliente) => (
                         <TableRow key={cliente.id}>
                           <TableCell className="font-medium">
                             {cliente.nome}
                           </TableCell>
                           <TableCell>{cliente.email || '-'}</TableCell>
                           <TableCell>{cliente.telefone || '-'}</TableCell>
                           <TableCell className="capitalize">
                             {cliente.tipo === 'PESSOA_FISICA' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                           </TableCell>
                           <TableCell>
                             <Badge variant={getStatusVariant(cliente.status)}>
                               {cliente.status}
                             </Badge>
                           </TableCell>
                           <TableCell>
                             {cliente.valorPotencial ? formatCurrency(cliente.valorPotencial) : '-'}
                           </TableCell>
                           <TableCell>
                             <div className="flex items-center space-x-2">
                               {canAccess.clientes.read && (
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   onClick={() => router.push(`/clientes/${cliente.id}`)}
                                 >
                                   <Eye className="h-4 w-4" />
                                 </Button>
                               )}
                               {canAccess.clientes.update && (
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   onClick={() => router.push(`/clientes/${cliente.id}/editar`)}
                                 >
                                   <Edit className="h-4 w-4" />
                                 </Button>
                               )}
                               {canAccess.clientes.delete && (
                                 <AlertDialog>
                                   <AlertDialogTrigger asChild>
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       disabled={deletingId === cliente.id}
                                     >
                                       {deletingId === cliente.id ? (
                                         <Loader2 className="h-4 w-4 animate-spin" />
                                       ) : (
                                         <Trash2 className="h-4 w-4" />
                                       )}
                                     </Button>
                                   </AlertDialogTrigger>
                                   <AlertDialogContent>
                                     <AlertDialogHeader>
                                       <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                       <AlertDialogDescription>
                                         Tem certeza que deseja excluir o cliente "{cliente.nome}"? Esta ação não pode ser desfeita.
                                       </AlertDialogDescription>
                                     </AlertDialogHeader>
                                     <AlertDialogFooter>
                                       <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                       <AlertDialogAction onClick={() => handleDelete(cliente.id)}>
                                         Excluir
                                       </AlertDialogAction>
                                     </AlertDialogFooter>
                                   </AlertDialogContent>
                                 </AlertDialog>
                               )}
                             </div>
                           </TableCell>
                         </TableRow>
                       ))
                     )}
                   </TableBody>
                 </Table>
               </div>
             )}
           </CardContent>
         </Card>

         {/* Pagination */}
         {!loading && meta.totalPages > 1 && (
           <div className="flex items-center justify-between">
             <p className="text-sm text-muted-foreground">
               Página {meta.page} de {meta.totalPages} ({meta.total} clientes)
             </p>
             <div className="flex items-center space-x-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                 disabled={currentPage === 1}
               >
                 Anterior
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, meta.totalPages))}
                 disabled={currentPage === meta.totalPages}
               >
                 Próxima
               </Button>
             </div>
           </div>
         )}
       </div>

     </ProtectedRoute>
   );
 }
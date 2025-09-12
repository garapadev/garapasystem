'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useHelpdeskDepartamentos } from '@/hooks/useHelpdeskDepartamentos';
import { useGruposHierarquicos } from '@/hooks/useGruposHierarquicos';

interface HelpdeskDepartamento {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  imapHost?: string;
  imapPort?: number;
  imapSecure: boolean;
  imapEmail?: string;
  imapPassword?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure: boolean;
  smtpEmail?: string;
  smtpPassword?: string;
  syncEnabled: boolean;
  syncInterval: number;
  lastSync?: Date;
  grupoHierarquicoId?: string;
  grupoHierarquico?: {
    id: string;
    nome: string;
  };
}



export default function HelpdeskTab() {
  const [departamentos, setDepartamentos] = useState<HelpdeskDepartamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toast } = useToast();
  const router = useRouter();

  // Carregar departamentos
  useEffect(() => {
    loadDepartamentos();
  }, []);

  const loadDepartamentos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/departamentos');
      if (response.ok) {
        const data = await response.json();
        // A API retorna um objeto com a propriedade 'departamentos'
        setDepartamentos(data.departamentos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar departamentos do Helpdesk',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };







  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este departamento?')) {
      return;
    }

    try {
      const response = await fetch(`/api/helpdesk/departamentos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Departamento excluído com sucesso'
        });
        loadDepartamentos();
      } else {
        throw new Error('Erro ao excluir departamento');
      }
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir departamento',
        variant: 'destructive'
      });
    }
  };



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">

                Departamentos do Helpdesk
              </CardTitle>
              <CardDescription>
                Configure os departamentos e suas respectivas configurações de email para o sistema de Helpdesk
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/helpdesk/departamentos/novo')}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Departamento
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sincronização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!Array.isArray(departamentos) || departamentos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum departamento cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  departamentos.map((departamento) => (
                    <TableRow key={departamento.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{departamento.nome}</div>
                          {departamento.descricao && (
                            <div className="text-sm text-muted-foreground">{departamento.descricao}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {departamento.grupoHierarquico?.nome || '-'}
                      </TableCell>
                      <TableCell>
                        {departamento.imapEmail || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={departamento.ativo ? 'default' : 'secondary'}>
                          {departamento.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {departamento.syncEnabled ? (
                          <div className="flex flex-col">
                            <Badge variant="default" className="mb-1">
                              Habilitada
                            </Badge>
                            {departamento.lastSync ? (
                              <span className="text-xs text-muted-foreground">
                                Última: {new Date(departamento.lastSync).toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                Nunca sincronizado
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary">
                            Desabilitada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/helpdesk/departamentos/${departamento.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(departamento.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
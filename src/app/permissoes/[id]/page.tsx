'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Shield, Users, Calendar, Hash } from 'lucide-react';
import Link from 'next/link';

// Dados mockados para exemplo
const mockPermissao = {
  id: '1',
  nome: 'Criar Clientes',
  descricao: 'Permite criar novos clientes e leads',
  recurso: 'clientes',
  acao: 'criar',
  createdAt: '2024-01-15',
  perfis: [
    { id: '1', nome: 'Administrador', descricao: 'Acesso completo ao sistema' },
    { id: '2', nome: 'Gerente de Vendas', descricao: 'Gerencia equipe de vendas' }
  ]
};

const getAcaoColor = (acao: string) => {
  switch (acao) {
    case 'criar':
      return 'bg-green-100 text-green-800';
    case 'editar':
      return 'bg-blue-100 text-blue-800';
    case 'excluir':
      return 'bg-red-100 text-red-800';
    case 'ler':
      return 'bg-gray-100 text-gray-800';
    case 'gerenciar':
      return 'bg-purple-100 text-purple-800';
    case 'administrar':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function PermissaoDetalhePage() {
  const params = useParams();
  const [permissao, setPermissao] = useState(mockPermissao);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando busca da permissão pelo ID
    const fetchPermissao = async () => {
      // Aqui você faria a chamada API para buscar a permissão
      // const response = await fetch(`/api/permissoes/${params.id}`);
      // const data = await response.json();
      
      // Por enquanto, usando dados mockados
      setTimeout(() => {
        setLoading(false);
      }, 500);
    };

    fetchPermissao();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/permissoes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{permissao.nome}</h1>
                <p className="text-muted-foreground">
                  Detalhes da permissão
                </p>
              </div>
            </div>
          </div>
          <Link href={`/permissoes/${permissao.id}/editar`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Descrição:</span>
                <span>{permissao.descricao}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Recurso:</span>
                <Badge variant="outline" className="capitalize">
                  {permissao.recurso}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">Ação:</span>
                <Badge className={getAcaoColor(permissao.acao)}>
                  {permissao.acao}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Criada em:</span>
                <span>{new Date(permissao.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Perfis Associados</span>
                </div>
                <Badge variant="outline">{permissao.perfis.length}</Badge>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Impacto da Permissão</h4>
                <p className="text-sm text-gray-600">
                  Esta permissão afeta {permissao.perfis.length} perfis e, 
                  consequentemente, todos os colaboradores associados a esses perfis.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Perfis Associados */}
        <Card>
          <CardHeader>
            <CardTitle>Perfis Associados</CardTitle>
            <CardDescription>
              Perfis que possuem esta permissão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {permissao.perfis.map((perfil) => (
                    <TableRow key={perfil.id}>
                      <TableCell className="font-medium">{perfil.nome}</TableCell>
                      <TableCell>{perfil.descricao}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/perfis/${perfil.id}`}>
                            <Button variant="ghost" size="sm">
                              Ver Detalhes
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">ID:</span>
                <span>{permissao.id}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Data de Criação:</span>
                <span>{new Date(permissao.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
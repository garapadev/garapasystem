'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Send } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useDepartamentos } from '@/hooks/useHelpdesk';

// Mock data para clientes e colaboradores - substituir por hooks reais
const mockClientes = [
  { id: 1, nome: 'João Silva', email: 'joao@email.com' },
  { id: 2, nome: 'Maria Santos', email: 'maria@email.com' },
  { id: 3, nome: 'Empresa ABC Ltda', email: 'contato@abc.com' },
  { id: 4, nome: 'Ana Costa', email: 'ana@email.com' }
];

const mockColaboradores = [
  { id: 1, nome: 'Carlos Oliveira' },
  { id: 2, nome: 'Pedro Lima' },
  { id: 3, nome: 'Maria Santos' },
  { id: 4, nome: 'Ana Silva' }
];

export default function NovoTicketPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    assunto: '',
    descricao: '',
    clienteId: '',
    departamentoId: '',
    prioridade: '',
    responsavelId: '',
    solicitanteNome: '',
    solicitanteEmail: '',
    solicitanteTelefone: ''
  });

  const { departamentos, loading: loadingDepartamentos } = useDepartamentos();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Auto-preencher dados do cliente quando selecionado
  const handleClienteChange = (clienteId: string) => {
    const cliente = mockClientes.find(c => c.id.toString() === clienteId);
    setFormData(prev => ({
      ...prev,
      clienteId,
      solicitanteNome: cliente?.nome || '',
      solicitanteEmail: cliente?.email || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.assunto || !formData.descricao || !formData.prioridade || !formData.departamentoId) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!formData.solicitanteNome || !formData.solicitanteEmail) {
      toast.error('Por favor, preencha os dados do solicitante.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/helpdesk/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar ticket');
      }

      const ticket = await response.json();
      toast.success('Ticket criado com sucesso!');
      
      // Redirecionar para o ticket criado
      router.push(`/helpdesk/${ticket.id}`);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar ticket. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/helpdesk">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Ticket</h1>
          <p className="text-muted-foreground">
            Crie um novo ticket de suporte
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assunto">Assunto *</Label>
                <Input
                  id="assunto"
                  placeholder="Descreva brevemente o problema ou solicitação"
                  value={formData.assunto}
                  onChange={(e) => handleInputChange('assunto', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva detalhadamente o problema, incluindo passos para reproduzir, mensagens de erro, etc."
                  value={formData.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  rows={6}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Classificação */}
          <Card>
            <CardHeader>
              <CardTitle>Classificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento *</Label>
                <Select 
                  value={formData.departamentoId} 
                  onValueChange={(value) => handleInputChange('departamentoId', value)}
                  disabled={loadingDepartamentos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingDepartamentos ? "Carregando..." : "Selecione o departamento responsável"} />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade *</Label>
                <Select value={formData.prioridade} onValueChange={(value) => handleInputChange('prioridade', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável</Label>
                <Select value={formData.responsavelId} onValueChange={(value) => handleInputChange('responsavelId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um responsável (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockColaboradores.map((colab) => (
                      <SelectItem key={colab.id} value={colab.id.toString()}>
                        {colab.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Informações do Cliente */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={formData.clienteId} onValueChange={handleClienteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id.toString()}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="solicitanteNome">Nome do Solicitante *</Label>
                <Input
                  id="solicitanteNome"
                  value={formData.solicitanteNome}
                  onChange={(e) => handleInputChange('solicitanteNome', e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solicitanteEmail">Email do Solicitante *</Label>
                <Input
                  id="solicitanteEmail"
                  type="email"
                  value={formData.solicitanteEmail}
                  onChange={(e) => handleInputChange('solicitanteEmail', e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solicitanteTelefone">Telefone do Solicitante</Label>
                <Input
                  id="solicitanteTelefone"
                  value={formData.solicitanteTelefone}
                  onChange={(e) => handleInputChange('solicitanteTelefone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/helpdesk">
              Cancelar
            </Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Criando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Criar Ticket
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
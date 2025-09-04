'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import Link from 'next/link';

// Opções para recursos e ações
const recursos = [
  'clientes',
  'colaboradores',
  'grupos',
  'perfis',
  'sistema',
  'relatorios'
];

const acoes = [
  { value: 'criar', label: 'Criar' },
  { value: 'ler', label: 'Ler/Visualizar' },
  { value: 'editar', label: 'Editar' },
  { value: 'excluir', label: 'Excluir' },
  { value: 'gerenciar', label: 'Gerenciar' },
  { value: 'administrar', label: 'Administrar' }
];

export default function NovaPermissaoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    recurso: '',
    acao: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica para salvar a permissão
    console.log('Salvando permissão:', formData);
    // Simulando salvamento e redirecionamento
    setTimeout(() => {
      router.push('/permissoes');
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateNomeSugestao = () => {
    if (formData.recurso && formData.acao) {
      const acaoLabel = acoes.find(a => a.value === formData.acao)?.label || formData.acao;
      const recursoLabel = formData.recurso.charAt(0).toUpperCase() + formData.recurso.slice(1);
      return `${acaoLabel} ${recursoLabel}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
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
              <h1 className="text-3xl font-bold tracking-tight">Nova Permissão</h1>
              <p className="text-muted-foreground">
                Crie uma nova permissão para o sistema
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Dados principais da permissão
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder={generateNomeSugestao()}
                    required
                  />
                  {generateNomeSugestao() && (
                    <p className="text-sm text-gray-500 mt-1">
                      Sugestão: {generateNomeSugestao()}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleChange('descricao', e.target.value)}
                    rows={3}
                    placeholder="Descreva o que esta permissão permite fazer..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Configuração da Permissão */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração da Permissão</CardTitle>
                <CardDescription>
                  Defina o recurso e a ação que esta permissão controla
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recurso">Recurso *</Label>
                  <Select value={formData.recurso} onValueChange={(value) => handleChange('recurso', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o recurso" />
                    </SelectTrigger>
                    <SelectContent>
                      {recursos.map((recurso) => (
                        <SelectItem key={recurso} value={recurso}>
                          {recurso.charAt(0).toUpperCase() + recurso.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="acao">Ação *</Label>
                  <Select value={formData.acao} onValueChange={(value) => handleChange('acao', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a ação" />
                    </SelectTrigger>
                    <SelectContent>
                      {acoes.map((acao) => (
                        <SelectItem key={acao.value} value={acao.value}>
                          {acao.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Informações sobre Permissões</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Recurso: A entidade que será controlada (ex: clientes, colaboradores)</li>
                    <li>• Ação: O que pode ser feito com o recurso (ex: criar, editar, excluir)</li>
                    <li>• As permissões são usadas nos perfis para controlar o acesso</li>
                    <li>• Seja específico ao criar permissões para melhor controle</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-4 mt-6">
            <Link href="/permissoes">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Salvar Permissão
            </Button>
          </div>
        </form>
    </div>
  );
}
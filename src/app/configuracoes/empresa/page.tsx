'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Building, Save, Upload, Palette, MapPin, Phone, Mail, CreditCard } from 'lucide-react';

interface Empresa {
  id?: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  telefone?: string;
  email?: string;
  website?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
  logoUrl?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  ativa: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export default function EmpresaPage() {
  const [empresa, setEmpresa] = useState<Empresa>({
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    ativa: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    carregarEmpresa();
  }, []);

  const carregarEmpresa = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configuracoes/empresa');
      
      if (response.ok) {
        const data = await response.json();
        if (data.empresa) {
          setEmpresa(data.empresa);
          setIsEditing(true);
        }
      } else if (response.status !== 404) {
        toast.error('Erro ao carregar dados da empresa');
      }
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
      toast.error('Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const salvarEmpresa = async () => {
    try {
      setSaving(true);
      
      // Validação básica
      if (!empresa.razaoSocial || !empresa.cnpj) {
        toast.error('Razão Social e CNPJ são obrigatórios');
        return;
      }

      const response = await fetch('/api/configuracoes/empresa', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(empresa),
      });

      if (response.ok) {
        const data = await response.json();
        setEmpresa(data.empresa);
        setIsEditing(true);
        toast.success('Dados da empresa salvos com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao salvar dados da empresa');
      }
    } catch (error) {
      console.error('Erro ao salvar empresa:', error);
      toast.error('Erro ao salvar dados da empresa');
    } finally {
      setSaving(false);
    }
  };

  const formatarCNPJ = (cnpj: string) => {
    const numeros = cnpj.replace(/\D/g, '');
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleCNPJChange = (value: string) => {
    const numeros = value.replace(/\D/g, '');
    if (numeros.length <= 14) {
      setEmpresa({ ...empresa, cnpj: numeros });
    }
  };

  const formatarCEP = (cep: string) => {
    const numeros = cep.replace(/\D/g, '');
    return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleCEPChange = (value: string) => {
    const numeros = value.replace(/\D/g, '');
    if (numeros.length <= 8) {
      setEmpresa({ ...empresa, cep: numeros });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Building className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuração da Empresa</h1>
            <p className="text-gray-600">Gerencie os dados da sua empresa</p>
          </div>
        </div>
        {isEditing && (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Empresa Cadastrada
          </Badge>
        )}
      </div>

      <Tabs defaultValue="dados-basicos" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
          <TabsTrigger value="endereco">Endereço</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
        </TabsList>

        <TabsContent value="dados-basicos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Informações Básicas</span>
              </CardTitle>
              <CardDescription>
                Dados principais da empresa para identificação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social *</Label>
                  <Input
                    id="razaoSocial"
                    value={empresa.razaoSocial}
                    onChange={(e) => setEmpresa({ ...empresa, razaoSocial: e.target.value })}
                    placeholder="Digite a razão social"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                  <Input
                    id="nomeFantasia"
                    value={empresa.nomeFantasia}
                    onChange={(e) => setEmpresa({ ...empresa, nomeFantasia: e.target.value })}
                    placeholder="Digite o nome fantasia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    value={formatarCNPJ(empresa.cnpj)}
                    onChange={(e) => handleCNPJChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricaoEstadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricaoEstadual"
                    value={empresa.inscricaoEstadual || ''}
                    onChange={(e) => setEmpresa({ ...empresa, inscricaoEstadual: e.target.value })}
                    placeholder="Digite a inscrição estadual"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inscricaoMunicipal">Inscrição Municipal</Label>
                  <Input
                    id="inscricaoMunicipal"
                    value={empresa.inscricaoMunicipal || ''}
                    onChange={(e) => setEmpresa({ ...empresa, inscricaoMunicipal: e.target.value })}
                    placeholder="Digite a inscrição municipal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={empresa.telefone || ''}
                    onChange={(e) => setEmpresa({ ...empresa, telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={empresa.email || ''}
                    onChange={(e) => setEmpresa({ ...empresa, email: e.target.value })}
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={empresa.website || ''}
                    onChange={(e) => setEmpresa({ ...empresa, website: e.target.value })}
                    placeholder="https://www.empresa.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endereco">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Endereço</span>
              </CardTitle>
              <CardDescription>
                Localização da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Textarea
                  id="endereco"
                  value={empresa.endereco || ''}
                  onChange={(e) => setEmpresa({ ...empresa, endereco: e.target.value })}
                  placeholder="Rua, número, bairro..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={empresa.cidade || ''}
                    onChange={(e) => setEmpresa({ ...empresa, cidade: e.target.value })}
                    placeholder="Digite a cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={empresa.estado || ''}
                    onChange={(e) => setEmpresa({ ...empresa, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formatarCEP(empresa.cep || '')}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Dados Financeiros</span>
              </CardTitle>
              <CardDescription>
                Informações bancárias e de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    id="banco"
                    value={empresa.banco || ''}
                    onChange={(e) => setEmpresa({ ...empresa, banco: e.target.value })}
                    placeholder="Nome do banco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agencia">Agência</Label>
                  <Input
                    id="agencia"
                    value={empresa.agencia || ''}
                    onChange={(e) => setEmpresa({ ...empresa, agencia: e.target.value })}
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conta">Conta</Label>
                  <Input
                    id="conta"
                    value={empresa.conta || ''}
                    onChange={(e) => setEmpresa({ ...empresa, conta: e.target.value })}
                    placeholder="00000-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pix">Chave PIX</Label>
                <Input
                  id="pix"
                  value={empresa.pix || ''}
                  onChange={(e) => setEmpresa({ ...empresa, pix: e.target.value })}
                  placeholder="CPF, CNPJ, e-mail ou telefone"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Identidade Visual</span>
              </CardTitle>
              <CardDescription>
                Logo e cores da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">URL do Logo</Label>
                <Input
                  id="logoUrl"
                  value={empresa.logoUrl || ''}
                  onChange={(e) => setEmpresa({ ...empresa, logoUrl: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="corPrimaria">Cor Primária</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="corPrimaria"
                      type="color"
                      value={empresa.corPrimaria || '#3B82F6'}
                      onChange={(e) => setEmpresa({ ...empresa, corPrimaria: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={empresa.corPrimaria || '#3B82F6'}
                      onChange={(e) => setEmpresa({ ...empresa, corPrimaria: e.target.value })}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="corSecundaria">Cor Secundária</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="corSecundaria"
                      type="color"
                      value={empresa.corSecundaria || '#6B7280'}
                      onChange={(e) => setEmpresa({ ...empresa, corSecundaria: e.target.value })}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={empresa.corSecundaria || '#6B7280'}
                      onChange={(e) => setEmpresa({ ...empresa, corSecundaria: e.target.value })}
                      placeholder="#6B7280"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={salvarEmpresa} 
          disabled={saving}
          className="min-w-32"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
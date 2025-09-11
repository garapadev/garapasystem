'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Settings, 
  Mail, 
  Server, 
  Shield, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash2, 
  RefreshCw,
  Building,
  Users,
  MessageSquare,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Interfaces
interface Department {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ativo: boolean;
  email?: string;
  imapHost?: string;
  imapPort?: number;
  imapEmail?: string;
  imapSenha?: string;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpEmail?: string;
  smtpSenha?: string;
  smtpSecure?: boolean;
  criadoEm: string;
  atualizadoEm: string;
  _count?: {
    tickets: number;
  };
}

interface CreateDepartmentData {
  nome: string;
  descricao?: string;
  cor: string;
  email?: string;
  imapHost?: string;
  imapPort?: number;
  imapEmail?: string;
  imapSenha?: string;
  imapSecure?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpEmail?: string;
  smtpSenha?: string;
  smtpSecure?: boolean;
}

interface DepartmentManagerProps {
  className?: string;
}

export function DepartmentManager({ className }: DepartmentManagerProps) {
  const { toast } = useToast();
  
  // Estados
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados dos diálogos
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  
  // Estados dos formulários
  const [createForm, setCreateForm] = useState<CreateDepartmentData>({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    email: '',
    imapHost: '',
    imapPort: 993,
    imapEmail: '',
    imapSenha: '',
    imapSecure: true,
    smtpHost: '',
    smtpPort: 587,
    smtpEmail: '',
    smtpSenha: '',
    smtpSecure: true
  });
  
  const [editForm, setEditForm] = useState<CreateDepartmentData>({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    email: '',
    imapHost: '',
    imapPort: 993,
    imapEmail: '',
    imapSenha: '',
    imapSecure: true,
    smtpHost: '',
    smtpPort: 587,
    smtpEmail: '',
    smtpSenha: '',
    smtpSecure: true
  });
  
  // Estados para mostrar/ocultar senhas
  const [showCreatePasswords, setShowCreatePasswords] = useState({
    imap: false,
    smtp: false
  });
  
  const [showEditPasswords, setShowEditPasswords] = useState({
    imap: false,
    smtp: false
  });
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const itemsPerPage = 20;

  // Funções de API
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/helpdesk/departments?page=${currentPage}&limit=${itemsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar departamentos');
      }
      
      const data = await response.json();
      setDepartments(data.departments || []);
      setTotalPages(data.totalPages || 1);
      setTotalDepartments(data.total || 0);
    } catch (error) {
      console.error('Erro ao buscar departamentos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar departamentos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, toast]);

  const createDepartment = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createForm)
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar departamento');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Departamento criado com sucesso'
      });
      
      setShowCreateDialog(false);
      resetCreateForm();
      fetchDepartments();
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar departamento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDepartment = async () => {
    if (!selectedDepartment) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/helpdesk/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: selectedDepartment.id, ...editForm })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar departamento');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Departamento atualizado com sucesso'
      });
      
      setShowEditDialog(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error) {
      console.error('Erro ao atualizar departamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar departamento',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartmentStatus = async (departmentId: string, ativo: boolean) => {
    try {
      const response = await fetch('/api/helpdesk/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: departmentId, ativo })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao alterar status do departamento');
      }
      
      toast({
        title: 'Sucesso',
        description: `Departamento ${ativo ? 'ativado' : 'desativado'} com sucesso`
      });
      
      fetchDepartments();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao alterar status do departamento',
        variant: 'destructive'
      });
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este departamento?')) {
      return;
    }
    
    try {
      const response = await fetch('/api/helpdesk/departments', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: departmentId })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir departamento');
      }
      
      toast({
        title: 'Sucesso',
        description: 'Departamento excluído com sucesso'
      });
      
      fetchDepartments();
    } catch (error) {
      console.error('Erro ao excluir departamento:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir departamento',
        variant: 'destructive'
      });
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchDepartments();
    setRefreshing(false);
  };

  // Funções auxiliares
  const resetCreateForm = () => {
    setCreateForm({
      nome: '',
      descricao: '',
      cor: '#3B82F6',
      email: '',
      imapHost: '',
      imapPort: 993,
      imapEmail: '',
      imapSenha: '',
      imapSecure: true,
      smtpHost: '',
      smtpPort: 587,
      smtpEmail: '',
      smtpSenha: '',
      smtpSecure: true
    });
    setShowCreatePasswords({ imap: false, smtp: false });
  };

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setEditForm({
      nome: department.nome,
      descricao: department.descricao || '',
      cor: department.cor,
      email: department.email || '',
      imapHost: department.imapHost || '',
      imapPort: department.imapPort || 993,
      imapEmail: department.imapEmail || '',
      imapSenha: '', // Não carregamos a senha por segurança
      imapSecure: department.imapSecure ?? true,
      smtpHost: department.smtpHost || '',
      smtpPort: department.smtpPort || 587,
      smtpEmail: department.smtpEmail || '',
      smtpSenha: '', // Não carregamos a senha por segurança
      smtpSecure: department.smtpSecure ?? true
    });
    setShowEditPasswords({ imap: false, smtp: false });
    setShowEditDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Efeitos
  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Departamentos</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDepartments}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {departments.filter(d => d.ativo).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inativos</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {departments.filter(d => !d.ativo).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {departments.reduce((total, dept) => total + (dept._count?.tickets || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de departamentos */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Departamentos do Helpdesk</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Departamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Criar Novo Departamento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    {/* Informações básicas */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Informações Básicas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome *</Label>
                          <Input
                            id="nome"
                            value={createForm.nome}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, nome: e.target.value }))}
                            placeholder="Nome do departamento"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cor">Cor</Label>
                          <div className="flex gap-2">
                            <Input
                              id="cor"
                              type="color"
                              value={createForm.cor}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, cor: e.target.value }))}
                              className="w-16 h-10 p-1"
                            />
                            <Input
                              value={createForm.cor}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, cor: e.target.value }))}
                              placeholder="#3B82F6"
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="descricao">Descrição</Label>
                        <Input
                          id="descricao"
                          value={createForm.descricao}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, descricao: e.target.value }))}
                          placeholder="Descrição do departamento"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Principal</Label>
                        <Input
                          id="email"
                          type="email"
                          value={createForm.email}
                          onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="departamento@empresa.com"
                        />
                      </div>
                    </div>

                    {/* Configurações IMAP */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Configurações IMAP (Recebimento)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="imapHost">Servidor IMAP</Label>
                          <Input
                            id="imapHost"
                            value={createForm.imapHost}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, imapHost: e.target.value }))}
                            placeholder="imap.gmail.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imapPort">Porta IMAP</Label>
                          <Input
                            id="imapPort"
                            type="number"
                            value={createForm.imapPort}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, imapPort: parseInt(e.target.value) || 993 }))}
                            placeholder="993"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="imapEmail">Email IMAP</Label>
                          <Input
                            id="imapEmail"
                            type="email"
                            value={createForm.imapEmail}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, imapEmail: e.target.value }))}
                            placeholder="email@empresa.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="imapSenha">Senha IMAP</Label>
                          <div className="relative">
                            <Input
                              id="imapSenha"
                              type={showCreatePasswords.imap ? 'text' : 'password'}
                              value={createForm.imapSenha}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, imapSenha: e.target.value }))}
                              placeholder="Senha do email"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowCreatePasswords(prev => ({ ...prev, imap: !prev.imap }))}
                            >
                              {showCreatePasswords.imap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="imapSecure"
                          checked={createForm.imapSecure}
                          onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, imapSecure: checked }))}
                        />
                        <Label htmlFor="imapSecure">Usar SSL/TLS</Label>
                      </div>
                    </div>

                    {/* Configurações SMTP */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Server className="h-5 w-5" />
                        Configurações SMTP (Envio)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtpHost">Servidor SMTP</Label>
                          <Input
                            id="smtpHost"
                            value={createForm.smtpHost}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpPort">Porta SMTP</Label>
                          <Input
                            id="smtpPort"
                            type="number"
                            value={createForm.smtpPort}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                            placeholder="587"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="smtpEmail">Email SMTP</Label>
                          <Input
                            id="smtpEmail"
                            type="email"
                            value={createForm.smtpEmail}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, smtpEmail: e.target.value }))}
                            placeholder="email@empresa.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtpSenha">Senha SMTP</Label>
                          <div className="relative">
                            <Input
                              id="smtpSenha"
                              type={showCreatePasswords.smtp ? 'text' : 'password'}
                              value={createForm.smtpSenha}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, smtpSenha: e.target.value }))}
                              placeholder="Senha do email"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowCreatePasswords(prev => ({ ...prev, smtp: !prev.smtp }))}
                            >
                              {showCreatePasswords.smtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="smtpSecure"
                          checked={createForm.smtpSecure}
                          onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, smtpSecure: checked }))}
                        />
                        <Label htmlFor="smtpSecure">Usar SSL/TLS</Label>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateDialog(false);
                          resetCreateForm();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={createDepartment}
                        disabled={loading || !createForm.nome}
                      >
                        {loading ? 'Criando...' : 'Criar Departamento'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum departamento encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {departments.map((department) => (
                <div key={department.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: department.cor }}
                      />
                      <div>
                        <h3 className="font-semibold">{department.nome}</h3>
                        {department.descricao && (
                          <p className="text-sm text-muted-foreground">{department.descricao}</p>
                        )}
                        {department.email && (
                          <p className="text-sm text-blue-600">{department.email}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={department.ativo ? 'default' : 'secondary'}>
                        {department.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                      
                      {department._count && (
                        <Badge variant="outline">
                          {department._count.tickets} tickets
                        </Badge>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(department)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDepartmentStatus(department.id, !department.ativo)}
                      >
                        {department.ativo ? 'Desativar' : 'Ativar'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDepartment(department.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    Criado em: {formatDate(department.criadoEm)} | 
                    Atualizado em: {formatDate(department.atualizadoEm)}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} ({totalDepartments} departamentos)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedDepartment && (
            <>
              <DialogHeader>
                <DialogTitle>Editar Departamento: {selectedDepartment.nome}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Informações básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-nome">Nome *</Label>
                      <Input
                        id="edit-nome"
                        value={editForm.nome}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                        placeholder="Nome do departamento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cor">Cor</Label>
                      <div className="flex gap-2">
                        <Input
                          id="edit-cor"
                          type="color"
                          value={editForm.cor}
                          onChange={(e) => setEditForm(prev => ({ ...prev, cor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={editForm.cor}
                          onChange={(e) => setEditForm(prev => ({ ...prev, cor: e.target.value }))}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-descricao">Descrição</Label>
                    <Input
                      id="edit-descricao"
                      value={editForm.descricao}
                      onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
                      placeholder="Descrição do departamento"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email Principal</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="departamento@empresa.com"
                    />
                  </div>
                </div>

                {/* Configurações IMAP */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configurações IMAP (Recebimento)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-imapHost">Servidor IMAP</Label>
                      <Input
                        id="edit-imapHost"
                        value={editForm.imapHost}
                        onChange={(e) => setEditForm(prev => ({ ...prev, imapHost: e.target.value }))}
                        placeholder="imap.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-imapPort">Porta IMAP</Label>
                      <Input
                        id="edit-imapPort"
                        type="number"
                        value={editForm.imapPort}
                        onChange={(e) => setEditForm(prev => ({ ...prev, imapPort: parseInt(e.target.value) || 993 }))}
                        placeholder="993"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-imapEmail">Email IMAP</Label>
                      <Input
                        id="edit-imapEmail"
                        type="email"
                        value={editForm.imapEmail}
                        onChange={(e) => setEditForm(prev => ({ ...prev, imapEmail: e.target.value }))}
                        placeholder="email@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-imapSenha">Senha IMAP</Label>
                      <div className="relative">
                        <Input
                          id="edit-imapSenha"
                          type={showEditPasswords.imap ? 'text' : 'password'}
                          value={editForm.imapSenha}
                          onChange={(e) => setEditForm(prev => ({ ...prev, imapSenha: e.target.value }))}
                          placeholder="Deixe vazio para manter a atual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowEditPasswords(prev => ({ ...prev, imap: !prev.imap }))}
                        >
                          {showEditPasswords.imap ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-imapSecure"
                      checked={editForm.imapSecure}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, imapSecure: checked }))}
                    />
                    <Label htmlFor="edit-imapSecure">Usar SSL/TLS</Label>
                  </div>
                </div>

                {/* Configurações SMTP */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Configurações SMTP (Envio)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-smtpHost">Servidor SMTP</Label>
                      <Input
                        id="edit-smtpHost"
                        value={editForm.smtpHost}
                        onChange={(e) => setEditForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-smtpPort">Porta SMTP</Label>
                      <Input
                        id="edit-smtpPort"
                        type="number"
                        value={editForm.smtpPort}
                        onChange={(e) => setEditForm(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-smtpEmail">Email SMTP</Label>
                      <Input
                        id="edit-smtpEmail"
                        type="email"
                        value={editForm.smtpEmail}
                        onChange={(e) => setEditForm(prev => ({ ...prev, smtpEmail: e.target.value }))}
                        placeholder="email@empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-smtpSenha">Senha SMTP</Label>
                      <div className="relative">
                        <Input
                          id="edit-smtpSenha"
                          type={showEditPasswords.smtp ? 'text' : 'password'}
                          value={editForm.smtpSenha}
                          onChange={(e) => setEditForm(prev => ({ ...prev, smtpSenha: e.target.value }))}
                          placeholder="Deixe vazio para manter a atual"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => setShowEditPasswords(prev => ({ ...prev, smtp: !prev.smtp }))}
                        >
                          {showEditPasswords.smtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-smtpSecure"
                      checked={editForm.smtpSecure}
                      onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, smtpSecure: checked }))}
                    />
                    <Label htmlFor="edit-smtpSecure">Usar SSL/TLS</Label>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditDialog(false);
                      setSelectedDepartment(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={updateDepartment}
                    disabled={loading || !editForm.nome}
                  >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
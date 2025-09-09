'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWebmailPermissions } from '@/hooks/useWebmailPermissions';
import { 
  WEBMAIL_PERMISSIONS, 
  WEBMAIL_ACCESS_LEVELS, 
  WebmailPermissionUtils,
  type WebmailAccessLevel 
} from '@/lib/permissions/webmail-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Users, 
  Settings, 
  Mail, 
  FolderOpen, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Search,
  Save,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  nome: string;
  email: string;
  perfil?: {
    id: string;
    nome: string;
    permissoes: {
      permissao: {
        id: string;
        nome: string;
        recurso: string;
        acao: string;
      };
    }[];
  };
}

interface WebmailPermissionsManagerProps {
  className?: string;
}

export function WebmailPermissionsManager({ className }: WebmailPermissionsManagerProps) {
  const { isAdmin } = useAuth();
  const { canAccess } = useWebmailPermissions();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState<WebmailAccessLevel>('BASIC');

  // Verificar se pode gerenciar usuários
  if (!isAdmin && !canAccess.admin.manageUsers) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Você não possui permissão para gerenciar permissões do webmail.
        </AlertDescription>
      </Alert>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users/webmail-permissions');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const saveUserPermissions = async (userId: string, permissions: string[]) => {
    try {
      setSaving(true);
      const response = await fetch(`/api/admin/users/${userId}/webmail-permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissions })
      });

      if (response.ok) {
        toast.success('Permissões atualizadas com sucesso');
        await loadUsers();
      } else {
        toast.error('Erro ao salvar permissões');
      }
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const applyAccessLevel = async (userId: string, accessLevel: WebmailAccessLevel) => {
    const permissions = WEBMAIL_ACCESS_LEVELS[accessLevel];
    await saveUserPermissions(userId, permissions);
  };

  const filteredUsers = users.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserWebmailPermissions = (user: User): string[] => {
    if (!user.perfil?.permissoes) return [];
    
    return user.perfil.permissoes
      .map(p => p.permissao.nome)
      .filter(permission => 
        Object.values(WEBMAIL_PERMISSIONS).includes(permission as any)
      );
  };

  const getUserAccessLevel = (user: User): WebmailAccessLevel | null => {
    const userPermissions = getUserWebmailPermissions(user);
    return WebmailPermissionUtils.getUserAccessLevel(userPermissions);
  };

  const getAccessLevelColor = (level: WebmailAccessLevel | null) => {
    switch (level) {
      case 'BASIC': return 'bg-blue-100 text-blue-800';
      case 'ADVANCED': return 'bg-green-100 text-green-800';
      case 'SUPERVISOR': return 'bg-yellow-100 text-yellow-800';
      case 'ADMIN': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gerenciar Permissões do Webmail</h2>
          <p className="text-muted-foreground">
            Configure permissões de acesso ao sistema de webmail para cada usuário
          </p>
        </div>
        <Button onClick={loadUsers} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissões
          </TabsTrigger>
          <TabsTrigger value="levels" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Níveis de Acesso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredUsers.map((user) => {
              const accessLevel = getUserAccessLevel(user);
              const permissions = getUserWebmailPermissions(user);
              
              return (
                <Card key={user.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{user.nome}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getAccessLevelColor(accessLevel)}>
                          {accessLevel || 'Sem Acesso'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Permissões Ativas:</Label>
                      <div className="flex flex-wrap gap-1">
                        {permissions.length > 0 ? (
                          permissions.map((permission) => (
                            <Badge key={permission} variant="secondary" className="text-xs">
                              {permission.replace('webmail.', '')}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Nenhuma permissão do webmail</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permissões Disponíveis</CardTitle>
              <CardDescription>
                Lista completa de permissões do sistema de webmail
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {/* Configuração de Email */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Settings className="h-4 w-4" />
                    Configuração de Email
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_CONFIG_READ}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_CONFIG_WRITE}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_CONFIG_DELETE}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_CONFIG_TEST}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Emails */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Mail className="h-4 w-4" />
                    Gerenciamento de Emails
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_READ}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_READ_ALL}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_COMPOSE}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_SEND}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_SEND_AS}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_DELETE}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_ARCHIVE}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_MOVE}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.EMAIL_FLAG}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Pastas */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <FolderOpen className="h-4 w-4" />
                    Gerenciamento de Pastas
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.FOLDER_READ}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.FOLDER_CREATE}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.FOLDER_DELETE}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.FOLDER_MANAGE}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Anexos */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Download className="h-4 w-4" />
                    Anexos
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.ATTACHMENT_DOWNLOAD}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.ATTACHMENT_UPLOAD}</Badge>
                  </div>
                </div>

                <Separator />

                {/* Administração */}
                <div>
                  <h4 className="font-medium flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4" />
                    Administração
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.ADMIN_VIEW_ALL}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.ADMIN_MANAGE_CONFIGS}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.ADMIN_MANAGE_USERS}</Badge>
                    <Badge variant="outline">{WEBMAIL_PERMISSIONS.ADMIN_LOGS}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="levels" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(WEBMAIL_ACCESS_LEVELS).map(([level, permissions]) => (
              <Card key={level}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className={`text-lg ${getAccessLevelColor(level as WebmailAccessLevel)}`}>
                        {level}
                      </CardTitle>
                      <CardDescription>
                        {permissions.length} permissões incluídas
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={selectedAccessLevel} onValueChange={(value) => setSelectedAccessLevel(value as WebmailAccessLevel)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BASIC">Básico</SelectItem>
                          <SelectItem value="ADVANCED">Avançado</SelectItem>
                          <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {permissions.map((permission) => (
                      <Badge key={permission} variant="secondary" className="text-xs">
                        {permission.replace('webmail.', '')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição de Usuário */}
      {selectedUser && (
        <UserPermissionModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onSave={(permissions) => saveUserPermissions(selectedUser.id, permissions)}
          saving={saving}
        />
      )}
    </div>
  );
}

// Componente Modal para edição de permissões
interface UserPermissionModalProps {
  user: User;
  onClose: () => void;
  onSave: (permissions: string[]) => Promise<void>;
  saving: boolean;
}

function UserPermissionModal({ user, onClose, onSave, saving }: UserPermissionModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    user.perfil?.permissoes
      .map(p => p.permissao.nome)
      .filter(permission => 
        Object.values(WEBMAIL_PERMISSIONS).includes(permission as any)
      ) || []
  );

  const togglePermission = (permission: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSave = async () => {
    await onSave(selectedPermissions);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Editar Permissões - {user.nome}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(WEBMAIL_PERMISSIONS).map(([key, permission]) => (
            <div key={permission} className="flex items-center justify-between">
              <Label htmlFor={permission} className="text-sm">
                {permission}
              </Label>
              <Switch
                id={permission}
                checked={selectedPermissions.includes(permission)}
                onCheckedChange={() => togglePermission(permission)}
              />
            </div>
          ))}
        </CardContent>
        <div className="flex justify-end gap-2 p-6 pt-0">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </Card>
    </div>
  );
}
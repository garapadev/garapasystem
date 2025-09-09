# Sistema de Controle de Acesso Granular - Webmail

## Análise da Estrutura Atual

### Sistema de Permissões Existente

#### Estrutura de Permissões
- **Modelo baseado em recursos e ações**: `recurso.acao` (ex: `clientes.read`, `usuarios.write`)
- **Permissão de administrador**: `admin` ou `sistema.administrar`
- **Validação por API Key**: Sistema robusto com permissões granulares
- **Validação por sessão**: Baseado em perfis de colaborador

#### Componentes Principais
1. **API Middleware** (`/lib/api-middleware.ts`)
   - Validação de autenticação (sessão + API Key)
   - Verificação de permissões por endpoint
   - Sistema de logs de acesso

2. **Hook useAuth** (`/hooks/useAuth.ts`)
   - Interface para verificação de permissões no frontend
   - Controle de acesso baseado em perfil do colaborador
   - Funções utilitárias para verificação de permissões

3. **Componente ProtectedRoute** (`/components/auth/ProtectedRoute.tsx`)
   - Proteção de rotas baseada em permissões
   - Suporte a múltiplas permissões
   - Fallback para acesso negado

### Estrutura do Módulo Webmail

#### Componentes Principais
1. **Interface Principal** (`/app/webmail/page.tsx`)
   - Lista de emails e pastas
   - Funcionalidades de sincronização
   - Gerenciamento de configurações

2. **Configuração de Email** (`/app/webmail/config/page.tsx`)
   - Configuração IMAP/SMTP
   - Testes de conectividade
   - Gerenciamento de contas

3. **Visualização de Email** (`/app/webmail/email/[id]/page.tsx`)
   - Leitura de emails
   - Ações (responder, encaminhar, arquivar, excluir)

4. **Composição de Email** (`/app/webmail/compose/page.tsx`)
   - Criação de novos emails
   - Anexos e formatação
   - Rascunhos

#### APIs do Webmail
1. **Configuração**: `/api/email-config`
2. **Listagem de Emails**: `/api/emails`
3. **Detalhes do Email**: `/api/emails/[id]`
4. **Envio de Email**: `/api/emails/send`
5. **Teste de Configuração**: `/api/emails/test`

## Design do Sistema de Controle de Acesso

### Permissões Específicas do Webmail

#### Estrutura de Permissões
```typescript
export const WEBMAIL_PERMISSIONS = {
  // Configuração de Email
  EMAIL_CONFIG_READ: 'webmail.config.read',
  EMAIL_CONFIG_WRITE: 'webmail.config.write',
  EMAIL_CONFIG_DELETE: 'webmail.config.delete',
  EMAIL_CONFIG_TEST: 'webmail.config.test',
  
  // Leitura de Emails
  EMAIL_READ: 'webmail.email.read',
  EMAIL_READ_ALL: 'webmail.email.read.all', // Ler emails de outros usuários
  
  // Composição e Envio
  EMAIL_COMPOSE: 'webmail.email.compose',
  EMAIL_SEND: 'webmail.email.send',
  EMAIL_SEND_AS: 'webmail.email.send.as', // Enviar como outro usuário
  
  // Gerenciamento de Emails
  EMAIL_DELETE: 'webmail.email.delete',
  EMAIL_ARCHIVE: 'webmail.email.archive',
  EMAIL_MOVE: 'webmail.email.move',
  EMAIL_FLAG: 'webmail.email.flag',
  
  // Pastas
  FOLDER_READ: 'webmail.folder.read',
  FOLDER_CREATE: 'webmail.folder.create',
  FOLDER_DELETE: 'webmail.folder.delete',
  FOLDER_MANAGE: 'webmail.folder.manage',
  
  // Sincronização
  SYNC_MANUAL: 'webmail.sync.manual',
  SYNC_AUTO: 'webmail.sync.auto',
  SYNC_SETTINGS: 'webmail.sync.settings',
  
  // Anexos
  ATTACHMENT_DOWNLOAD: 'webmail.attachment.download',
  ATTACHMENT_UPLOAD: 'webmail.attachment.upload',
  
  // Administração
  ADMIN_VIEW_ALL: 'webmail.admin.view.all',
  ADMIN_MANAGE_CONFIGS: 'webmail.admin.manage.configs',
  ADMIN_MANAGE_USERS: 'webmail.admin.manage.users',
  ADMIN_LOGS: 'webmail.admin.logs'
} as const;
```

### Níveis de Acesso

#### 1. Usuário Básico
- `webmail.config.read` - Visualizar própria configuração
- `webmail.config.write` - Editar própria configuração
- `webmail.config.test` - Testar própria configuração
- `webmail.email.read` - Ler próprios emails
- `webmail.email.compose` - Compor emails
- `webmail.email.send` - Enviar emails
- `webmail.email.delete` - Excluir próprios emails
- `webmail.email.archive` - Arquivar próprios emails
- `webmail.folder.read` - Visualizar próprias pastas
- `webmail.sync.manual` - Sincronização manual
- `webmail.attachment.download` - Baixar anexos
- `webmail.attachment.upload` - Enviar anexos

#### 2. Usuário Avançado
- Todas as permissões do Usuário Básico +
- `webmail.folder.create` - Criar pastas
- `webmail.folder.delete` - Excluir pastas
- `webmail.sync.auto` - Configurar sincronização automática
- `webmail.sync.settings` - Configurações avançadas de sync

#### 3. Supervisor
- Todas as permissões do Usuário Avançado +
- `webmail.email.read.all` - Ler emails de subordinados
- `webmail.admin.view.all` - Visualizar configurações de subordinados

#### 4. Administrador
- Todas as permissões +
- `webmail.admin.manage.configs` - Gerenciar todas as configurações
- `webmail.admin.manage.users` - Gerenciar usuários do webmail
- `webmail.admin.logs` - Acessar logs do sistema
- `webmail.email.send.as` - Enviar como outro usuário
- `admin` - Acesso total (fallback)

### Integração com Sistema Existente

#### 1. Atualização do API Middleware
```typescript
// Adicionar mapeamento de endpoints do webmail
const endpointPermissions: Record<string, string[]> = {
  // ... permissões existentes ...
  
  // Webmail - Configuração
  'GET:/api/email-config': ['webmail.config.read'],
  'POST:/api/email-config': ['webmail.config.write'],
  'PUT:/api/email-config': ['webmail.config.write'],
  'DELETE:/api/email-config': ['webmail.config.delete'],
  
  // Webmail - Emails
  'GET:/api/emails': ['webmail.email.read'],
  'GET:/api/emails/[id]': ['webmail.email.read'],
  'POST:/api/emails/send': ['webmail.email.send'],
  'DELETE:/api/emails/[id]': ['webmail.email.delete'],
  
  // Webmail - Testes
  'POST:/api/emails/test': ['webmail.config.test'],
  'POST:/api/emails/test-send': ['webmail.email.send'],
  
  // Webmail - Administração
  'GET:/api/webmail/admin/users': ['webmail.admin.manage.users'],
  'GET:/api/webmail/admin/logs': ['webmail.admin.logs']
};
```

#### 2. Extensão do Hook useAuth
```typescript
// Adicionar verificações específicas do webmail
const canAccess = useMemo(() => {
  return {
    // ... acessos existentes ...
    
    // Webmail
    webmail: {
      config: {
        read: hasPermission('webmail', 'config.read'),
        write: hasPermission('webmail', 'config.write'),
        delete: hasPermission('webmail', 'config.delete'),
        test: hasPermission('webmail', 'config.test')
      },
      email: {
        read: hasPermission('webmail', 'email.read'),
        readAll: hasPermission('webmail', 'email.read.all'),
        compose: hasPermission('webmail', 'email.compose'),
        send: hasPermission('webmail', 'email.send'),
        sendAs: hasPermission('webmail', 'email.send.as'),
        delete: hasPermission('webmail', 'email.delete'),
        archive: hasPermission('webmail', 'email.archive')
      },
      admin: {
        viewAll: hasPermission('webmail', 'admin.view.all'),
        manageConfigs: hasPermission('webmail', 'admin.manage.configs'),
        manageUsers: hasPermission('webmail', 'admin.manage.users'),
        logs: hasPermission('webmail', 'admin.logs')
      }
    }
  };
}, [hasPermission, hasAnyPermission]);
```

#### 3. Middleware Específico do Webmail
```typescript
// /lib/webmail-middleware.ts
export class WebmailMiddleware {
  static async validateEmailAccess(
    userId: string, 
    emailId: string, 
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    // Verificar se o email pertence ao usuário
    // Ou se tem permissão administrativa
  }
  
  static async validateConfigAccess(
    userId: string, 
    configId: string
  ): Promise<boolean> {
    // Verificar propriedade da configuração
  }
}
```

### Segurança e Isolamento de Dados

#### 1. Isolamento por Usuário
- Emails são isolados por `emailConfigId`
- Configurações são vinculadas ao `colaboradorId`
- Validação de propriedade em todas as operações

#### 2. Auditoria e Logs
- Log de todas as ações do webmail
- Rastreamento de acessos a emails de outros usuários
- Monitoramento de configurações administrativas

#### 3. Validação de Dados
- Sanitização de conteúdo de emails
- Validação de anexos
- Proteção contra XSS em emails HTML

### Implementação Gradual

#### Fase 1: Permissões Básicas
1. Implementar permissões básicas do webmail
2. Atualizar API middleware
3. Adicionar validações nos endpoints existentes

#### Fase 2: Interface Administrativa
1. Criar interface de gerenciamento de permissões
2. Implementar visualização de logs
3. Adicionar controles administrativos

#### Fase 3: Funcionalidades Avançadas
1. Implementar permissões de supervisão
2. Adicionar controles de quota
3. Implementar políticas de retenção

### Considerações de Performance

#### 1. Cache de Permissões
- Cache de permissões do usuário na sessão
- Invalidação automática em mudanças de perfil

#### 2. Otimização de Consultas
- Índices adequados nas tabelas de permissões
- Consultas otimizadas para verificação de acesso

#### 3. Lazy Loading
- Carregamento sob demanda de permissões específicas
- Pré-carregamento de permissões críticas

## Próximos Passos

1. **Implementar permissões específicas do webmail**
2. **Atualizar middleware de API**
3. **Criar validações de segurança**
4. **Desenvolver interface administrativa**
5. **Implementar sistema de auditoria**
6. **Testes de segurança e performance**
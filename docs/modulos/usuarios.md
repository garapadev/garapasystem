# Módulo: Usuários

**Status:** ✅ Implementado  
**Categoria:** Core  
**Versão:** 1.0  
**Responsável:** Equipe Core  

---

## 1. Visão Geral

O módulo Usuários é responsável pelo gerenciamento completo de usuários do sistema, incluindo autenticação, autorização, perfis, permissões e controle de acesso. É um módulo fundamental que suporta toda a estrutura de segurança do GarapaSystem.

### Propósito
- Gerenciar usuários e suas credenciais
- Controlar acesso e permissões
- Manter perfis e configurações pessoais
- Implementar autenticação segura

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Segurança:** Autenticação robusta e segura
- **Controle:** Gestão granular de permissões
- **Usabilidade:** Interface intuitiva para gestão
- **Auditoria:** Rastreamento de ações dos usuários

### Requisitos Funcionais
- CRUD completo de usuários
- Sistema de autenticação JWT
- Gestão de perfis e permissões
- Controle de sessões ativas
- Histórico de atividades
- Recuperação de senha
- Autenticação de dois fatores (2FA)
- Integração com hierarquia organizacional

### Requisitos Não-Funcionais
- Segurança: Criptografia de senhas (bcrypt)
- Performance: Login < 2 segundos
- Disponibilidade: 99.9% uptime
- Escalabilidade: 1000+ usuários simultâneos
- Conformidade: LGPD e boas práticas

---

## 3. Funcionalidades

### 3.1 Gestão de Usuários
- **CRUD Completo:** Criar, visualizar, editar e desativar usuários
- **Perfis:** Informações pessoais e profissionais
- **Status:** Ativo, inativo, bloqueado, pendente
- **Hierarquia:** Relacionamento com grupos hierárquicos
- **Configurações:** Preferências pessoais do usuário

### 3.2 Autenticação e Segurança
- Login com email/senha
- Tokens JWT com refresh
- Sessões ativas e controle
- Logout automático por inatividade
- Bloqueio por tentativas inválidas
- Recuperação de senha por email
- Autenticação de dois fatores (2FA)

### 3.3 Autorização e Permissões
- Sistema de permissões granular
- Perfis de acesso pré-definidos
- Herança de permissões por hierarquia
- Controle de acesso por módulo
- Permissões temporárias
- Auditoria de acessos

### 3.4 Gestão de Perfis
- Informações pessoais
- Foto de perfil
- Configurações de notificação
- Preferências de interface
- Histórico de atividades
- Estatísticas de uso

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/users/
├── page.tsx                     # Lista de usuários
├── [id]/
│   ├── page.tsx                # Detalhes do usuário
│   ├── edit/page.tsx           # Editar usuário
│   └── profile/page.tsx        # Perfil do usuário
├── new/page.tsx                # Novo usuário
├── profile/
│   ├── page.tsx                # Meu perfil
│   ├── edit/page.tsx           # Editar meu perfil
│   ├── security/page.tsx       # Configurações de segurança
│   └── preferences/page.tsx    # Preferências
├── components/
│   ├── UserCard.tsx            # Card de usuário
│   ├── UserForm.tsx            # Formulário de usuário
│   ├── UserList.tsx            # Lista de usuários
│   ├── UserProfile.tsx         # Perfil do usuário
│   ├── UserAvatar.tsx          # Avatar do usuário
│   ├── UserStatus.tsx          # Status do usuário
│   ├── PermissionMatrix.tsx    # Matriz de permissões
│   ├── SessionManager.tsx      # Gerenciador de sessões
│   ├── SecuritySettings.tsx    # Configurações de segurança
│   └── ActivityLog.tsx         # Log de atividades
├── hooks/
│   ├── useUsers.tsx            # Hook para usuários
│   ├── useAuth.tsx             # Hook para autenticação
│   ├── usePermissions.tsx      # Hook para permissões
│   ├── useProfile.tsx          # Hook para perfil
│   └── useSessions.tsx         # Hook para sessões
└── types/
    └── user.ts                 # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model Usuario {
  id              String    @id @default(cuid())
  email           String    @unique
  senha           String
  nome            String
  sobrenome       String?
  telefone        String?
  avatar          String?
  
  // Status e controle
  status          StatusUsuario @default(ATIVO)
  emailVerificado Boolean   @default(false)
  ultimoLogin     DateTime?
  tentativasLogin Int       @default(0)
  bloqueadoAte    DateTime?
  
  // Configurações
  configuracoes   Json?     // Preferências do usuário
  notificacoes    Json?     // Configurações de notificação
  tema            String?   @default("light")
  idioma          String?   @default("pt-BR")
  
  // 2FA
  twoFactorSecret String?
  twoFactorEnabled Boolean  @default(false)
  backupCodes     String[]
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  perfilId        String
  perfil          Perfil    @relation(fields: [perfilId], references: [id])
  grupoHierarquicoId String?
  grupoHierarquico GrupoHierarquico? @relation(fields: [grupoHierarquicoId], references: [id])
  
  // Atividades
  sessoes         SessaoUsuario[]
  atividades      AtividadeUsuario[]
  logs            LogSistema[]
  
  // Relacionamentos operacionais
  clientesCriados Cliente[] @relation("UsuarioCriador")
  ordensServico   OrdemServico[]
  tasks           Task[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@map("usuarios")
}

model SessaoUsuario {
  id              String    @id @default(cuid())
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  
  token           String    @unique
  refreshToken    String?   @unique
  userAgent       String?
  ipAddress       String?
  dispositivo     String?
  localizacao     String?
  
  isActive        Boolean   @default(true)
  expiresAt       DateTime
  lastActivity    DateTime  @default(now())
  
  createdAt       DateTime  @default(now())
  
  @@map("sessoes_usuario")
}

model AtividadeUsuario {
  id              String    @id @default(cuid())
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  
  acao            String    // CREATE, UPDATE, DELETE, LOGIN, etc.
  modulo          String    // users, clients, orders, etc.
  recurso         String?   // ID do recurso afetado
  detalhes        Json?     // Detalhes da ação
  ipAddress       String?
  userAgent       String?
  
  createdAt       DateTime  @default(now())
  
  @@map("atividades_usuario")
}

enum StatusUsuario {
  ATIVO
  INATIVO
  BLOQUEADO
  PENDENTE
  SUSPENSO
}
```

### 4.3 Hooks Customizados
- **useUsers:** Gestão de usuários
- **useAuth:** Autenticação e autorização
- **usePermissions:** Controle de permissões
- **useProfile:** Perfil do usuário
- **useSessions:** Gestão de sessões

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Usuários
GET    /api/users                      # Listar usuários
POST   /api/users                      # Criar usuário
GET    /api/users/[id]                 # Buscar usuário
PUT    /api/users/[id]                 # Atualizar usuário
DELETE /api/users/[id]                 # Deletar usuário
PATCH  /api/users/[id]/status          # Alterar status

// Autenticação
POST   /api/auth/login                 # Login
POST   /api/auth/logout                # Logout
POST   /api/auth/refresh               # Refresh token
POST   /api/auth/forgot-password       # Esqueci a senha
POST   /api/auth/reset-password        # Resetar senha
POST   /api/auth/verify-email          # Verificar email

// 2FA
POST   /api/auth/2fa/setup             # Configurar 2FA
POST   /api/auth/2fa/verify            # Verificar 2FA
POST   /api/auth/2fa/disable           # Desabilitar 2FA
GET    /api/auth/2fa/backup-codes      # Códigos de backup

// Perfil
GET    /api/users/profile              # Meu perfil
PUT    /api/users/profile              # Atualizar perfil
POST   /api/users/profile/avatar       # Upload avatar
PUT    /api/users/profile/password     # Alterar senha
PUT    /api/users/profile/preferences  # Preferências

// Sessões
GET    /api/users/sessions             # Minhas sessões
DELETE /api/users/sessions/[id]        # Encerrar sessão
DELETE /api/users/sessions/all         # Encerrar todas

// Atividades
GET    /api/users/activities           # Minhas atividades
GET    /api/users/[id]/activities      # Atividades do usuário

// Permissões
GET    /api/users/[id]/permissions     # Permissões do usuário
PUT    /api/users/[id]/permissions     # Atualizar permissões
```

### 5.2 Estrutura de Resposta
```typescript
interface UserResponse {
  id: string;
  email: string;
  nome: string;
  sobrenome?: string;
  telefone?: string;
  avatar?: string;
  status: StatusUsuario;
  emailVerificado: boolean;
  ultimoLogin?: string;
  empresa: {
    id: string;
    nome: string;
  };
  perfil: {
    id: string;
    nome: string;
    permissoes: string[];
  };
  grupoHierarquico?: {
    id: string;
    nome: string;
  };
  configuracoes?: any;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: UserResponse;
  token: string;
  refreshToken: string;
  expiresAt: string;
}
```

### 5.3 Validações (Zod)
```typescript
const UserSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(8).max(100),
  nome: z.string().min(2).max(50),
  sobrenome: z.string().max(50).optional(),
  telefone: z.string().regex(/^\d{10,11}$/).optional(),
  perfilId: z.string().cuid(),
  grupoHierarquicoId: z.string().cuid().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'BLOQUEADO', 'PENDENTE']).optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
  twoFactorCode: z.string().length(6).optional()
});

const PasswordResetSchema = z.object({
  token: z.string(),
  novaSenha: z.string().min(8).max(100),
  confirmaSenha: z.string()
}).refine(data => data.novaSenha === data.confirmaSenha, {
  message: "Senhas não coincidem",
  path: ["confirmaSenha"]
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Lista de Usuários:** Tabela com filtros e busca
- **Detalhes do Usuário:** Informações completas
- **Formulário de Usuário:** Criação/edição
- **Meu Perfil:** Perfil do usuário logado
- **Configurações de Segurança:** 2FA, sessões, etc.

### 6.2 Componentes Reutilizáveis
- **UserCard:** Card com informações básicas
- **UserAvatar:** Avatar com fallback
- **UserStatus:** Badge de status
- **PermissionMatrix:** Matriz de permissões
- **SessionList:** Lista de sessões ativas
- **ActivityTimeline:** Timeline de atividades

### 6.3 Estados de Interface
- Loading: Skeleton loaders
- Empty: Estado vazio com ações
- Error: Mensagens de erro
- Success: Confirmações de ações
- Offline: Modo offline limitado

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const USER_PERMISSIONS = [
  'users.read',              // Visualizar usuários
  'users.write',             // Criar/editar usuários
  'users.delete',            // Deletar usuários
  'users.permissions.write', // Gerenciar permissões
  'users.sessions.read',     // Ver sessões
  'users.sessions.write',    // Gerenciar sessões
  'users.activities.read',   // Ver atividades
  'users.profile.write'      // Editar próprio perfil
];
```

### 7.2 Níveis de Acesso
- **Usuário:** Editar próprio perfil
- **Supervisor:** Visualizar usuários da equipe
- **Gerente:** Gestão completa de usuários
- **Administrador:** Todas as permissões

### 7.3 Segurança Implementada
- Senhas criptografadas com bcrypt
- Tokens JWT com expiração
- Rate limiting para login
- Bloqueio por tentativas inválidas
- Logs de todas as ações
- Validação de entrada rigorosa
- Sanitização de dados

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Perfis:** Sistema de permissões
- **Grupos Hierárquicos:** Estrutura organizacional
- **Logs:** Auditoria de ações
- **Notificações:** Alertas e comunicações
- **Todos os módulos:** Controle de acesso

### 8.2 APIs Externas
- **Email Service:** Envio de emails
- **SMS Service:** Verificação por SMS
- **LDAP/AD:** Integração corporativa
- **OAuth:** Login social (futuro)

### 8.3 Eventos e Webhooks
- Usuário criado
- Login realizado
- Senha alterada
- Permissões modificadas
- Sessão expirada
- Atividade suspeita

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Modelo de dados e autenticação básica
- ✅ **Semana 3-4:** CRUD de usuários
- ✅ **Semana 5-6:** Sistema de permissões
- ✅ **Semana 7-8:** Gestão de sessões
- ✅ **Semana 9-10:** Perfis e configurações
- ✅ **Semana 11-12:** Recuperação de senha
- ✅ **Semana 13-14:** Autenticação 2FA
- ✅ **Semana 15-16:** Logs de atividade
- ✅ **Semana 17-18:** Interface de usuário
- ✅ **Semana 19-20:** Testes e otimizações

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** Login social (Google, Microsoft)
- 📋 **Q2 2025:** Integração LDAP/Active Directory
- 📋 **Q3 2025:** Biometria e WebAuthn
- 📋 **Q4 2025:** Analytics de comportamento

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (90% cobertura)
- **Integração:** APIs e autenticação
- **E2E:** Fluxos completos de usuário
- **Segurança:** Testes de penetração

### 10.2 Métricas de Qualidade
- Cobertura de testes: 90%
- Tempo de login: < 2 segundos
- Taxa de erro: < 0.1%
- Disponibilidade: 99.9%

### 10.3 Critérios de Aceitação
- ✅ CRUD completo funcionando
- ✅ Autenticação segura
- ✅ Permissões granulares
- ✅ 2FA implementado
- ✅ Sessões controladas
- ✅ Logs de auditoria
- ✅ Interface responsiva
- ✅ Performance adequada

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Core
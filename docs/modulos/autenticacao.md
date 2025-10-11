# Módulo: Autenticação

**Status:** ✅ Implementado  
**Categoria:** Core  
**Versão:** 1.0  
**Responsável:** Equipe Segurança  

---

## 1. Visão Geral

O módulo Autenticação é responsável por todo o sistema de autenticação e autorização do GarapaSystem. Implementa autenticação segura com múltiplos fatores, controle de sessões, e integração com sistemas externos. É um módulo crítico para a segurança de toda a aplicação.

### Propósito
- Autenticar usuários de forma segura
- Controlar acesso aos recursos
- Gerenciar sessões de usuário
- Implementar autenticação multi-fator (2FA)

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Segurança:** Autenticação robusta e segura
- **Usabilidade:** Experiência de login fluida
- **Flexibilidade:** Múltiplos métodos de autenticação
- **Compliance:** Atendimento a padrões de segurança

### Requisitos Funcionais
- Login com email/senha
- Autenticação de dois fatores (2FA)
- Recuperação de senha
- Gestão de sessões
- Login social (Google, Microsoft)
- SSO (Single Sign-On)
- Controle de tentativas de login
- Auditoria de acessos

### Requisitos Não-Funcionais
- Segurança: Criptografia forte
- Performance: Login < 2 segundos
- Disponibilidade: 99.9% uptime
- Escalabilidade: 10k+ usuários simultâneos
- Usabilidade: Interface intuitiva

---

## 3. Funcionalidades

### 3.1 Autenticação Básica
- **Login:** Email/senha com validação
- **Logout:** Encerramento seguro de sessão
- **Lembrar-me:** Sessão persistente
- **Bloqueio:** Bloqueio por tentativas excessivas
- **Captcha:** Proteção contra bots

### 3.2 Autenticação Multi-Fator (2FA)
- **TOTP:** Time-based One-Time Password
- **SMS:** Código via SMS
- **Email:** Código via email
- **Backup Codes:** Códigos de recuperação
- **Biometria:** Autenticação biométrica (futuro)

### 3.3 Recuperação de Senha
- **Reset por Email:** Link de recuperação
- **Perguntas de Segurança:** Validação adicional
- **Expiração:** Links com tempo limitado
- **Histórico:** Controle de senhas anteriores
- **Política:** Validação de complexidade

### 3.4 Login Social
- **Google:** OAuth 2.0 com Google
- **Microsoft:** OAuth 2.0 com Microsoft
- **LinkedIn:** OAuth 2.0 com LinkedIn
- **GitHub:** OAuth 2.0 com GitHub (dev)
- **Personalizado:** Provedores customizados

### 3.5 Gestão de Sessões
- **Múltiplas Sessões:** Controle de dispositivos
- **Expiração:** Timeout automático
- **Renovação:** Refresh tokens
- **Revogação:** Encerramento remoto
- **Monitoramento:** Atividade de sessão

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/auth/
├── login/
│   ├── page.tsx                # Página de login
│   ├── components/
│   │   ├── LoginForm.tsx       # Formulário de login
│   │   ├── SocialLogin.tsx     # Login social
│   │   ├── TwoFactorForm.tsx   # Formulário 2FA
│   │   └── CaptchaWidget.tsx   # Widget de captcha
│   └── hooks/
│       ├── useLogin.tsx        # Hook de login
│       └── useSocialAuth.tsx   # Hook login social
├── register/
│   ├── page.tsx                # Página de registro
│   ├── verify/page.tsx         # Verificação de email
│   └── components/
│       ├── RegisterForm.tsx    # Formulário de registro
│       └── EmailVerification.tsx # Verificação
├── forgot-password/
│   ├── page.tsx                # Esqueci a senha
│   ├── reset/page.tsx          # Reset de senha
│   └── components/
│       ├── ForgotForm.tsx      # Formulário esqueci
│       └── ResetForm.tsx       # Formulário reset
├── two-factor/
│   ├── setup/page.tsx          # Configurar 2FA
│   ├── verify/page.tsx         # Verificar 2FA
│   ├── backup-codes/page.tsx   # Códigos de backup
│   └── components/
│       ├── QRCodeSetup.tsx     # Setup QR Code
│       ├── TOTPVerify.tsx      # Verificação TOTP
│       └── BackupCodes.tsx     # Códigos backup
├── sessions/
│   ├── page.tsx                # Gerenciar sessões
│   └── components/
│       ├── SessionList.tsx     # Lista de sessões
│       └── SessionCard.tsx     # Card de sessão
├── profile/
│   ├── page.tsx                # Perfil do usuário
│   ├── security/page.tsx       # Configurações segurança
│   └── components/
│       ├── ProfileForm.tsx     # Formulário perfil
│       ├── PasswordChange.tsx  # Alterar senha
│       └── SecuritySettings.tsx # Config segurança
├── components/
│   ├── AuthGuard.tsx           # Proteção de rotas
│   ├── LoginRequired.tsx       # Login obrigatório
│   ├── PermissionGuard.tsx     # Proteção permissões
│   ├── SessionProvider.tsx     # Provider de sessão
│   └── AuthStatus.tsx          # Status de autenticação
├── hooks/
│   ├── useAuth.tsx             # Hook principal auth
│   ├── useSession.tsx          # Hook de sessão
│   ├── usePermissions.tsx      # Hook de permissões
│   ├── use2FA.tsx              # Hook 2FA
│   └── usePasswordPolicy.tsx   # Hook política senha
├── lib/
│   ├── auth.ts                 # Configuração NextAuth
│   ├── jwt.ts                  # Utilitários JWT
│   ├── password.ts             # Utilitários senha
│   ├── totp.ts                 # Utilitários TOTP
│   └── session.ts              # Utilitários sessão
└── types/
    └── auth.ts                 # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model Usuario {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  email           String    @unique
  emailVerified   DateTime?
  nome            String
  sobrenome       String?
  avatar          String?
  
  // Autenticação
  password        String?   // Hash da senha
  passwordChangedAt DateTime?
  
  // 2FA
  twoFactorEnabled Boolean  @default(false)
  twoFactorSecret String?   // Secret TOTP
  backupCodes     String[]  // Códigos de backup
  
  // Controle de Acesso
  isActive        Boolean   @default(true)
  isVerified      Boolean   @default(false)
  lastLoginAt     DateTime?
  loginAttempts   Int       @default(0)
  lockedUntil     DateTime?
  
  // Relacionamentos
  empresaId       String?
  empresa         Empresa?  @relation(fields: [empresaId], references: [id])
  colaboradorId   String?   @unique
  colaborador     Colaborador? @relation(fields: [colaboradorId], references: [id])
  
  // Sessões e Atividades
  sessoes         SessaoUsuario[]
  atividades      AtividadeUsuario[]
  
  // Contas Sociais
  accounts        Account[]
  
  // Tokens
  tokens          VerificationToken[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@map("usuarios")
}

model SessaoUsuario {
  id              String    @id @default(cuid())
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  
  // Dados da Sessão
  sessionToken    String    @unique
  refreshToken    String?   @unique
  
  // Informações do Dispositivo
  userAgent       String?
  ipAddress       String?
  device          String?
  browser         String?
  os              String?
  location        String?   // Cidade/País
  
  // Controle
  isActive        Boolean   @default(true)
  lastActivity    DateTime  @default(now())
  expiresAt       DateTime
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("sessoes_usuario")
}

model AtividadeUsuario {
  id              String    @id @default(cuid())
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  
  // Atividade
  acao            AcaoUsuario
  recurso         String?   // Recurso acessado
  detalhes        Json?     // Detalhes da ação
  
  // Contexto
  ipAddress       String?
  userAgent       String?
  sessaoId        String?
  
  // Resultado
  sucesso         Boolean   @default(true)
  erro            String?
  
  timestamp       DateTime  @default(now())
  
  @@map("atividades_usuario")
}

model Account {
  id              String    @id @default(cuid())
  userId          String
  user            Usuario   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type            String
  provider        String
  providerAccountId String
  refresh_token   String?
  access_token    String?
  expires_at      Int?
  token_type      String?
  scope           String?
  id_token        String?
  session_state   String?
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model VerificationToken {
  id              String    @id @default(cuid())
  usuarioId       String?
  usuario         Usuario?  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  
  identifier      String    // Email ou telefone
  token           String    @unique
  tipo            TipoToken
  
  expiresAt       DateTime
  usedAt          DateTime?
  
  createdAt       DateTime  @default(now())
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}

model ConfiguracaoSeguranca {
  id              String    @id @default(cuid())
  empresaId       String    @unique
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  // Política de Senha
  senhaMinLength  Int       @default(8)
  senhaRequireUpper Boolean @default(true)
  senhaRequireLower Boolean @default(true)
  senhaRequireNumber Boolean @default(true)
  senhaRequireSymbol Boolean @default(false)
  senhaHistoryCount Int     @default(5)
  senhaMaxAge     Int?      // Dias
  
  // Controle de Acesso
  maxLoginAttempts Int      @default(5)
  lockoutDuration Int       @default(30) // Minutos
  sessionTimeout  Int       @default(480) // Minutos
  require2FA      Boolean   @default(false)
  
  // IPs Permitidos
  ipsPermitidos   String[]
  
  // Configurações Avançadas
  enableCaptcha   Boolean   @default(true)
  enableSocialLogin Boolean @default(true)
  enableSSO       Boolean   @default(false)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("configuracoes_seguranca")
}

enum AcaoUsuario {
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_CHANGE
  PASSWORD_RESET
  EMAIL_VERIFY
  TWO_FACTOR_ENABLE
  TWO_FACTOR_DISABLE
  TWO_FACTOR_VERIFY
  PROFILE_UPDATE
  SESSION_CREATE
  SESSION_DESTROY
  PERMISSION_GRANT
  PERMISSION_REVOKE
}

enum TipoToken {
  EMAIL_VERIFICATION
  PASSWORD_RESET
  TWO_FACTOR
  PHONE_VERIFICATION
}
```

### 4.3 Hooks Customizados
- **useAuth:** Hook principal de autenticação
- **useSession:** Gestão de sessões
- **usePermissions:** Controle de permissões
- **use2FA:** Autenticação de dois fatores

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Autenticação
POST   /api/auth/login                     # Login
POST   /api/auth/logout                    # Logout
POST   /api/auth/refresh                   # Refresh token
GET    /api/auth/me                        # Dados do usuário

// Registro
POST   /api/auth/register                  # Registro
POST   /api/auth/verify-email              # Verificar email
POST   /api/auth/resend-verification       # Reenviar verificação

// Recuperação de Senha
POST   /api/auth/forgot-password           # Esqueci a senha
POST   /api/auth/reset-password            # Reset senha
POST   /api/auth/change-password           # Alterar senha

// 2FA
POST   /api/auth/2fa/setup                 # Configurar 2FA
POST   /api/auth/2fa/verify                # Verificar 2FA
POST   /api/auth/2fa/disable               # Desabilitar 2FA
GET    /api/auth/2fa/backup-codes          # Códigos backup
POST   /api/auth/2fa/regenerate-codes      # Regenerar códigos

// Sessões
GET    /api/auth/sessions                  # Listar sessões
DELETE /api/auth/sessions/[id]             # Revogar sessão
DELETE /api/auth/sessions/all              # Revogar todas

// Login Social
GET    /api/auth/[...nextauth]             # NextAuth endpoints

// Atividades
GET    /api/auth/activities                # Atividades do usuário
GET    /api/auth/activities/[id]           # Detalhes atividade

// Configurações
GET    /api/auth/security-settings         # Config segurança
PUT    /api/auth/security-settings         # Atualizar config
```

### 5.2 Estrutura de Resposta
```typescript
interface AuthResponse {
  user: {
    id: string;
    email: string;
    nome: string;
    avatar?: string;
    isVerified: boolean;
    twoFactorEnabled: boolean;
    empresa?: {
      id: string;
      nome: string;
    };
  };
  session: {
    id: string;
    token: string;
    expiresAt: string;
  };
  permissions: string[];
}

interface SessionResponse {
  id: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  ipAddress?: string;
  lastActivity: string;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: string;
}
```

### 5.3 Validações (Zod)
```typescript
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
  captcha: z.string().optional()
});

const RegisterSchema = z.object({
  email: z.string().email(),
  nome: z.string().min(2).max(50),
  sobrenome: z.string().min(2).max(50).optional(),
  password: z.string().min(8).max(100),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true)
}).refine(data => data.password === data.confirmPassword);

const PasswordResetSchema = z.object({
  token: z.string(),
  password: z.string().min(8).max(100),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword);
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Login:** Formulário de autenticação
- **Registro:** Criação de conta
- **2FA Setup:** Configuração de 2FA
- **Perfil:** Gestão de conta
- **Sessões:** Gerenciamento de sessões

### 6.2 Componentes Reutilizáveis
- **AuthGuard:** Proteção de rotas
- **LoginForm:** Formulário de login
- **SocialLogin:** Botões de login social
- **PasswordStrength:** Indicador de força
- **QRCodeSetup:** Configuração TOTP

### 6.3 Estados de Interface
- Loading: Indicadores de carregamento
- Error: Mensagens de erro
- Success: Confirmações
- Locked: Conta bloqueada
- Verification: Verificação pendente

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const AUTH_PERMISSIONS = [
  'auth.login',                 // Fazer login
  'auth.register',              // Registrar conta
  'auth.profile.read',          # Ver perfil
  'auth.profile.write',         # Editar perfil
  'auth.sessions.read',         # Ver sessões
  'auth.sessions.write',        # Gerenciar sessões
  'auth.2fa.setup',             # Configurar 2FA
  'auth.security.read',         # Ver config segurança
  'auth.security.write'         # Alterar config segurança
];
```

### 7.2 Níveis de Acesso
- **Público:** Login e registro
- **Usuário:** Gestão de conta própria
- **Admin:** Gestão de usuários
- **Super Admin:** Configurações globais

### 7.3 Segurança Implementada
- Hash de senhas com bcrypt
- JWT com refresh tokens
- Rate limiting
- Proteção CSRF
- Validação de entrada
- Auditoria completa
- Criptografia de dados sensíveis

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Usuários:** Gestão de contas
- **Empresas:** Multi-tenancy
- **Permissões:** Controle de acesso
- **Logs:** Auditoria
- **Notificações:** Alertas de segurança

### 8.2 Sistemas Externos
- **Google OAuth:** Login social
- **Microsoft OAuth:** Login social
- **SMS Gateway:** Códigos 2FA
- **Email Service:** Verificações
- **LDAP/AD:** Integração corporativa

### 8.3 Eventos e Webhooks
- Login realizado
- Falha de login
- Conta bloqueada
- 2FA configurado
- Senha alterada
- Sessão expirada

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Autenticação básica
- ✅ **Semana 3-4:** Gestão de sessões
- ✅ **Semana 5-6:** Recuperação de senha
- ✅ **Semana 7-8:** Autenticação 2FA
- ✅ **Semana 9-10:** Login social
- ✅ **Semana 11-12:** Interface de usuário
- ✅ **Semana 13-14:** Auditoria e logs
- ✅ **Semana 15-16:** Configurações de segurança
- ✅ **Semana 17-18:** Rate limiting
- ✅ **Semana 19-20:** Testes e otimizações

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** Autenticação biométrica
- 📋 **Q2 2025:** SSO empresarial
- 📋 **Q3 2025:** Análise comportamental
- 📋 **Q4 2025:** Zero Trust Security

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (95% cobertura)
- **Integração:** Fluxos de autenticação
- **E2E:** Cenários completos
- **Segurança:** Testes de penetração

### 10.2 Métricas de Qualidade
- Cobertura de testes: 95%
- Performance: < 2 segundos
- Disponibilidade: 99.9%
- Segurança: Sem vulnerabilidades críticas

### 10.3 Critérios de Aceitação
- ✅ Login/logout funcionando
- ✅ 2FA implementado
- ✅ Recuperação de senha
- ✅ Login social
- ✅ Gestão de sessões
- ✅ Auditoria completa
- ✅ Interface responsiva
- ✅ Segurança robusta

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Segurança
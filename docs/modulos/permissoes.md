# Módulo: Permissões

**Status:** ✅ Implementado  
**Categoria:** Core  
**Versão:** 1.0  
**Responsável:** Equipe Segurança  

---

## 1. Visão Geral

O módulo Permissões é responsável pelo controle de acesso granular do GarapaSystem. Implementa um sistema RBAC (Role-Based Access Control) flexível que permite definir perfis, permissões e controlar o acesso a recursos específicos do sistema de forma hierárquica e escalável.

### Propósito
- Controlar acesso a recursos do sistema
- Implementar hierarquia de permissões
- Gerenciar perfis de usuário
- Facilitar administração de acessos

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Segurança:** Controle granular de acesso
- **Flexibilidade:** Sistema adaptável a diferentes cenários
- **Escalabilidade:** Suporte a grandes volumes de usuários
- **Usabilidade:** Interface intuitiva para administração

### Requisitos Funcionais
- Sistema RBAC completo
- Hierarquia de perfis
- Permissões granulares
- Herança de permissões
- Delegação temporária
- Auditoria de acessos
- Grupos de usuários
- Permissões condicionais

### Requisitos Não-Funcionais
- Segurança: Controle rigoroso
- Performance: Verificação < 100ms
- Disponibilidade: 99.9% uptime
- Escalabilidade: 100k+ permissões
- Usabilidade: Interface administrativa

---

## 3. Funcionalidades

### 3.1 Gestão de Perfis
- **Criação:** Definição de novos perfis
- **Hierarquia:** Estrutura hierárquica de perfis
- **Herança:** Herança automática de permissões
- **Templates:** Perfis pré-definidos
- **Customização:** Personalização por empresa

### 3.2 Gestão de Permissões
- **Granularidade:** Controle fino de recursos
- **Categorização:** Organização por módulos
- **Condicionais:** Permissões baseadas em contexto
- **Temporárias:** Permissões com expiração
- **Delegação:** Delegação de permissões

### 3.3 Atribuição de Acesso
- **Usuário-Perfil:** Atribuição direta
- **Usuário-Permissão:** Permissões específicas
- **Grupos:** Gestão por grupos
- **Herança:** Herança automática
- **Exceções:** Negação específica

### 3.4 Auditoria e Controle
- **Logs:** Registro de todas as ações
- **Relatórios:** Relatórios de acesso
- **Monitoramento:** Monitoramento em tempo real
- **Alertas:** Alertas de segurança
- **Compliance:** Atendimento a regulamentações

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/permissions/
├── page.tsx                     # Lista de permissões
├── profiles/
│   ├── page.tsx                # Lista de perfis
│   ├── [id]/
│   │   ├── page.tsx            # Detalhes do perfil
│   │   ├── edit/page.tsx       # Editar perfil
│   │   ├── permissions/page.tsx # Permissões do perfil
│   │   └── users/page.tsx      # Usuários do perfil
│   ├── new/page.tsx            # Novo perfil
│   └── hierarchy/page.tsx      # Hierarquia de perfis
├── users/
│   ├── page.tsx                # Usuários e permissões
│   ├── [id]/
│   │   ├── page.tsx            # Permissões do usuário
│   │   ├── assign/page.tsx     # Atribuir permissões
│   │   └── history/page.tsx    # Histórico de permissões
│   └── bulk/page.tsx           # Atribuição em massa
├── groups/
│   ├── page.tsx                # Lista de grupos
│   ├── [id]/page.tsx           # Detalhes do grupo
│   ├── new/page.tsx            # Novo grupo
│   └── permissions/page.tsx    # Permissões do grupo
├── audit/
│   ├── page.tsx                # Auditoria de acessos
│   ├── reports/page.tsx        # Relatórios
│   └── alerts/page.tsx         # Alertas de segurança
├── settings/
│   ├── page.tsx                # Configurações
│   ├── policies/page.tsx       # Políticas de acesso
│   └── templates/page.tsx      # Templates de perfis
├── components/
│   ├── PermissionTree.tsx      # Árvore de permissões
│   ├── ProfileCard.tsx         # Card de perfil
│   ├── UserPermissions.tsx     # Permissões do usuário
│   ├── PermissionMatrix.tsx    # Matriz de permissões
│   ├── AccessControl.tsx       # Controle de acesso
│   ├── PermissionChecker.tsx   # Verificador
│   ├── RoleHierarchy.tsx       # Hierarquia de perfis
│   └── AuditLog.tsx            # Log de auditoria
├── hooks/
│   ├── usePermissions.tsx      # Hook principal
│   ├── useProfiles.tsx         # Hook de perfis
│   ├── useUserPermissions.tsx  # Hook usuário
│   ├── useAccessControl.tsx    # Hook controle
│   └── useAudit.tsx            # Hook auditoria
├── lib/
│   ├── rbac.ts                 # Sistema RBAC
│   ├── permissions.ts          # Definições
│   ├── access-control.ts       # Controle de acesso
│   └── audit.ts                # Auditoria
└── types/
    └── permissions.ts          # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model Perfil {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  nome            String
  descricao       String?
  codigo          String?   @unique
  
  // Hierarquia
  nivel           Int       @default(1)
  perfilPaiId     String?
  perfilPai       Perfil?   @relation("PerfilHierarquia", fields: [perfilPaiId], references: [id])
  subperfis       Perfil[]  @relation("PerfilHierarquia")
  
  // Configurações
  isSystem        Boolean   @default(false) // Perfil do sistema
  isActive        Boolean   @default(true)
  cor             String?   // Cor para identificação
  icone           String?   // Ícone do perfil
  
  // Relacionamentos
  empresaId       String?
  empresa         Empresa?  @relation(fields: [empresaId], references: [id])
  
  // Permissões e Usuários
  permissoes      PerfilPermissao[]
  usuarios        UsuarioPerfil[]
  grupos          GrupoPermissao[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@map("perfis")
}

model Permissao {
  id              String    @id @default(cuid())
  
  // Identificação
  codigo          String    @unique // Ex: users.read, orders.write
  nome            String
  descricao       String?
  
  // Categorização
  modulo          String    // Módulo do sistema
  categoria       String?   // Categoria dentro do módulo
  recurso         String    // Recurso específico
  acao            AcaoPermissao // Ação permitida
  
  // Configurações
  isSystem        Boolean   @default(false)
  isActive        Boolean   @default(true)
  nivel           NivelPermissao @default(BASICO)
  
  // Condições
  condicoes       Json?     // Condições para aplicação
  
  // Relacionamentos
  perfis          PerfilPermissao[]
  usuarios        UsuarioPermissao[]
  grupos          GrupoPermissao[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("permissoes")
}

model PerfilPermissao {
  id              String    @id @default(cuid())
  perfilId        String
  perfil          Perfil    @relation(fields: [perfilId], references: [id], onDelete: Cascade)
  permissaoId     String
  permissao       Permissao @relation(fields: [permissaoId], references: [id], onDelete: Cascade)
  
  // Configurações
  concedida       Boolean   @default(true) // true = concedida, false = negada
  herdada         Boolean   @default(false) // Herdada de perfil pai
  
  // Condições Específicas
  condicoes       Json?
  
  // Auditoria
  concedidoPor    String?
  concedidoEm     DateTime  @default(now())
  
  @@unique([perfilId, permissaoId])
  @@map("perfil_permissoes")
}

model UsuarioPerfil {
  id              String    @id @default(cuid())
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  perfilId        String
  perfil          Perfil    @relation(fields: [perfilId], references: [id], onDelete: Cascade)
  
  // Configurações
  isActive        Boolean   @default(true)
  isPrimario      Boolean   @default(false) // Perfil principal
  
  // Validade
  validoAte       DateTime?
  
  // Auditoria
  atribuidoPor    String?
  atribuidoEm     DateTime  @default(now())
  
  @@unique([usuarioId, perfilId])
  @@map("usuario_perfis")
}

model UsuarioPermissao {
  id              String    @id @default(cuid())
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  permissaoId     String
  permissao       Permissao @relation(fields: [permissaoId], references: [id], onDelete: Cascade)
  
  // Configurações
  concedida       Boolean   @default(true)
  
  // Validade
  validoAte       DateTime?
  
  // Contexto
  contexto        Json?     // Contexto específico
  
  // Auditoria
  concedidoPor    String?
  concedidoEm     DateTime  @default(now())
  
  @@unique([usuarioId, permissaoId])
  @@map("usuario_permissoes")
}

model GrupoUsuario {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  nome            String
  descricao       String?
  
  // Configurações
  isActive        Boolean   @default(true)
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  // Membros e Permissões
  membros         UsuarioGrupo[]
  permissoes      GrupoPermissao[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("grupos_usuario")
}

model UsuarioGrupo {
  id              String    @id @default(cuid())
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  grupoId         String
  grupo           GrupoUsuario @relation(fields: [grupoId], references: [id], onDelete: Cascade)
  
  // Configurações
  isActive        Boolean   @default(true)
  
  // Validade
  validoAte       DateTime?
  
  // Auditoria
  adicionadoPor   String?
  adicionadoEm    DateTime  @default(now())
  
  @@unique([usuarioId, grupoId])
  @@map("usuario_grupos")
}

model GrupoPermissao {
  id              String    @id @default(cuid())
  grupoId         String?
  grupo           GrupoUsuario? @relation(fields: [grupoId], references: [id], onDelete: Cascade)
  perfilId        String?
  perfil          Perfil?   @relation(fields: [perfilId], references: [id], onDelete: Cascade)
  permissaoId     String
  permissao       Permissao @relation(fields: [permissaoId], references: [id], onDelete: Cascade)
  
  // Configurações
  concedida       Boolean   @default(true)
  
  // Auditoria
  concedidoPor    String?
  concedidoEm     DateTime  @default(now())
  
  @@map("grupo_permissoes")
}

model LogPermissao {
  id              String    @id @default(cuid())
  
  // Usuário
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  
  // Ação
  acao            AcaoLogPermissao
  recurso         String    // Recurso acessado
  permissao       String?   // Permissão verificada
  
  // Resultado
  autorizado      Boolean
  motivo          String?   // Motivo da negação
  
  // Contexto
  ipAddress       String?
  userAgent       String?
  sessaoId        String?
  
  // Detalhes
  detalhes        Json?
  
  timestamp       DateTime  @default(now())
  
  @@map("logs_permissao")
}

enum AcaoPermissao {
  CREATE  // Criar
  READ    // Ler
  UPDATE  // Atualizar
  DELETE  // Deletar
  EXECUTE // Executar
  APPROVE // Aprovar
  MANAGE  // Gerenciar
}

enum NivelPermissao {
  BASICO
  INTERMEDIARIO
  AVANCADO
  CRITICO
}

enum AcaoLogPermissao {
  ACESSO_PERMITIDO
  ACESSO_NEGADO
  PERMISSAO_CONCEDIDA
  PERMISSAO_REVOGADA
  PERFIL_ATRIBUIDO
  PERFIL_REMOVIDO
  GRUPO_ADICIONADO
  GRUPO_REMOVIDO
}
```

### 4.3 Hooks Customizados
- **usePermissions:** Hook principal de permissões
- **useProfiles:** Gestão de perfis
- **useUserPermissions:** Permissões do usuário
- **useAccessControl:** Controle de acesso

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Perfis
GET    /api/permissions/profiles            # Listar perfis
POST   /api/permissions/profiles            # Criar perfil
GET    /api/permissions/profiles/[id]       # Buscar perfil
PUT    /api/permissions/profiles/[id]       # Atualizar perfil
DELETE /api/permissions/profiles/[id]       # Deletar perfil
GET    /api/permissions/profiles/hierarchy  # Hierarquia

// Permissões
GET    /api/permissions                     # Listar permissões
POST   /api/permissions                     # Criar permissão
GET    /api/permissions/[id]                # Buscar permissão
PUT    /api/permissions/[id]                # Atualizar permissão
DELETE /api/permissions/[id]                # Deletar permissão
GET    /api/permissions/modules             # Por módulo

// Atribuições
POST   /api/permissions/assign/user         # Atribuir a usuário
POST   /api/permissions/assign/profile      # Atribuir a perfil
POST   /api/permissions/assign/group        # Atribuir a grupo
DELETE /api/permissions/revoke/user         # Revogar de usuário
DELETE /api/permissions/revoke/profile      # Revogar de perfil

// Verificações
POST   /api/permissions/check               # Verificar permissão
GET    /api/permissions/user/[userId]       # Permissões do usuário
GET    /api/permissions/effective/[userId]  # Permissões efetivas

// Grupos
GET    /api/permissions/groups              # Listar grupos
POST   /api/permissions/groups              # Criar grupo
GET    /api/permissions/groups/[id]         # Buscar grupo
PUT    /api/permissions/groups/[id]         # Atualizar grupo
DELETE /api/permissions/groups/[id]         # Deletar grupo

// Auditoria
GET    /api/permissions/audit               # Logs de auditoria
GET    /api/permissions/audit/user/[userId] # Logs do usuário
GET    /api/permissions/reports             # Relatórios
```

### 5.2 Estrutura de Resposta
```typescript
interface PermissionResponse {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  modulo: string;
  categoria?: string;
  recurso: string;
  acao: AcaoPermissao;
  nivel: NivelPermissao;
  isSystem: boolean;
  isActive: boolean;
}

interface ProfileResponse {
  id: string;
  nome: string;
  descricao?: string;
  codigo?: string;
  nivel: number;
  isSystem: boolean;
  isActive: boolean;
  perfilPai?: {
    id: string;
    nome: string;
  };
  permissoes: PermissionResponse[];
  usuarios: number; // Quantidade de usuários
}

interface UserPermissionsResponse {
  usuario: {
    id: string;
    nome: string;
    email: string;
  };
  perfis: ProfileResponse[];
  permissoesEfetivas: PermissionResponse[];
  permissoesEspecificas: PermissionResponse[];
  grupos: {
    id: string;
    nome: string;
  }[];
}
```

### 5.3 Validações (Zod)
```typescript
const ProfileSchema = z.object({
  nome: z.string().min(2).max(50),
  descricao: z.string().max(200).optional(),
  codigo: z.string().max(20).optional(),
  perfilPaiId: z.string().cuid().optional(),
  cor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  icone: z.string().max(50).optional()
});

const PermissionSchema = z.object({
  codigo: z.string().min(3).max(100),
  nome: z.string().min(2).max(100),
  descricao: z.string().max(200).optional(),
  modulo: z.string().min(2).max(50),
  categoria: z.string().max(50).optional(),
  recurso: z.string().min(2).max(50),
  acao: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE', 'APPROVE', 'MANAGE']),
  nivel: z.enum(['BASICO', 'INTERMEDIARIO', 'AVANCADO', 'CRITICO']).optional()
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Lista de Perfis:** Gestão de perfis
- **Matriz de Permissões:** Visualização matricial
- **Usuários e Permissões:** Atribuições
- **Auditoria:** Logs e relatórios
- **Configurações:** Políticas de acesso

### 6.2 Componentes Reutilizáveis
- **PermissionTree:** Árvore de permissões
- **AccessControl:** Controle de acesso
- **PermissionMatrix:** Matriz visual
- **RoleHierarchy:** Hierarquia de perfis
- **PermissionChecker:** Verificador

### 6.3 Estados de Interface
- Loading: Carregamento de permissões
- Empty: Sem permissões
- Error: Erros de acesso
- Denied: Acesso negado
- Granted: Acesso concedido

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const PERMISSION_PERMISSIONS = [
  'permissions.read',           // Ver permissões
  'permissions.write',          // Gerenciar permissões
  'permissions.assign',         // Atribuir permissões
  'permissions.revoke',         // Revogar permissões
  'profiles.read',              // Ver perfis
  'profiles.write',             // Gerenciar perfis
  'profiles.assign',            // Atribuir perfis
  'groups.read',                // Ver grupos
  'groups.write',               // Gerenciar grupos
  'permissions.audit.read',     // Ver auditoria
  'permissions.system.write'    // Gerenciar sistema
];
```

### 7.2 Níveis de Acesso
- **Usuário:** Ver próprias permissões
- **Supervisor:** Gerenciar equipe
- **Admin:** Gestão completa
- **Super Admin:** Permissões de sistema

### 7.3 Segurança Implementada
- Verificação em tempo real
- Cache de permissões
- Auditoria completa
- Prevenção de escalação
- Validação de contexto
- Isolamento por empresa

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Autenticação:** Controle de acesso
- **Usuários:** Gestão de contas
- **Empresas:** Multi-tenancy
- **Logs:** Auditoria
- **Todos os módulos:** Controle de acesso

### 8.2 Sistemas Externos
- **LDAP/AD:** Sincronização de perfis
- **SSO:** Single Sign-On
- **IAM:** Identity and Access Management
- **Compliance:** Sistemas de compliance

### 8.3 Eventos e Webhooks
- Permissão concedida
- Permissão revogada
- Perfil atribuído
- Acesso negado
- Violação de segurança

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Modelo de dados RBAC
- ✅ **Semana 3-4:** Sistema de perfis
- ✅ **Semana 5-6:** Gestão de permissões
- ✅ **Semana 7-8:** Hierarquia de perfis
- ✅ **Semana 9-10:** Atribuição de permissões
- ✅ **Semana 11-12:** Interface administrativa
- ✅ **Semana 13-14:** Sistema de grupos
- ✅ **Semana 15-16:** Auditoria e logs
- ✅ **Semana 17-18:** Verificação em tempo real
- ✅ **Semana 19-20:** Testes e otimizações

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** Permissões condicionais avançadas
- 📋 **Q2 2025:** IA para detecção de anomalias
- 📋 **Q3 2025:** Integração com IAM externo
- 📋 **Q4 2025:** Zero Trust Access

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (92% cobertura)
- **Integração:** Fluxos de permissões
- **E2E:** Cenários de acesso
- **Segurança:** Testes de escalação

### 10.2 Métricas de Qualidade
- Cobertura de testes: 92%
- Performance: < 100ms verificação
- Disponibilidade: 99.9%
- Segurança: Sem vulnerabilidades

### 10.3 Critérios de Aceitação
- ✅ Sistema RBAC funcionando
- ✅ Hierarquia de perfis
- ✅ Permissões granulares
- ✅ Atribuição flexível
- ✅ Auditoria completa
- ✅ Interface administrativa
- ✅ Performance adequada
- ✅ Segurança robusta

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Segurança
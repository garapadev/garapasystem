# Módulo: Configurações

**Status:** ✅ Implementado  
**Categoria:** Core  
**Versão:** 1.0  
**Responsável:** Equipe Core  

---

## 1. Visão Geral

O módulo Configurações é responsável pelo gerenciamento centralizado de todas as configurações do sistema, incluindo parâmetros globais, configurações por empresa, integrações, notificações e personalizações. É um módulo fundamental que permite a customização e adaptação do sistema às necessidades específicas de cada organização.

### Propósito
- Centralizar configurações do sistema
- Permitir customização por empresa
- Gerenciar integrações externas
- Controlar comportamentos do sistema

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Centralização:** Ponto único para configurações
- **Flexibilidade:** Adaptação às necessidades específicas
- **Segurança:** Controle de acesso às configurações
- **Auditoria:** Rastreamento de alterações

### Requisitos Funcionais
- Configurações globais do sistema
- Configurações específicas por empresa
- Gestão de integrações externas
- Configurações de notificações
- Parâmetros de segurança
- Configurações de interface
- Backup e restauração de configurações
- Versionamento de configurações

### Requisitos Não-Funcionais
- Performance: Carregamento < 1 segundo
- Disponibilidade: 99.9% uptime
- Segurança: Criptografia de dados sensíveis
- Usabilidade: Interface intuitiva
- Auditoria: Log de todas as alterações

---

## 3. Funcionalidades

### 3.1 Configurações Globais
- **Sistema:** Parâmetros gerais do sistema
- **Segurança:** Políticas de senha, sessão, etc.
- **Email:** Configurações de SMTP
- **Backup:** Configurações de backup automático
- **Logs:** Níveis de log e retenção
- **Performance:** Cache, rate limiting, etc.

### 3.2 Configurações por Empresa
- **Informações:** Dados da empresa
- **Personalização:** Logo, cores, tema
- **Módulos:** Habilitação/desabilitação de módulos
- **Integrações:** APIs e webhooks específicos
- **Notificações:** Preferências de comunicação
- **Workflow:** Fluxos personalizados

### 3.3 Integrações Externas
- **APIs:** Configuração de APIs externas
- **Webhooks:** URLs e eventos
- **Email:** Provedores de email
- **SMS:** Provedores de SMS
- **Pagamento:** Gateways de pagamento
- **Armazenamento:** Cloud storage

### 3.4 Configurações de Interface
- **Tema:** Cores e aparência
- **Layout:** Disposição de elementos
- **Idioma:** Localização
- **Timezone:** Fuso horário
- **Formato:** Data, hora, moeda
- **Dashboard:** Widgets padrão

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/configurations/
├── page.tsx                     # Dashboard de configurações
├── system/
│   ├── page.tsx                # Configurações do sistema
│   ├── security/page.tsx       # Configurações de segurança
│   ├── email/page.tsx          # Configurações de email
│   ├── backup/page.tsx         # Configurações de backup
│   └── performance/page.tsx    # Configurações de performance
├── company/
│   ├── page.tsx                # Configurações da empresa
│   ├── branding/page.tsx       # Marca e personalização
│   ├── modules/page.tsx        # Habilitação de módulos
│   └── workflow/page.tsx       # Fluxos de trabalho
├── integrations/
│   ├── page.tsx                # Lista de integrações
│   ├── apis/page.tsx           # Configuração de APIs
│   ├── webhooks/page.tsx       # Configuração de webhooks
│   ├── email/page.tsx          # Provedores de email
│   ├── sms/page.tsx            # Provedores de SMS
│   └── payment/page.tsx        # Gateways de pagamento
├── interface/
│   ├── page.tsx                # Configurações de interface
│   ├── theme/page.tsx          # Tema e cores
│   ├── layout/page.tsx         # Layout e disposição
│   └── localization/page.tsx   # Localização
├── components/
│   ├── ConfigurationCard.tsx   # Card de configuração
│   ├── ConfigurationForm.tsx   # Formulário genérico
│   ├── SettingsGroup.tsx       # Grupo de configurações
│   ├── ToggleSwitch.tsx        # Switch de habilitação
│   ├── ColorPicker.tsx         # Seletor de cores
│   ├── LogoUpload.tsx          # Upload de logo
│   ├── IntegrationTest.tsx     # Teste de integração
│   ├── ConfigurationHistory.tsx # Histórico de alterações
│   └── BackupRestore.tsx       # Backup e restauração
├── hooks/
│   ├── useConfigurations.tsx   # Hook para configurações
│   ├── useSystemConfig.tsx     # Hook para config do sistema
│   ├── useCompanyConfig.tsx    # Hook para config da empresa
│   ├── useIntegrations.tsx     # Hook para integrações
│   └── useConfigHistory.tsx    # Hook para histórico
└── types/
    └── configuration.ts        # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model ConfiguracaoSistema {
  id              String    @id @default(cuid())
  chave           String    @unique
  valor           Json
  tipo            TipoConfiguracao
  categoria       CategoriaConfiguracao
  descricao       String?
  isEncrypted     Boolean   @default(false)
  isRequired      Boolean   @default(false)
  
  // Validação
  schema          Json?     // Schema de validação
  valorPadrao     Json?     // Valor padrão
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("configuracoes_sistema")
}

model ConfiguracaoEmpresa {
  id              String    @id @default(cuid())
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  chave           String
  valor           Json
  tipo            TipoConfiguracao
  categoria       CategoriaConfiguracao
  descricao       String?
  isEncrypted     Boolean   @default(false)
  
  // Herança
  herdaSistema    Boolean   @default(true)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@unique([empresaId, chave])
  @@map("configuracoes_empresa")
}

model IntegracaoExterna {
  id              String    @id @default(cuid())
  nome            String
  tipo            TipoIntegracao
  provedor        String
  
  // Configurações
  configuracao    Json      // Configurações específicas
  credenciais     Json      // Credenciais (criptografadas)
  webhookUrl      String?
  eventos         String[]  // Eventos suportados
  
  // Status
  isActive        Boolean   @default(true)
  isConfigured    Boolean   @default(false)
  lastTest        DateTime?
  lastTestResult  Json?
  
  // Relacionamentos
  empresaId       String?
  empresa         Empresa?  @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("integracoes_externas")
}

model HistoricoConfiguracao {
  id              String    @id @default(cuid())
  tipo            String    // sistema ou empresa
  referenciaId    String    // ID da configuração
  chave           String
  valorAnterior   Json?
  valorNovo       Json
  acao            AcaoConfiguracao
  
  // Auditoria
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  ipAddress       String?
  userAgent       String?
  motivo          String?
  
  createdAt       DateTime  @default(now())
  
  @@map("historico_configuracoes")
}

enum TipoConfiguracao {
  STRING
  NUMBER
  BOOLEAN
  JSON
  ARRAY
  PASSWORD
  URL
  EMAIL
  COLOR
  FILE
}

enum CategoriaConfiguracao {
  SISTEMA
  SEGURANCA
  EMAIL
  SMS
  BACKUP
  PERFORMANCE
  INTERFACE
  INTEGRACAO
  NOTIFICACAO
  WORKFLOW
}

enum TipoIntegracao {
  EMAIL
  SMS
  PAYMENT
  STORAGE
  API
  WEBHOOK
  OAUTH
  DATABASE
}

enum AcaoConfiguracao {
  CRIADA
  ATUALIZADA
  REMOVIDA
  RESTAURADA
}
```

### 4.3 Hooks Customizados
- **useConfigurations:** Gestão geral de configurações
- **useSystemConfig:** Configurações do sistema
- **useCompanyConfig:** Configurações da empresa
- **useIntegrations:** Integrações externas
- **useConfigHistory:** Histórico de alterações

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Configurações do Sistema
GET    /api/configurations/system           # Listar configurações do sistema
GET    /api/configurations/system/[key]     # Buscar configuração específica
PUT    /api/configurations/system/[key]     # Atualizar configuração
POST   /api/configurations/system/bulk      # Atualização em massa

// Configurações da Empresa
GET    /api/configurations/company          # Listar configurações da empresa
GET    /api/configurations/company/[key]    # Buscar configuração específica
PUT    /api/configurations/company/[key]    # Atualizar configuração
POST   /api/configurations/company/bulk     # Atualização em massa
DELETE /api/configurations/company/[key]    # Remover (voltar ao padrão)

// Integrações
GET    /api/configurations/integrations     # Listar integrações
POST   /api/configurations/integrations     # Criar integração
GET    /api/configurations/integrations/[id] # Buscar integração
PUT    /api/configurations/integrations/[id] # Atualizar integração
DELETE /api/configurations/integrations/[id] # Deletar integração
POST   /api/configurations/integrations/[id]/test # Testar integração

// Histórico
GET    /api/configurations/history          # Histórico de alterações
GET    /api/configurations/history/[id]     # Detalhes da alteração
POST   /api/configurations/history/[id]/restore # Restaurar configuração

// Backup e Restauração
GET    /api/configurations/backup           # Gerar backup
POST   /api/configurations/restore          # Restaurar backup
GET    /api/configurations/export           # Exportar configurações
POST   /api/configurations/import           # Importar configurações

// Validação
POST   /api/configurations/validate         # Validar configurações
GET    /api/configurations/schema/[key]     # Schema de validação
```

### 5.2 Estrutura de Resposta
```typescript
interface ConfigurationResponse {
  id: string;
  chave: string;
  valor: any;
  tipo: TipoConfiguracao;
  categoria: CategoriaConfiguracao;
  descricao?: string;
  isEncrypted: boolean;
  isRequired: boolean;
  schema?: any;
  valorPadrao?: any;
  createdAt: string;
  updatedAt: string;
}

interface IntegrationResponse {
  id: string;
  nome: string;
  tipo: TipoIntegracao;
  provedor: string;
  configuracao: any;
  webhookUrl?: string;
  eventos: string[];
  isActive: boolean;
  isConfigured: boolean;
  lastTest?: string;
  lastTestResult?: any;
  createdAt: string;
  updatedAt: string;
}
```

### 5.3 Validações (Zod)
```typescript
const ConfigurationSchema = z.object({
  chave: z.string().min(1).max(100),
  valor: z.any(),
  tipo: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'ARRAY', 'PASSWORD', 'URL', 'EMAIL', 'COLOR', 'FILE']),
  categoria: z.enum(['SISTEMA', 'SEGURANCA', 'EMAIL', 'SMS', 'BACKUP', 'PERFORMANCE', 'INTERFACE', 'INTEGRACAO', 'NOTIFICACAO', 'WORKFLOW']),
  descricao: z.string().max(500).optional(),
  isEncrypted: z.boolean().optional(),
  isRequired: z.boolean().optional()
});

const IntegrationSchema = z.object({
  nome: z.string().min(1).max(100),
  tipo: z.enum(['EMAIL', 'SMS', 'PAYMENT', 'STORAGE', 'API', 'WEBHOOK', 'OAUTH', 'DATABASE']),
  provedor: z.string().min(1).max(50),
  configuracao: z.record(z.any()),
  credenciais: z.record(z.any()).optional(),
  webhookUrl: z.string().url().optional(),
  eventos: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Dashboard:** Visão geral das configurações
- **Sistema:** Configurações globais
- **Empresa:** Configurações específicas
- **Integrações:** Gestão de integrações
- **Interface:** Personalização da interface

### 6.2 Componentes Reutilizáveis
- **ConfigurationCard:** Card de configuração
- **SettingsGroup:** Grupo de configurações
- **ToggleSwitch:** Switch de habilitação
- **ColorPicker:** Seletor de cores
- **FileUpload:** Upload de arquivos
- **JsonEditor:** Editor JSON
- **PasswordField:** Campo de senha

### 6.3 Estados de Interface
- Loading: Skeleton loaders
- Empty: Estado vazio
- Error: Mensagens de erro
- Success: Confirmações
- Dirty: Alterações não salvas

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const CONFIGURATION_PERMISSIONS = [
  'configurations.system.read',     // Ver configurações do sistema
  'configurations.system.write',    // Editar configurações do sistema
  'configurations.company.read',    // Ver configurações da empresa
  'configurations.company.write',   // Editar configurações da empresa
  'configurations.integrations.read', // Ver integrações
  'configurations.integrations.write', // Gerenciar integrações
  'configurations.history.read',    // Ver histórico
  'configurations.backup.read',     // Gerar backup
  'configurations.backup.write'     // Restaurar backup
];
```

### 7.2 Níveis de Acesso
- **Usuário:** Sem acesso às configurações
- **Supervisor:** Visualizar configurações da empresa
- **Gerente:** Editar configurações da empresa
- **Administrador:** Todas as permissões

### 7.3 Segurança Implementada
- Criptografia de dados sensíveis
- Auditoria de todas as alterações
- Validação rigorosa de entrada
- Controle de acesso granular
- Backup automático antes de alterações
- Rate limiting para APIs

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Todos os módulos:** Consomem configurações
- **Usuários:** Configurações de autenticação
- **Email:** Configurações de SMTP
- **Notificações:** Configurações de envio
- **Logs:** Configurações de auditoria

### 8.2 Provedores Suportados
- **Email:** SMTP, SendGrid, Mailgun, AWS SES
- **SMS:** Twilio, AWS SNS, Nexmo
- **Storage:** AWS S3, Google Cloud, Azure
- **Payment:** Stripe, PayPal, PagSeguro
- **Monitoring:** Sentry, DataDog, New Relic

### 8.3 Eventos e Webhooks
- Configuração alterada
- Integração testada
- Backup criado
- Configuração restaurada
- Erro de integração

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Modelo de dados e estrutura básica
- ✅ **Semana 3-4:** Configurações do sistema
- ✅ **Semana 5-6:** Configurações por empresa
- ✅ **Semana 7-8:** Interface de configurações
- ✅ **Semana 9-10:** Integrações externas
- ✅ **Semana 11-12:** Histórico e auditoria
- ✅ **Semana 13-14:** Backup e restauração
- ✅ **Semana 15-16:** Validações e segurança
- ✅ **Semana 17-18:** Testes de integração
- ✅ **Semana 19-20:** Otimizações e documentação

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** Configurações por usuário
- 📋 **Q2 2025:** Templates de configuração
- 📋 **Q3 2025:** Configurações dinâmicas
- 📋 **Q4 2025:** IA para otimização automática

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (85% cobertura)
- **Integração:** APIs e validações
- **E2E:** Fluxos completos de configuração
- **Segurança:** Testes de criptografia

### 10.2 Métricas de Qualidade
- Cobertura de testes: 85%
- Tempo de carregamento: < 1 segundo
- Taxa de erro: < 0.1%
- Disponibilidade: 99.9%

### 10.3 Critérios de Aceitação
- ✅ Configurações centralizadas
- ✅ Interface intuitiva
- ✅ Integrações funcionando
- ✅ Histórico completo
- ✅ Backup/restauração
- ✅ Segurança implementada
- ✅ Validações rigorosas
- ✅ Performance adequada

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Core
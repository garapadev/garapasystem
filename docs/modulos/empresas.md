# Módulo: Empresas

**Status:** ✅ Implementado  
**Categoria:** Core  
**Versão:** 1.0  
**Responsável:** Equipe Core  

---

## 1. Visão Geral

O módulo Empresas é responsável pelo gerenciamento das empresas/organizações que utilizam o sistema. É um módulo fundamental que serve como base para a estrutura multi-tenant do GarapaSystem, permitindo que múltiplas empresas utilizem o sistema de forma isolada e segura.

### Propósito
- Gerenciar dados das empresas clientes
- Implementar isolamento multi-tenant
- Controlar configurações por empresa
- Facilitar gestão de licenças e planos

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Multi-tenancy:** Isolamento seguro entre empresas
- **Gestão:** Controle completo de dados empresariais
- **Configuração:** Personalização por empresa
- **Compliance:** Atendimento a regulamentações

### Requisitos Funcionais
- CRUD completo de empresas
- Gestão de dados corporativos
- Controle de endereços e filiais
- Gestão de documentos empresariais
- Configurações personalizadas
- Controle de licenças e planos
- Histórico de alterações
- Relatórios empresariais

### Requisitos Não-Funcionais
- Segurança: Isolamento total entre tenants
- Performance: Consultas < 1 segundo
- Disponibilidade: 99.9% uptime
- Escalabilidade: 1000+ empresas
- Usabilidade: Interface administrativa

---

## 3. Funcionalidades

### 3.1 Gestão de Empresas
- **Dados Básicos:** Razão social, nome fantasia, CNPJ
- **Contatos:** Telefones, emails, site
- **Endereços:** Matriz e filiais
- **Documentos:** Contratos sociais, licenças
- **Status:** Ativa, inativa, suspensa, trial

### 3.2 Estrutura Organizacional
- **Filiais:** Gestão de múltiplas unidades
- **Departamentos:** Estrutura departamental
- **Centros de Custo:** Organização financeira
- **Hierarquia:** Estrutura organizacional
- **Configurações:** Personalizações por empresa

### 3.3 Licenciamento
- **Planos:** Diferentes níveis de serviço
- **Usuários:** Limite de usuários por plano
- **Módulos:** Módulos disponíveis por plano
- **Storage:** Limite de armazenamento
- **API Calls:** Limite de chamadas de API

### 3.4 Configurações
- **Personalização:** Logo, cores, temas
- **Integrações:** APIs externas habilitadas
- **Notificações:** Configurações de email/SMS
- **Backup:** Políticas de backup
- **Segurança:** Políticas de segurança

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/companies/
├── page.tsx                     # Lista de empresas
├── [id]/
│   ├── page.tsx                # Detalhes da empresa
│   ├── edit/page.tsx           # Editar empresa
│   ├── settings/page.tsx       # Configurações
│   ├── branches/page.tsx       # Filiais
│   ├── documents/page.tsx      # Documentos
│   └── history/page.tsx        # Histórico
├── new/page.tsx                # Nova empresa
├── plans/
│   ├── page.tsx                # Planos disponíveis
│   ├── [id]/page.tsx           # Detalhes do plano
│   └── compare/page.tsx        # Comparar planos
├── reports/
│   ├── page.tsx                # Relatórios
│   ├── usage/page.tsx          # Uso do sistema
│   └── billing/page.tsx        # Faturamento
├── components/
│   ├── CompanyCard.tsx         # Card de empresa
│   ├── CompanyForm.tsx         # Formulário de empresa
│   ├── CompanyList.tsx         # Lista de empresas
│   ├── CompanyProfile.tsx      # Perfil da empresa
│   ├── BranchManager.tsx       # Gestão de filiais
│   ├── PlanSelector.tsx        # Seletor de plano
│   ├── UsageChart.tsx          # Gráfico de uso
│   ├── CompanySettings.tsx     # Configurações
│   └── CompanyStats.tsx        # Estatísticas
├── hooks/
│   ├── useCompanies.tsx        # Hook para empresas
│   ├── usePlans.tsx            # Hook para planos
│   ├── useCompanySettings.tsx  # Hook para configurações
│   └── useUsageStats.tsx       # Hook para estatísticas
└── types/
    └── company.ts              # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model Empresa {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  razaoSocial     String
  nomeFantasia    String?
  cnpj            String    @unique
  inscricaoEstadual String?
  inscricaoMunicipal String?
  
  // Contatos
  email           String?
  telefone        String?
  celular         String?
  website         String?
  
  // Endereço Principal
  endereco        String?
  numero          String?
  complemento     String?
  bairro          String?
  cidade          String?
  estado          String?
  cep             String?
  pais            String    @default("Brasil")
  
  // Dados Adicionais
  porte           PorteEmpresa?
  setor           SetorEmpresa?
  dataFundacao    DateTime?
  observacoes     String?
  
  // Personalização
  logo            String?   // URL do logo
  corPrimaria     String?   // Cor principal
  corSecundaria   String?   // Cor secundária
  tema            TemaEmpresa @default(CLARO)
  
  // Status e Licenciamento
  status          StatusEmpresa @default(TRIAL)
  planoId         String?
  plano           PlanoEmpresa? @relation(fields: [planoId], references: [id])
  dataVencimento  DateTime?
  limitUsuarios   Int       @default(5)
  limitStorage    Int       @default(1024) // MB
  limitApiCalls   Int       @default(10000)
  
  // Configurações
  configuracoes   ConfiguracaoEmpresa[]
  
  // Relacionamentos
  filiais         FilialEmpresa[]
  usuarios        Usuario[]
  colaboradores   Colaborador[]
  clientes        Cliente[]
  ordensServico   OrdemServico[]
  tasks           Task[]
  departamentos   Departamento[]
  cargos          Cargo[]
  
  // Documentos e Histórico
  documentos      DocumentoEmpresa[]
  historico       HistoricoEmpresa[]
  
  // Estatísticas de Uso
  estatisticas    EstatisticaUso[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@map("empresas")
}

model FilialEmpresa {
  id              String    @id @default(cuid())
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  // Dados da Filial
  nome            String
  cnpj            String?   @unique
  inscricaoEstadual String?
  inscricaoMunicipal String?
  
  // Contatos
  email           String?
  telefone        String?
  responsavel     String?
  
  // Endereço
  endereco        String
  numero          String?
  complemento     String?
  bairro          String
  cidade          String
  estado          String
  cep             String
  
  // Status
  isMatriz        Boolean   @default(false)
  isActive        Boolean   @default(true)
  
  // Relacionamentos
  colaboradores   Colaborador[]
  ordensServico   OrdemServico[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("filiais_empresa")
}

model PlanoEmpresa {
  id              String    @id @default(cuid())
  nome            String
  descricao       String?
  
  // Limites
  limitUsuarios   Int
  limitStorage    Int       // MB
  limitApiCalls   Int
  limitEmails     Int
  limitSms        Int
  
  // Módulos Inclusos
  modulosInclusos String[]  // Array de módulos
  
  // Preços
  precoMensal     Decimal
  precoAnual      Decimal?
  
  // Recursos
  suportePrioridade Boolean @default(false)
  backupDiario    Boolean   @default(false)
  integracao      Boolean   @default(false)
  apiAvancada     Boolean   @default(false)
  relatoriosAvancados Boolean @default(false)
  
  // Status
  isActive        Boolean   @default(true)
  isPopular       Boolean   @default(false)
  
  // Relacionamentos
  empresas        Empresa[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("planos_empresa")
}

model DocumentoEmpresa {
  id              String    @id @default(cuid())
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  tipo            TipoDocumentoEmpresa
  nome            String
  arquivo         String    // URL do arquivo
  tamanho         Int?      // Tamanho em bytes
  mimeType        String?
  
  // Metadados
  dataVencimento  DateTime?
  observacoes     String?
  isConfidencial  Boolean   @default(false)
  
  // Auditoria
  uploadedBy      String
  uploadedAt      DateTime  @default(now())
  
  @@map("documentos_empresa")
}

model HistoricoEmpresa {
  id              String    @id @default(cuid())
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  acao            AcaoHistoricoEmpresa
  campo           String?   // Campo alterado
  valorAnterior   String?
  valorNovo       String?
  observacoes     String?
  
  // Auditoria
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  timestamp       DateTime  @default(now())
  
  @@map("historico_empresas")
}

model EstatisticaUso {
  id              String    @id @default(cuid())
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  // Período
  data            DateTime
  
  // Métricas
  usuariosAtivos  Int       @default(0)
  loginsDia       Int       @default(0)
  apiCallsDia     Int       @default(0)
  storageUsado    Int       @default(0) // MB
  emailsEnviados  Int       @default(0)
  smsEnviados     Int       @default(0)
  
  // Módulos Utilizados
  modulosUsados   String[]
  
  createdAt       DateTime  @default(now())
  
  @@unique([empresaId, data])
  @@map("estatisticas_uso")
}

enum StatusEmpresa {
  TRIAL
  ATIVA
  SUSPENSA
  INATIVA
  CANCELADA
}

enum PorteEmpresa {
  MEI
  MICRO
  PEQUENA
  MEDIA
  GRANDE
}

enum SetorEmpresa {
  TECNOLOGIA
  SERVICOS
  COMERCIO
  INDUSTRIA
  SAUDE
  EDUCACAO
  FINANCEIRO
  AGRONEGOCIO
  OUTRO
}

enum TemaEmpresa {
  CLARO
  ESCURO
  AUTO
}

enum TipoDocumentoEmpresa {
  CONTRATO_SOCIAL
  CARTAO_CNPJ
  INSCRICAO_ESTADUAL
  INSCRICAO_MUNICIPAL
  ALVARA_FUNCIONAMENTO
  LICENCA_AMBIENTAL
  CERTIFICADO_DIGITAL
  CONTRATO_SERVICO
  OUTRO
}

enum AcaoHistoricoEmpresa {
  CRIACAO
  ALTERACAO
  ATIVACAO
  SUSPENSAO
  CANCELAMENTO
  MUDANCA_PLANO
  RENOVACAO
}
```

### 4.3 Hooks Customizados
- **useCompanies:** Gestão de empresas
- **usePlans:** Gestão de planos
- **useCompanySettings:** Configurações
- **useUsageStats:** Estatísticas de uso

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Empresas
GET    /api/companies                      # Listar empresas
POST   /api/companies                      # Criar empresa
GET    /api/companies/[id]                 # Buscar empresa
PUT    /api/companies/[id]                 # Atualizar empresa
DELETE /api/companies/[id]                 # Deletar empresa
PATCH  /api/companies/[id]/status          # Alterar status

// Filiais
GET    /api/companies/[id]/branches        # Listar filiais
POST   /api/companies/[id]/branches        # Criar filial
PUT    /api/companies/branches/[branchId]  # Atualizar filial
DELETE /api/companies/branches/[branchId]  # Deletar filial

// Planos
GET    /api/companies/plans                # Listar planos
GET    /api/companies/plans/[id]           # Buscar plano
POST   /api/companies/[id]/plan            # Alterar plano

// Configurações
GET    /api/companies/[id]/settings        # Obter configurações
PUT    /api/companies/[id]/settings        # Atualizar configurações

// Documentos
GET    /api/companies/[id]/documents       # Documentos da empresa
POST   /api/companies/[id]/documents       # Upload de documento
DELETE /api/companies/documents/[docId]    # Deletar documento

// Estatísticas
GET    /api/companies/[id]/stats           # Estatísticas de uso
GET    /api/companies/[id]/usage           # Uso detalhado
GET    /api/companies/[id]/billing         # Informações de cobrança

// Relatórios
GET    /api/companies/reports/overview     # Visão geral
GET    /api/companies/reports/usage        # Relatório de uso
GET    /api/companies/reports/billing      # Relatório de faturamento
```

### 5.2 Estrutura de Resposta
```typescript
interface CompanyResponse {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  status: StatusEmpresa;
  plano?: {
    id: string;
    nome: string;
    limitUsuarios: number;
  };
  logo?: string;
  tema: TemaEmpresa;
  filiais: FilialEmpresa[];
  estatisticas?: {
    usuariosAtivos: number;
    storageUsado: number;
    apiCallsMes: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 5.3 Validações (Zod)
```typescript
const CompanySchema = z.object({
  razaoSocial: z.string().min(2).max(100),
  nomeFantasia: z.string().max(100).optional(),
  cnpj: z.string().regex(/^\d{14}$/),
  inscricaoEstadual: z.string().optional(),
  email: z.string().email().optional(),
  telefone: z.string().regex(/^\d{10,11}$/).optional(),
  endereco: z.string().max(200).optional(),
  numero: z.string().max(10).optional(),
  bairro: z.string().max(50).optional(),
  cidade: z.string().max(50).optional(),
  estado: z.string().length(2).optional(),
  cep: z.string().regex(/^\d{8}$/).optional(),
  porte: z.enum(['MEI', 'MICRO', 'PEQUENA', 'MEDIA', 'GRANDE']).optional(),
  setor: z.enum(['TECNOLOGIA', 'SERVICOS', 'COMERCIO', 'INDUSTRIA', 'SAUDE', 'EDUCACAO', 'FINANCEIRO', 'AGRONEGOCIO', 'OUTRO']).optional(),
  planoId: z.string().cuid().optional()
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Lista de Empresas:** Tabela administrativa
- **Perfil da Empresa:** Informações completas
- **Configurações:** Personalização
- **Planos:** Gestão de licenças
- **Relatórios:** Uso e faturamento

### 6.2 Componentes Reutilizáveis
- **CompanyCard:** Card com informações básicas
- **PlanSelector:** Seletor de planos
- **UsageChart:** Gráficos de uso
- **BranchManager:** Gestão de filiais
- **CompanySettings:** Configurações

### 6.3 Estados de Interface
- Loading: Skeleton loaders
- Empty: Estado vazio
- Error: Mensagens de erro
- Success: Confirmações
- Trial: Indicadores de trial

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const COMPANY_PERMISSIONS = [
  'companies.read',             // Visualizar empresas
  'companies.write',            // Criar/editar empresas
  'companies.delete',           // Deletar empresas
  'companies.settings.write',   // Alterar configurações
  'companies.plans.write',      // Gerenciar planos
  'companies.stats.read',       // Ver estatísticas
  'companies.billing.read'      // Ver faturamento
];
```

### 7.2 Níveis de Acesso
- **Super Admin:** Gestão completa
- **Admin Empresa:** Gestão da própria empresa
- **Usuário:** Visualização limitada

### 7.3 Segurança Implementada
- Isolamento multi-tenant
- Criptografia de dados sensíveis
- Controle de acesso por empresa
- Auditoria de alterações
- Backup automático
- Compliance LGPD

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Usuários:** Controle de acesso
- **Colaboradores:** Estrutura organizacional
- **Configurações:** Personalização
- **Logs:** Auditoria
- **Relatórios:** Dados empresariais

### 8.2 Sistemas Externos
- **Receita Federal:** Validação de CNPJ
- **Correios:** Validação de CEP
- **Bancos:** Integração financeira
- **Contabilidade:** Sistemas contábeis

### 8.3 Eventos e Webhooks
- Empresa criada
- Plano alterado
- Limite atingido
- Vencimento próximo
- Empresa suspensa

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Modelo de dados básico
- ✅ **Semana 3-4:** CRUD de empresas
- ✅ **Semana 5-6:** Sistema de planos
- ✅ **Semana 7-8:** Multi-tenancy
- ✅ **Semana 9-10:** Gestão de filiais
- ✅ **Semana 11-12:** Configurações personalizadas
- ✅ **Semana 13-14:** Interface administrativa
- ✅ **Semana 15-16:** Estatísticas de uso
- ✅ **Semana 17-18:** Sistema de cobrança
- ✅ **Semana 19-20:** Testes e otimizações

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** Dashboard executivo
- 📋 **Q2 2025:** BI empresarial
- 📋 **Q3 2025:** Marketplace de módulos
- 📋 **Q4 2025:** IA para insights

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (90% cobertura)
- **Integração:** APIs e multi-tenancy
- **E2E:** Fluxos administrativos
- **Segurança:** Isolamento entre tenants

### 10.2 Métricas de Qualidade
- Cobertura de testes: 90%
- Performance: < 1 segundo
- Disponibilidade: 99.9%
- Isolamento: 100%

### 10.3 Critérios de Aceitação
- ✅ CRUD completo funcionando
- ✅ Multi-tenancy implementado
- ✅ Sistema de planos
- ✅ Gestão de filiais
- ✅ Configurações personalizadas
- ✅ Estatísticas de uso
- ✅ Interface administrativa
- ✅ Segurança e isolamento

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Core
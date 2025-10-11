# Módulo: Colaboradores

**Status:** ✅ Implementado  
**Categoria:** Operacional  
**Versão:** 1.0  
**Responsável:** Equipe RH  

---

## 1. Visão Geral

O módulo Colaboradores é responsável pelo gerenciamento completo dos funcionários da empresa, incluindo dados pessoais, profissionais, hierarquia organizacional, controle de acesso e gestão de recursos humanos. É um módulo fundamental para a estrutura organizacional do sistema.

### Propósito
- Gerenciar dados dos colaboradores
- Controlar hierarquia organizacional
- Facilitar gestão de recursos humanos
- Integrar com outros módulos operacionais

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Gestão:** Controle completo de colaboradores
- **Hierarquia:** Estrutura organizacional clara
- **Integração:** Conexão com módulos operacionais
- **Compliance:** Atendimento às leis trabalhistas

### Requisitos Funcionais
- CRUD completo de colaboradores
- Gestão de cargos e departamentos
- Controle de hierarquia organizacional
- Gestão de documentos pessoais
- Controle de acesso e permissões
- Histórico de alterações
- Relatórios de RH
- Integração com folha de pagamento

### Requisitos Não-Funcionais
- Segurança: Proteção de dados pessoais (LGPD)
- Performance: Consultas < 2 segundos
- Disponibilidade: 99.9% uptime
- Escalabilidade: 10k+ colaboradores
- Usabilidade: Interface intuitiva

---

## 3. Funcionalidades

### 3.1 Gestão de Colaboradores
- **Dados Pessoais:** Nome, CPF, RG, endereço, contatos
- **Dados Profissionais:** Cargo, departamento, salário, admissão
- **Documentos:** Upload e gestão de documentos
- **Foto:** Upload de foto do colaborador
- **Status:** Ativo, inativo, férias, licença, demitido

### 3.2 Estrutura Organizacional
- **Departamentos:** Criação e gestão de departamentos
- **Cargos:** Definição de cargos e responsabilidades
- **Hierarquia:** Relacionamento superior/subordinado
- **Equipes:** Formação de equipes de trabalho
- **Centros de Custo:** Alocação por centro de custo

### 3.3 Controle de Acesso
- **Usuários:** Vinculação com sistema de usuários
- **Permissões:** Controle granular de acesso
- **Perfis:** Perfis de acesso por cargo
- **Grupos:** Agrupamento por função
- **Delegação:** Delegação temporária de acesso

### 3.4 Gestão Documental
- **Documentos Pessoais:** CPF, RG, CNH, etc.
- **Documentos Trabalhistas:** CTPS, PIS, etc.
- **Contratos:** Contratos de trabalho
- **Certificados:** Certificações e cursos
- **Avaliações:** Avaliações de desempenho

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/collaborators/
├── page.tsx                     # Lista de colaboradores
├── [id]/
│   ├── page.tsx                # Detalhes do colaborador
│   ├── edit/page.tsx           # Editar colaborador
│   ├── documents/page.tsx      # Documentos do colaborador
│   └── history/page.tsx        # Histórico de alterações
├── new/page.tsx                # Novo colaborador
├── departments/
│   ├── page.tsx                # Lista de departamentos
│   ├── [id]/page.tsx           # Detalhes do departamento
│   └── new/page.tsx            # Novo departamento
├── positions/
│   ├── page.tsx                # Lista de cargos
│   ├── [id]/page.tsx           # Detalhes do cargo
│   └── new/page.tsx            # Novo cargo
├── hierarchy/
│   ├── page.tsx                # Organograma
│   └── edit/page.tsx           # Editar hierarquia
├── reports/
│   ├── page.tsx                # Relatórios de RH
│   ├── headcount/page.tsx      # Relatório de headcount
│   └── turnover/page.tsx       # Relatório de turnover
├── components/
│   ├── CollaboratorCard.tsx    # Card de colaborador
│   ├── CollaboratorForm.tsx    # Formulário de colaborador
│   ├── CollaboratorList.tsx    # Lista de colaboradores
│   ├── CollaboratorProfile.tsx # Perfil do colaborador
│   ├── DepartmentTree.tsx      # Árvore de departamentos
│   ├── OrganizationChart.tsx   # Organograma
│   ├── DocumentUpload.tsx      # Upload de documentos
│   ├── HierarchyBuilder.tsx    # Construtor de hierarquia
│   ├── PositionSelector.tsx    # Seletor de cargo
│   └── CollaboratorStats.tsx   # Estatísticas
├── hooks/
│   ├── useCollaborators.tsx    # Hook para colaboradores
│   ├── useDepartments.tsx      # Hook para departamentos
│   ├── usePositions.tsx        # Hook para cargos
│   ├── useHierarchy.tsx        # Hook para hierarquia
│   └── useCollaboratorDocs.tsx # Hook para documentos
└── types/
    └── collaborator.ts         # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model Colaborador {
  id              String    @id @default(cuid())
  
  // Dados Pessoais
  nome            String
  sobrenome       String
  cpf             String    @unique
  rg              String?
  dataNascimento  DateTime?
  sexo            Sexo?
  estadoCivil     EstadoCivil?
  
  // Contatos
  email           String?   @unique
  telefone        String?
  celular         String?
  
  // Endereço
  endereco        String?
  numero          String?
  complemento     String?
  bairro          String?
  cidade          String?
  estado          String?
  cep             String?
  
  // Dados Profissionais
  matricula       String    @unique
  dataAdmissao    DateTime
  dataDemissao    DateTime?
  salario         Decimal?
  observacoes     String?
  
  // Documentos Trabalhistas
  pis             String?
  ctps            String?
  tituloEleitor   String?
  reservista      String?
  
  // Status
  status          StatusColaborador @default(ATIVO)
  foto            String?   // URL da foto
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  departamentoId  String?
  departamento    Departamento? @relation(fields: [departamentoId], references: [id])
  cargoId         String?
  cargo           Cargo?    @relation(fields: [cargoId], references: [id])
  supervisorId    String?
  supervisor      Colaborador? @relation("SupervisorSubordinado", fields: [supervisorId], references: [id])
  subordinados    Colaborador[] @relation("SupervisorSubordinado")
  
  // Sistema
  usuarioId       String?   @unique
  usuario         Usuario?  @relation(fields: [usuarioId], references: [id])
  
  // Documentos e Histórico
  documentos      DocumentoColaborador[]
  historico       HistoricoColaborador[]
  
  // Relacionamentos Operacionais
  ordensServico   OrdemServico[]
  tasks           Task[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@map("colaboradores")
}

model Departamento {
  id              String    @id @default(cuid())
  nome            String
  descricao       String?
  codigo          String?   @unique
  
  // Hierarquia
  departamentoPaiId String?
  departamentoPai Departamento? @relation("DepartamentoHierarquia", fields: [departamentoPaiId], references: [id])
  subdepartamentos Departamento[] @relation("DepartamentoHierarquia")
  
  // Gestão
  gerenteId       String?
  gerente         Colaborador? @relation("GerenteDepartamento", fields: [gerenteId], references: [id])
  
  // Centro de Custo
  centroCusto     String?
  orcamento       Decimal?
  
  // Status
  isActive        Boolean   @default(true)
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  colaboradores   Colaborador[]
  cargos          Cargo[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("departamentos")
}

model Cargo {
  id              String    @id @default(cuid())
  nome            String
  descricao       String?
  codigo          String?   @unique
  
  // Hierarquia
  nivel           Int       @default(1)
  cargoPaiId      String?
  cargoPai        Cargo?    @relation("CargoHierarquia", fields: [cargoPaiId], references: [id])
  subcargos       Cargo[]   @relation("CargoHierarquia")
  
  // Remuneração
  salarioMinimo   Decimal?
  salarioMaximo   Decimal?
  
  // Requisitos
  escolaridade    Escolaridade?
  experiencia     String?
  competencias    String[]
  
  // Status
  isActive        Boolean   @default(true)
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  departamentoId  String?
  departamento    Departamento? @relation(fields: [departamentoId], references: [id])
  colaboradores   Colaborador[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("cargos")
}

model DocumentoColaborador {
  id              String    @id @default(cuid())
  colaboradorId   String
  colaborador     Colaborador @relation(fields: [colaboradorId], references: [id])
  
  tipo            TipoDocumento
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
  
  @@map("documentos_colaborador")
}

model HistoricoColaborador {
  id              String    @id @default(cuid())
  colaboradorId   String
  colaborador     Colaborador @relation(fields: [colaboradorId], references: [id])
  
  acao            AcaoHistorico
  campo           String?   // Campo alterado
  valorAnterior   String?
  valorNovo       String?
  observacoes     String?
  
  // Auditoria
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  timestamp       DateTime  @default(now())
  
  @@map("historico_colaboradores")
}

enum StatusColaborador {
  ATIVO
  INATIVO
  FERIAS
  LICENCA
  DEMITIDO
  APOSENTADO
}

enum Sexo {
  MASCULINO
  FEMININO
  OUTRO
}

enum EstadoCivil {
  SOLTEIRO
  CASADO
  DIVORCIADO
  VIUVO
  UNIAO_ESTAVEL
}

enum Escolaridade {
  FUNDAMENTAL_INCOMPLETO
  FUNDAMENTAL_COMPLETO
  MEDIO_INCOMPLETO
  MEDIO_COMPLETO
  SUPERIOR_INCOMPLETO
  SUPERIOR_COMPLETO
  POS_GRADUACAO
  MESTRADO
  DOUTORADO
}

enum TipoDocumento {
  CPF
  RG
  CNH
  CTPS
  PIS
  TITULO_ELEITOR
  RESERVISTA
  COMPROVANTE_RESIDENCIA
  CONTRATO_TRABALHO
  CERTIFICADO
  DIPLOMA
  OUTRO
}

enum AcaoHistorico {
  CRIACAO
  ALTERACAO
  PROMOCAO
  TRANSFERENCIA
  DEMISSAO
  REATIVACAO
  FERIAS
  LICENCA
}
```

### 4.3 Hooks Customizados
- **useCollaborators:** Gestão de colaboradores
- **useDepartments:** Gestão de departamentos
- **usePositions:** Gestão de cargos
- **useHierarchy:** Estrutura hierárquica
- **useCollaboratorDocs:** Documentos

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Colaboradores
GET    /api/collaborators                  # Listar colaboradores
POST   /api/collaborators                  # Criar colaborador
GET    /api/collaborators/[id]             # Buscar colaborador
PUT    /api/collaborators/[id]             # Atualizar colaborador
DELETE /api/collaborators/[id]             # Deletar colaborador
PATCH  /api/collaborators/[id]/status      # Alterar status

// Departamentos
GET    /api/collaborators/departments      # Listar departamentos
POST   /api/collaborators/departments      # Criar departamento
GET    /api/collaborators/departments/[id] # Buscar departamento
PUT    /api/collaborators/departments/[id] # Atualizar departamento
DELETE /api/collaborators/departments/[id] # Deletar departamento

// Cargos
GET    /api/collaborators/positions        # Listar cargos
POST   /api/collaborators/positions        # Criar cargo
GET    /api/collaborators/positions/[id]   # Buscar cargo
PUT    /api/collaborators/positions/[id]   # Atualizar cargo
DELETE /api/collaborators/positions/[id]   # Deletar cargo

// Hierarquia
GET    /api/collaborators/hierarchy        # Obter hierarquia
PUT    /api/collaborators/hierarchy        # Atualizar hierarquia
GET    /api/collaborators/orgchart         # Organograma

// Documentos
GET    /api/collaborators/[id]/documents   # Documentos do colaborador
POST   /api/collaborators/[id]/documents   # Upload de documento
DELETE /api/collaborators/documents/[docId] # Deletar documento

// Relatórios
GET    /api/collaborators/reports/headcount # Relatório de headcount
GET    /api/collaborators/reports/turnover  # Relatório de turnover
GET    /api/collaborators/reports/birthday  # Aniversariantes
```

### 5.2 Estrutura de Resposta
```typescript
interface CollaboratorResponse {
  id: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  email?: string;
  telefone?: string;
  matricula: string;
  dataAdmissao: string;
  dataDemissao?: string;
  status: StatusColaborador;
  foto?: string;
  departamento?: {
    id: string;
    nome: string;
  };
  cargo?: {
    id: string;
    nome: string;
  };
  supervisor?: {
    id: string;
    nome: string;
  };
  usuario?: {
    id: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 5.3 Validações (Zod)
```typescript
const CollaboratorSchema = z.object({
  nome: z.string().min(2).max(50),
  sobrenome: z.string().min(2).max(50),
  cpf: z.string().regex(/^\d{11}$/),
  rg: z.string().optional(),
  dataNascimento: z.string().datetime().optional(),
  email: z.string().email().optional(),
  telefone: z.string().regex(/^\d{10,11}$/).optional(),
  matricula: z.string().min(1).max(20),
  dataAdmissao: z.string().datetime(),
  salario: z.number().positive().optional(),
  departamentoId: z.string().cuid().optional(),
  cargoId: z.string().cuid().optional(),
  supervisorId: z.string().cuid().optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'FERIAS', 'LICENCA', 'DEMITIDO']).optional()
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Lista de Colaboradores:** Tabela com filtros
- **Perfil do Colaborador:** Informações completas
- **Organograma:** Estrutura hierárquica visual
- **Departamentos:** Gestão de departamentos
- **Relatórios:** Relatórios de RH

### 6.2 Componentes Reutilizáveis
- **CollaboratorCard:** Card com informações básicas
- **OrganizationChart:** Organograma interativo
- **DepartmentTree:** Árvore de departamentos
- **DocumentUpload:** Upload de documentos
- **HierarchyBuilder:** Construtor de hierarquia

### 6.3 Estados de Interface
- Loading: Skeleton loaders
- Empty: Estado vazio
- Error: Mensagens de erro
- Success: Confirmações
- Editing: Modo de edição

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const COLLABORATOR_PERMISSIONS = [
  'collaborators.read',         // Visualizar colaboradores
  'collaborators.write',        // Criar/editar colaboradores
  'collaborators.delete',       // Deletar colaboradores
  'collaborators.documents.read', // Ver documentos
  'collaborators.documents.write', // Gerenciar documentos
  'collaborators.salary.read',  // Ver salários
  'collaborators.reports.read', // Acessar relatórios
  'departments.write',          // Gerenciar departamentos
  'positions.write'             // Gerenciar cargos
];
```

### 7.2 Níveis de Acesso
- **Colaborador:** Ver próprios dados
- **Supervisor:** Ver equipe direta
- **RH:** Gestão completa
- **Administrador:** Todas as permissões

### 7.3 Segurança Implementada
- Proteção de dados pessoais (LGPD)
- Criptografia de documentos sensíveis
- Controle de acesso granular
- Auditoria de alterações
- Backup seguro de dados
- Anonimização para relatórios

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Usuários:** Vinculação de contas
- **Grupos Hierárquicos:** Estrutura organizacional
- **Ordens de Serviço:** Atribuição de responsáveis
- **Tasks:** Atribuição de tarefas
- **Relatórios:** Dados para relatórios

### 8.2 Sistemas Externos
- **Folha de Pagamento:** Integração com sistemas de RH
- **Ponto Eletrônico:** Controle de frequência
- **Planos de Saúde:** Gestão de benefícios
- **E-Social:** Envio de informações trabalhistas

### 8.3 Eventos e Webhooks
- Colaborador criado
- Colaborador alterado
- Colaborador demitido
- Documento vencendo
- Aniversário do colaborador

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Modelo de dados e estrutura básica
- ✅ **Semana 3-4:** CRUD de colaboradores
- ✅ **Semana 5-6:** Gestão de departamentos e cargos
- ✅ **Semana 7-8:** Estrutura hierárquica
- ✅ **Semana 9-10:** Upload e gestão de documentos
- ✅ **Semana 11-12:** Interface de usuário
- ✅ **Semana 13-14:** Relatórios de RH
- ✅ **Semana 15-16:** Integração com usuários
- ✅ **Semana 17-18:** Organograma visual
- ✅ **Semana 19-20:** Testes e otimizações

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** Avaliação de desempenho
- 📋 **Q2 2025:** Gestão de competências
- 📋 **Q3 2025:** Plano de carreira
- 📋 **Q4 2025:** IA para análise de RH

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (85% cobertura)
- **Integração:** APIs e validações
- **E2E:** Fluxos completos de RH
- **Segurança:** Proteção de dados

### 10.2 Métricas de Qualidade
- Cobertura de testes: 85%
- Performance: < 2 segundos
- Disponibilidade: 99.9%
- Conformidade LGPD: 100%

### 10.3 Critérios de Aceitação
- ✅ CRUD completo funcionando
- ✅ Hierarquia organizacional
- ✅ Gestão de documentos
- ✅ Organograma visual
- ✅ Relatórios de RH
- ✅ Integração com usuários
- ✅ Segurança LGPD
- ✅ Interface responsiva

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe RH
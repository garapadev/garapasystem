# Módulo: Tasks

**Status:** ✅ Implementado  
**Categoria:** Operacional  
**Versão:** 1.0  
**Responsável:** Equipe Produtividade  

---

## 1. Visão Geral

O módulo Tasks é o sistema de gestão de tarefas e produtividade do GarapaSystem, permitindo organizar, acompanhar e executar atividades de forma eficiente. Integra-se com todos os módulos operacionais para criar um fluxo de trabalho coeso.

### Propósito
- Organizar e priorizar atividades
- Acompanhar progresso e produtividade
- Facilitar colaboração entre equipes
- Garantir cumprimento de prazos

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Produtividade:** Maximizar eficiência da equipe
- **Organização:** Estruturar fluxo de trabalho
- **Colaboração:** Facilitar trabalho em equipe
- **Visibilidade:** Transparência no progresso

### Requisitos Funcionais
- Criação e gestão de tarefas
- Sistema de prioridades e prazos
- Atribuição de responsáveis
- Comentários e colaboração
- Subtarefas e dependências
- Templates de tarefas recorrentes
- Notificações e lembretes

### Requisitos Não-Funcionais
- Performance: Carregamento < 800ms
- Sincronização: Tempo real entre usuários
- Disponibilidade: 99.9% uptime
- Escalabilidade: Suporte a 50k+ tarefas

---

## 3. Funcionalidades

### 3.1 Gestão de Tarefas
- **Criação:** Tarefas simples e complexas
- **Edição:** Atualização em tempo real
- **Priorização:** Níveis de urgência e importância
- **Categorização:** Tags e projetos
- **Status:** Controle de estados

### 3.2 Organização e Estrutura
- Projetos e subprojetos
- Listas personalizadas
- Filtros avançados
- Busca inteligente
- Visualizações múltiplas (lista, kanban, calendário)

### 3.3 Colaboração
- Atribuição múltipla
- Comentários e discussões
- Menções e notificações
- Compartilhamento de arquivos
- Histórico de atividades

### 3.4 Automação
- Templates de tarefas
- Tarefas recorrentes
- Regras de automação
- Integração com outros módulos
- Webhooks personalizados

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/tasks/
├── page.tsx                    # Lista de tarefas
├── [id]/
│   ├── page.tsx               # Detalhes da tarefa
│   ├── edit/page.tsx          # Edição
│   └── comments/page.tsx      # Comentários
├── new/page.tsx               # Nova tarefa
├── projects/
│   ├── page.tsx               # Lista de projetos
│   ├── [id]/page.tsx          # Detalhes do projeto
│   └── new/page.tsx           # Novo projeto
├── components/
│   ├── TaskForm.tsx           # Formulário de tarefa
│   ├── TaskCard.tsx           # Card de tarefa
│   ├── TaskList.tsx           # Lista de tarefas
│   ├── TaskKanban.tsx         # Board kanban
│   ├── TaskCalendar.tsx       # Visualização calendário
│   ├── TaskFilters.tsx        # Filtros de busca
│   ├── TaskComments.tsx       # Sistema de comentários
│   ├── TaskTimer.tsx          # Timer de execução
│   ├── ProjectCard.tsx        # Card de projeto
│   └── TaskTemplate.tsx       # Templates
├── hooks/
│   ├── useTaskData.tsx        # Hook para dados
│   ├── useTaskForm.tsx        # Hook para formulários
│   ├── useTaskFilters.tsx     # Hook para filtros
│   ├── useTaskTimer.tsx       # Hook para timer
│   └── useTaskComments.tsx    # Hook para comentários
└── types/
    └── task.ts                # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model Task {
  id              String    @id @default(cuid())
  titulo          String
  descricao       String?
  status          StatusTask @default(PENDENTE)
  prioridade      PrioridadeTask @default(MEDIA)
  tipo            TipoTask @default(GERAL)
  
  // Relacionamentos
  responsavelId   String?
  responsavel     Colaborador? @relation(fields: [responsavelId], references: [id])
  clienteId       String?
  cliente         Cliente? @relation(fields: [clienteId], references: [id])
  ordemServicoId  String?
  ordemServico    OrdemServico? @relation(fields: [ordemServicoId], references: [id])
  projetoId       String?
  projeto         Projeto? @relation(fields: [projetoId], references: [id])
  
  // Datas
  dataVencimento  DateTime?
  dataInicio      DateTime?
  dataConclusao   DateTime?
  tempoEstimado   Int?      // em minutos
  tempoRealizado  Int?      // em minutos
  
  // Organização
  tags            String[]
  observacoes     String?
  arquivos        String[]
  
  // Relacionamentos
  subtarefas      Task[]    @relation("TaskSubtarefas")
  tarefaPai       Task?     @relation("TaskSubtarefas", fields: [tarefaPaiId], references: [id])
  tarefaPaiId     String?
  comentarios     TaskComment[]
  historico       TaskHistory[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("tasks")
}

model Projeto {
  id              String    @id @default(cuid())
  nome            String
  descricao       String?
  status          StatusProjeto @default(ATIVO)
  cor             String?
  
  // Relacionamentos
  responsavelId   String?
  responsavel     Colaborador? @relation(fields: [responsavelId], references: [id])
  clienteId       String?
  cliente         Cliente? @relation(fields: [clienteId], references: [id])
  
  // Datas
  dataInicio      DateTime?
  dataFim         DateTime?
  
  // Relacionamentos
  tarefas         Task[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("projetos")
}

enum StatusTask {
  PENDENTE
  EM_ANDAMENTO
  PAUSADA
  AGUARDANDO
  CONCLUIDA
  CANCELADA
}

enum PrioridadeTask {
  BAIXA
  MEDIA
  ALTA
  URGENTE
}

enum TipoTask {
  GERAL
  FOLLOW_UP
  REUNIAO
  LIGACAO
  EMAIL
  VISITA
  ANALISE
  DESENVOLVIMENTO
}
```

### 4.3 Hooks Customizados
- **useTaskData:** Gerencia dados das tarefas
- **useTaskForm:** Validação e submissão
- **useTaskFilters:** Sistema de filtros
- **useTaskTimer:** Controle de tempo
- **useTaskComments:** Sistema de comentários

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// CRUD Tarefas
GET    /api/tasks                    # Listar tarefas
POST   /api/tasks                    # Criar tarefa
GET    /api/tasks/[id]               # Buscar tarefa
PUT    /api/tasks/[id]               # Atualizar tarefa
DELETE /api/tasks/[id]               # Deletar tarefa

// Ações de Tarefa
POST   /api/tasks/[id]/start         # Iniciar tarefa
POST   /api/tasks/[id]/pause         # Pausar tarefa
POST   /api/tasks/[id]/complete      # Concluir tarefa
POST   /api/tasks/[id]/cancel        # Cancelar tarefa

// Comentários
GET    /api/tasks/[id]/comments      # Listar comentários
POST   /api/tasks/[id]/comments      # Adicionar comentário
DELETE /api/tasks/[id]/comments/[commentId] # Deletar comentário

// Projetos
GET    /api/projects                 # Listar projetos
POST   /api/projects                 # Criar projeto
GET    /api/projects/[id]            # Buscar projeto
PUT    /api/projects/[id]            # Atualizar projeto
DELETE /api/projects/[id]            # Deletar projeto

// Templates
GET    /api/tasks/templates          # Listar templates
POST   /api/tasks/templates          # Criar template
POST   /api/tasks/templates/[id]/use # Usar template

// Relatórios
GET    /api/tasks/reports/productivity # Relatório de produtividade
GET    /api/tasks/reports/time        # Relatório de tempo
GET    /api/tasks/reports/projects    # Relatório de projetos
```

### 5.2 Estrutura de Resposta
```typescript
interface TaskResponse {
  id: string;
  titulo: string;
  descricao?: string;
  status: StatusTask;
  prioridade: PrioridadeTask;
  tipo: TipoTask;
  responsavel?: {
    id: string;
    nome: string;
    avatar?: string;
  };
  cliente?: {
    id: string;
    nome: string;
  };
  projeto?: {
    id: string;
    nome: string;
    cor?: string;
  };
  dataVencimento?: string;
  tempoEstimado?: number;
  tempoRealizado?: number;
  tags: string[];
  subtarefas: TaskResponse[];
  comentarios: TaskComment[];
  createdAt: string;
  updatedAt: string;
}
```

### 5.3 Validações (Zod)
```typescript
const TaskSchema = z.object({
  titulo: z.string().min(3).max(200),
  descricao: z.string().optional(),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'PAUSADA', 'AGUARDANDO', 'CONCLUIDA', 'CANCELADA']),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']),
  tipo: z.enum(['GERAL', 'FOLLOW_UP', 'REUNIAO', 'LIGACAO', 'EMAIL', 'VISITA', 'ANALISE', 'DESENVOLVIMENTO']),
  responsavelId: z.string().cuid().optional(),
  clienteId: z.string().cuid().optional(),
  projetoId: z.string().cuid().optional(),
  dataVencimento: z.string().datetime().optional(),
  tempoEstimado: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  observacoes: z.string().optional()
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Lista de Tarefas:** Múltiplas visualizações
- **Detalhes da Tarefa:** Visão completa com comentários
- **Projetos:** Gestão de projetos e tarefas
- **Relatórios:** Dashboard de produtividade

### 6.2 Componentes Reutilizáveis
- **TaskCard:** Card com informações resumidas
- **TaskKanban:** Board visual de status
- **TaskCalendar:** Visualização em calendário
- **TaskTimer:** Timer integrado
- **PriorityBadge:** Badge de prioridade
- **StatusIndicator:** Indicador de status

### 6.3 Visualizações
- **Lista:** Visualização tradicional em lista
- **Kanban:** Board visual por status
- **Calendário:** Visualização temporal
- **Timeline:** Linha do tempo de atividades
- **Gráficos:** Métricas e estatísticas

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const TASK_PERMISSIONS = [
  'tasks.read',              // Visualizar tarefas
  'tasks.write',             // Criar/editar tarefas
  'tasks.delete',            // Deletar tarefas
  'tasks.assign',            // Atribuir tarefas
  'tasks.comments.read',     // Ver comentários
  'tasks.comments.write',    // Adicionar comentários
  'tasks.time.track',        // Rastrear tempo
  'tasks.reports.read',      // Acessar relatórios
  'projects.read',           // Visualizar projetos
  'projects.write',          // Criar/editar projetos
  'projects.delete'          // Deletar projetos
];
```

### 7.2 Níveis de Acesso
- **Colaborador:** Tarefas próprias e atribuídas
- **Supervisor:** Tarefas da equipe
- **Gerente:** Todos os projetos e relatórios
- **Administrador:** Todas as permissões

### 7.3 Segurança de Dados
- Filtros automáticos por hierarquia
- Logs de todas as alterações
- Backup automático de dados
- Criptografia de anexos sensíveis

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Clientes:** Tarefas relacionadas a clientes
- **Ordens de Serviço:** Tarefas de execução
- **Colaboradores:** Atribuição e responsabilidade
- **Helpdesk:** Tarefas de suporte
- **Orçamentos:** Follow-up comercial

### 8.2 APIs Externas
- **Google Calendar:** Sincronização de eventos
- **Slack/Teams:** Notificações
- **Email:** Criação de tarefas por email
- **Zapier:** Automações externas

### 8.3 Webhooks e Eventos
- Tarefa criada/atualizada
- Status alterado
- Prazo vencido
- Comentário adicionado
- Projeto concluído

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Modelo de dados e CRUD básico
- ✅ **Semana 3-4:** Interface de listagem e filtros
- ✅ **Semana 5-6:** Sistema de status e prioridades
- ✅ **Semana 7-8:** Projetos e organização
- ✅ **Semana 9-10:** Comentários e colaboração
- ✅ **Semana 11-12:** Timer e controle de tempo
- ✅ **Semana 13-14:** Templates e automação
- ✅ **Semana 15-16:** Relatórios e métricas
- ✅ **Semana 17-18:** Testes e otimizações

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** App mobile dedicado
- 📋 **Q2 2025:** IA para sugestão de tarefas
- 📋 **Q3 2025:** Integração com calendários externos
- 📋 **Q4 2025:** Análise preditiva de produtividade

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (92% cobertura)
- **Integração:** APIs e sincronização
- **E2E:** Fluxos completos de trabalho
- **Performance:** Carregamento e filtros

### 10.2 Métricas de Qualidade
- Cobertura de testes: 92%
- Performance: < 800ms carregamento
- Acessibilidade: WCAG 2.1 AA
- Sincronização: < 100ms delay

### 10.3 Critérios de Aceitação
- ✅ CRUD completo funcionando
- ✅ Sistema de filtros eficiente
- ✅ Colaboração em tempo real
- ✅ Timer de execução preciso
- ✅ Notificações funcionando
- ✅ Relatórios precisos
- ✅ Interface responsiva

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Produtividade
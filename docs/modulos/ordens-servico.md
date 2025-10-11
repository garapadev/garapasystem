# Módulo: Ordens de Serviço

**Status:** ✅ Implementado  
**Categoria:** Operacional  
**Versão:** 1.0  
**Responsável:** Equipe Operacional  

---

## 1. Visão Geral

O módulo Ordens de Serviço é o coração operacional do GarapaSystem, gerenciando todo o ciclo de vida dos serviços técnicos, desde a abertura até a conclusão. Integra-se diretamente com clientes, colaboradores, orçamentos e laudos técnicos.

### Propósito
- Gerenciar execução de serviços técnicos
- Controlar fluxo operacional completo
- Rastrear progresso e recursos utilizados
- Garantir qualidade e prazos de entrega

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Controle:** Gestão completa do ciclo de serviços
- **Rastreabilidade:** Histórico detalhado de execução
- **Eficiência:** Otimização de recursos e prazos
- **Qualidade:** Padronização de processos

### Requisitos Funcionais
- Criação automática a partir de orçamentos aprovados
- Atribuição de colaboradores e recursos
- Controle de status e progresso
- Gestão de materiais e custos
- Integração com laudos técnicos
- Sistema de aprovações e validações

### Requisitos Não-Funcionais
- Performance: Carregamento < 1 segundo
- Disponibilidade: 99.9% uptime
- Escalabilidade: Suporte a 10k+ ordens simultâneas
- Auditoria: Log completo de todas as ações

---

## 3. Funcionalidades

### 3.1 Gestão de Ordens
- **Criação:** Manual ou automática via orçamento
- **Atribuição:** Colaboradores e equipes
- **Agendamento:** Datas e horários de execução
- **Status:** Controle de estados do processo
- **Priorização:** Níveis de urgência

### 3.2 Execução e Acompanhamento
- Check-in/check-out de colaboradores
- Registro de atividades realizadas
- Upload de fotos e evidências
- Controle de materiais utilizados
- Registro de tempo trabalhado

### 3.3 Aprovações e Validações
- Aprovação de orçamentos extras
- Validação de conclusão
- Assinatura digital do cliente
- Avaliação de qualidade
- Emissão de certificados

### 3.4 Relatórios e Métricas
- Relatórios de produtividade
- Análise de custos vs. orçado
- Métricas de qualidade
- Indicadores de prazo
- Dashboard operacional

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/ordens-servico/
├── page.tsx                      # Lista de ordens
├── [id]/
│   ├── page.tsx                 # Detalhes da ordem
│   ├── edit/page.tsx            # Edição
│   ├── execucao/page.tsx        # Tela de execução
│   └── relatorio/page.tsx       # Relatório final
├── new/page.tsx                 # Nova ordem
├── components/
│   ├── OrdemForm.tsx            # Formulário principal
│   ├── OrdemCard.tsx            # Card de ordem
│   ├── OrdemTable.tsx           # Tabela de ordens
│   ├── OrdemFilters.tsx         # Filtros de busca
│   ├── OrdemTimeline.tsx        # Timeline de execução
│   ├── OrdemStatus.tsx          # Componente de status
│   ├── MaterialList.tsx         # Lista de materiais
│   ├── ColaboradorAssign.tsx    # Atribuição de colaboradores
│   ├── PhotoUpload.tsx          # Upload de fotos
│   └── OrdemApproval.tsx        # Aprovações
├── hooks/
│   ├── useOrdemData.tsx         # Hook para dados
│   ├── useOrdemForm.tsx         # Hook para formulários
│   ├── useOrdemExecution.tsx    # Hook para execução
│   └── useOrdemStatus.tsx       # Hook para status
└── types/
    └── ordem-servico.ts         # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model OrdemServico {
  id                String    @id @default(cuid())
  numero            String    @unique
  titulo            String
  descricao         String?
  status            StatusOrdemServico @default(ABERTA)
  prioridade        PrioridadeOrdem @default(NORMAL)
  tipo              TipoOrdemServico
  
  // Relacionamentos
  clienteId         String
  cliente           Cliente   @relation(fields: [clienteId], references: [id])
  orcamentoId       String?
  orcamento         Orcamento? @relation(fields: [orcamentoId], references: [id])
  colaboradorId     String?
  colaborador       Colaborador? @relation(fields: [colaboradorId], references: [id])
  
  // Datas
  dataAbertura      DateTime  @default(now())
  dataAgendamento   DateTime?
  dataInicio        DateTime?
  dataConclusao     DateTime?
  prazoEstimado     DateTime?
  
  // Valores
  valorOrcado       Decimal?
  valorRealizado    Decimal?
  valorMateriais    Decimal?
  valorMaoObra      Decimal?
  
  // Execução
  observacoes       String?
  observacoesInternas String?
  avaliacaoCliente  Int?
  assinaturaCliente String?
  
  // Relacionamentos
  itens             ItemOrdemServico[]
  anexos            AnexoOrdemServico[]
  historico         HistoricoOrdemServico[]
  laudoTecnico      LaudoTecnico?
  tarefas           Task[]
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  @@map("ordens_servico")
}

enum StatusOrdemServico {
  ABERTA
  AGENDADA
  EM_ANDAMENTO
  PAUSADA
  AGUARDANDO_APROVACAO
  AGUARDANDO_MATERIAL
  CONCLUIDA
  CANCELADA
}

enum PrioridadeOrdem {
  BAIXA
  NORMAL
  ALTA
  URGENTE
  CRITICA
}

enum TipoOrdemServico {
  MANUTENCAO
  INSTALACAO
  REPARO
  CONSULTORIA
  EMERGENCIA
  PREVENTIVA
  CORRETIVA
}
```

### 4.3 Hooks Customizados
- **useOrdemData:** Gerencia dados da ordem
- **useOrdemForm:** Validação e submissão
- **useOrdemExecution:** Controle de execução
- **useOrdemStatus:** Gerenciamento de status
- **useOrdemMaterials:** Gestão de materiais

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// CRUD Básico
GET    /api/ordens-servico              # Listar ordens
POST   /api/ordens-servico              # Criar ordem
GET    /api/ordens-servico/[id]         # Buscar ordem
PUT    /api/ordens-servico/[id]         # Atualizar ordem
DELETE /api/ordens-servico/[id]         # Deletar ordem

// Execução
POST   /api/ordens-servico/[id]/iniciar    # Iniciar execução
POST   /api/ordens-servico/[id]/pausar     # Pausar execução
POST   /api/ordens-servico/[id]/concluir   # Concluir ordem
POST   /api/ordens-servico/[id]/cancelar   # Cancelar ordem

// Materiais e Recursos
GET    /api/ordens-servico/[id]/materiais
POST   /api/ordens-servico/[id]/materiais
PUT    /api/ordens-servico/[id]/materiais/[itemId]

// Anexos e Evidências
GET    /api/ordens-servico/[id]/anexos
POST   /api/ordens-servico/[id]/anexos
DELETE /api/ordens-servico/[id]/anexos/[anexoId]

// Relatórios
GET    /api/ordens-servico/relatorios/produtividade
GET    /api/ordens-servico/relatorios/custos
GET    /api/ordens-servico/relatorios/qualidade
```

### 5.2 Estrutura de Resposta
```typescript
interface OrdemServicoResponse {
  id: string;
  numero: string;
  titulo: string;
  descricao?: string;
  status: StatusOrdemServico;
  prioridade: PrioridadeOrdem;
  tipo: TipoOrdemServico;
  cliente: {
    id: string;
    nome: string;
    email?: string;
  };
  colaborador?: {
    id: string;
    nome: string;
  };
  dataAbertura: string;
  dataAgendamento?: string;
  prazoEstimado?: string;
  valorOrcado?: number;
  valorRealizado?: number;
  itens: ItemOrdemServico[];
  anexos: AnexoOrdemServico[];
}
```

### 5.3 Validações (Zod)
```typescript
const OrdemServicoSchema = z.object({
  titulo: z.string().min(5).max(200),
  descricao: z.string().optional(),
  clienteId: z.string().cuid(),
  colaboradorId: z.string().cuid().optional(),
  tipo: z.enum(['MANUTENCAO', 'INSTALACAO', 'REPARO', 'CONSULTORIA', 'EMERGENCIA']),
  prioridade: z.enum(['BAIXA', 'NORMAL', 'ALTA', 'URGENTE', 'CRITICA']),
  dataAgendamento: z.string().datetime().optional(),
  prazoEstimado: z.string().datetime().optional(),
  valorOrcado: z.number().positive().optional(),
  observacoes: z.string().optional()
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Lista de Ordens:** Kanban board e tabela
- **Detalhes da Ordem:** Visão completa com tabs
- **Execução:** Interface para técnicos em campo
- **Relatórios:** Dashboard de métricas

### 6.2 Componentes Reutilizáveis
- **OrdemCard:** Card com informações resumidas
- **OrdemKanban:** Board de status visual
- **OrdemTimeline:** Timeline de execução
- **StatusBadge:** Badge de status colorido
- **PriorityIndicator:** Indicador de prioridade
- **MaterialTracker:** Rastreamento de materiais

### 6.3 Estados de Interface
- Loading: Skeleton para carregamento
- Empty: Estado vazio com filtros ativos
- Error: Mensagens de erro contextuais
- Success: Confirmações de ações

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const ORDEM_SERVICO_PERMISSIONS = [
  'ordens.read',              // Visualizar ordens
  'ordens.write',             // Criar/editar ordens
  'ordens.delete',            // Deletar ordens
  'ordens.execute',           // Executar ordens
  'ordens.approve',           // Aprovar ordens
  'ordens.assign',            // Atribuir colaboradores
  'ordens.materials.read',    // Ver materiais
  'ordens.materials.write',   // Gerenciar materiais
  'ordens.reports.read'       // Acessar relatórios
];
```

### 7.2 Níveis de Acesso
- **Técnico:** Executar ordens atribuídas
- **Supervisor:** Gerenciar equipe e aprovar
- **Gerente:** Acesso completo e relatórios
- **Administrador:** Todas as permissões

### 7.3 Segurança de Dados
- Logs de todas as alterações
- Assinatura digital para conclusão
- Backup automático de anexos
- Criptografia de dados sensíveis
- Auditoria de acesso

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Clientes:** Solicitante da ordem
- **Colaboradores:** Execução e atribuição
- **Orçamentos:** Origem da ordem
- **Laudos Técnicos:** Resultado técnico
- **Tasks:** Tarefas relacionadas
- **Materiais:** Controle de estoque (futuro)

### 8.2 APIs Externas
- **Google Maps:** Localização e rotas
- **WhatsApp:** Notificações para cliente
- **Email:** Comunicações automáticas
- **Assinatura Digital:** Validação de conclusão

### 8.3 Webhooks e Eventos
- Ordem criada/atualizada
- Status alterado
- Colaborador atribuído
- Ordem concluída
- Avaliação recebida

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Modelo de dados e CRUD básico
- ✅ **Semana 3-4:** Interface de listagem e kanban
- ✅ **Semana 5-6:** Formulários e validações
- ✅ **Semana 7-8:** Sistema de status e workflow
- ✅ **Semana 9-10:** Execução e timeline
- ✅ **Semana 11-12:** Materiais e custos
- ✅ **Semana 13-14:** Anexos e evidências
- ✅ **Semana 15-16:** Relatórios e métricas
- ✅ **Semana 17-18:** Testes e otimizações

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** App mobile para técnicos
- 📋 **Q2 2025:** Integração com estoque
- 📋 **Q3 2025:** IA para otimização de rotas
- 📋 **Q4 2025:** IoT para monitoramento

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (88% cobertura)
- **Integração:** APIs e fluxos de workflow
- **E2E:** Cenários completos de execução
- **Performance:** Carregamento e busca

### 10.2 Métricas de Qualidade
- Cobertura de testes: 88%
- Performance: < 1s carregamento
- Acessibilidade: WCAG 2.1 AA
- Disponibilidade: 99.9%

### 10.3 Critérios de Aceitação
- ✅ Workflow completo funcionando
- ✅ Integração com outros módulos
- ✅ Sistema de aprovações
- ✅ Controle de materiais e custos
- ✅ Relatórios precisos
- ✅ Interface mobile-friendly
- ✅ Notificações automáticas

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Operacional
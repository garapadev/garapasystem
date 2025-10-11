# Módulo: Relatórios

**Status:** ✅ Implementado  
**Categoria:** Operational  
**Versão:** 1.0  
**Responsável:** Equipe Analytics  

---

## 1. Visão Geral

O módulo Relatórios é responsável pela geração, visualização e distribuição de relatórios analíticos do GarapaSystem. Oferece uma plataforma robusta para criação de dashboards personalizados, relatórios automatizados e análises de dados em tempo real, atendendo às necessidades de diferentes níveis organizacionais.

### Propósito
- Gerar relatórios analíticos
- Criar dashboards personalizados
- Automatizar distribuição de relatórios
- Fornecer insights de negócio

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Analytics:** Análises profundas de dados
- **Automação:** Relatórios automatizados
- **Personalização:** Dashboards customizáveis
- **Performance:** Processamento eficiente

### Requisitos Funcionais
- Geração de relatórios dinâmicos
- Dashboards interativos
- Agendamento de relatórios
- Exportação múltiplos formatos
- Filtros avançados
- Drill-down de dados
- Compartilhamento seguro
- Templates personalizáveis
- Relatórios em tempo real
- Alertas baseados em dados

### Requisitos Não-Funcionais
- Performance: Geração < 30s
- Escalabilidade: 1M+ registros
- Disponibilidade: 99.9% uptime
- Usabilidade: Interface intuitiva
- Segurança: Controle de acesso

---

## 3. Funcionalidades

### 3.1 Geração de Relatórios
- **Dinâmicos:** Relatórios baseados em parâmetros
- **Estáticos:** Relatórios pré-definidos
- **Agendados:** Execução automática
- **Sob Demanda:** Geração instantânea
- **Comparativos:** Análises comparativas

### 3.2 Dashboards
- **Personalizáveis:** Widgets customizáveis
- **Interativos:** Filtros e drill-down
- **Responsivos:** Adaptação a dispositivos
- **Tempo Real:** Dados atualizados
- **Compartilháveis:** Distribuição controlada

### 3.3 Visualizações
- **Gráficos:** Diversos tipos de gráficos
- **Tabelas:** Tabelas dinâmicas
- **Mapas:** Visualizações geográficas
- **KPIs:** Indicadores chave
- **Métricas:** Métricas customizadas

### 3.4 Distribuição
- **Email:** Envio automático
- **Portal:** Acesso via web
- **API:** Integração externa
- **Mobile:** Aplicativo móvel
- **Impressão:** Relatórios físicos

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/reports/
├── page.tsx                     # Lista de relatórios
├── dashboard/
│   ├── page.tsx                # Dashboard principal
│   ├── [id]/page.tsx           # Dashboard específico
│   ├── builder/page.tsx        # Construtor de dashboard
│   ├── widgets/
│   │   ├── ChartWidget.tsx     # Widget de gráfico
│   │   ├── TableWidget.tsx     # Widget de tabela
│   │   ├── KPIWidget.tsx       # Widget de KPI
│   │   ├── MapWidget.tsx       # Widget de mapa
│   │   └── MetricWidget.tsx    # Widget de métrica
│   └── templates/page.tsx      # Templates de dashboard
├── builder/
│   ├── page.tsx                # Construtor de relatórios
│   ├── query/page.tsx          # Editor de consultas
│   ├── design/page.tsx         # Designer visual
│   ├── preview/page.tsx        # Pré-visualização
│   └── publish/page.tsx        # Publicação
├── scheduled/
│   ├── page.tsx                # Relatórios agendados
│   ├── [id]/page.tsx           # Detalhes do agendamento
│   ├── new/page.tsx            # Novo agendamento
│   └── history/page.tsx        # Histórico de execuções
├── templates/
│   ├── page.tsx                # Templates disponíveis
│   ├── [id]/page.tsx           # Detalhes do template
│   ├── new/page.tsx            # Novo template
│   └── categories/page.tsx     # Categorias
├── analytics/
│   ├── page.tsx                # Analytics avançado
│   ├── trends/page.tsx         # Análise de tendências
│   ├── forecasting/page.tsx    # Previsões
│   └── insights/page.tsx       # Insights automáticos
├── exports/
│   ├── page.tsx                # Histórico de exportações
│   ├── queue/page.tsx          # Fila de processamento
│   └── settings/page.tsx       # Configurações
├── components/
│   ├── ReportViewer.tsx        # Visualizador
│   ├── ChartBuilder.tsx        # Construtor de gráficos
│   ├── FilterPanel.tsx         # Painel de filtros
│   ├── DataTable.tsx           # Tabela de dados
│   ├── ExportButton.tsx        # Botão de exportação
│   ├── ScheduleForm.tsx        # Formulário agendamento
│   ├── TemplateCard.tsx        # Card de template
│   ├── QueryEditor.tsx         # Editor de consultas
│   ├── VisualizationPicker.tsx # Seletor de visualização
│   └── ShareDialog.tsx         # Diálogo de compartilhamento
├── hooks/
│   ├── useReports.tsx          # Hook principal
│   ├── useDashboard.tsx        # Hook de dashboard
│   ├── useCharts.tsx           # Hook de gráficos
│   ├── useExport.tsx           # Hook de exportação
│   ├── useSchedule.tsx         # Hook de agendamento
│   └── useAnalytics.tsx        # Hook de analytics
├── lib/
│   ├── report-engine.ts        # Engine de relatórios
│   ├── chart-config.ts         # Configuração de gráficos
│   ├── export-utils.ts         # Utilitários de exportação
│   ├── query-builder.ts        # Construtor de consultas
│   ├── data-processor.ts       # Processador de dados
│   └── scheduler.ts            # Agendador
└── types/
    └── reports.ts              # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model Relatorio {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  nome            String
  descricao       String?
  categoria       String?
  tags            String[]  // Tags para organização
  
  // Configuração
  tipo            TipoRelatorio
  formato         FormatoRelatorio @default(HTML)
  consulta        Json      // Query SQL ou configuração
  parametros      Json?     // Parâmetros do relatório
  filtros         Json?     // Filtros padrão
  
  // Layout e Design
  template        String?   // Template utilizado
  configuracao    Json?     // Configurações de layout
  estilos         Json?     // Estilos customizados
  
  // Permissões
  isPublico       Boolean   @default(false)
  isAtivo         Boolean   @default(true)
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  autorId         String
  autor           Usuario   @relation("RelatorioAutor", fields: [autorId], references: [id])
  
  // Agendamentos e Execuções
  agendamentos    AgendamentoRelatorio[]
  execucoes       ExecucaoRelatorio[]
  compartilhamentos CompartilhamentoRelatorio[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@map("relatorios")
}

model Dashboard {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  nome            String
  descricao       String?
  categoria       String?
  
  // Layout
  layout          Json      // Configuração do layout
  widgets         DashboardWidget[]
  
  // Configurações
  isPublico       Boolean   @default(false)
  isAtivo         Boolean   @default(true)
  autoRefresh     Int?      // Intervalo de atualização (segundos)
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  autorId         String
  autor           Usuario   @relation("DashboardAutor", fields: [autorId], references: [id])
  
  // Compartilhamentos
  compartilhamentos CompartilhamentoDashboard[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("dashboards")
}

model DashboardWidget {
  id              String    @id @default(cuid())
  dashboardId     String
  dashboard       Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  
  // Posicionamento
  posicaoX        Int
  posicaoY        Int
  largura         Int
  altura          Int
  
  // Configuração
  tipo            TipoWidget
  titulo          String?
  configuracao    Json      // Configurações específicas do widget
  consulta        Json?     // Query para dados
  
  // Estilo
  estilos         Json?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("dashboard_widgets")
}

model AgendamentoRelatorio {
  id              String    @id @default(cuid())
  relatorioId     String
  relatorio       Relatorio @relation(fields: [relatorioId], references: [id], onDelete: Cascade)
  
  // Agendamento
  nome            String
  cronExpression  String    // Expressão cron
  timezone        String    @default("America/Sao_Paulo")
  
  // Configurações
  isAtivo         Boolean   @default(true)
  parametros      Json?     // Parâmetros específicos
  
  // Distribuição
  destinatarios   String[]  // Emails dos destinatários
  formato         FormatoRelatorio @default(PDF)
  assunto         String?
  mensagem        String?
  
  // Execuções
  execucoes       ExecucaoRelatorio[]
  
  // Auditoria
  criadoPor       String
  criador         Usuario   @relation(fields: [criadoPor], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("agendamentos_relatorio")
}

model ExecucaoRelatorio {
  id              String    @id @default(cuid())
  relatorioId     String?
  relatorio       Relatorio? @relation(fields: [relatorioId], references: [id])
  agendamentoId   String?
  agendamento     AgendamentoRelatorio? @relation(fields: [agendamentoId], references: [id])
  
  // Execução
  status          StatusExecucao
  iniciadoEm      DateTime  @default(now())
  finalizadoEm    DateTime?
  duracao         Int?      // Duração em segundos
  
  // Resultado
  arquivo         String?   // Caminho do arquivo gerado
  tamanho         Int?      // Tamanho do arquivo
  registros       Int?      // Número de registros
  
  // Erro
  erro            String?   // Mensagem de erro
  stackTrace      String?   // Stack trace do erro
  
  // Parâmetros utilizados
  parametros      Json?
  
  // Auditoria
  executadoPor    String?
  executor        Usuario?  @relation(fields: [executadoPor], references: [id])
  
  @@map("execucoes_relatorio")
}

model TemplateRelatorio {
  id              String    @id @default(cuid())
  
  // Dados Básicos
  nome            String
  descricao       String?
  categoria       String
  
  // Template
  conteudo        String    // HTML/Template do relatório
  estilos         String?   // CSS customizado
  configuracao    Json?     // Configurações do template
  
  // Metadados
  versao          String    @default("1.0")
  isSystem        Boolean   @default(false)
  isAtivo         Boolean   @default(true)
  
  // Relacionamentos
  empresaId       String?
  empresa         Empresa?  @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("templates_relatorio")
}

model CompartilhamentoRelatorio {
  id              String    @id @default(cuid())
  relatorioId     String
  relatorio       Relatorio @relation(fields: [relatorioId], references: [id], onDelete: Cascade)
  
  // Compartilhamento
  usuarioId       String?
  usuario         Usuario?  @relation(fields: [usuarioId], references: [id])
  email           String?   // Para usuários externos
  
  // Permissões
  permissoes      PermissaoCompartilhamento[]
  
  // Validade
  validoAte       DateTime?
  
  // Auditoria
  compartilhadoPor String
  compartilhador  Usuario   @relation("CompartilhamentoAutor", fields: [compartilhadoPor], references: [id])
  compartilhadoEm DateTime  @default(now())
  
  @@map("compartilhamentos_relatorio")
}

model CompartilhamentoDashboard {
  id              String    @id @default(cuid())
  dashboardId     String
  dashboard       Dashboard @relation(fields: [dashboardId], references: [id], onDelete: Cascade)
  
  // Compartilhamento
  usuarioId       String?
  usuario         Usuario?  @relation(fields: [usuarioId], references: [id])
  email           String?
  
  // Permissões
  permissoes      PermissaoCompartilhamento[]
  
  // Validade
  validoAte       DateTime?
  
  // Auditoria
  compartilhadoPor String
  compartilhador  Usuario   @relation("CompartilhamentoDashboardAutor", fields: [compartilhadoPor], references: [id])
  compartilhadoEm DateTime  @default(now())
  
  @@map("compartilhamentos_dashboard")
}

enum TipoRelatorio {
  TABULAR     // Relatório tabular
  GRAFICO     // Relatório com gráficos
  DASHBOARD   // Dashboard
  FORMULARIO  // Relatório de formulário
  ETIQUETA    // Etiquetas
  CARTA       // Cartas/Documentos
}

enum FormatoRelatorio {
  HTML
  PDF
  EXCEL
  CSV
  JSON
  XML
}

enum TipoWidget {
  CHART_BAR       // Gráfico de barras
  CHART_LINE      // Gráfico de linha
  CHART_PIE       // Gráfico de pizza
  CHART_AREA      // Gráfico de área
  TABLE           // Tabela
  KPI             // Indicador KPI
  METRIC          // Métrica simples
  MAP             // Mapa
  TEXT            // Texto/HTML
  IFRAME          // IFrame
}

enum StatusExecucao {
  PENDENTE
  EXECUTANDO
  CONCLUIDO
  ERRO
  CANCELADO
}

enum PermissaoCompartilhamento {
  VISUALIZAR
  EXPORTAR
  COMPARTILHAR
  EDITAR
}
```

### 4.3 Hooks Customizados
- **useReports:** Hook principal de relatórios
- **useDashboard:** Gestão de dashboards
- **useCharts:** Configuração de gráficos
- **useExport:** Exportação de dados

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Relatórios
GET    /api/reports                      # Listar relatórios
POST   /api/reports                      # Criar relatório
GET    /api/reports/[id]                 # Buscar relatório
PUT    /api/reports/[id]                 # Atualizar relatório
DELETE /api/reports/[id]                 # Deletar relatório
POST   /api/reports/[id]/execute         # Executar relatório
GET    /api/reports/[id]/preview         # Pré-visualizar

// Dashboards
GET    /api/dashboards                   # Listar dashboards
POST   /api/dashboards                   # Criar dashboard
GET    /api/dashboards/[id]              # Buscar dashboard
PUT    /api/dashboards/[id]              # Atualizar dashboard
DELETE /api/dashboards/[id]              # Deletar dashboard
GET    /api/dashboards/[id]/data         # Dados do dashboard

// Widgets
GET    /api/dashboards/[id]/widgets      # Widgets do dashboard
POST   /api/dashboards/[id]/widgets      # Adicionar widget
PUT    /api/widgets/[id]                 # Atualizar widget
DELETE /api/widgets/[id]                 # Deletar widget
GET    /api/widgets/[id]/data            # Dados do widget

// Agendamentos
GET    /api/reports/scheduled            # Agendamentos
POST   /api/reports/scheduled            # Criar agendamento
GET    /api/reports/scheduled/[id]       # Buscar agendamento
PUT    /api/reports/scheduled/[id]       # Atualizar agendamento
DELETE /api/reports/scheduled/[id]       # Deletar agendamento
POST   /api/reports/scheduled/[id]/run   # Executar agora

// Execuções
GET    /api/reports/executions           # Histórico execuções
GET    /api/reports/executions/[id]      # Detalhes execução
DELETE /api/reports/executions/[id]      # Cancelar execução
GET    /api/reports/executions/[id]/download # Download resultado

// Templates
GET    /api/reports/templates            # Listar templates
POST   /api/reports/templates            # Criar template
GET    /api/reports/templates/[id]       # Buscar template
PUT    /api/reports/templates/[id]       # Atualizar template
DELETE /api/reports/templates/[id]       # Deletar template

// Exportação
POST   /api/reports/export               # Exportar dados
GET    /api/reports/export/[id]          # Status exportação
GET    /api/reports/export/[id]/download # Download arquivo

// Compartilhamento
POST   /api/reports/[id]/share           # Compartilhar relatório
GET    /api/reports/shared               # Relatórios compartilhados
DELETE /api/reports/share/[id]           # Remover compartilhamento

// Analytics
GET    /api/reports/analytics            # Analytics de uso
GET    /api/reports/insights             # Insights automáticos
GET    /api/reports/trends               # Análise de tendências
```

### 5.2 Estrutura de Resposta
```typescript
interface ReportResponse {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  tipo: TipoRelatorio;
  formato: FormatoRelatorio;
  isPublico: boolean;
  isAtivo: boolean;
  autor: {
    id: string;
    nome: string;
  };
  ultimaExecucao?: {
    id: string;
    status: StatusExecucao;
    finalizadoEm?: string;
  };
  agendamentos: number;
  execucoes: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardResponse {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  isPublico: boolean;
  isAtivo: boolean;
  autoRefresh?: number;
  widgets: WidgetResponse[];
  autor: {
    id: string;
    nome: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface WidgetResponse {
  id: string;
  tipo: TipoWidget;
  titulo?: string;
  posicaoX: number;
  posicaoY: number;
  largura: number;
  altura: number;
  configuracao: any;
  dados?: any;
}

interface ExecutionResponse {
  id: string;
  status: StatusExecucao;
  iniciadoEm: string;
  finalizadoEm?: string;
  duracao?: number;
  registros?: number;
  arquivo?: string;
  tamanho?: number;
  erro?: string;
  relatorio: {
    id: string;
    nome: string;
  };
  executor?: {
    id: string;
    nome: string;
  };
}
```

### 5.3 Validações (Zod)
```typescript
const ReportSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(500).optional(),
  categoria: z.string().max(50).optional(),
  tipo: z.enum(['TABULAR', 'GRAFICO', 'DASHBOARD', 'FORMULARIO', 'ETIQUETA', 'CARTA']),
  formato: z.enum(['HTML', 'PDF', 'EXCEL', 'CSV', 'JSON', 'XML']).optional(),
  consulta: z.any(),
  parametros: z.any().optional(),
  filtros: z.any().optional()
});

const DashboardSchema = z.object({
  nome: z.string().min(2).max(100),
  descricao: z.string().max(500).optional(),
  categoria: z.string().max(50).optional(),
  layout: z.any(),
  autoRefresh: z.number().min(30).max(3600).optional()
});

const WidgetSchema = z.object({
  tipo: z.enum(['CHART_BAR', 'CHART_LINE', 'CHART_PIE', 'CHART_AREA', 'TABLE', 'KPI', 'METRIC', 'MAP', 'TEXT', 'IFRAME']),
  titulo: z.string().max(100).optional(),
  posicaoX: z.number().min(0),
  posicaoY: z.number().min(0),
  largura: z.number().min(1).max(12),
  altura: z.number().min(1).max(12),
  configuracao: z.any()
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Lista de Relatórios:** Gestão de relatórios
- **Dashboard Builder:** Construtor de dashboards
- **Report Builder:** Construtor de relatórios
- **Agendamentos:** Gestão de agendamentos
- **Analytics:** Análises avançadas

### 6.2 Componentes Reutilizáveis
- **ReportViewer:** Visualizador de relatórios
- **ChartBuilder:** Construtor de gráficos
- **DataTable:** Tabela de dados
- **FilterPanel:** Painel de filtros
- **ExportButton:** Botão de exportação

### 6.3 Estados de Interface
- Loading: Carregamento de dados
- Empty: Sem dados
- Error: Erro na geração
- Processing: Processando
- Ready: Pronto para visualização

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const REPORTS_PERMISSIONS = [
  'reports.read',               // Ver relatórios
  'reports.write',              // Criar/editar relatórios
  'reports.delete',             // Deletar relatórios
  'reports.execute',            // Executar relatórios
  'reports.schedule',           // Agendar relatórios
  'reports.share',              // Compartilhar relatórios
  'dashboards.read',            // Ver dashboards
  'dashboards.write',           // Criar/editar dashboards
  'dashboards.delete',          // Deletar dashboards
  'reports.admin',              // Administração completa
  'reports.analytics.read'      # Ver analytics
];
```

### 7.2 Níveis de Acesso
- **Usuário:** Ver relatórios compartilhados
- **Analista:** Criar relatórios básicos
- **Gestor:** Relatórios avançados
- **Admin:** Gestão completa

### 7.3 Segurança Implementada
- Controle de acesso por relatório
- Filtros de segurança automáticos
- Auditoria de execuções
- Isolamento de dados por empresa
- Validação de consultas SQL

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Dashboard:** Métricas principais
- **Clientes:** Relatórios de clientes
- **Ordens de Serviço:** Relatórios operacionais
- **Usuários:** Relatórios de acesso
- **Logs:** Relatórios de auditoria

### 8.2 Sistemas Externos
- **BI Tools:** Power BI, Tableau
- **Email:** Distribuição automática
- **Storage:** Armazenamento de arquivos
- **APIs:** Integração de dados externos

### 8.3 Formatos de Exportação
- PDF: Relatórios formatados
- Excel: Planilhas dinâmicas
- CSV: Dados tabulares
- JSON: Integração API
- HTML: Visualização web

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Estrutura base de relatórios
- ✅ **Semana 3-4:** Engine de geração
- ✅ **Semana 5-6:** Interface de criação
- ✅ **Semana 7-8:** Sistema de dashboards
- ✅ **Semana 9-10:** Widgets e visualizações
- ✅ **Semana 11-12:** Agendamento automático
- ✅ **Semana 13-14:** Exportação múltiplos formatos
- ✅ **Semana 15-16:** Sistema de templates
- ✅ **Semana 17-18:** Compartilhamento seguro
- ✅ **Semana 19-20:** Analytics e insights

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** IA para insights automáticos
- 📋 **Q2 2025:** Relatórios em tempo real
- 📋 **Q3 2025:** Integração com BI externo
- 📋 **Q4 2025:** Machine Learning para previsões

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (90% cobertura)
- **Integração:** Fluxos de geração
- **E2E:** Cenários completos
- **Performance:** Testes de carga

### 10.2 Métricas de Qualidade
- Cobertura de testes: 90%
- Performance: < 30s geração
- Disponibilidade: 99.9%
- Precisão: 100% dados

### 10.3 Critérios de Aceitação
- ✅ Geração de relatórios funcionando
- ✅ Dashboards interativos
- ✅ Agendamento automático
- ✅ Exportação múltiplos formatos
- ✅ Compartilhamento seguro
- ✅ Performance adequada
- ✅ Interface intuitiva
- ✅ Controle de acesso

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Analytics
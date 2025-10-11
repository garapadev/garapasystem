# Módulo: Logs

**Status:** ✅ Implementado  
**Categoria:** Core  
**Versão:** 1.0  
**Responsável:** Equipe Core  

---

## 1. Visão Geral

O módulo Logs é responsável pelo registro, armazenamento e análise de todas as atividades do sistema, incluindo logs de aplicação, auditoria, segurança e performance. É fundamental para monitoramento, debugging, compliance e análise de comportamento do sistema.

### Propósito
- Registrar todas as atividades do sistema
- Facilitar debugging e troubleshooting
- Garantir compliance e auditoria
- Monitorar performance e segurança

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Auditoria:** Rastreamento completo de ações
- **Debugging:** Facilitar identificação de problemas
- **Compliance:** Atender requisitos regulatórios
- **Monitoramento:** Acompanhar saúde do sistema

### Requisitos Funcionais
- Logs estruturados e categorizados
- Diferentes níveis de log (DEBUG, INFO, WARN, ERROR)
- Logs de auditoria para ações críticas
- Logs de performance e métricas
- Logs de segurança e acesso
- Busca e filtros avançados
- Exportação de logs
- Retenção configurável

### Requisitos Não-Funcionais
- Performance: Impacto mínimo no sistema
- Armazenamento: Compressão e rotação
- Disponibilidade: 99.9% uptime
- Escalabilidade: Milhões de logs/dia
- Segurança: Logs imutáveis e criptografados

---

## 3. Funcionalidades

### 3.1 Tipos de Logs
- **Aplicação:** Logs gerais da aplicação
- **Auditoria:** Ações de usuários e sistema
- **Segurança:** Tentativas de acesso, falhas
- **Performance:** Métricas de tempo e recursos
- **API:** Requisições e respostas
- **Erro:** Exceções e falhas do sistema
- **Sistema:** Eventos do sistema operacional

### 3.2 Níveis de Log
- **DEBUG:** Informações detalhadas para desenvolvimento
- **INFO:** Informações gerais de funcionamento
- **WARN:** Avisos sobre situações anômalas
- **ERROR:** Erros que não impedem funcionamento
- **FATAL:** Erros críticos que param o sistema

### 3.3 Funcionalidades de Busca
- Busca por texto livre
- Filtros por data/hora
- Filtros por nível
- Filtros por módulo/componente
- Filtros por usuário
- Busca por correlação ID
- Exportação de resultados

### 3.4 Análise e Relatórios
- Dashboard de logs em tempo real
- Métricas de erro por período
- Análise de performance
- Relatórios de auditoria
- Alertas automáticos
- Tendências e padrões

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/logs/
├── page.tsx                     # Dashboard de logs
├── application/
│   ├── page.tsx                # Logs de aplicação
│   └── [level]/page.tsx        # Logs por nível
├── audit/
│   ├── page.tsx                # Logs de auditoria
│   ├── users/page.tsx          # Auditoria de usuários
│   └── system/page.tsx         # Auditoria do sistema
├── security/
│   ├── page.tsx                # Logs de segurança
│   ├── access/page.tsx         # Logs de acesso
│   └── threats/page.tsx        # Ameaças detectadas
├── performance/
│   ├── page.tsx                # Logs de performance
│   ├── api/page.tsx            # Performance de APIs
│   └── database/page.tsx       # Performance do banco
├── search/
│   ├── page.tsx                # Busca avançada
│   └── saved/page.tsx          # Buscas salvas
├── reports/
│   ├── page.tsx                # Relatórios
│   ├── audit/page.tsx          # Relatórios de auditoria
│   └── performance/page.tsx    # Relatórios de performance
├── components/
│   ├── LogViewer.tsx           # Visualizador de logs
│   ├── LogEntry.tsx            # Entrada de log
│   ├── LogFilter.tsx           # Filtros de log
│   ├── LogSearch.tsx           # Busca de logs
│   ├── LogChart.tsx            # Gráficos de logs
│   ├── LogExport.tsx           # Exportação de logs
│   ├── LogAlert.tsx            # Alertas de log
│   ├── LogMetrics.tsx          # Métricas de logs
│   └── LogTimeline.tsx         # Timeline de eventos
├── hooks/
│   ├── useLogs.tsx             # Hook para logs
│   ├── useLogSearch.tsx        # Hook para busca
│   ├── useLogMetrics.tsx       # Hook para métricas
│   ├── useLogExport.tsx        # Hook para exportação
│   └── useLogAlerts.tsx        # Hook para alertas
└── types/
    └── log.ts                  # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model LogSistema {
  id              String    @id @default(cuid())
  
  // Identificação
  correlationId   String?   // ID para correlacionar logs relacionados
  sessionId       String?   // ID da sessão
  requestId       String?   // ID da requisição
  
  // Conteúdo
  nivel           NivelLog
  categoria       CategoriaLog
  modulo          String    // Módulo que gerou o log
  componente      String?   // Componente específico
  mensagem        String
  detalhes        Json?     // Detalhes adicionais
  stackTrace      String?   // Stack trace para erros
  
  // Contexto
  usuarioId       String?
  usuario         Usuario?  @relation(fields: [usuarioId], references: [id])
  empresaId       String?
  empresa         Empresa?  @relation(fields: [empresaId], references: [id])
  
  // Requisição
  method          String?   // HTTP method
  url             String?   // URL da requisição
  userAgent       String?   // User agent
  ipAddress       String?   // IP do cliente
  
  // Performance
  duration        Int?      // Duração em ms
  memoryUsage     Int?      // Uso de memória
  cpuUsage        Float?    // Uso de CPU
  
  // Metadados
  tags            String[]  // Tags para categorização
  environment     String?   // Ambiente (dev, prod, etc.)
  version         String?   // Versão da aplicação
  
  timestamp       DateTime  @default(now())
  
  @@index([nivel, categoria, timestamp])
  @@index([correlationId])
  @@index([usuarioId, timestamp])
  @@index([modulo, timestamp])
  @@map("logs_sistema")
}

model LogAuditoria {
  id              String    @id @default(cuid())
  
  // Ação
  acao            AcaoAuditoria
  recurso         String    // Tipo de recurso (user, client, order, etc.)
  recursoId       String?   // ID do recurso
  
  // Dados
  dadosAnteriores Json?     // Estado anterior
  dadosNovos      Json?     // Estado novo
  campos          String[]  // Campos alterados
  
  // Contexto
  usuarioId       String
  usuario         Usuario   @relation(fields: [usuarioId], references: [id])
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  // Requisição
  ipAddress       String
  userAgent       String
  sessionId       String?
  
  // Resultado
  sucesso         Boolean   @default(true)
  motivoFalha     String?
  
  timestamp       DateTime  @default(now())
  
  @@index([acao, recurso, timestamp])
  @@index([usuarioId, timestamp])
  @@index([recurso, recursoId])
  @@map("logs_auditoria")
}

model LogPerformance {
  id              String    @id @default(cuid())
  
  // Identificação
  tipo            TipoPerformance
  nome            String    // Nome da operação
  categoria       String?   // Categoria da operação
  
  // Métricas
  duracao         Int       // Duração em ms
  memoryInicial   Int?      // Memória inicial
  memoryFinal     Int?      // Memória final
  cpuUsage        Float?    // Uso de CPU
  
  // Contexto
  usuarioId       String?
  usuario         Usuario?  @relation(fields: [usuarioId], references: [id])
  sessionId       String?
  requestId       String?
  
  // Detalhes
  parametros      Json?     // Parâmetros da operação
  resultado       Json?     // Resultado da operação
  erro            String?   // Erro se houver
  
  timestamp       DateTime  @default(now())
  
  @@index([tipo, nome, timestamp])
  @@index([duracao])
  @@map("logs_performance")
}

model AlertaLog {
  id              String    @id @default(cuid())
  nome            String
  descricao       String?
  
  // Condições
  condicoes       Json      // Condições para disparar o alerta
  niveis          NivelLog[]
  categorias      CategoriaLog[]
  modulos         String[]
  
  // Configurações
  isActive        Boolean   @default(true)
  frequencia      Int       @default(5) // Minutos
  threshold       Int       @default(1) // Número de ocorrências
  
  // Notificações
  notificarEmail  Boolean   @default(true)
  emails          String[]
  notificarSlack  Boolean   @default(false)
  slackWebhook    String?
  
  // Relacionamentos
  empresaId       String
  empresa         Empresa   @relation(fields: [empresaId], references: [id])
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastTriggered   DateTime?
  
  @@map("alertas_log")
}

enum NivelLog {
  DEBUG
  INFO
  WARN
  ERROR
  FATAL
}

enum CategoriaLog {
  APPLICATION
  AUDIT
  SECURITY
  PERFORMANCE
  API
  DATABASE
  SYSTEM
  INTEGRATION
}

enum AcaoAuditoria {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  EXPORT
  IMPORT
  APPROVE
  REJECT
  SEND
  RECEIVE
}

enum TipoPerformance {
  API_REQUEST
  DATABASE_QUERY
  FILE_OPERATION
  EMAIL_SEND
  REPORT_GENERATION
  BACKUP_OPERATION
  INTEGRATION_CALL
}
```

### 4.3 Hooks Customizados
- **useLogs:** Gestão geral de logs
- **useLogSearch:** Busca e filtros
- **useLogMetrics:** Métricas e estatísticas
- **useLogExport:** Exportação de logs
- **useLogAlerts:** Gestão de alertas

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Logs Gerais
GET    /api/logs                          # Listar logs
GET    /api/logs/[id]                     # Buscar log específico
POST   /api/logs/search                   # Busca avançada
GET    /api/logs/levels                   # Logs por nível
GET    /api/logs/categories               # Logs por categoria

// Logs de Auditoria
GET    /api/logs/audit                    # Logs de auditoria
GET    /api/logs/audit/users/[id]         # Auditoria de usuário
GET    /api/logs/audit/resources/[type]   # Auditoria por recurso

// Logs de Performance
GET    /api/logs/performance              # Logs de performance
GET    /api/logs/performance/api          # Performance de APIs
GET    /api/logs/performance/database     # Performance do banco

// Métricas
GET    /api/logs/metrics                  # Métricas gerais
GET    /api/logs/metrics/errors           # Métricas de erro
GET    /api/logs/metrics/performance      # Métricas de performance
GET    /api/logs/metrics/trends           # Tendências

// Exportação
POST   /api/logs/export                   # Exportar logs
GET    /api/logs/export/[id]              # Status da exportação
GET    /api/logs/export/[id]/download     # Download do arquivo

// Alertas
GET    /api/logs/alerts                   # Listar alertas
POST   /api/logs/alerts                   # Criar alerta
PUT    /api/logs/alerts/[id]              # Atualizar alerta
DELETE /api/logs/alerts/[id]              # Deletar alerta
POST   /api/logs/alerts/[id]/test         # Testar alerta

// Limpeza
DELETE /api/logs/cleanup                  # Limpeza de logs antigos
POST   /api/logs/archive                  # Arquivar logs
```

### 5.2 Estrutura de Resposta
```typescript
interface LogResponse {
  id: string;
  correlationId?: string;
  nivel: NivelLog;
  categoria: CategoriaLog;
  modulo: string;
  componente?: string;
  mensagem: string;
  detalhes?: any;
  stackTrace?: string;
  usuario?: {
    id: string;
    nome: string;
  };
  method?: string;
  url?: string;
  ipAddress?: string;
  duration?: number;
  tags: string[];
  timestamp: string;
}

interface LogMetricsResponse {
  total: number;
  porNivel: Record<NivelLog, number>;
  porCategoria: Record<CategoriaLog, number>;
  porModulo: Record<string, number>;
  tendencia: {
    periodo: string;
    total: number;
    erros: number;
  }[];
}
```

### 5.3 Validações (Zod)
```typescript
const LogSearchSchema = z.object({
  query: z.string().optional(),
  nivel: z.array(z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])).optional(),
  categoria: z.array(z.enum(['APPLICATION', 'AUDIT', 'SECURITY', 'PERFORMANCE', 'API', 'DATABASE', 'SYSTEM', 'INTEGRATION'])).optional(),
  modulo: z.array(z.string()).optional(),
  usuarioId: z.string().cuid().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0)
});

const AlertSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().max(500).optional(),
  condicoes: z.record(z.any()),
  niveis: z.array(z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'])),
  categorias: z.array(z.enum(['APPLICATION', 'AUDIT', 'SECURITY', 'PERFORMANCE', 'API', 'DATABASE', 'SYSTEM', 'INTEGRATION'])),
  modulos: z.array(z.string()),
  isActive: z.boolean().optional(),
  frequencia: z.number().min(1).max(1440),
  threshold: z.number().min(1),
  emails: z.array(z.string().email())
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Dashboard:** Visão geral dos logs
- **Logs de Aplicação:** Logs gerais
- **Auditoria:** Logs de auditoria
- **Performance:** Métricas de performance
- **Busca:** Busca avançada de logs

### 6.2 Componentes Reutilizáveis
- **LogViewer:** Visualizador principal
- **LogEntry:** Entrada individual de log
- **LogFilter:** Filtros avançados
- **LogChart:** Gráficos e métricas
- **LogTimeline:** Timeline de eventos
- **LogExport:** Exportação de dados

### 6.3 Estados de Interface
- Loading: Skeleton loaders
- Empty: Estado vazio
- Error: Mensagens de erro
- Streaming: Logs em tempo real
- Filtering: Aplicando filtros

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const LOG_PERMISSIONS = [
  'logs.read',              // Visualizar logs
  'logs.audit.read',        // Visualizar logs de auditoria
  'logs.performance.read',  // Visualizar logs de performance
  'logs.security.read',     // Visualizar logs de segurança
  'logs.export',            // Exportar logs
  'logs.alerts.write',      // Gerenciar alertas
  'logs.cleanup.write'      // Limpeza de logs
];
```

### 7.2 Níveis de Acesso
- **Usuário:** Sem acesso aos logs
- **Supervisor:** Logs da própria equipe
- **Gerente:** Logs da empresa
- **Administrador:** Todos os logs

### 7.3 Segurança Implementada
- Logs imutáveis após criação
- Criptografia de dados sensíveis
- Controle de acesso granular
- Auditoria de acesso aos logs
- Rate limiting para consultas
- Sanitização de dados pessoais

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Todos os módulos:** Geram logs
- **Usuários:** Logs de autenticação
- **Auditoria:** Logs de ações
- **Performance:** Métricas de sistema
- **Segurança:** Logs de acesso

### 8.2 Ferramentas Externas
- **ELK Stack:** Elasticsearch, Logstash, Kibana
- **Grafana:** Visualização de métricas
- **Sentry:** Monitoramento de erros
- **DataDog:** APM e logs
- **Slack:** Notificações de alertas

### 8.3 Eventos e Webhooks
- Novo log crítico
- Threshold de erro atingido
- Sistema indisponível
- Performance degradada
- Tentativa de acesso suspeita

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Estrutura básica de logs
- ✅ **Semana 3-4:** Logs de aplicação e auditoria
- ✅ **Semana 5-6:** Logs de performance
- ✅ **Semana 7-8:** Interface de visualização
- ✅ **Semana 9-10:** Busca e filtros
- ✅ **Semana 11-12:** Métricas e dashboards
- ✅ **Semana 13-14:** Alertas automáticos
- ✅ **Semana 15-16:** Exportação e relatórios
- ✅ **Semana 17-18:** Otimizações de performance
- ✅ **Semana 19-20:** Testes e documentação

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** Integração com ELK Stack
- 📋 **Q2 2025:** Machine Learning para detecção de anomalias
- 📋 **Q3 2025:** Logs distribuídos e correlação
- 📋 **Q4 2025:** Analytics preditivos

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (80% cobertura)
- **Integração:** APIs e busca
- **Performance:** Volume alto de logs
- **Segurança:** Controle de acesso

### 10.2 Métricas de Qualidade
- Cobertura de testes: 80%
- Performance de busca: < 2 segundos
- Disponibilidade: 99.9%
- Retenção de dados: Configurável

### 10.3 Critérios de Aceitação
- ✅ Logs estruturados e categorizados
- ✅ Busca rápida e eficiente
- ✅ Métricas em tempo real
- ✅ Alertas funcionando
- ✅ Exportação de dados
- ✅ Interface intuitiva
- ✅ Performance adequada
- ✅ Segurança implementada

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Core
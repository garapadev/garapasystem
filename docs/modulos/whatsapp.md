# Módulo: WhatsApp

**Status:** ✅ Implementado  
**Categoria:** Comunicação  
**Versão:** 1.0  
**Responsável:** Equipe Comunicação  

---

## 1. Visão Geral

O módulo WhatsApp é responsável pela integração completa com WhatsApp Business, permitindo comunicação automatizada e manual com clientes, envio de notificações, templates de mensagens e gestão de múltiplas sessões de WhatsApp.

### Propósito
- Centralizar comunicação via WhatsApp
- Automatizar notificações e follow-ups
- Gerenciar múltiplas contas WhatsApp
- Integrar com fluxos operacionais

---

## 2. Objetivos e Requisitos

### Objetivos Principais
- **Comunicação:** Canal direto com clientes
- **Automação:** Notificações automáticas
- **Eficiência:** Gestão centralizada de mensagens
- **Integração:** Conectar com outros módulos

### Requisitos Funcionais
- Múltiplas sessões WhatsApp simultâneas
- Envio de mensagens individuais e em massa
- Templates de mensagens personalizáveis
- Histórico completo de conversas
- Envio de arquivos e mídias
- Webhooks para eventos
- Status de entrega e leitura

### Requisitos Não-Funcionais
- Disponibilidade: 99.5% uptime
- Performance: Envio < 3 segundos
- Escalabilidade: 10k+ mensagens/dia
- Segurança: Criptografia end-to-end

---

## 3. Funcionalidades

### 3.1 Gestão de Sessões
- **Múltiplas Contas:** Suporte a várias contas WhatsApp
- **QR Code:** Autenticação via QR Code
- **Status:** Monitoramento de conexão
- **Reconexão:** Automática em caso de queda
- **Backup:** Sessões salvas localmente

### 3.2 Envio de Mensagens
- Mensagens de texto simples
- Mensagens com formatação (negrito, itálico)
- Envio de imagens, documentos e áudios
- Mensagens em massa com personalização
- Agendamento de mensagens
- Templates pré-definidos

### 3.3 Automações
- Notificações de ordens de serviço
- Confirmações de agendamento
- Lembretes de vencimento
- Follow-up automático
- Respostas automáticas
- Integração com chatbots

### 3.4 Relatórios e Métricas
- Taxa de entrega
- Taxa de leitura
- Tempo de resposta
- Volume de mensagens
- Análise de engajamento

---

## 4. Arquitetura Técnica

### 4.1 Estrutura de Arquivos
```
src/app/whatsapp/
├── page.tsx                     # Dashboard WhatsApp
├── sessions/
│   ├── page.tsx                # Gestão de sessões
│   ├── [id]/page.tsx           # Detalhes da sessão
│   └── new/page.tsx            # Nova sessão
├── messages/
│   ├── page.tsx                # Lista de mensagens
│   ├── send/page.tsx           # Envio de mensagens
│   └── templates/page.tsx      # Templates
├── automations/
│   ├── page.tsx                # Lista de automações
│   ├── [id]/page.tsx           # Detalhes da automação
│   └── new/page.tsx            # Nova automação
├── components/
│   ├── SessionCard.tsx         # Card de sessão
│   ├── SessionStatus.tsx       # Status da sessão
│   ├── QRCodeDisplay.tsx       # Exibição do QR Code
│   ├── MessageForm.tsx         # Formulário de mensagem
│   ├── MessageList.tsx         # Lista de mensagens
│   ├── TemplateEditor.tsx      # Editor de templates
│   ├── ContactPicker.tsx       # Seletor de contatos
│   ├── MediaUpload.tsx         # Upload de mídia
│   ├── AutomationBuilder.tsx   # Construtor de automações
│   └── WhatsAppChat.tsx        # Interface de chat
├── hooks/
│   ├── useWhatsAppSession.tsx  # Hook para sessões
│   ├── useWhatsAppMessages.tsx # Hook para mensagens
│   ├── useWhatsAppTemplates.tsx # Hook para templates
│   └── useWhatsAppAutomation.tsx # Hook para automações
└── types/
    └── whatsapp.ts             # Tipos TypeScript
```

### 4.2 Modelos de Dados (Prisma)
```typescript
model WhatsAppSession {
  id              String    @id @default(cuid())
  nome            String
  telefone        String    @unique
  status          StatusWhatsApp @default(DESCONECTADO)
  qrCode          String?
  sessionData     Json?
  
  // Configurações
  isActive        Boolean   @default(true)
  autoReconnect   Boolean   @default(true)
  webhookUrl      String?
  
  // Relacionamentos
  mensagens       WhatsAppMessage[]
  automacoes      WhatsAppAutomation[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastConnected   DateTime?
  
  @@map("whatsapp_sessions")
}

model WhatsAppMessage {
  id              String    @id @default(cuid())
  sessionId       String
  session         WhatsAppSession @relation(fields: [sessionId], references: [id])
  
  // Dados da mensagem
  messageId       String?   // ID do WhatsApp
  from            String
  to              String
  body            String?
  type            TipoMensagemWhatsApp
  mediaUrl        String?
  fileName        String?
  
  // Status
  status          StatusMensagemWhatsApp @default(ENVIANDO)
  timestamp       DateTime
  deliveredAt     DateTime?
  readAt          DateTime?
  
  // Relacionamentos
  clienteId       String?
  cliente         Cliente?  @relation(fields: [clienteId], references: [id])
  ordemServicoId  String?
  ordemServico    OrdemServico? @relation(fields: [ordemServicoId], references: [id])
  
  createdAt       DateTime  @default(now())
  
  @@map("whatsapp_messages")
}

model WhatsAppTemplate {
  id              String    @id @default(cuid())
  nome            String
  conteudo        String
  variaveis       String[]  // Variáveis disponíveis
  categoria       String?
  isActive        Boolean   @default(true)
  
  // Relacionamentos
  automacoes      WhatsAppAutomation[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("whatsapp_templates")
}

enum StatusWhatsApp {
  CONECTADO
  DESCONECTADO
  CONECTANDO
  ERRO
  QR_CODE
}

enum TipoMensagemWhatsApp {
  TEXT
  IMAGE
  DOCUMENT
  AUDIO
  VIDEO
  LOCATION
}

enum StatusMensagemWhatsApp {
  ENVIANDO
  ENVIADA
  ENTREGUE
  LIDA
  ERRO
}
```

### 4.3 Hooks Customizados
- **useWhatsAppSession:** Gerencia sessões
- **useWhatsAppMessages:** Controle de mensagens
- **useWhatsAppTemplates:** Gestão de templates
- **useWhatsAppAutomation:** Automações
- **useWhatsAppWebhook:** Webhooks e eventos

---

## 5. APIs e Endpoints

### 5.1 Endpoints Principais
```typescript
// Sessões
GET    /api/whatsapp/sessions           # Listar sessões
POST   /api/whatsapp/sessions           # Criar sessão
GET    /api/whatsapp/sessions/[id]      # Buscar sessão
PUT    /api/whatsapp/sessions/[id]      # Atualizar sessão
DELETE /api/whatsapp/sessions/[id]      # Deletar sessão

// Controle de Sessão
POST   /api/whatsapp/sessions/[id]/connect    # Conectar
POST   /api/whatsapp/sessions/[id]/disconnect # Desconectar
GET    /api/whatsapp/sessions/[id]/qr         # Obter QR Code
GET    /api/whatsapp/sessions/[id]/status     # Status da sessão

// Mensagens
GET    /api/whatsapp/messages           # Listar mensagens
POST   /api/whatsapp/messages           # Enviar mensagem
GET    /api/whatsapp/messages/[id]      # Buscar mensagem
POST   /api/whatsapp/messages/bulk      # Envio em massa

// Templates
GET    /api/whatsapp/templates          # Listar templates
POST   /api/whatsapp/templates          # Criar template
GET    /api/whatsapp/templates/[id]     # Buscar template
PUT    /api/whatsapp/templates/[id]     # Atualizar template
DELETE /api/whatsapp/templates/[id]     # Deletar template

// Automações
GET    /api/whatsapp/automations        # Listar automações
POST   /api/whatsapp/automations        # Criar automação
PUT    /api/whatsapp/automations/[id]   # Atualizar automação
DELETE /api/whatsapp/automations/[id]   # Deletar automação

// Webhooks
POST   /api/whatsapp/webhook            # Receber webhooks
GET    /api/whatsapp/webhook/test       # Testar webhook

// Relatórios
GET    /api/whatsapp/reports/delivery   # Relatório de entrega
GET    /api/whatsapp/reports/engagement # Relatório de engajamento
```

### 5.2 Estrutura de Resposta
```typescript
interface WhatsAppSessionResponse {
  id: string;
  nome: string;
  telefone: string;
  status: StatusWhatsApp;
  qrCode?: string;
  isActive: boolean;
  autoReconnect: boolean;
  lastConnected?: string;
  createdAt: string;
  updatedAt: string;
}

interface WhatsAppMessageResponse {
  id: string;
  messageId?: string;
  from: string;
  to: string;
  body?: string;
  type: TipoMensagemWhatsApp;
  status: StatusMensagemWhatsApp;
  timestamp: string;
  deliveredAt?: string;
  readAt?: string;
  cliente?: {
    id: string;
    nome: string;
  };
}
```

### 5.3 Validações (Zod)
```typescript
const WhatsAppSessionSchema = z.object({
  nome: z.string().min(3).max(50),
  telefone: z.string().regex(/^\d{10,15}$/),
  isActive: z.boolean().optional(),
  autoReconnect: z.boolean().optional(),
  webhookUrl: z.string().url().optional()
});

const WhatsAppMessageSchema = z.object({
  sessionId: z.string().cuid(),
  to: z.string().regex(/^\d{10,15}$/),
  body: z.string().min(1).max(4096).optional(),
  type: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO']),
  mediaUrl: z.string().url().optional(),
  templateId: z.string().cuid().optional(),
  variables: z.record(z.string()).optional()
});
```

---

## 6. Componentes de Interface

### 6.1 Páginas Principais
- **Dashboard:** Visão geral das sessões
- **Gestão de Sessões:** CRUD de sessões
- **Envio de Mensagens:** Interface de envio
- **Templates:** Gestão de templates
- **Automações:** Configuração de automações

### 6.2 Componentes Reutilizáveis
- **SessionCard:** Card de sessão com status
- **QRCodeDisplay:** Exibição do QR Code
- **MessageBubble:** Bolha de mensagem
- **ContactPicker:** Seletor de contatos
- **TemplateEditor:** Editor WYSIWYG
- **MediaPreview:** Preview de mídias

### 6.3 Estados de Interface
- Conectando: Spinner de conexão
- QR Code: Exibição do código
- Conectado: Indicador verde
- Erro: Mensagens de erro
- Offline: Estado desconectado

---

## 7. Permissões e Segurança

### 7.1 Permissões Necessárias
```typescript
const WHATSAPP_PERMISSIONS = [
  'whatsapp.read',              // Visualizar WhatsApp
  'whatsapp.sessions.write',    // Gerenciar sessões
  'whatsapp.messages.send',     // Enviar mensagens
  'whatsapp.messages.bulk',     // Envio em massa
  'whatsapp.templates.write',   // Gerenciar templates
  'whatsapp.automations.write', // Configurar automações
  'whatsapp.reports.read'       // Acessar relatórios
];
```

### 7.2 Níveis de Acesso
- **Operador:** Envio de mensagens individuais
- **Supervisor:** Envio em massa e templates
- **Gerente:** Gestão completa e automações
- **Administrador:** Todas as permissões

### 7.3 Segurança de Dados
- Criptografia de sessões armazenadas
- Logs de todas as mensagens enviadas
- Rate limiting para envios
- Validação de números de telefone
- Backup seguro de conversas

---

## 8. Integrações

### 8.1 Módulos Integrados
- **Clientes:** Envio para base de clientes
- **Ordens de Serviço:** Notificações automáticas
- **Tasks:** Lembretes e follow-ups
- **Helpdesk:** Suporte via WhatsApp
- **Orçamentos:** Confirmações e aprovações

### 8.2 APIs Externas
- **WhatsApp Business API:** Oficial do Meta
- **Baileys:** Biblioteca não-oficial
- **Twilio:** Provedor alternativo
- **360Dialog:** Provedor empresarial

### 8.3 Webhooks e Eventos
- Mensagem recebida
- Status de entrega alterado
- Sessão conectada/desconectada
- Erro de envio
- Novo contato adicionado

---

## 9. Cronograma de Implementação

### 9.1 Histórico (Já Implementado)
- ✅ **Semana 1-2:** Integração básica com Baileys
- ✅ **Semana 3-4:** Gestão de sessões e QR Code
- ✅ **Semana 5-6:** Envio de mensagens de texto
- ✅ **Semana 7-8:** Upload e envio de mídias
- ✅ **Semana 9-10:** Templates de mensagens
- ✅ **Semana 11-12:** Envio em massa
- ✅ **Semana 13-14:** Automações básicas
- ✅ **Semana 15-16:** Webhooks e eventos
- ✅ **Semana 17-18:** Relatórios e métricas
- ✅ **Semana 19-20:** Testes e otimizações

### 9.2 Melhorias Futuras
- 📋 **Q1 2025:** Chatbot com IA
- 📋 **Q2 2025:** WhatsApp Business API oficial
- 📋 **Q3 2025:** Integração com CRM externo
- 📋 **Q4 2025:** Analytics avançados

---

## 10. Testes e Validação

### 10.1 Testes Implementados
- **Unitários:** Componentes e hooks (85% cobertura)
- **Integração:** APIs e webhooks
- **E2E:** Fluxos completos de envio
- **Performance:** Envio em massa

### 10.2 Métricas de Qualidade
- Cobertura de testes: 85%
- Taxa de entrega: 98%+
- Tempo de envio: < 3 segundos
- Disponibilidade: 99.5%

### 10.3 Critérios de Aceitação
- ✅ Múltiplas sessões funcionando
- ✅ Envio de texto e mídia
- ✅ Templates personalizáveis
- ✅ Automações configuráveis
- ✅ Relatórios precisos
- ✅ Webhooks funcionando
- ✅ Interface intuitiva

---

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Março 2025  
**Mantido por:** Equipe Comunicação
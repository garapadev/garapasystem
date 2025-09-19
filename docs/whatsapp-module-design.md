# Módulo WhatsApp Cliente - Plano de Implementação

## Visão Geral

Este documento detalha o plano completo para implementação do módulo WhatsApp Cliente no GarapaSystem, utilizando a biblioteca whatsmeow para integração com a API WhatsApp Web multidevice.

## 🏗️ Arquitetura do Sistema

### Estrutura de Diretórios

```
src/
├── lib/
│   └── whatsapp/
│       ├── client.ts          # Cliente WhatsApp principal
│       ├── message-handler.ts # Processamento de mensagens
│       ├── auth.ts           # Autenticação e sessões
│       ├── media.ts          # Manipulação de mídia
│       └── types.ts          # Tipos TypeScript
├── scripts/
│   └── start-whatsapp-worker.ts # Script de inicialização do worker
├── app/
│   ├── api/
│   │   └── whatsapp/
│   │       ├── send/route.ts     # Envio de mensagens
│   │       ├── status/route.ts   # Status da conexão
│   │       └── webhook/route.ts  # Webhooks de eventos
│   └── whatsapp/
│       ├── page.tsx             # Interface principal
│       ├── components/          # Componentes React
│       └── hooks/              # Hooks customizados
└── components/
    └── whatsapp/
        ├── chat-interface.tsx   # Interface de chat
        ├── contact-list.tsx     # Lista de contatos
        └── message-composer.tsx # Compositor de mensagens
```

### Integração com PM2

O módulo WhatsApp será integrado ao ecosystem.config.js existente:

```javascript
{
  name: 'whatsapp-worker',
  script: './src/scripts/start-whatsapp-worker.ts',
  interpreter: 'node',
  interpreter_args: '--loader ts-node/esm',
  instances: 1,
  exec_mode: 'fork',
  watch: false,
  env: {
    NODE_ENV: 'development',
    WHATSAPP_SESSION_PATH: './data/whatsapp-sessions'
  },
  env_production: {
    NODE_ENV: 'production',
    WHATSAPP_SESSION_PATH: '/app/data/whatsapp-sessions'
  }
}
```

## 📊 Estrutura de Banco de Dados

### Novos Modelos Prisma

```prisma
// WhatsApp Connection Management
model WhatsAppConnection {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  phoneNumber String?
  isConnected Boolean  @default(false)
  qrCode      String?
  lastSeen    DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relacionamentos
  messages    WhatsAppMessage[]
  contacts    WhatsAppContact[]
  groups      WhatsAppGroup[]
  
  @@map("whatsapp_connections")
}

// WhatsApp Messages
model WhatsAppMessage {
  id           String   @id @default(cuid())
  messageId    String   @unique // ID da mensagem do WhatsApp
  connectionId String
  chatId       String   // ID do chat (contato ou grupo)
  fromMe       Boolean  @default(false)
  messageType  WhatsAppMessageType
  content      String?
  mediaUrl     String?
  mediaType    String?
  timestamp    DateTime
  isRead       Boolean  @default(false)
  createdAt    DateTime @default(now())
  
  // Relacionamentos
  connection   WhatsAppConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  @@map("whatsapp_messages")
}

// WhatsApp Contacts
model WhatsAppContact {
  id           String   @id @default(cuid())
  connectionId String
  contactId    String   // ID do contato no WhatsApp
  name         String?
  phoneNumber  String
  profilePic   String?
  isBlocked    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relacionamentos
  connection   WhatsAppConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  @@unique([connectionId, contactId])
  @@map("whatsapp_contacts")
}

// WhatsApp Groups
model WhatsAppGroup {
  id           String   @id @default(cuid())
  connectionId String
  groupId      String   // ID do grupo no WhatsApp
  name         String
  description  String?
  profilePic   String?
  isAdmin      Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relacionamentos
  connection   WhatsAppConnection @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  
  @@unique([connectionId, groupId])
  @@map("whatsapp_groups")
}

// WhatsApp Automation Rules
model WhatsAppAutomation {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  trigger     WhatsAppTriggerType
  conditions  Json     // Condições em JSON
  actions     Json     // Ações em JSON
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("whatsapp_automations")
}

// Enums
enum WhatsAppMessageType {
  TEXT
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
  STICKER
  LOCATION
  CONTACT
  
  @@map("whatsapp_message_type")
}

enum WhatsAppTriggerType {
  MESSAGE_RECEIVED
  CONTACT_ADDED
  GROUP_JOINED
  KEYWORD_DETECTED
  SCHEDULE
  
  @@map("whatsapp_trigger_type")
}
```

## 🚀 Funcionalidades Principais

### 1. Gerenciamento de Conexão

- **Autenticação QR Code**: Interface para escaneamento do QR code
- **Reconexão Automática**: Sistema de reconexão em caso de desconexão
- **Multi-sessão**: Suporte a múltiplas conexões WhatsApp
- **Status de Conexão**: Monitoramento em tempo real do status

### 2. Sistema de Mensageria

#### Envio de Mensagens
- Mensagens de texto
- Envio de mídia (imagens, vídeos, documentos, áudio)
- Mensagens para contatos individuais
- Mensagens para grupos
- Agendamento de mensagens
- Templates de mensagens

#### Recebimento de Mensagens
- Recepção em tempo real
- Processamento de diferentes tipos de mídia
- Notificações de entrega e leitura
- Histórico completo de conversas

### 3. Gerenciamento de Contatos e Grupos

- **Lista de Contatos**: Sincronização automática
- **Informações de Contato**: Nome, foto, status
- **Gerenciamento de Grupos**: Criação, administração, convites
- **Bloqueio/Desbloqueio**: Controle de contatos

### 4. Sistema de Automação

#### Triggers Disponíveis
- Mensagem recebida
- Palavra-chave detectada
- Novo contato adicionado
- Entrada em grupo
- Agendamento por tempo

#### Ações Automatizadas
- Resposta automática
- Encaminhamento para departamentos
- Criação de tickets no Helpdesk
- Criação de tarefas
- Notificações por email
- Integração com CRM

### 5. Integração com Módulos Existentes

#### Helpdesk
- Criação automática de tickets a partir de mensagens
- Resposta a tickets via WhatsApp
- Notificações de status de tickets
- Escalação automática

#### Tasks
- Criação de tarefas via WhatsApp
- Notificações de vencimento
- Atualizações de status
- Lembretes automáticos

#### CRM (Clientes)
- Sincronização de contatos
- Histórico de comunicação
- Segmentação de clientes
- Campanhas direcionadas

## 🔐 Sistema de Permissões

Seguindo o padrão estabelecido no projeto:

```typescript
// Permissões do módulo WhatsApp
export const WHATSAPP_PERMISSIONS = {
  // Conexão
  WHATSAPP_CONNECTION_VIEW: 'whatsapp:connection:view',
  WHATSAPP_CONNECTION_MANAGE: 'whatsapp:connection:manage',
  WHATSAPP_CONNECTION_CREATE: 'whatsapp:connection:create',
  WHATSAPP_CONNECTION_DELETE: 'whatsapp:connection:delete',
  
  // Mensagens
  WHATSAPP_MESSAGE_VIEW: 'whatsapp:message:view',
  WHATSAPP_MESSAGE_SEND: 'whatsapp:message:send',
  WHATSAPP_MESSAGE_DELETE: 'whatsapp:message:delete',
  WHATSAPP_MESSAGE_EXPORT: 'whatsapp:message:export',
  
  // Contatos
  WHATSAPP_CONTACT_VIEW: 'whatsapp:contact:view',
  WHATSAPP_CONTACT_MANAGE: 'whatsapp:contact:manage',
  WHATSAPP_CONTACT_BLOCK: 'whatsapp:contact:block',
  
  // Grupos
  WHATSAPP_GROUP_VIEW: 'whatsapp:group:view',
  WHATSAPP_GROUP_MANAGE: 'whatsapp:group:manage',
  WHATSAPP_GROUP_CREATE: 'whatsapp:group:create',
  WHATSAPP_GROUP_ADMIN: 'whatsapp:group:admin',
  
  // Automação
  WHATSAPP_AUTOMATION_VIEW: 'whatsapp:automation:view',
  WHATSAPP_AUTOMATION_CREATE: 'whatsapp:automation:create',
  WHATSAPP_AUTOMATION_EDIT: 'whatsapp:automation:edit',
  WHATSAPP_AUTOMATION_DELETE: 'whatsapp:automation:delete',
  
  // Relatórios
  WHATSAPP_REPORTS_VIEW: 'whatsapp:reports:view',
  WHATSAPP_REPORTS_EXPORT: 'whatsapp:reports:export',
} as const;
```

## 📋 Plano de Implementação

### Fase 1: Infraestrutura Base (Semana 1-2)

1. **Setup do Worker WhatsApp**
   - Configuração do PM2
   - Script de inicialização
   - Integração com banco de dados

2. **Modelos de Dados**
   - Criação dos modelos Prisma
   - Migração do banco de dados
   - Seed de dados iniciais

3. **Cliente WhatsApp Base**
   - Implementação do cliente whatsmeow
   - Sistema de autenticação
   - Gerenciamento de sessões

### Fase 2: Funcionalidades Core (Semana 3-4)

1. **Sistema de Mensageria**
   - Envio e recebimento de mensagens
   - Suporte a diferentes tipos de mídia
   - Interface de chat básica

2. **Gerenciamento de Contatos**
   - Sincronização de contatos
   - Interface de gerenciamento
   - Sistema de bloqueio

3. **APIs REST**
   - Endpoints para envio de mensagens
   - APIs de status e controle
   - Webhooks para eventos

### Fase 3: Automação e Integração (Semana 5-6)

1. **Sistema de Automação**
   - Engine de regras
   - Interface de configuração
   - Triggers e ações

2. **Integração com Helpdesk**
   - Criação automática de tickets
   - Notificações bidirecionais
   - Interface unificada

3. **Integração com Tasks**
   - Criação de tarefas via WhatsApp
   - Notificações de vencimento
   - Atualizações de status

### Fase 4: Interface e Relatórios (Semana 7-8)

1. **Interface Completa**
   - Dashboard principal
   - Chat interface avançada
   - Configurações e preferências

2. **Sistema de Relatórios**
   - Métricas de mensagens
   - Relatórios de automação
   - Analytics de uso

3. **Testes e Otimização**
   - Testes de integração
   - Otimização de performance
   - Documentação final

## 🛠️ Tecnologias e Dependências

### Dependências Go (para o worker)
```go
// go.mod
module whatsapp-worker

go 1.21

require (
    go.mau.fi/whatsmeow v0.0.0-20240811141640-b804d10c54c2
    go.mau.fi/libsignal v0.1.0
    google.golang.org/protobuf v1.31.0
    github.com/lib/pq v1.10.9
    github.com/gorilla/websocket v1.5.0
)
```

### Dependências Node.js
```json
{
  "dependencies": {
    "@types/node": "^20.0.0",
    "ws": "^8.14.0",
    "sharp": "^0.32.0",
    "mime-types": "^2.1.35"
  },
  "devDependencies": {
    "@types/ws": "^8.5.0",
    "@types/mime-types": "^2.1.1"
  }
}
```

## 🔧 Configuração e Deploy

### Variáveis de Ambiente
```bash
# WhatsApp Configuration
WHATSAPP_SESSION_PATH=/app/data/whatsapp-sessions
WHATSAPP_MEDIA_PATH=/app/data/whatsapp-media
WHATSAPP_WEBHOOK_URL=http://localhost:3000/api/whatsapp/webhook
WHATSAPP_MAX_CONNECTIONS=5

# Go Worker Configuration
GO_WORKER_PORT=8080
GO_WORKER_HOST=localhost
DATABASE_URL=postgresql://user:password@localhost:5432/garapasystem
```

### Scripts de Deploy
```bash
#!/bin/bash
# deploy-whatsapp.sh

echo "Deploying WhatsApp Module..."

# Build Go worker
cd /app/whatsapp-worker
go build -o whatsapp-worker main.go

# Install Node.js dependencies
cd /app
npm install

# Run database migrations
npx prisma migrate deploy

# Restart PM2 processes
pm2 restart ecosystem.config.js --only whatsapp-worker
pm2 restart ecosystem.config.js --only garapasystem-server

echo "WhatsApp Module deployed successfully!"
```

## 📈 Benefícios e ROI

### Benefícios Operacionais
- **Comunicação Unificada**: Centralização de todas as comunicações
- **Automação Inteligente**: Redução de trabalho manual repetitivo
- **Resposta Rápida**: Atendimento 24/7 automatizado
- **Integração Completa**: Sincronização com todos os módulos

### Métricas de Sucesso
- Redução de 60% no tempo de resposta inicial
- Aumento de 40% na satisfação do cliente
- Automação de 70% das consultas básicas
- Integração de 100% dos processos de comunicação

### ROI Estimado
- **Economia de Tempo**: 20 horas/semana de trabalho manual
- **Melhoria na Conversão**: 25% de aumento em vendas
- **Redução de Custos**: 30% menos gastos com atendimento
- **Payback**: 3-4 meses após implementação

## 📚 Documentação Adicional

### Links Úteis
- [Documentação whatsmeow](https://pkg.go.dev/go.mau.fi/whatsmeow)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PM2 Documentation](https://pm2.keymetrics.io/docs)

### Arquivos de Configuração
- `ecosystem.config.js` - Configuração PM2
- `prisma/schema.prisma` - Esquema do banco de dados
- `src/lib/whatsapp/` - Biblioteca principal
- `docs/whatsapp-api.md` - Documentação da API

---

**Documento criado em**: Janeiro 2025  
**Versão**: 1.0  
**Autor**: GarapaSystem Development Team  
**Status**: Aprovado para implementação
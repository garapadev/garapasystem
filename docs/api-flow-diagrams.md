# Diagramas de Fluxo - API GarapaSystem

## Índice

1. [Fluxo de Autenticação](#fluxo-de-autenticação)
2. [Fluxo de Autorização](#fluxo-de-autorização)
3. [Fluxo de Rate Limiting](#fluxo-de-rate-limiting)
4. [Fluxo de Criação de Recursos](#fluxo-de-criação-de-recursos)
5. [Fluxo de Webhooks](#fluxo-de-webhooks)
6. [Fluxo de Tratamento de Erros](#fluxo-de-tratamento-de-erros)

---

## Fluxo de Autenticação

### Autenticação por Sessão (NextAuth)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as API Gateway
    participant Auth as NextAuth
    participant DB as Database
    
    C->>API: POST /api/auth/signin
    API->>Auth: Validar credenciais
    Auth->>DB: Buscar usuário
    DB-->>Auth: Dados do usuário
    
    alt Credenciais válidas
        Auth->>Auth: Gerar JWT Token
        Auth-->>API: Token + Dados do usuário
        API-->>C: 200 OK + Session Cookie
    else Credenciais inválidas
        Auth-->>API: Erro de autenticação
        API-->>C: 401 Unauthorized
    end
```

### Autenticação por API Key

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as API Gateway
    participant Middleware as Auth Middleware
    participant DB as Database
    
    C->>API: Request com Authorization Header
    API->>Middleware: Validar API Key
    Middleware->>Middleware: Hash da chave (SHA-256)
    Middleware->>DB: Buscar chave no banco
    DB-->>Middleware: Dados da API Key
    
    alt API Key válida e ativa
        Middleware->>Middleware: Verificar expiração
        Middleware-->>API: Autorização concedida
        API-->>C: Processar requisição
    else API Key inválida
        Middleware-->>API: Erro de autorização
        API-->>C: 401 Unauthorized
    end
```

---

## Fluxo de Autorização

### Verificação de Permissões

```mermaid
flowchart TD
    A[Requisição Recebida] --> B{Autenticado?}
    B -->|Não| C[401 Unauthorized]
    B -->|Sim| D{Tipo de Auth}
    
    D -->|Sessão| E[Verificar Permissões do Usuário]
    D -->|API Key| F[Verificar Permissões da Chave]
    
    E --> G{Tem Permissão?}
    F --> G
    
    G -->|Não| H[403 Forbidden]
    G -->|Sim| I[Processar Requisição]
    
    I --> J[200 OK + Dados]
```

### Matriz de Permissões

```mermaid
graph LR
    Admin[admin] --> All[Todas as Permissões]
    
    Users[usuarios.*] --> UR[usuarios.read]
    Users --> UW[usuarios.write]
    Users --> UD[usuarios.delete]
    
    Clients[clientes.*] --> CR[clientes.read]
    Clients --> CW[clientes.write]
    Clients --> CD[clientes.delete]
    
    Tasks[tasks.*] --> TR[tasks.read]
    Tasks --> TW[tasks.write]
    Tasks --> TD[tasks.delete]
    
    Emails[emails.*] --> ER[emails.read]
    Emails --> EW[emails.write]
    Emails --> ES[emails.sync]
```

---

## Fluxo de Rate Limiting

### Controle de Requisições

```mermaid
sequenceDiagram
    participant C as Cliente
    participant RL as Rate Limiter
    participant DB as Database
    participant API as API Endpoint
    
    C->>RL: Requisição
    RL->>RL: Gerar chave (IP/API Key)
    RL->>DB: Buscar registro de rate limit
    
    alt Primeiro acesso na janela
        DB-->>RL: Nenhum registro
        RL->>DB: Criar novo registro (hits: 1)
        RL->>API: Permitir requisição
        API-->>C: Resposta + Headers de Rate Limit
    else Dentro do limite
        DB-->>RL: Registro existente
        RL->>DB: Incrementar hits
        RL->>API: Permitir requisição
        API-->>C: Resposta + Headers de Rate Limit
    else Limite excedido
        DB-->>RL: Hits >= Limite
        RL-->>C: 429 Too Many Requests
    end
```

### Janela Deslizante

```mermaid
gantt
    title Rate Limiting - Janela de 60 segundos
    dateFormat X
    axisFormat %S
    
    section Requisições
    Janela 1 (100 req) :0, 60
    Janela 2 (100 req) :60, 120
    Janela 3 (100 req) :120, 180
    
    section Reset
    Reset 1 :milestone, 60, 0
    Reset 2 :milestone, 120, 0
    Reset 3 :milestone, 180, 0
```

---

## Fluxo de Criação de Recursos

### Exemplo: Criar Cliente

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as API Gateway
    participant Val as Validator
    participant DB as Database
    participant WH as Webhook Service
    
    C->>API: POST /api/clientes
    API->>Val: Validar dados
    
    alt Dados inválidos
        Val-->>API: Erro de validação
        API-->>C: 400 Bad Request
    else Dados válidos
        Val->>DB: Verificar email duplicado
        
        alt Email já existe
            DB-->>API: Conflito
            API-->>C: 409 Conflict
        else Email único
            DB->>DB: Criar cliente
            DB->>DB: Criar endereços
            DB-->>API: Cliente criado
            API->>WH: Disparar webhook (cliente.criado)
            API-->>C: 201 Created + Dados do cliente
        end
    end
```

### Validação de Dados

```mermaid
flowchart TD
    A[Dados Recebidos] --> B[Validação de Schema]
    B --> C{Schema Válido?}
    C -->|Não| D[400 Bad Request]
    C -->|Sim| E[Validação de Negócio]
    
    E --> F{Email Único?}
    F -->|Não| G[409 Conflict]
    F -->|Sim| H{Documento Válido?}
    H -->|Não| I[422 Unprocessable Entity]
    H -->|Sim| J[Criar Recurso]
    
    J --> K[201 Created]
```

---

## Fluxo de Webhooks

### Configuração e Disparo

```mermaid
sequenceDiagram
    participant API as API System
    participant WH as Webhook Service
    participant Queue as Message Queue
    participant Target as Target System
    
    Note over API: Evento ocorre (ex: cliente criado)
    API->>WH: Disparar webhook
    WH->>WH: Buscar webhooks ativos para evento
    
    loop Para cada webhook
        WH->>Queue: Adicionar à fila
        Queue->>Queue: Processar com retry
        Queue->>Target: POST webhook payload
        
        alt Sucesso (2xx)
            Target-->>Queue: 200 OK
            Queue->>WH: Marcar como entregue
        else Falha
            Target-->>Queue: Erro (4xx/5xx)
            Queue->>Queue: Agendar retry (backoff exponencial)
        end
    end
```

### Estrutura do Payload

```mermaid
classDiagram
    class WebhookPayload {
        +string id
        +string event
        +datetime timestamp
        +object data
        +object metadata
        +string signature
    }
    
    class EventData {
        +string resourceType
        +string resourceId
        +object before
        +object after
        +string action
    }
    
    class Metadata {
        +string apiVersion
        +string source
        +string userId
        +string apiKeyId
    }
    
    WebhookPayload --> EventData
    WebhookPayload --> Metadata
```

---

## Fluxo de Tratamento de Erros

### Hierarquia de Erros

```mermaid
flowchart TD
    A[Requisição] --> B{Autenticado?}
    B -->|Não| C[401 Unauthorized]
    B -->|Sim| D{Autorizado?}
    D -->|Não| E[403 Forbidden]
    D -->|Sim| F{Rate Limit OK?}
    F -->|Não| G[429 Too Many Requests]
    F -->|Sim| H{Dados Válidos?}
    H -->|Não| I[400 Bad Request]
    H -->|Sim| J{Recurso Existe?}
    J -->|Não| K[404 Not Found]
    J -->|Sim| L{Conflito?}
    L -->|Sim| M[409 Conflict]
    L -->|Não| N{Processável?}
    N -->|Não| O[422 Unprocessable Entity]
    N -->|Sim| P[Processar]
    P --> Q{Erro Interno?}
    Q -->|Sim| R[500 Internal Server Error]
    Q -->|Não| S[200 OK]
```

### Estrutura de Resposta de Erro

```mermaid
classDiagram
    class ErrorResponse {
        +string error
        +string message
        +object details
        +datetime timestamp
        +string path
        +number status
    }
    
    class ErrorDetails {
        +array fieldErrors
        +string code
        +object context
    }
    
    class FieldError {
        +string field
        +array messages
        +any rejectedValue
    }
    
    ErrorResponse --> ErrorDetails
    ErrorDetails --> FieldError
```

---

## Fluxo de Sincronização de E-mails

### Processo de Sincronização

```mermaid
sequenceDiagram
    participant Scheduler as Scheduler
    participant EmailSync as Email Sync Service
    participant IMAP as IMAP Server
    participant DB as Database
    participant WS as WebSocket
    
    Scheduler->>EmailSync: Iniciar sincronização
    EmailSync->>IMAP: Conectar
    EmailSync->>IMAP: Buscar novos e-mails
    IMAP-->>EmailSync: Lista de e-mails
    
    loop Para cada e-mail
        EmailSync->>DB: Verificar se já existe
        alt E-mail novo
            EmailSync->>DB: Salvar e-mail
            EmailSync->>WS: Notificar cliente (novo e-mail)
        else E-mail existente
            EmailSync->>EmailSync: Verificar mudanças
            alt Houve mudanças
                EmailSync->>DB: Atualizar e-mail
                EmailSync->>WS: Notificar cliente (e-mail atualizado)
            end
        end
    end
    
    EmailSync->>IMAP: Desconectar
    EmailSync-->>Scheduler: Sincronização concluída
```

---

## Fluxo de Integração WhatsApp

### Conexão e Envio de Mensagens

```mermaid
sequenceDiagram
    participant Client as Cliente
    participant API as API Gateway
    participant WA as WhatsApp Service
    participant Provider as WhatsApp Provider
    
    Client->>API: POST /api/whatsapp/connect
    API->>WA: Iniciar conexão
    WA->>Provider: Solicitar QR Code
    Provider-->>WA: QR Code
    WA-->>API: QR Code
    API-->>Client: QR Code para scan
    
    Note over Client: Usuário escaneia QR Code
    
    Provider->>WA: Conexão estabelecida
    WA->>API: Status: conectado
    
    Client->>API: POST /api/whatsapp/send
    API->>WA: Enviar mensagem
    WA->>Provider: Enviar via WhatsApp
    Provider-->>WA: Confirmação de envio
    WA-->>API: Status de entrega
    API-->>Client: Confirmação
```

---

*Diagramas atualizados em: Janeiro 2024*
*Versão da API: 0.2.37.13*
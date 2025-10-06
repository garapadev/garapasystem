# Módulo E-mails - API GarapaSystem

## Visão Geral

O módulo de E-mails do GarapaSystem é um sistema completo de gerenciamento de e-mails que permite aos colaboradores configurar contas de e-mail, sincronizar mensagens via IMAP, enviar e-mails via SMTP, e gerenciar pastas e anexos. O sistema oferece funcionalidades avançadas como sincronização automática, suporte a rascunhos, e notificações.

## Características Principais

- **Configuração de E-mail**: Configuração de contas IMAP/SMTP por colaborador
- **Sincronização IMAP**: Sincronização automática e manual de e-mails
- **Envio SMTP**: Envio de e-mails com suporte a anexos e rascunhos
- **Gerenciamento de Pastas**: Organização automática em pastas (INBOX, Sent, Drafts, etc.)
- **Anexos**: Upload e gerenciamento de anexos
- **Criptografia**: Senhas criptografadas para segurança
- **Notificações**: Sistema de notificações para eventos de e-mail
- **Histórico**: Rastreamento de ações realizadas
- **Interface Pública**: Visualização de e-mails sem autenticação (quando permitido)

## Relacionamentos

### Principais Entidades
- **EmailConfig**: Configuração de e-mail do colaborador
- **Email**: Mensagens de e-mail sincronizadas
- **EmailFolder**: Pastas de organização de e-mails
- **EmailAttachment**: Anexos dos e-mails
- **Colaborador**: Proprietário da configuração de e-mail
- **Usuario**: Usuário autenticado no sistema

### Estrutura de Relacionamentos
```
Colaborador (1) ←→ (1) EmailConfig
EmailConfig (1) ←→ (N) EmailFolder
EmailConfig (1) ←→ (N) Email
EmailFolder (1) ←→ (N) Email
Email (1) ←→ (N) EmailAttachment
```

## Endpoints da API

### 1. Listar E-mails
**GET** `/api/emails`

Lista e-mails do colaborador com filtros e paginação.

#### Parâmetros de Query
- `folder` (string, opcional): Nome da pasta (padrão: 'INBOX')
- `limit` (number, opcional): Limite de resultados (padrão: 50)
- `offset` (number, opcional): Offset para paginação (padrão: 0)
- `search` (string, opcional): Termo de busca (assunto, remetente, conteúdo)

#### Exemplo de Requisição
```javascript
const response = await fetch('/api/emails?folder=INBOX&limit=20&offset=0&search=importante', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

#### Exemplo de Resposta
```json
{
  "emails": [
    {
      "id": "email_123",
      "messageId": "<message@example.com>",
      "subject": "Assunto do E-mail",
      "from": [
        {
          "address": "sender@example.com",
          "name": "Remetente"
        }
      ],
      "to": [
        {
          "address": "recipient@example.com",
          "name": "Destinatário"
        }
      ],
      "date": "2024-01-15T10:30:00Z",
      "isRead": false,
      "isFlagged": false,
      "hasAttachments": true,
      "preview": "Prévia do conteúdo do e-mail...",
      "size": 2048
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### 2. Buscar E-mail por ID
**GET** `/api/emails/[id]`

Busca um e-mail específico com conteúdo completo.

#### Exemplo de Resposta
```json
{
  "id": "email_123",
  "messageId": "<message@example.com>",
  "subject": "Assunto do E-mail",
  "from": [
    {
      "address": "sender@example.com",
      "name": "Remetente"
    }
  ],
  "to": [
    {
      "address": "recipient@example.com",
      "name": "Destinatário"
    }
  ],
  "cc": [],
  "bcc": [],
  "date": "2024-01-15T10:30:00Z",
  "body": "Conteúdo completo do e-mail",
  "bodyType": "html",
  "textContent": "Versão em texto do e-mail",
  "preview": "Prévia do conteúdo...",
  "isRead": true,
  "attachments": [
    {
      "id": "att_123",
      "filename": "documento.pdf",
      "contentType": "application/pdf",
      "size": 1024000,
      "path": "/uploads/email-attachments/documento.pdf"
    }
  ],
  "folder": {
    "id": "folder_123",
    "name": "INBOX",
    "path": "INBOX"
  }
}
```

### 3. Atualizar E-mail
**PUT** `/api/emails/[id]`

Atualiza propriedades de um e-mail (pasta, status de leitura, sinalização).

#### Corpo da Requisição
```json
{
  "folderId": "folder_456",
  "isRead": true,
  "isFlagged": false
}
```

### 4. Excluir E-mail
**DELETE** `/api/emails/[id]`

Move o e-mail para a lixeira ou exclui permanentemente.

#### Exemplo de Resposta
```json
{
  "success": true
}
```

### 5. Enviar E-mail
**POST** `/api/emails/send`

Envia um novo e-mail com suporte a anexos e rascunhos.

#### Corpo da Requisição (FormData)
```javascript
const formData = new FormData();
formData.append('to', 'destinatario@example.com');
formData.append('cc', 'copia@example.com');
formData.append('subject', 'Assunto do E-mail');
formData.append('body', 'Conteúdo do e-mail');
formData.append('isHtml', 'true');
formData.append('isDraft', 'false');
formData.append('attachments', file1);
formData.append('attachments', file2);
```

#### Exemplo de Resposta
```json
{
  "success": true,
  "message": "Email enviado com sucesso",
  "messageId": "<generated@example.com>",
  "emailId": "email_456"
}
```

### 6. Configuração de E-mail
**GET/POST/DELETE** `/api/email-config`

#### GET - Buscar Configuração
```json
{
  "success": true,
  "data": {
    "id": "config_123",
    "imapHost": "imap.gmail.com",
    "imapPort": 993,
    "imapSecure": true,
    "smtpHost": "smtp.gmail.com",
    "smtpPort": 587,
    "smtpSecure": false,
    "email": "usuario@gmail.com",
    "syncEnabled": true,
    "syncInterval": 180,
    "lastSync": "2024-01-15T10:30:00Z",
    "ativo": true
  }
}
```

#### POST - Criar/Atualizar Configuração
```json
{
  "imapHost": "imap.gmail.com",
  "imapPort": 993,
  "imapSecure": true,
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpSecure": false,
  "email": "usuario@gmail.com",
  "password": "senha_do_email",
  "syncEnabled": true,
  "syncInterval": 180
}
```

### 7. Pastas de E-mail
**GET** `/api/email-folders`

Lista todas as pastas de e-mail do colaborador.

#### Exemplo de Resposta
```json
{
  "folders": [
    {
      "id": "folder_123",
      "name": "INBOX",
      "path": "INBOX",
      "specialUse": "\\Inbox",
      "unreadCount": 5,
      "totalCount": 150
    },
    {
      "id": "folder_124",
      "name": "Sent",
      "path": "INBOX.Sent",
      "specialUse": "\\Sent",
      "unreadCount": 0,
      "totalCount": 75
    }
  ]
}
```

### 8. Sincronização de E-mails
**POST** `/api/email-sync`

Inicia sincronização manual de e-mails via IMAP.

#### Exemplo de Resposta
```json
{
  "success": true,
  "message": "Sincronização iniciada com sucesso",
  "lastSync": "2024-01-15T10:30:00Z"
}
```

## Códigos de Status HTTP

- **200 OK**: Operação realizada com sucesso
- **201 Created**: E-mail enviado ou configuração criada
- **400 Bad Request**: Dados inválidos ou configuração incorreta
- **401 Unauthorized**: Token de autenticação inválido
- **404 Not Found**: E-mail, configuração ou pasta não encontrada
- **500 Internal Server Error**: Erro interno do servidor

## Validações e Regras de Negócio

### Configuração de E-mail
- Host IMAP e SMTP são obrigatórios
- Portas devem estar entre 1 e 65535
- E-mail deve ter formato válido
- Senha é obrigatória e criptografada
- Intervalo de sincronização entre 60 e 3600 segundos

### Envio de E-mails
- Destinatário é obrigatório
- Assunto é obrigatório
- Corpo do e-mail é obrigatório
- Anexos têm limite de tamanho
- Verificação de conexão SMTP antes do envio

### Sincronização
- Configuração deve estar ativa
- Conexão IMAP deve ser válida
- Pastas são criadas automaticamente se não existirem
- E-mails duplicados são evitados via messageId

## Segurança

### Controle de Acesso
- Autenticação obrigatória via JWT
- Cada colaborador acessa apenas seus e-mails
- Senhas de e-mail criptografadas

### Validação de Dados
- Validação de esquemas com Zod
- Sanitização de conteúdo HTML
- Verificação de tipos de arquivo para anexos

### Criptografia
- Senhas de e-mail criptografadas com AES
- Conexões IMAP/SMTP seguras (TLS/SSL)
- Tokens de autenticação seguros

## Performance e Otimização

### Índices de Banco de Dados
```sql
-- Índices recomendados
CREATE INDEX idx_email_config_colaborador ON EmailConfig(colaboradorId);
CREATE INDEX idx_email_folder_config ON EmailFolder(emailConfigId);
CREATE INDEX idx_email_folder_message ON Email(folderId);
CREATE INDEX idx_email_message_id ON Email(messageId);
CREATE INDEX idx_email_date ON Email(date);
CREATE INDEX idx_email_read ON Email(isRead);
```

### Paginação
- Limite padrão de 50 e-mails por página
- Offset para navegação entre páginas
- Contagem total para interface

### Includes Otimizados
- Carregamento seletivo de relacionamentos
- Exclusão de campos sensíveis (senhas)
- Pré-carregamento de anexos quando necessário

## Integração com Outros Módulos

### Colaboradores
- Configuração de e-mail vinculada ao colaborador
- Permissões baseadas no colaborador

### Notificações
- Notificações de novos e-mails
- Alertas de falhas de sincronização
- Confirmações de envio

### Arquivos
- Gerenciamento de anexos
- Upload e download de arquivos
- Controle de tipos e tamanhos

## Exemplos de Uso

### Configurar E-mail
```javascript
// Configurar conta de e-mail
const configResponse = await fetch('/api/email-config', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token'
  },
  body: JSON.stringify({
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapSecure: true,
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    email: 'usuario@gmail.com',
    password: 'senha_do_app',
    syncEnabled: true,
    syncInterval: 300
  })
});
```

### Enviar E-mail com Anexo
```javascript
// Enviar e-mail com anexo
const formData = new FormData();
formData.append('to', 'cliente@example.com');
formData.append('subject', 'Orçamento Solicitado');
formData.append('body', '<h1>Segue orçamento em anexo</h1>');
formData.append('isHtml', 'true');
formData.append('isDraft', 'false');
formData.append('attachments', pdfFile);

const sendResponse = await fetch('/api/emails/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token'
  },
  body: formData
});
```

### Sincronizar E-mails
```javascript
// Sincronizar e-mails manualmente
const syncResponse = await fetch('/api/email-sync', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

### Listar E-mails com Filtro
```javascript
// Listar e-mails não lidos
const emailsResponse = await fetch('/api/emails?folder=INBOX&search=urgente&limit=10', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer token'
  }
});
```

## Webhooks e Eventos

### Eventos Disponíveis
- `email.received`: Novo e-mail recebido
- `email.sent`: E-mail enviado com sucesso
- `email.failed`: Falha no envio de e-mail
- `email.sync.completed`: Sincronização concluída
- `email.sync.failed`: Falha na sincronização

### Payload do Webhook
```json
{
  "event": "email.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "emailId": "email_123",
    "subject": "Novo E-mail",
    "from": "sender@example.com",
    "folder": "INBOX",
    "colaboradorId": "colab_123"
  }
}
```

## Troubleshooting

### Problemas Comuns

#### Falha na Conexão IMAP/SMTP
```javascript
// Verificar configurações
const testConnection = async () => {
  try {
    const response = await fetch('/api/email-config/test', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer token' }
    });
    const result = await response.json();
    console.log('Teste de conexão:', result);
  } catch (error) {
    console.error('Erro na conexão:', error);
  }
};
```

#### E-mails Não Sincronizando
1. Verificar se a configuração está ativa
2. Validar credenciais IMAP
3. Verificar conectividade de rede
4. Revisar logs de sincronização

#### Falha no Envio de E-mails
1. Verificar configurações SMTP
2. Validar autenticação
3. Verificar limites de anexos
4. Revisar configurações de firewall

### Debugging
```javascript
// Habilitar logs detalhados
process.env.EMAIL_DEBUG = 'true';

// Verificar status da sincronização
const checkSyncStatus = async () => {
  const response = await fetch('/api/email-config');
  const config = await response.json();
  console.log('Última sincronização:', config.data.lastSync);
};
```

## Relatórios e Métricas

### Métricas Disponíveis
- Total de e-mails por pasta
- E-mails não lidos por colaborador
- Taxa de sucesso de envios
- Frequência de sincronização
- Uso de armazenamento por anexos

### Exemplo de Relatório
```javascript
// Relatório de e-mails por período
const emailReport = await fetch('/api/reports/emails?startDate=2024-01-01&endDate=2024-01-31', {
  headers: { 'Authorization': 'Bearer token' }
});
```

## Changelog

### Versão 2.1.0
- Adicionado suporte a rascunhos
- Melhorias na sincronização IMAP
- Otimização de performance para anexos grandes

### Versão 2.0.0
- Reescrita completa do sistema de e-mails
- Suporte a múltiplas contas por colaborador
- Sistema de notificações em tempo real

### Versão 1.5.0
- Adicionado suporte a anexos
- Implementação de pastas personalizadas
- Melhorias na interface de usuário

## Suporte

Para suporte técnico ou dúvidas sobre a implementação:

- **Documentação**: `/docs/api-module-emails.md`
- **Logs**: Verificar logs do sistema em `/var/log/garapa-system/`
- **Monitoramento**: Dashboard de métricas disponível em `/admin/metrics`
- **Contato**: Equipe de desenvolvimento GarapaSystem

---

*Documentação gerada automaticamente - Última atualização: 2024-01-15*
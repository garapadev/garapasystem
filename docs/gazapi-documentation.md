# Documentação Completa da API GazAPI

## Visão Geral

A **GazAPI** é uma API robusta para integração de aplicações com WhatsApp, permitindo envio e recebimento de mensagens via WhatsApp Web. Esta documentação foi compilada a partir da análise completa da API oficial.

### Informações Básicas
- **Versão Atual**: 1.2.4 (02/09/2025)
- **Versionamento**: Semântico (X.Y.Z)
- **URL de Teste**: https://gazapi.com.br
- **Base**: WhatsApp Web (sujeita às limitações da plataforma)
- **Delay**: 5 segundos fixos entre envios de mensagens

## Sistema de Autenticação

### Parâmetros Obrigatórios
Todos os endpoints requerem três parâmetros principais:

1. **Session**: Nome para identificar qual WhatsApp está conectando
   - Formato: minúsculo, sem espaços/acentos
   - Exemplo: `"minha_sessao"`

2. **SessionKey**: Chave da sessão (pode ser igual ao Session)
   - Formato: minúsculo, sem espaços/acentos
   - Exemplo: `"minha_sessao"`

3. **Token**: Código único fornecido após aquisição da API
   - Exemplo: `"abc123def456"`

### Headers Obrigatórios
```json
{
  "content-type": "application/json",
  "sessionkey": "sua_session_key"
}
```

### Códigos de Erro
- **400**: Parâmetro inválido
- **401**: Session/SessionKey incorreto
- **404**: Endpoint incorreto
- **500**: Erro do servidor

## Categorias de Endpoints

### 1. Sessões (11 endpoints)
Gerenciamento de sessões do WhatsApp conectadas à API.

#### Status Possíveis
- `CONNECTED`: Conectado e funcionando
- `inChat`: Em conversa ativa
- `DISCONNECTED`: Desconectado

#### Endpoints Principais
- `POST /start` - Iniciar nova sessão
- `GET /getQrCode` - Obter QR Code para autenticação
- `POST /getSessionStatus` - Verificar status da sessão
- `POST /restart` - Reiniciar sessão
- `POST /close` - Encerrar sessão

### 2. Mensagens (12 tipos)
Categoria principal para envio de conteúdo multimídia.

#### Tipos Suportados
- **Texto**: Mensagens simples com emojis
- **Imagem**: JPG, PNG com legenda opcional
- **Áudio**: MP3, OGG, WAV (Base64 ou URL)
- **Vídeo**: MP4 e outros (limite 16MB)
- **Arquivo**: PDF, DOC, XLS, etc.
- **Adesivo**: Stickers do WhatsApp
- **Contato**: Compartilhamento de contatos
- **Localização**: Coordenadas GPS
- **Botões**: Funcionalidade instável
- **Listas**: Funcionalidade instável

#### Endpoints Principais
- `POST /sendText` - Enviar texto
- `POST /sendImage` - Enviar imagem
- `POST /sendAudio` - Enviar áudio
- `POST /sendVideo` - Enviar vídeo
- `POST /sendFile` - Enviar arquivo
- `POST /sendSticker` - Enviar adesivo
- `POST /sendContact` - Enviar contato
- `POST /sendLocation` - Enviar localização

### 3. Grupos (18 endpoints)
Gerenciamento completo de grupos do WhatsApp.

#### Funcionalidades
- Criar grupos
- Alterar nome/imagem/descrição
- Gerenciar membros (adicionar/remover)
- Controle de administradores
- Geração de links de convite
- Listas de transmissão

#### Formato de Número para Grupos
`admin_number-group_id`
Exemplo: `5511999999999-120363123456789012@g.us`

#### Endpoints Principais
- `POST /getAllGroups` - Listar todos os grupos
- `POST /createGroup` - Criar novo grupo
- `POST /changeGroupName` - Alterar nome do grupo
- `POST /changeGroupImage` - Alterar imagem do grupo
- `POST /addParticipant` - Adicionar participante
- `POST /removeParticipant` - Remover participante
- `POST /promoteParticipant` - Promover a admin
- `POST /demoteParticipant` - Remover admin

### 4. Status (3 tipos)
Publicação de status temporários (24 horas).

#### Tipos Suportados
- **Texto**: Status colorido
- **Imagem**: Imagens com texto
- **Vídeo**: Vídeos curtos

#### Endpoints
- `POST /sendText` (para status)
- `POST /sendImage` (para status)
- `POST /sendVideo` (para status)

### 5. Conversas (7 endpoints)
Gerenciamento de conversas ativas.

#### Funcionalidades
- Obter conversas
- Arquivar/desarquivar
- Marcar como lida/não lida
- Pin/unpin conversas
- Controle de notificações

#### Endpoints Principais
- `POST /getChat` - Obter conversa específica
- `POST /getAllChats` - Obter todas as conversas
- `POST /archiveChat` - Arquivar conversa
- `POST /unarchiveChat` - Desarquivar conversa
- `POST /markChatRead` - Marcar como lida
- `POST /markChatUnread` - Marcar como não lida

### 6. Contatos (6 endpoints)
Gerenciamento da lista de contatos.

#### Funcionalidades
- Obter contato específico
- Listar todos os contatos
- Verificar se número é válido
- Bloquear/desbloquear contatos
- Obter foto de perfil

#### Endpoints Principais
- `POST /getContact` - Obter contato específico
- `POST /getAllContacts` - Obter todos os contatos
- `POST /checkNumberStatus` - Verificar se é WhatsApp
- `POST /blockContact` - Bloquear contato
- `POST /unblockContact` - Desbloquear contato
- `POST /getProfilePicture` - Obter foto de perfil

### 7. Dispositivo (4 endpoints)
Monitoramento do dispositivo conectado.

#### Funcionalidades
- Nível de bateria
- Status de conexão
- Informações do dispositivo
- Informações do host/servidor

#### Endpoints
- `POST /getBatteryLevel` - Nível de bateria
- `POST /getConnectionState` - Status de conexão
- `POST /getDeviceInfo` - Informações do dispositivo
- `POST /getHostDevice` - Informações do host

## Sistema de Webhooks

### Tipos de Eventos (4)
1. **Mensagens Enviadas**: Confirmação de envio
2. **Mensagens Recebidas**: Novas mensagens
3. **Status da Conexão**: Mudanças de status
4. **Exibição do QR Code**: Quando QR é gerado

### Configuração
- URLs podem ser obtidas em https://webhook.site para testes
- Uso constante pode causar timeout na API
- Recomendado usar com moderação

### Endpoints
- `POST /getWebhooks` - Obter webhooks configurados
- `POST /setWebhooks` - Configurar webhooks

## Limitações Técnicas

### Restrições Gerais
- **Delay fixo**: 5 segundos entre envios de mensagens
- **Limite de vídeo**: 16MB máximo
- **URLs de arquivos**: Não podem conter caracteres especiais
- **Funcionalidades instáveis**: Botões e listas
- **Base WhatsApp Web**: Sujeita às limitações da plataforma
- **Webhooks**: Podem causar timeout se usados constantemente

### Formatos Suportados

#### Números de Telefone
- **Brasileiro**: `+5511999999999`
- **Internacional**: Formato padrão com código do país

#### Grupos
- **Formato**: `admin_number-group_id`
- **Exemplo**: `5511999999999-120363123456789012@g.us`

#### Arquivos
- **Base64**: Suportado para áudio e arquivos
- **Imagens**: JPG, PNG
- **Vídeos**: MP4 e outros formatos comuns
- **Documentos**: PDF, DOC, XLS, etc.
- **Áudio**: MP3, OGG, WAV

## Exemplos de Uso

### Iniciar Sessão
```json
POST /start
{
  "session": "minha_sessao",
  "sessionkey": "minha_sessao",
  "token": "abc123def456"
}
```

### Enviar Mensagem de Texto
```json
POST /sendText
{
  "session": "minha_sessao",
  "sessionkey": "minha_sessao", 
  "token": "abc123def456",
  "number": "5511999999999",
  "text": "Olá! Esta é uma mensagem de teste."
}
```

### Enviar Imagem
```json
POST /sendImage
{
  "session": "minha_sessao",
  "sessionkey": "minha_sessao",
  "token": "abc123def456", 
  "number": "5511999999999",
  "image": "https://exemplo.com/imagem.jpg",
  "caption": "Legenda da imagem"
}
```

### Verificar Status da Sessão
```json
POST /getSessionStatus
{
  "session": "minha_sessao",
  "sessionkey": "minha_sessao",
  "token": "abc123def456"
}
```

## Fluxo de Implementação Recomendado

1. **Inicialização**
   - Chamar `POST /start` para iniciar sessão
   - Obter QR Code com `GET /getQrCode`
   - Aguardar escaneamento do QR

2. **Monitoramento**
   - Verificar status com `POST /getSessionStatus`
   - Configurar webhooks se necessário

3. **Operações**
   - Enviar mensagens conforme necessário
   - Respeitar delay de 5 segundos entre envios
   - Gerenciar grupos e contatos conforme demanda

4. **Manutenção**
   - Monitorar conexão regularmente
   - Reiniciar sessão se necessário
   - Tratar erros adequadamente

## Considerações de Segurança

- Manter tokens seguros e não expostos
- Usar HTTPS para todas as comunicações
- Implementar rate limiting adequado
- Monitorar logs para detectar uso anômalo
- Validar todos os inputs antes do envio

## Changelog e Versionamento

A API utiliza versionamento semântico (X.Y.Z):
- **X**: Mudanças incompatíveis
- **Y**: Novas funcionalidades compatíveis
- **Z**: Correções de bugs

Versão atual: **1.2.4** (02/09/2025)

---

*Esta documentação foi compilada através da análise completa da API Uzapi oficial e serve como base para implementação de APIs compatíveis.*
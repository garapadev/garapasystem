# Documentação do GarapaSystem

Bem-vindo à documentação completa do GarapaSystem! Este diretório contém toda a documentação técnica, guias de implementação e referências da API.

## 📚 Índice da Documentação

### 🔌 API e Integração

#### [📖 Documentação Completa da API](./api-documentation.md)
Documentação abrangente da API incluindo autenticação, endpoints, permissões e exemplos.

#### [⚡ Referência Rápida da API](./api-quick-reference.md)
Guia de referência rápida com endpoints principais, códigos de status e exemplos básicos.

#### [💡 Exemplos Práticos da API](./api-examples.md)
Exemplos completos de uso da API, cenários reais e código de integração.

#### [🔧 Troubleshooting da API](./api-troubleshooting.md)
Guia de solução de problemas comuns, debugging e boas práticas.

#### [📊 Diagramas de Fluxo da API](./api-flow-diagrams.md)
Diagramas visuais dos fluxos de autenticação, autorização e processos da API.

### 📋 Documentação por Módulos

#### [👥 Módulo de Clientes](./api-module-clientes.md)
Documentação completa do módulo de clientes, incluindo gerenciamento de contatos, endereços e relacionamentos.

#### [📱 Módulo de WhatsApp](./api-module-whatsapp.md)
Documentação do módulo de integração WhatsApp, sessões, mensagens e configurações multi-API.

#### [⚙️ Módulo de Administração](./api-module-administracao.md)
Documentação do módulo administrativo, incluindo usuários, permissões, configurações e logs do sistema.

### 🔐 Autenticação e Segurança

#### [🔑 Guia de Implementação NextAuth](./nextauth-implementation-guide.md)
Guia detalhado de implementação e configuração do NextAuth.

#### [📧 Design de Permissões de Webmail](./webmail-permissions-design.md)
Documentação do sistema de permissões para o módulo de webmail.

### 🚀 Infraestrutura e Deploy

#### [⚙️ Troubleshooting PM2](./pm2-troubleshooting.md)
Guia de solução de problemas e configuração do PM2.

## 🎯 Guias por Público

### Para Desenvolvedores Frontend
1. [Referência Rápida da API](./api-quick-reference.md) - Para consultas rápidas
2. [Módulo de Clientes](./api-module-clientes.md) - Para interface de clientes
3. [Módulo de WhatsApp](./api-module-whatsapp.md) - Para integração WhatsApp
4. [Exemplos Práticos](./api-examples.md) - Para implementação
5. [Troubleshooting](./api-troubleshooting.md) - Para resolver problemas

### Para Desenvolvedores Backend
1. [Documentação Completa da API](./api-documentation.md) - Para entender a arquitetura
2. [Módulo de Administração](./api-module-administracao.md) - Para sistema de permissões
3. [Diagramas de Fluxo](./api-flow-diagrams.md) - Para visualizar processos
4. [Guia NextAuth](./nextauth-implementation-guide.md) - Para autenticação

### Para DevOps/SysAdmin
1. [Troubleshooting PM2](./pm2-troubleshooting.md) - Para gerenciar serviços
2. [Módulo de Administração](./api-module-administracao.md) - Para logs e monitoramento
3. [Documentação da API](./api-documentation.md) - Para configurar infraestrutura

### Para Integradores/Terceiros
1. [Referência Rápida](./api-quick-reference.md) - Para começar rapidamente
2. [Módulo de Clientes](./api-module-clientes.md) - Para integração de dados
3. [Módulo de WhatsApp](./api-module-whatsapp.md) - Para automação de mensagens
4. [Exemplos Práticos](./api-examples.md) - Para implementar integrações
5. [Troubleshooting](./api-troubleshooting.md) - Para resolver problemas

## 🔍 Busca Rápida

### Autenticação
- **API Keys**: [Documentação](./api-documentation.md#api-keys) | [Exemplos](./api-examples.md#gerenciamento-de-permissões)
- **JWT/Sessão**: [NextAuth Guide](./nextauth-implementation-guide.md) | [Fluxos](./api-flow-diagrams.md#autenticação)
- **Permissões**: [Sistema](./api-documentation.md#permissões) | [Webmail](./webmail-permissions-design.md)

### Endpoints Principais
- **Clientes**: [Docs](./api-documentation.md#clientes) | [Exemplos](./api-examples.md#passo-1-criar-cliente)
- **Tarefas**: [Docs](./api-documentation.md#tarefas) | [Exemplos](./api-examples.md#passo-4-criar-tarefas-relacionadas)
- **Ordens de Serviço**: [Docs](./api-documentation.md#ordens-de-serviço) | [Exemplos](./api-examples.md#passo-3-aprovar-orçamento-e-criar-ordem-de-serviço)
- **WhatsApp**: [Docs](./api-documentation.md#whatsapp) | [Exemplos](./api-examples.md#integração-com-whatsapp)
- **E-mails**: [Docs](./api-documentation.md#e-mails) | [Exemplos](./api-examples.md#sincronização-de-e-mails)

### Problemas Comuns
- **401 Unauthorized**: [Solução](./api-troubleshooting.md#erro-401-unauthorized)
- **403 Forbidden**: [Solução](./api-troubleshooting.md#erro-403-forbidden)
- **429 Rate Limit**: [Solução](./api-troubleshooting.md#erro-429-too-many-requests)
- **422 Validation**: [Solução](./api-troubleshooting.md#erro-422-unprocessable-entity)
- **Webhooks**: [Troubleshooting](./api-troubleshooting.md#problemas-com-webhooks)

## 📋 Informações do Sistema

- **Versão Atual**: 0.2.37.13
- **Tecnologias**: Next.js, Prisma, NextAuth, PM2
- **Base URL**: `https://seu-dominio.com/api`
- **Formato**: JSON
- **Autenticação**: Bearer Token (API Key ou JWT)

## 🚀 Início Rápido

### 1. Obter API Key
```bash
# Via interface web ou API
POST /api/api-keys
{
  "nome": "Minha Integração",
  "permissoes": ["clientes.read", "clientes.write"]
}
```

### 2. Primeira Requisição
```javascript
const response = await fetch('https://seu-dominio.com/api/clientes', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});
```

### 3. Verificar Resposta
```javascript
if (response.ok) {
  const clientes = await response.json();
  console.log('Clientes:', clientes);
} else {
  console.error('Erro:', response.status, response.statusText);
}
```

## 📞 Suporte

### Documentação
- 📖 [Documentação Completa](./api-documentation.md)
- ⚡ [Referência Rápida](./api-quick-reference.md)
- 🔧 [Troubleshooting](./api-troubleshooting.md)

### Ferramentas de Teste
- **Postman**: Importe a collection em `/docs/postman-collection.json`
- **cURL**: Exemplos em cada documento
- **Swagger/OpenAPI**: Disponível em `/api/docs` (se configurado)

### Logs e Monitoramento
```bash
# Logs da aplicação
pm2 logs garapasystem

# Status dos serviços
pm2 status

# Monitoramento
pm2 monit
```

## 🔄 Atualizações

Esta documentação é atualizada regularmente. Verifique:
- **Data da última atualização**: Janeiro 2024
- **Versão da API**: 0.2.37.13
- **Changelog**: Consulte os commits do repositório

## 📝 Contribuindo

Para contribuir com a documentação:
1. Identifique lacunas ou informações desatualizadas
2. Crie exemplos práticos e casos de uso
3. Documente novos endpoints ou funcionalidades
4. Mantenha a consistência de formatação
5. Teste todos os exemplos de código

## 🏷️ Tags e Categorias

### Por Funcionalidade
- `#autenticacao` - Tudo sobre autenticação e autorização
- `#api` - Endpoints e uso da API
- `#webhooks` - Configuração e uso de webhooks
- `#email` - Integração e sincronização de e-mails
- `#whatsapp` - Integração com WhatsApp
- `#pm2` - Gerenciamento de processos
- `#troubleshooting` - Solução de problemas

### Por Nível
- `#iniciante` - Para quem está começando
- `#intermediario` - Para desenvolvedores com experiência
- `#avancado` - Para casos complexos e otimizações

### Por Tipo
- `#guia` - Tutoriais passo a passo
- `#referencia` - Documentação de referência
- `#exemplo` - Exemplos práticos de código
- `#troubleshooting` - Solução de problemas

---

*Documentação mantida pela equipe de desenvolvimento do GarapaSystem*
*Última atualização: Janeiro 2024*
# GarapaSystem Docker v0.1.32 - Módulo Webmail

## 📋 Resumo da Versão

Esta versão 0.1.32 do GarapaSystem inclui o módulo de webmail totalmente integrado e funcional.

## 🚀 Características da Imagem Docker

### ✅ Funcionalidades Implementadas
- **Módulo Webmail**: Totalmente integrado com interface de composição, inbox e gerenciamento de emails
- **Multi-stage Build**: Otimização de tamanho e segurança
- **Usuário não-root**: Execução segura com usuário `nextjs`
- **Configurações de Ambiente**: Suporte a variáveis para webmail e segurança
- **Script de Inicialização**: Verificações automáticas e configuração flexível

### 🔧 Dependências Incluídas
- Node.js 18.20.8 (Alpine)
- Next.js com todas as dependências
- Prisma ORM
- Bibliotecas de segurança (openssl, ca-certificates)
- Configurações de timezone

### 🌐 Variáveis de Ambiente Suportadas
```bash
# Essenciais
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@host:port/db

# Webmail
WEBMAIL_SECURE=true
WEBMAIL_TLS_REJECT_UNAUTHORIZED=false

# Opcional
SKIP_DB_CHECK=true  # Para pular verificações de banco
TZ=America/Sao_Paulo
```

## 🐳 Como Usar

### Build Local
```bash
docker build -t garapasystem:0.1.32 .
```

### Executar Container
```bash
# Com banco de dados
docker run -d \
  --name garapasystem \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:port/db" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  garapasystem:0.1.32

# Sem banco (modo desenvolvimento)
docker run -d \
  --name garapasystem \
  -p 3000:3000 \
  -e SKIP_DB_CHECK=true \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  garapasystem:0.1.32
```

## 📤 Push para Docker Hub

Para fazer o push para o Docker Hub, execute:

```bash
# 1. Fazer login no Docker Hub
docker login

# 2. Taguear a imagem com seu usuário
docker tag garapasystem:0.1.32 SEU_USUARIO/garapasystem:0.1.32
docker tag garapasystem:latest SEU_USUARIO/garapasystem:latest

# 3. Fazer push
docker push SEU_USUARIO/garapasystem:0.1.32
docker push SEU_USUARIO/garapasystem:latest
```

## 🧪 Testes Realizados

✅ **Build da Imagem**: Concluído com sucesso  
✅ **Inicialização do Container**: Aplicação inicia corretamente  
✅ **Módulo Webmail**: Rotas `/webmail` respondem adequadamente  
✅ **Redirecionamento de Autenticação**: Funcionando conforme esperado  
✅ **Configurações de Ambiente**: Variáveis aplicadas corretamente  

## 📊 Informações da Imagem

- **Tamanho**: ~3.74GB
- **Base**: node:18-alpine
- **Arquitetura**: Multi-platform
- **Usuário**: nextjs (não-root)
- **Porta**: 3000
- **Workdir**: /app

## 🔒 Segurança

- Execução com usuário não-root
- Dependências de segurança atualizadas
- Configurações TLS para webmail
- Variáveis de ambiente para secrets
- Verificações de permissões automáticas

## 📝 Changelog v0.1.32

- ➕ Adicionado módulo webmail completo
- 🔧 Otimizações no Dockerfile
- 🛡️ Melhorias de segurança
- 📧 Configurações específicas para webmail
- 🚀 Script de inicialização aprimorado
- ✅ Correções de suspense boundary
- 🔄 Suporte a modo sem banco de dados
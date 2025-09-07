# GarapaSystem - Sistema de Gestão Empresarial

![GarapaSystem Logo](https://raw.githubusercontent.com/garapadev/garapasystem/main/public/logo.svg)

## 📋 Sobre o Projeto

O **GarapaSystem** é um sistema completo de gestão empresarial desenvolvido com Next.js, TypeScript e PostgreSQL. Oferece funcionalidades abrangentes para gerenciamento de clientes, pipeline de vendas, colaboradores, permissões e muito mais.

## 🚀 Funcionalidades Principais

- **Dashboard Interativo**: Visão geral completa dos dados da empresa
- **Gestão de Clientes**: Cadastro e acompanhamento de clientes
- **Pipeline de Vendas**: Controle completo do funil de vendas
- **Gestão de Colaboradores**: Administração de equipes
- **Sistema de Permissões**: Controle granular de acesso
- **API REST**: Endpoints completos para integração
- **Webhooks**: Notificações em tempo real
- **Documentação Swagger**: API totalmente documentada

## 🐳 Como Usar com Docker

### Pré-requisitos
- Docker
- Docker Compose

### Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/garapadev/garapasystem.git
cd garapasystem

# Execute com Docker Compose
docker-compose up -d
```

### Usando a Imagem do Docker Hub

```bash
# Baixar e executar a imagem
docker pull garapadev/garapasystem:latest

# Executar com variáveis de ambiente
docker run -d \
  --name garapasystem \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@localhost:5432/garapasystem" \
  -e NEXTAUTH_SECRET="your-secret-key" \
  -e NEXTAUTH_URL="http://localhost:3000" \
  garapadev/garapasystem:latest
```

### Docker Compose Completo

```yaml
version: '3.8'
services:
  garapasystem-postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: garapasystem
      POSTGRES_USER: garapasystem
      POSTGRES_PASSWORD: garapasystem123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  garapasystem-app:
    image: garapadev/garapasystem:latest
    environment:
      DATABASE_URL: postgresql://garapasystem:garapasystem123@garapasystem-postgres:5432/garapasystem
      NEXTAUTH_SECRET: your-secret-key-here
      NEXTAUTH_URL: http://localhost:3000
    ports:
      - "3000:3000"
    depends_on:
      - garapasystem-postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão com PostgreSQL | ✅ |
| `NEXTAUTH_SECRET` | Chave secreta para autenticação | ✅ |
| `NEXTAUTH_URL` | URL base da aplicação | ✅ |
| `REDIS_URL` | URL de conexão com Redis | ❌ |

## 📱 Acesso à Aplicação

Após iniciar os containers:

- **Aplicação**: http://localhost:3000
- **Documentação API**: http://localhost:3000/swagger
- **Login padrão**: admin@garapasystem.com / admin123

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Node.js, Prisma ORM
- **Banco de Dados**: PostgreSQL
- **Cache**: Redis
- **Autenticação**: NextAuth.js
- **Documentação**: Swagger UI

## 📊 Screenshots

### Dashboard Principal
![Dashboard](https://raw.githubusercontent.com/garapadev/garapasystem/main/screenshots/dashboard-principal-2025-09-06T14-11-55-405Z.png)

### Gestão de Clientes
![Clientes](https://raw.githubusercontent.com/garapadev/garapasystem/main/screenshots/clientes-gestao-2025-09-06T14-12-07-966Z.png)

### Pipeline de Vendas
![Pipeline](https://raw.githubusercontent.com/garapadev/garapasystem/main/screenshots/pipeline-vendas-completo-2025-09-06T14-18-23-046Z.png)

## 🔗 Links Úteis

- **Repositório GitHub**: https://github.com/garapadev/garapasystem
- **Docker Hub**: https://hub.docker.com/r/garapadev/garapasystem
- **Documentação**: Em desenvolvimento

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Veja nosso [guia de contribuição](CONTRIBUTING.md) para mais informações.

## 📞 Suporte

Para suporte e dúvidas:
- **Email**: suporte@garapadev.com
- **Issues**: https://github.com/garapadev/garapasystem/issues

---

**Desenvolvido com ❤️ pela equipe GarapaDev**
# 🚀 Guia de Instalação - GarapaSystem v0.2.37.7

Este guia descreve como instalar e configurar o GarapaSystem em um ambiente novo.

## 📋 Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** (versão 8 ou superior)
- **Banco de dados** (PostgreSQL, MySQL ou SQLite)
- **Git** (para clonar o repositório)

## 🔧 Instalação Automática

O GarapaSystem possui um sistema de instalação automática que configura o banco de dados e executa o seed inicial quando necessário.

### 1. Clone o Repositório

```bash
git clone <url-do-repositorio>
cd GarapaSystem
```

### 2. Configure as Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Configure as seguintes variáveis essenciais:

```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/garapasystem"

# Autenticação
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Outras configurações...
```

### 3. Instale as Dependências

```bash
npm install
```

**🎉 Pronto!** O script de pós-instalação (`postinstall`) será executado automaticamente e:

- ✅ Verificará se o banco de dados está vazio
- ✅ Executará as migrations necessárias
- ✅ Criará o seed inicial com usuário administrador
- ✅ Gerará o cliente Prisma
- ✅ Preparará o ambiente para uso

## 🔄 Instalação Manual (Opcional)

Se preferir executar a configuração manualmente:

```bash
# Executar apenas a configuração
npm run setup

# Ou executar cada etapa individualmente:
npx prisma migrate deploy
npm run db:seed
npx prisma generate
npm run build
```

## 👤 Usuário Administrador Padrão

Após a instalação, será criado um usuário administrador com:

- **Email:** `admin@garapasystem.com`
- **Senha:** `password`

⚠️ **IMPORTANTE:** Altere a senha do administrador após o primeiro login!

## 🚀 Iniciando o Sistema

### Desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3000

### Produção com PM2
```bash
npm run pm2:prod
```

### Produção Simples
```bash
npm run build
npm start
```

## 🔍 Verificação da Instalação

Para verificar se tudo foi instalado corretamente:

1. **Banco de Dados:** Verifique se as tabelas foram criadas
2. **Usuário Admin:** Tente fazer login com as credenciais padrão
3. **Permissões:** Verifique se todas as permissões foram criadas
4. **Módulos:** Teste o acesso aos diferentes módulos do sistema

## 🛠️ Solução de Problemas

### Erro de Conexão com Banco
- Verifique se o banco de dados está rodando
- Confirme as credenciais no arquivo `.env`
- Teste a conexão: `npx prisma db push`

### Erro de Permissões
- Verifique se o script tem permissão de execução: `chmod +x scripts/auto-setup.sh`
- Execute manualmente: `npm run setup`

### Banco Não Vazio
Se o banco já contém dados, o seed não será executado. Para forçar:
```bash
npm run db:reset  # ⚠️ CUIDADO: Apaga todos os dados
npm run db:seed
```

## 📦 Módulos Incluídos

O seed inicial configura permissões para todos os módulos:

- 📊 **Dashboard** - Visualização geral
- 👥 **Clientes** - Gestão de clientes (CRUD)
- 🤝 **Colaboradores** - Gestão de colaboradores (CRUD)
- 🏢 **Grupos Hierárquicos** - Organização empresarial (CRUD)
- 🔐 **Perfis e Permissões** - Controle de acesso (CRUD)
- 👤 **Usuários** - Gestão de usuários (CRUD)
- 📋 **Ordens de Serviço** - Gestão completa de OS (CRUD + Aprovação)
- 💰 **Orçamentos** - Sistema de orçamentos (CRUD + Aprovação + Geração)
- 📧 **Webmail** - Sistema de email integrado (Completo)
- ⚙️ **Sistema** - Administração geral

## 🔄 Atualizações

Para atualizar o sistema mantendo os dados:

```bash
git pull origin main
npm install  # Executará automaticamente as migrations pendentes
```

## 📞 Suporte

Em caso de problemas:

1. Verifique os logs: `npm run pm2:logs`
2. Consulte a documentação completa
3. Entre em contato com o suporte técnico

---

**GarapaSystem v0.2.37.7** - Sistema de Gestão Empresarial Completo
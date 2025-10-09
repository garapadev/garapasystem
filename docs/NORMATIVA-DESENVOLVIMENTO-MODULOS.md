# NORMATIVA OBRIGATÓRIA - DESENVOLVIMENTO DE MÓDULOS
## Sistema GarapaSystem CRM/ERP

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Status:** OBRIGATÓRIO  
**Aplicabilidade:** Todos os desenvolvedores e equipe técnica  

---

## 📋 ÍNDICE

1. [Introdução e Objetivos](#1-introdução-e-objetivos)
2. [Processo de Desenvolvimento de Novos Módulos](#2-processo-de-desenvolvimento-de-novos-módulos)
3. [Itens Obrigatórios de Implementação](#3-itens-obrigatórios-de-implementação)
4. [Especificações Técnicas para Interface](#4-especificações-técnicas-para-interface)
5. [Procedimentos de Atualização Automática](#5-procedimentos-de-atualização-automática)
6. [Diretrizes de Atualizações Contínuas](#6-diretrizes-de-atualizações-contínuas)
7. [Padrões de Desenvolvimento](#7-padrões-de-desenvolvimento)
8. [Controle de Qualidade e Validação](#8-controle-de-qualidade-e-validação)
9. [Anexos e Referências](#9-anexos-e-referências)

---

## 1. INTRODUÇÃO E OBJETIVOS

### 1.1 Finalidade
Este documento estabelece as diretrizes **OBRIGATÓRIAS** para o desenvolvimento de novos módulos no sistema GarapaSystem CRM/ERP, garantindo consistência, qualidade e padronização em todas as implementações.

### 1.2 Escopo
- Desenvolvimento de novos módulos funcionais
- Integração com o sistema de gerenciamento de módulos existente
- Padrões de interface e experiência do usuário
- Procedimentos de deployment e atualização
- Controles de qualidade e testes

### 1.3 Arquitetura Atual
O sistema utiliza:
- **Backend:** Next.js 14+ com TypeScript
- **Banco de Dados:** PostgreSQL com Prisma ORM
- **Frontend:** React com Tailwind CSS e shadcn/ui
- **Containerização:** Docker com Docker Compose
- **Gerenciamento de Processos:** PM2
- **Sistema de Módulos:** Baseado no modelo `ModuloSistema`

---

## 2. PROCESSO DE DESENVOLVIMENTO DE NOVOS MÓDULOS

### 2.1 Etapas Obrigatórias

#### 2.1.1 Fase de Planejamento
1. **Análise de Requisitos**
   - Documentar funcionalidades detalhadas
   - Definir permissões necessárias
   - Mapear integrações com módulos existentes
   - Validar com stakeholders

2. **Design da Arquitetura**
   - Definir estrutura de dados (modelos Prisma)
   - Planejar APIs necessárias
   - Desenhar fluxos de interface
   - Definir dependências externas

#### 2.1.2 Fase de Implementação
1. **Configuração Inicial**
   ```bash
   # Criar branch específica para o módulo
   git checkout -b feature/modulo-[nome-modulo]
   
   # Verificar dependências
   npm install
   ```

2. **Implementação Backend**
   - Criar modelos no schema Prisma
   - Implementar APIs REST
   - Configurar permissões
   - Implementar validações

3. **Implementação Frontend**
   - Criar componentes React
   - Implementar páginas
   - Configurar roteamento
   - Integrar com APIs

#### 2.1.3 Fase de Integração
1. **Registro no Sistema de Módulos**
2. **Testes de Integração**
3. **Validação de Permissões**
4. **Documentação**

### 2.2 Boas Práticas Obrigatórias

- **Desenvolvimento Incremental:** Implementar funcionalidades em pequenos incrementos
- **Code Review:** Todo código deve passar por revisão de pelo menos 2 desenvolvedores
- **Testes Automatizados:** Cobertura mínima de 80% para novas funcionalidades
- **Documentação Contínua:** Documentar durante o desenvolvimento, não após

---

## 3. ITENS OBRIGATÓRIOS DE IMPLEMENTAÇÃO

### 3.1 Estrutura de Banco de Dados

#### 3.1.1 Registro no Sistema de Módulos (OBRIGATÓRIO)
```typescript
// Exemplo de registro no seed de módulos
{
  nome: 'nome-modulo',           // OBRIGATÓRIO: Identificador único
  titulo: 'Título do Módulo',    // OBRIGATÓRIO: Nome para exibição
  descricao: 'Descrição detalhada do módulo', // OBRIGATÓRIO
  ativo: true,                   // OBRIGATÓRIO: Status inicial
  core: false,                   // OBRIGATÓRIO: false para módulos não-core
  icone: 'IconeLucide',         // OBRIGATÓRIO: Ícone do Lucide React
  ordem: 100,                    // OBRIGATÓRIO: Ordem no menu (incrementar)
  rota: '/nome-modulo',         // OBRIGATÓRIO: Rota principal
  categoria: 'categoria',        // OBRIGATÓRIO: Ver categorias válidas
  permissao: 'modulo.view',     // OBRIGATÓRIO: Permissão base
}
```

**Justificativa Técnica:** O registro no sistema de módulos é essencial para:
- Controle de acesso e permissões
- Exibição correta no menu de navegação
- Gerenciamento centralizado de módulos
- Auditoria e logs de utilização

#### 3.1.2 Modelos de Dados (OBRIGATÓRIO)
```prisma
// Exemplo de modelo para novo módulo
model NovoModulo {
  id        String   @id @default(cuid())
  nome      String
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relacionamentos obrigatórios
  autorId   String?
  autor     Colaborador? @relation(fields: [autorId], references: [id])
  
  @@map("novo_modulo")
}
```

**Justificativa Técnica:** Padronização garante:
- Consistência na estrutura de dados
- Facilita manutenção e evolução
- Permite auditoria e rastreabilidade
- Integração com sistema de permissões

### 3.2 APIs REST (OBRIGATÓRIO)

#### 3.2.1 Estrutura Padrão de APIs
```typescript
// /src/app/api/nome-modulo/route.ts
export async function GET(request: Request) {
  // Implementação obrigatória
}

export async function POST(request: Request) {
  // Implementação obrigatória
}

// /src/app/api/nome-modulo/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Implementação obrigatória
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // Implementação obrigatória
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  // Implementação obrigatória
}
```

**Justificativa Técnica:** APIs padronizadas garantem:
- Consistência na interface de dados
- Facilita integração com frontend
- Permite reutilização de componentes
- Simplifica manutenção

### 3.3 Sistema de Permissões (OBRIGATÓRIO)

#### 3.3.1 Definição de Permissões
```typescript
// Permissões obrigatórias para cada módulo
const permissoes = [
  'nome_modulo.view',    // Visualizar
  'nome_modulo.create',  // Criar
  'nome_modulo.edit',    // Editar
  'nome_modulo.delete',  // Excluir
  'nome_modulo.admin',   // Administrar
];
```

**Justificativa Técnica:** Sistema de permissões é obrigatório para:
- Controle de acesso granular
- Segurança de dados
- Compliance com regulamentações
- Auditoria de ações

### 3.4 Componentes de Interface (OBRIGATÓRIO)

#### 3.4.1 Estrutura de Componentes
```
/src/components/nome-modulo/
├── index.ts                    # Exports principais
├── NovoModuloList.tsx         # Lista principal
├── NovoModuloForm.tsx         # Formulário
├── NovoModuloCard.tsx         # Card de exibição
├── NovoModuloDialog.tsx       # Modal/Dialog
└── NovoModuloDeleteDialog.tsx # Confirmação de exclusão
```

**Justificativa Técnica:** Estrutura padronizada facilita:
- Manutenção e evolução
- Reutilização de código
- Onboarding de novos desenvolvedores
- Consistência visual

---

## 4. ESPECIFICAÇÕES TÉCNICAS PARA INTERFACE

### 4.1 Integração com Configurações > Módulos

#### 4.1.1 Requisitos de Exibição (OBRIGATÓRIO)
Para que o módulo apareça corretamente em **Configurações > Módulos**, deve:

1. **Estar registrado na tabela `modulos_sistema`**
2. **Possuir ícone válido do Lucide React**
3. **Ter categoria definida**
4. **Possuir permissão configurada**

#### 4.1.2 Categorias Válidas
```typescript
enum CategoriaModulo {
  CORE = 'core',                    // Módulos essenciais
  COMUNICACAO = 'comunicacao',      // Email, WhatsApp, etc.
  VENDAS = 'vendas',               // Orçamentos, negócios
  OPERACIONAL = 'operacional',      // OS, tarefas, laudos
  RELATORIOS = 'relatorios',       // Relatórios e analytics
  INTEGRACAO = 'integracao'        // Integrações externas
}
```

#### 4.1.3 Ícones Suportados
Utilizar apenas ícones do **Lucide React**:
```typescript
// Exemplos de ícones válidos
import { 
  Users, Settings, Mail, MessageCircle, 
  FileText, Wrench, TrendingUp, BarChart,
  Database, Zap, Shield, Calendar
} from 'lucide-react';
```

### 4.2 Padrões de Interface

#### 4.2.1 Layout de Páginas (OBRIGATÓRIO)
```tsx
// Estrutura padrão de página
export default function NovoModuloPage() {
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Título do Módulo</h1>
          <p className="text-muted-foreground">Descrição do módulo</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>
      
      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {/* Componentes de filtro */}
        </CardContent>
      </Card>
      
      {/* Conteúdo Principal */}
      <Card>
        <CardContent>
          {/* Lista ou conteúdo principal */}
        </CardContent>
      </Card>
    </div>
  );
}
```

#### 4.2.2 Componentes UI Obrigatórios
Utilizar **APENAS** componentes do shadcn/ui:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`, `Input`, `Select`, `Checkbox`
- `Table`, `TableBody`, `TableCell`, `TableHead`
- `Dialog`, `DialogContent`, `DialogHeader`
- `Toast` para notificações
- `Badge` para status

### 4.3 Responsividade (OBRIGATÓRIO)

#### 4.3.1 Breakpoints Padrão
```css
/* Tailwind CSS breakpoints obrigatórios */
sm: 640px   /* Tablet pequeno */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop pequeno */
xl: 1280px  /* Desktop */
2xl: 1536px /* Desktop grande */
```

#### 4.3.2 Classes Responsivas Obrigatórias
```tsx
// Exemplo de implementação responsiva
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Cards responsivos */}
</div>

<Table className="hidden md:table">
  {/* Tabela para desktop */}
</Table>

<div className="md:hidden space-y-4">
  {/* Cards para mobile */}
</div>
```

---

## 5. PROCEDIMENTOS DE ATUALIZAÇÃO AUTOMÁTICA

### 5.1 Atualização de Tabelas (OBRIGATÓRIO)

#### 5.1.1 Migrations Prisma
```bash
# Processo obrigatório para alterações no banco
npx prisma migrate dev --name add_novo_modulo
npx prisma generate
```

#### 5.1.2 Seeds de Dados
```typescript
// /prisma/seeds/novo-modulo.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedNovoModulo() {
  console.log('🌱 Seeding Novo Módulo...');
  
  // Registrar módulo no sistema
  await prisma.moduloSistema.upsert({
    where: { nome: 'novo-modulo' },
    update: {},
    create: {
      nome: 'novo-modulo',
      titulo: 'Novo Módulo',
      descricao: 'Descrição do novo módulo',
      ativo: true,
      core: false,
      icone: 'Package',
      ordem: 100,
      rota: '/novo-modulo',
      categoria: 'operacional',
      permissao: 'novo_modulo.view',
    },
  });
  
  console.log('✅ Novo Módulo seeded successfully');
}
```

### 5.2 Deployment com Docker

#### 5.2.1 Atualização de Container (OBRIGATÓRIO)
```bash
# Script de deployment obrigatório
#!/bin/bash

# 1. Build da nova imagem
docker build -t garapasystem:v[versao] .

# 2. Tag para registry
docker tag garapasystem:v[versao] garapadev/garapasystem:v[versao]

# 3. Push para registry
docker push garapadev/garapasystem:v[versao]

# 4. Atualizar docker-compose
# Editar docker-compose.yml com nova versão

# 5. Deploy
docker-compose down
docker-compose up -d

# 6. Executar migrations
docker exec garapasystem-app npx prisma migrate deploy
docker exec garapasystem-app npx prisma db seed
```

#### 5.2.2 Verificação de Saúde (OBRIGATÓRIO)
```bash
# Verificações obrigatórias pós-deployment
docker ps | grep garapasystem
docker logs garapasystem-app --tail 50
curl -f http://localhost:3000/api/health || exit 1
```

### 5.3 Rollback Automático

#### 5.3.1 Procedimento de Rollback (OBRIGATÓRIO)
```bash
#!/bin/bash
# Script de rollback obrigatório

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
  echo "Erro: Versão anterior não especificada"
  exit 1
fi

# 1. Parar serviços
docker-compose down

# 2. Restaurar versão anterior
sed -i "s/garapasystem:v.*/garapasystem:$PREVIOUS_VERSION/" docker-compose.yml

# 3. Subir com versão anterior
docker-compose up -d

# 4. Verificar saúde
sleep 30
curl -f http://localhost:3000/api/health || {
  echo "Erro: Rollback falhou"
  exit 1
}

echo "Rollback para $PREVIOUS_VERSION concluído com sucesso"
```

---

## 6. DIRETRIZES DE ATUALIZAÇÕES CONTÍNUAS

### 6.1 Estratégia de Versionamento (OBRIGATÓRIO)

#### 6.1.1 Semantic Versioning
```
MAJOR.MINOR.PATCH.BUILD
Exemplo: 1.2.3.45

MAJOR: Mudanças incompatíveis
MINOR: Novas funcionalidades compatíveis
PATCH: Correções de bugs
BUILD: Build automático
```

#### 6.1.2 Tags de Versão
```bash
# Tags obrigatórias
git tag -a v1.2.3 -m "Release v1.2.3: Novo módulo XYZ"
git push origin v1.2.3
```

### 6.2 Mecanismos de Prevenção de Erros

#### 6.2.1 Validações Pré-Deploy (OBRIGATÓRIO)
```bash
#!/bin/bash
# Validações obrigatórias antes do deploy

# 1. Testes automatizados
npm test || exit 1

# 2. Lint
npm run lint || exit 1

# 3. Type checking
npm run type-check || exit 1

# 4. Build
npm run build || exit 1

# 5. Validação de migrations
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma

echo "✅ Todas as validações passaram"
```

#### 6.2.2 Health Checks (OBRIGATÓRIO)
```typescript
// /src/app/api/health/route.ts
export async function GET() {
  try {
    // Verificar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    
    // Verificar módulos críticos
    const modulosCore = await prisma.moduloSistema.findMany({
      where: { core: true, ativo: true }
    });
    
    if (modulosCore.length === 0) {
      throw new Error('Módulos core não encontrados');
    }
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      modules: modulosCore.length
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

### 6.3 Monitoramento e Alertas

#### 6.3.1 Logs Estruturados (OBRIGATÓRIO)
```typescript
// Padrão de logs obrigatório
import { logger } from '@/lib/logger';

logger.info('Módulo iniciado', {
  module: 'novo-modulo',
  version: '1.0.0',
  timestamp: new Date().toISOString()
});

logger.error('Erro no módulo', {
  module: 'novo-modulo',
  error: error.message,
  stack: error.stack,
  userId: user?.id
});
```

#### 6.3.2 Métricas de Performance (OBRIGATÓRIO)
```typescript
// Instrumentação obrigatória
import { performance } from 'perf_hooks';

export async function GET() {
  const start = performance.now();
  
  try {
    // Lógica da API
    const result = await processData();
    
    const duration = performance.now() - start;
    logger.info('API performance', {
      endpoint: '/api/novo-modulo',
      duration: `${duration.toFixed(2)}ms`,
      success: true
    });
    
    return Response.json(result);
  } catch (error) {
    const duration = performance.now() - start;
    logger.error('API error', {
      endpoint: '/api/novo-modulo',
      duration: `${duration.toFixed(2)}ms`,
      error: error.message
    });
    
    throw error;
  }
}
```

---

## 7. PADRÕES DE DESENVOLVIMENTO

### 7.1 Convenções de Código (OBRIGATÓRIO)

#### 7.1.1 Nomenclatura
```typescript
// Arquivos e pastas: kebab-case
novo-modulo/
novo-modulo-form.tsx

// Componentes: PascalCase
export function NovoModuloForm() {}

// Variáveis e funções: camelCase
const novoModulo = {};
function criarNovoModulo() {}

// Constantes: UPPER_SNAKE_CASE
const MAX_ITEMS_PER_PAGE = 50;

// Tipos e interfaces: PascalCase
interface NovoModuloData {}
type NovoModuloStatus = 'ativo' | 'inativo';
```

#### 7.1.2 Estrutura de Imports (OBRIGATÓRIO)
```typescript
// 1. Imports do React
import { useState, useEffect } from 'react';

// 2. Imports de bibliotecas externas
import { toast } from 'sonner';

// 3. Imports internos (componentes)
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 4. Imports de tipos
import type { NovoModuloData } from '@/types/novo-modulo';

// 5. Imports relativos
import './styles.css';
```

### 7.2 Estrutura de Arquivos (OBRIGATÓRIO)

#### 7.2.1 Estrutura de Módulo Completa
```
/src/
├── app/
│   ├── api/
│   │   └── novo-modulo/
│   │       ├── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   └── novo-modulo/
│       ├── page.tsx
│       ├── loading.tsx
│       ├── error.tsx
│       ├── [id]/
│       │   ├── page.tsx
│       │   └── edit/
│       │       └── page.tsx
│       └── novo/
│           └── page.tsx
├── components/
│   └── novo-modulo/
│       ├── index.ts
│       ├── NovoModuloList.tsx
│       ├── NovoModuloForm.tsx
│       ├── NovoModuloCard.tsx
│       ├── NovoModuloDialog.tsx
│       └── NovoModuloDeleteDialog.tsx
├── hooks/
│   └── use-novo-modulo.ts
├── lib/
│   └── novo-modulo.ts
└── types/
    └── novo-modulo.ts
```

### 7.3 Documentação Obrigatória

#### 7.3.1 JSDoc para Funções (OBRIGATÓRIO)
```typescript
/**
 * Cria um novo item do módulo
 * @param data - Dados do novo item
 * @param userId - ID do usuário que está criando
 * @returns Promise com o item criado
 * @throws {ValidationError} Quando os dados são inválidos
 * @throws {PermissionError} Quando o usuário não tem permissão
 */
export async function criarNovoModulo(
  data: NovoModuloData,
  userId: string
): Promise<NovoModulo> {
  // Implementação
}
```

#### 7.3.2 README do Módulo (OBRIGATÓRIO)
```markdown
# Módulo: [Nome do Módulo]

## Descrição
Breve descrição do que o módulo faz.

## Funcionalidades
- [ ] Funcionalidade 1
- [ ] Funcionalidade 2

## APIs
- `GET /api/novo-modulo` - Lista itens
- `POST /api/novo-modulo` - Cria item
- `PUT /api/novo-modulo/[id]` - Atualiza item
- `DELETE /api/novo-modulo/[id]` - Remove item

## Permissões
- `novo_modulo.view` - Visualizar
- `novo_modulo.create` - Criar
- `novo_modulo.edit` - Editar
- `novo_modulo.delete` - Excluir

## Dependências
- Módulo A
- Módulo B

## Configuração
Instruções de configuração específicas.
```

### 7.4 Testes Automatizados (OBRIGATÓRIO)

#### 7.4.1 Estrutura de Testes
```
/tests/
├── unit/
│   └── novo-modulo/
│       ├── novo-modulo.test.ts
│       └── components/
│           └── NovoModuloForm.test.tsx
├── integration/
│   └── novo-modulo/
│       └── api.test.ts
└── e2e/
    └── novo-modulo/
        └── crud.test.ts
```

#### 7.4.2 Cobertura Mínima (OBRIGATÓRIO)
- **Testes Unitários:** 80% de cobertura
- **Testes de Integração:** APIs principais
- **Testes E2E:** Fluxos críticos

#### 7.4.3 Exemplo de Teste Unitário
```typescript
// /tests/unit/novo-modulo/novo-modulo.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { criarNovoModulo } from '@/lib/novo-modulo';

describe('NovoModulo', () => {
  beforeEach(() => {
    // Setup
  });

  it('deve criar um novo item com dados válidos', async () => {
    const data = {
      nome: 'Teste',
      descricao: 'Descrição teste'
    };
    
    const result = await criarNovoModulo(data, 'user-id');
    
    expect(result).toBeDefined();
    expect(result.nome).toBe('Teste');
  });

  it('deve falhar com dados inválidos', async () => {
    const data = {
      nome: '', // Nome vazio
      descricao: 'Descrição'
    };
    
    await expect(criarNovoModulo(data, 'user-id'))
      .rejects
      .toThrow('Nome é obrigatório');
  });
});
```

### 7.5 Controles de Versão (OBRIGATÓRIO)

#### 7.5.1 Padrão de Commits
```bash
# Formato obrigatório
tipo(escopo): descrição

# Tipos válidos
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: manutenção

# Exemplos
feat(novo-modulo): adicionar CRUD básico
fix(novo-modulo): corrigir validação de formulário
docs(novo-modulo): adicionar documentação da API
```

#### 7.5.2 Fluxo de Branches
```bash
# Branch principal
main

# Branch de desenvolvimento
develop

# Branches de feature
feature/novo-modulo-crud
feature/novo-modulo-permissions

# Branches de hotfix
hotfix/novo-modulo-critical-bug

# Branches de release
release/v1.2.0
```

---

## 7.6. PADRÕES DE TRATAMENTO DE ERROS (OBRIGATÓRIO)

### 7.6.1 Padronização de Respostas de Erro

**REGRA OBRIGATÓRIA:** Todas as APIs devem utilizar o método `ApiMiddleware.createErrorResponse` para tratamento de erros, garantindo consistência e padronização em todo o sistema.

#### 7.6.1.1 Uso Correto (OBRIGATÓRIO)
```typescript
// ✅ CORRETO - Usar ApiMiddleware.createErrorResponse
import { ApiMiddleware } from '@/lib/api-middleware';

// Erro de validação
if (!validationResult.success) {
  return ApiMiddleware.createErrorResponse(
    `Dados inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
    400
  );
}

// Erro de recurso não encontrado
if (!item) {
  return ApiMiddleware.createErrorResponse('Item não encontrado', 404);
}

// Erro interno do servidor
} catch (error) {
  console.error('Erro ao processar:', error);
  return ApiMiddleware.createErrorResponse('Erro interno do servidor', 500);
}
```

#### 7.6.1.2 Uso Incorreto (PROIBIDO)
```typescript
// ❌ INCORRETO - NÃO usar NextResponse.json diretamente para erros
return NextResponse.json(
  { error: 'Mensagem de erro' },
  { status: 400 }
);

// ❌ INCORRETO - Formato inconsistente
return Response.json(
  { message: 'Erro', success: false },
  { status: 500 }
);
```

### 7.6.2 Validação com Zod (OBRIGATÓRIO)

#### 7.6.2.1 Implementação Padrão
```typescript
import { createItemSchema } from '@/lib/validations/item';

// Validação de dados de entrada
const validationResult = createItemSchema.safeParse(body);
if (!validationResult.success) {
  return ApiMiddleware.createErrorResponse(
    `Dados inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
    400
  );
}

const validatedData = validationResult.data;
```

### 7.6.3 Códigos de Status Padronizados

#### 7.6.3.1 Mapeamento de Erros
- **400 Bad Request:** Dados inválidos, validação Zod falhou
- **401 Unauthorized:** Não autenticado
- **403 Forbidden:** Sem permissão para a operação
- **404 Not Found:** Recurso não encontrado
- **409 Conflict:** Conflito de dados (ex: email já existe)
- **500 Internal Server Error:** Erro interno do servidor

#### 7.6.3.2 Formato de Resposta Padronizado
```json
{
  "message": "Descrição do erro",
  "status": 400,
  "timestamp": "2025-01-XX T XX:XX:XX.XXXZ"
}
```

### 7.6.4 Benefícios da Padronização

- **Consistência:** Todas as respostas de erro seguem o mesmo formato
- **Manutenibilidade:** Mudanças no formato podem ser feitas centralizadamente
- **Debugging:** Timestamp automático facilita rastreamento
- **Frontend:** Interface pode tratar erros de forma uniforme
- **Logs:** Estrutura padronizada melhora análise de logs

### 7.6.5 Checklist de Implementação

#### 7.6.5.1 Para Novas APIs (OBRIGATÓRIO)
- [ ] Importar `ApiMiddleware` de `@/lib/api-middleware`
- [ ] Usar `createErrorResponse` para todos os erros
- [ ] Implementar validação Zod com schemas apropriados
- [ ] Mapear códigos de status corretamente
- [ ] Testar todas as condições de erro

#### 7.6.5.2 Para APIs Existentes (OBRIGATÓRIO)
- [ ] Substituir `NextResponse.json` por `ApiMiddleware.createErrorResponse`
- [ ] Migrar validação manual para schemas Zod
- [ ] Verificar códigos de status (404 para "não encontrado")
- [ ] Atualizar testes para novo formato
- [ ] Documentar mudanças na API

---

## 8. CONTROLE DE QUALIDADE E VALIDAÇÃO

### 8.1 Checklist de Validação (OBRIGATÓRIO)

#### 8.1.1 Antes do Desenvolvimento
- [ ] Requisitos documentados e aprovados
- [ ] Arquitetura definida e revisada
- [ ] Permissões mapeadas
- [ ] Dependências identificadas
- [ ] Cronograma estabelecido

#### 8.1.2 Durante o Desenvolvimento
- [ ] Código segue padrões estabelecidos
- [ ] Testes unitários implementados
- [ ] Documentação atualizada
- [ ] Code review realizado
- [ ] Validações de segurança aplicadas

#### 8.1.3 Antes do Deploy
- [ ] Todos os testes passando
- [ ] Cobertura de testes ≥ 80%
- [ ] Lint sem erros
- [ ] Build bem-sucedido
- [ ] Migrations testadas
- [ ] Documentação completa
- [ ] Aprovação de stakeholders

### 8.2 Critérios de Aceitação (OBRIGATÓRIO)

#### 8.2.1 Funcionalidade
- [ ] Todas as funcionalidades implementadas
- [ ] Validações funcionando corretamente
- [ ] Tratamento de erros adequado
- [ ] Performance aceitável (< 2s para operações básicas)

#### 8.2.2 Interface
- [ ] Design consistente com o sistema
- [ ] Responsividade em todos os dispositivos
- [ ] Acessibilidade (WCAG 2.1 AA)
- [ ] Usabilidade validada

#### 8.2.3 Segurança
- [ ] Autenticação implementada
- [ ] Autorização configurada
- [ ] Validação de entrada
- [ ] Sanitização de dados
- [ ] Logs de auditoria

#### 8.2.4 Integração
- [ ] Módulo aparece em Configurações > Módulos
- [ ] Permissões funcionando
- [ ] Navegação integrada
- [ ] APIs documentadas

### 8.3 Processo de Aprovação

#### 8.3.1 Revisão Técnica (OBRIGATÓRIO)
1. **Code Review:** Mínimo 2 desenvolvedores
2. **Arquitetura Review:** Arquiteto de software
3. **Security Review:** Especialista em segurança
4. **Performance Review:** Análise de performance

#### 8.3.2 Testes de Aceitação (OBRIGATÓRIO)
1. **Testes Funcionais:** QA Team
2. **Testes de Usabilidade:** UX Team
3. **Testes de Performance:** DevOps Team
4. **Testes de Segurança:** Security Team

---

## 9. ANEXOS E REFERÊNCIAS

### 9.1 Templates e Exemplos

#### 9.1.1 Template de Componente React
```typescript
// /templates/ComponentTemplate.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ComponentTemplateProps {
  // Props do componente
}

export function ComponentTemplate({ }: ComponentTemplateProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    try {
      setLoading(true);
      // Lógica do componente
      toast({
        title: 'Sucesso',
        description: 'Ação realizada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao realizar ação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Título do Componente</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleAction} disabled={loading}>
          {loading ? 'Carregando...' : 'Ação'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

#### 9.1.2 Template de API Route
```typescript
// /templates/api-route-template.ts
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema de validação
const createSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  descricao: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Verificar permissão
    // TODO: Implementar verificação de permissão

    const items = await prisma.novoModulo.findMany({
      where: { ativo: true },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Erro ao buscar itens:', error);
    return Response.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSchema.parse(body);

    const item = await prisma.novoModulo.create({
      data: {
        ...validatedData,
        autorId: session.user.id,
      },
    });

    return Response.json({
      success: true,
      data: item,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erro ao criar item:', error);
    return Response.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### 9.2 Ferramentas e Recursos

#### 9.2.1 Ferramentas Obrigatórias
- **IDE:** VS Code com extensões TypeScript, Prisma, Tailwind
- **Linting:** ESLint com configuração do projeto
- **Formatação:** Prettier
- **Testes:** Vitest + Testing Library
- **Documentação:** JSDoc + Markdown

#### 9.2.2 Recursos de Referência
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação shadcn/ui](https://ui.shadcn.com)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Guia de Acessibilidade WCAG](https://www.w3.org/WAI/WCAG21/quickref/)

### 9.3 Contatos e Suporte

#### 9.3.1 Equipe Técnica
- **Arquiteto de Software:** [Nome] - [email]
- **Tech Lead:** [Nome] - [email]
- **DevOps:** [Nome] - [email]
- **QA Lead:** [Nome] - [email]

#### 9.3.2 Canais de Comunicação
- **Slack:** #desenvolvimento-modulos
- **Email:** dev-team@garapasystem.com
- **Documentação:** Wiki interno
- **Issues:** Sistema de tickets interno

---

## 📝 CONTROLE DE VERSÕES

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | Janeiro 2025 | Equipe Técnica | Versão inicial |

---

## ⚖️ CONFORMIDADE E AUDITORIA

Este documento é **OBRIGATÓRIO** e deve ser seguido por todos os membros da equipe de desenvolvimento. O não cumprimento das diretrizes estabelecidas pode resultar em:

- Rejeição de pull requests
- Necessidade de refatoração
- Atraso no cronograma de entrega
- Revisão adicional de código

**Última atualização:** Janeiro 2025  
**Próxima revisão:** Julho 2025  
**Status:** ATIVO E OBRIGATÓRIO
# Permissões e Roles - Sistema de Aprovação de Cotações

## 1. Estrutura de Roles

### 1.1 Hierarquia de Roles

```
SUPER_ADMIN
├── ADMIN_COMPRAS
├── GERENTE_COMPRAS
│   ├── COORDENADOR_COMPRAS
│   │   ├── COMPRADOR_SENIOR
│   │   │   ├── COMPRADOR_PLENO
│   │   │   │   └── COMPRADOR_JUNIOR
│   │   └── ANALISTA_COMPRAS
│   └── APROVADOR_NIVEL_3
│       ├── APROVADOR_NIVEL_2
│       │   └── APROVADOR_NIVEL_1
│       └── GESTOR_CENTRO_CUSTO
└── SOLICITANTE
    ├── SOLICITANTE_ESPECIAL
    └── SOLICITANTE_BASICO
```

### 1.2 Definição de Roles

#### 1.2.1 Roles Administrativos

**SUPER_ADMIN**
- Acesso total ao sistema
- Configuração de todas as regras de aprovação
- Gestão de usuários e permissões
- Acesso a todos os relatórios e auditorias

**ADMIN_COMPRAS**
- Administração completa do módulo de compras
- Configuração de regras de aprovação
- Gestão de fornecedores e categorias
- Relatórios gerenciais completos

**GERENTE_COMPRAS**
- Supervisão geral do processo de compras
- Aprovação de valores altos (acima de R$ 100.000)
- Configuração de políticas departamentais
- Relatórios estratégicos

#### 1.2.2 Roles de Coordenação

**COORDENADOR_COMPRAS**
- Coordenação da equipe de compradores
- Aprovação de valores médios (R$ 25.000 - R$ 100.000)
- Distribuição de cotações
- Monitoramento de performance

**COMPRADOR_SENIOR**
- Gestão completa de cotações
- Aprovação de valores baixos (até R$ 25.000)
- Negociação com fornecedores
- Análise técnica de propostas

**COMPRADOR_PLENO**
- Gestão de cotações de complexidade média
- Aprovação limitada (até R$ 10.000)
- Suporte a cotações complexas

**COMPRADOR_JUNIOR**
- Gestão de cotações simples
- Aprovação muito limitada (até R$ 2.500)
- Aprendizado supervisionado

**ANALISTA_COMPRAS**
- Análise de dados e relatórios
- Suporte técnico às cotações
- Sem poder de aprovação

#### 1.2.3 Roles de Aprovação

**APROVADOR_NIVEL_3**
- Aprovação final de valores altos
- Delegação de aprovações
- Revisão de decisões de níveis inferiores

**APROVADOR_NIVEL_2**
- Aprovação de valores médios
- Supervisão de aprovadores nível 1
- Escalação para nível 3

**APROVADOR_NIVEL_1**
- Aprovação de valores baixos
- Primeira instância de aprovação
- Análise inicial de cotações

**GESTOR_CENTRO_CUSTO**
- Aprovação específica para seu centro de custo
- Controle orçamentário
- Validação de necessidade

#### 1.2.4 Roles de Solicitação

**SOLICITANTE_ESPECIAL**
- Solicitações de qualquer valor
- Acesso a relatórios de suas solicitações
- Acompanhamento detalhado

**SOLICITANTE_BASICO**
- Solicitações limitadas por valor
- Acompanhamento básico
- Relatórios simples

## 2. Matriz de Permissões

### 2.1 Permissões de Cotações

| Ação | SUPER_ADMIN | ADMIN_COMPRAS | GERENTE_COMPRAS | COORDENADOR_COMPRAS | COMPRADOR_SENIOR | COMPRADOR_PLENO | COMPRADOR_JUNIOR | APROVADOR_N3 | APROVADOR_N2 | APROVADOR_N1 | GESTOR_CC | SOLICITANTE |
|------|-------------|---------------|-----------------|---------------------|------------------|-----------------|------------------|--------------|--------------|--------------|-----------|-------------|
| **Criar Cotação** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Editar Cotação** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Excluir Cotação** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Visualizar Todas** | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ❌ |
| **Aprovar Cotação** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **Rejeitar Cotação** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **Delegar Aprovação** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ⚠️ | ❌ | ❌ |

**Legenda:**
- ✅ = Permissão total
- ⚠️ = Permissão condicional (baseada em valor, centro de custo, etc.)
- ❌ = Sem permissão

### 2.2 Permissões de Solicitações

| Ação | SUPER_ADMIN | ADMIN_COMPRAS | GERENTE_COMPRAS | COORDENADOR_COMPRAS | COMPRADOR_SENIOR | APROVADOR_N3 | APROVADOR_N2 | APROVADOR_N1 | GESTOR_CC | SOLICITANTE_ESP | SOLICITANTE_BAS |
|------|-------------|---------------|-----------------|---------------------|------------------|--------------|--------------|--------------|-----------|-----------------|-----------------|
| **Criar Solicitação** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Editar Solicitação** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| **Cancelar Solicitação** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| **Aprovar Final** | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ |
| **Rejeitar Final** | ✅ | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ❌ |
| **Visualizar Próprias** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Visualizar Todas** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ❌ | ❌ |

### 2.3 Permissões de Configuração

| Ação | SUPER_ADMIN | ADMIN_COMPRAS | GERENTE_COMPRAS | COORDENADOR_COMPRAS | Outros |
|------|-------------|---------------|-----------------|---------------------|--------|
| **Configurar Regras Aprovação** | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| **Definir Limites Valor** | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| **Configurar Notificações** | ✅ | ✅ | ✅ | ⚠️ | ❌ |
| **Gerenciar Usuários** | ✅ | ✅ | ⚠️ | ❌ | ❌ |
| **Configurar Delegações** | ✅ | ✅ | ✅ | ✅ | ⚠️ |

## 3. Regras de Negócio por Role

### 3.1 Limites de Valor por Role

```typescript
const limitesValor = {
  SUPER_ADMIN: { min: 0, max: null },
  ADMIN_COMPRAS: { min: 0, max: null },
  GERENTE_COMPRAS: { min: 0, max: null },
  COORDENADOR_COMPRAS: { min: 0, max: 100000 },
  COMPRADOR_SENIOR: { min: 0, max: 25000 },
  COMPRADOR_PLENO: { min: 0, max: 10000 },
  COMPRADOR_JUNIOR: { min: 0, max: 2500 },
  APROVADOR_NIVEL_3: { min: 50000, max: null },
  APROVADOR_NIVEL_2: { min: 10000, max: 100000 },
  APROVADOR_NIVEL_1: { min: 0, max: 25000 },
  GESTOR_CENTRO_CUSTO: { min: 0, max: 50000 }, // Apenas seu CC
  SOLICITANTE_ESPECIAL: { min: 0, max: null }, // Para solicitação
  SOLICITANTE_BASICO: { min: 0, max: 10000 }, // Para solicitação
};
```

### 3.2 Restrições por Centro de Custo

```typescript
const restricoesCentroCusto = {
  GESTOR_CENTRO_CUSTO: {
    apenasProprioCC: true,
    podeVerOutros: false,
    podeAprovarOutros: false
  },
  APROVADOR_NIVEL_1: {
    apenasProprioCC: false,
    podeVerOutros: true,
    podeAprovarOutros: true,
    limitePorCC: 25000
  },
  SOLICITANTE_BASICO: {
    apenasProprioCC: true,
    podeVerOutros: false,
    podeAprovarOutros: false
  }
};
```

### 3.3 Regras de Delegação

```typescript
const regrasDelegacao = {
  APROVADOR_NIVEL_3: {
    podeDelegarPara: ['APROVADOR_NIVEL_3', 'GERENTE_COMPRAS'],
    podeReceberDe: ['APROVADOR_NIVEL_3'],
    delegacaoAutomatica: true,
    tempoLimite: 24 // horas
  },
  APROVADOR_NIVEL_2: {
    podeDelegarPara: ['APROVADOR_NIVEL_2', 'APROVADOR_NIVEL_3'],
    podeReceberDe: ['APROVADOR_NIVEL_2', 'APROVADOR_NIVEL_3'],
    delegacaoAutomatica: true,
    tempoLimite: 12
  },
  APROVADOR_NIVEL_1: {
    podeDelegarPara: ['APROVADOR_NIVEL_1', 'APROVADOR_NIVEL_2'],
    podeReceberDe: ['APROVADOR_NIVEL_1'],
    delegacaoAutomatica: false,
    tempoLimite: 8
  }
};
```

## 4. Implementação de Permissões

### 4.1 Middleware de Autorização

```typescript
// Verificar permissão para aprovar cotação
export const verificarPermissaoAprovacaoCotacao = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cotacaoId } = req.params;
    const usuario = req.user;
    
    // Buscar dados da cotação
    const cotacao = await prisma.cotacao.findUnique({
      where: { id: cotacaoId },
      include: {
        solicitacao: {
          include: {
            solicitante: true,
            centroCusto: true
          }
        }
      }
    });
    
    if (!cotacao) {
      return res.status(404).json({ error: 'Cotação não encontrada' });
    }
    
    // Verificar se não é o próprio solicitante
    if (cotacao.solicitacao.solicitanteId === usuario.id) {
      return res.status(403).json({ 
        error: 'Solicitante não pode aprovar própria cotação' 
      });
    }
    
    // Verificar role e limites
    const podeAprovar = await verificarPermissaoAprovacao(
      usuario,
      cotacao.valorTotal,
      cotacao.solicitacao.centroCustoId,
      'COTACAO'
    );
    
    if (!podeAprovar) {
      return res.status(403).json({ 
        error: 'Usuário não tem permissão para aprovar esta cotação' 
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Função auxiliar para verificar permissão
const verificarPermissaoAprovacao = async (
  usuario: Usuario,
  valor: number,
  centroCustoId: string,
  tipo: 'COTACAO' | 'SOLICITACAO'
) => {
  // Verificar role
  const rolesAprovacao = [
    'SUPER_ADMIN',
    'ADMIN_COMPRAS',
    'GERENTE_COMPRAS',
    'COORDENADOR_COMPRAS',
    'COMPRADOR_SENIOR',
    'COMPRADOR_PLENO',
    'COMPRADOR_JUNIOR',
    'APROVADOR_NIVEL_3',
    'APROVADOR_NIVEL_2',
    'APROVADOR_NIVEL_1',
    'GESTOR_CENTRO_CUSTO'
  ];
  
  if (!rolesAprovacao.includes(usuario.role)) {
    return false;
  }
  
  // Verificar limite de valor
  const limite = limitesValor[usuario.role];
  if (limite.max && valor > limite.max) {
    return false;
  }
  
  // Verificar centro de custo
  if (usuario.role === 'GESTOR_CENTRO_CUSTO') {
    const gestorCC = await prisma.gestorCentroCusto.findFirst({
      where: {
        usuarioId: usuario.id,
        centroCustoId: centroCustoId
      }
    });
    
    if (!gestorCC) {
      return false;
    }
  }
  
  return true;
};
```

### 4.2 Decorators de Permissão

```typescript
// Decorator para verificar role
export const RequireRole = (roles: string[]) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const req = args[0];
      const res = args[1];
      
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: 'Acesso negado - Role insuficiente' 
        });
      }
      
      return method.apply(this, args);
    };
  };
};

// Decorator para verificar limite de valor
export const RequireValueLimit = (maxValue?: number) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const req = args[0];
      const res = args[1];
      const { valor } = req.body;
      
      const limite = limitesValor[req.user.role];
      
      if (limite.max && valor > limite.max) {
        return res.status(403).json({ 
          error: `Valor excede limite permitido: R$ ${limite.max}` 
        });
      }
      
      return method.apply(this, args);
    };
  };
};

// Uso dos decorators
class CotacaoController {
  @RequireRole(['APROVADOR_NIVEL_1', 'APROVADOR_NIVEL_2', 'APROVADOR_NIVEL_3'])
  @RequireValueLimit()
  async aprovarCotacao(req: Request, res: Response) {
    // Lógica de aprovação
  }
}
```

### 4.3 Sistema de Permissões Dinâmicas

```typescript
// Configuração de permissões por empresa
interface ConfiguracaoPermissoes {
  empresaId: string;
  roles: {
    [roleName: string]: {
      permissoes: string[];
      limitesValor: {
        cotacao: number;
        solicitacao: number;
      };
      centrosCusto: string[];
      configuracoes: {
        delegacao: boolean;
        aprovacaoAutomatica: boolean;
        notificacoes: boolean;
      };
    };
  };
}

// Carregar configurações da empresa
const carregarConfiguracaoPermissoes = async (empresaId: string) => {
  const config = await prisma.configuracaoPermissoes.findUnique({
    where: { empresaId }
  });
  
  return config || configuracaoPadrao;
};

// Verificar permissão dinâmica
const verificarPermissaoDinamica = async (
  usuario: Usuario,
  acao: string,
  recurso: any
) => {
  const config = await carregarConfiguracaoPermissoes(usuario.empresaId);
  const roleConfig = config.roles[usuario.role];
  
  if (!roleConfig) {
    return false;
  }
  
  // Verificar se tem a permissão
  if (!roleConfig.permissoes.includes(acao)) {
    return false;
  }
  
  // Verificar limites específicos
  if (acao.includes('aprovar') && recurso.valor) {
    const limite = acao.includes('cotacao') 
      ? roleConfig.limitesValor.cotacao
      : roleConfig.limitesValor.solicitacao;
      
    if (recurso.valor > limite) {
      return false;
    }
  }
  
  return true;
};
```

## 5. Auditoria de Permissões

### 5.1 Log de Acessos

```typescript
// Middleware para log de acessos
export const logAcesso = (acao: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const logData = {
      usuarioId: req.user.id,
      acao,
      recurso: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date(),
      parametros: {
        params: req.params,
        query: req.query,
        body: sanitizeBody(req.body)
      }
    };
    
    // Salvar log assíncrono
    prisma.logAcesso.create({ data: logData }).catch(console.error);
    
    next();
  };
};

// Sanitizar dados sensíveis
const sanitizeBody = (body: any) => {
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.token;
  return sanitized;
};
```

### 5.2 Relatório de Permissões

```typescript
// Gerar relatório de uso de permissões
export const gerarRelatorioPermissoes = async (
  empresaId: string,
  dataInicio: Date,
  dataFim: Date
) => {
  const logs = await prisma.logAcesso.findMany({
    where: {
      usuario: { empresaId },
      timestamp: {
        gte: dataInicio,
        lte: dataFim
      }
    },
    include: {
      usuario: {
        select: {
          nome: true,
          email: true,
          role: true
        }
      }
    }
  });
  
  // Agrupar por usuário e ação
  const relatorio = logs.reduce((acc, log) => {
    const key = `${log.usuarioId}-${log.acao}`;
    if (!acc[key]) {
      acc[key] = {
        usuario: log.usuario,
        acao: log.acao,
        quantidade: 0,
        ultimoAcesso: log.timestamp
      };
    }
    acc[key].quantidade++;
    if (log.timestamp > acc[key].ultimoAcesso) {
      acc[key].ultimoAcesso = log.timestamp;
    }
    return acc;
  }, {});
  
  return Object.values(relatorio);
};
```

## 6. Configuração de Roles no Banco

### 6.1 Tabela de Roles

```sql
CREATE TABLE roles (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  nivel_hierarquia INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir roles padrão
INSERT INTO roles (id, nome, descricao, nivel_hierarquia) VALUES
('SUPER_ADMIN', 'Super Administrador', 'Acesso total ao sistema', 10),
('ADMIN_COMPRAS', 'Administrador de Compras', 'Administração do módulo de compras', 9),
('GERENTE_COMPRAS', 'Gerente de Compras', 'Gerenciamento geral de compras', 8),
('COORDENADOR_COMPRAS', 'Coordenador de Compras', 'Coordenação da equipe de compras', 7),
('COMPRADOR_SENIOR', 'Comprador Sênior', 'Comprador experiente', 6),
('COMPRADOR_PLENO', 'Comprador Pleno', 'Comprador intermediário', 5),
('COMPRADOR_JUNIOR', 'Comprador Júnior', 'Comprador iniciante', 4),
('APROVADOR_NIVEL_3', 'Aprovador Nível 3', 'Aprovação de valores altos', 8),
('APROVADOR_NIVEL_2', 'Aprovador Nível 2', 'Aprovação de valores médios', 6),
('APROVADOR_NIVEL_1', 'Aprovador Nível 1', 'Aprovação de valores baixos', 4),
('GESTOR_CENTRO_CUSTO', 'Gestor de Centro de Custo', 'Gestão de centro de custo específico', 5),
('SOLICITANTE_ESPECIAL', 'Solicitante Especial', 'Solicitante com privilégios especiais', 3),
('SOLICITANTE_BASICO', 'Solicitante Básico', 'Solicitante padrão', 2);
```

### 6.2 Tabela de Permissões

```sql
CREATE TABLE permissoes (
  id VARCHAR(50) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  descricao TEXT,
  modulo VARCHAR(50),
  recurso VARCHAR(50),
  acao VARCHAR(50),
  ativo BOOLEAN DEFAULT true
);

-- Inserir permissões
INSERT INTO permissoes (id, nome, descricao, modulo, recurso, acao) VALUES
('COTACAO_CRIAR', 'Criar Cotação', 'Permissão para criar cotações', 'compras', 'cotacao', 'criar'),
('COTACAO_EDITAR', 'Editar Cotação', 'Permissão para editar cotações', 'compras', 'cotacao', 'editar'),
('COTACAO_EXCLUIR', 'Excluir Cotação', 'Permissão para excluir cotações', 'compras', 'cotacao', 'excluir'),
('COTACAO_APROVAR', 'Aprovar Cotação', 'Permissão para aprovar cotações', 'compras', 'cotacao', 'aprovar'),
('COTACAO_REJEITAR', 'Rejeitar Cotação', 'Permissão para rejeitar cotações', 'compras', 'cotacao', 'rejeitar'),
('SOLICITACAO_APROVAR_FINAL', 'Aprovação Final', 'Permissão para aprovação final de solicitações', 'compras', 'solicitacao', 'aprovar_final');
```

### 6.3 Tabela de Relacionamento Role-Permissão

```sql
CREATE TABLE role_permissoes (
  role_id VARCHAR(50),
  permissao_id VARCHAR(50),
  limite_valor DECIMAL(15,2),
  condicoes JSON,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permissao_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permissao_id) REFERENCES permissoes(id)
);
```

## 7. Testes de Permissões

### 7.1 Testes Unitários

```typescript
describe('Sistema de Permissões', () => {
  describe('Aprovação de Cotações', () => {
    test('APROVADOR_NIVEL_1 deve poder aprovar cotação até R$ 25.000', async () => {
      const usuario = { role: 'APROVADOR_NIVEL_1', id: 'user1' };
      const cotacao = { valorTotal: 20000, solicitanteId: 'user2' };
      
      const podeAprovar = await verificarPermissaoAprovacao(
        usuario, 
        cotacao.valorTotal, 
        'cc1', 
        'COTACAO'
      );
      
      expect(podeAprovar).toBe(true);
    });
    
    test('APROVADOR_NIVEL_1 NÃO deve poder aprovar cotação acima de R$ 25.000', async () => {
      const usuario = { role: 'APROVADOR_NIVEL_1', id: 'user1' };
      const cotacao = { valorTotal: 30000, solicitanteId: 'user2' };
      
      const podeAprovar = await verificarPermissaoAprovacao(
        usuario, 
        cotacao.valorTotal, 
        'cc1', 
        'COTACAO'
      );
      
      expect(podeAprovar).toBe(false);
    });
    
    test('Solicitante NÃO deve poder aprovar própria cotação', async () => {
      const usuario = { role: 'APROVADOR_NIVEL_2', id: 'user1' };
      const cotacao = { valorTotal: 15000, solicitanteId: 'user1' };
      
      const podeAprovar = await verificarPermissaoAprovacao(
        usuario, 
        cotacao.valorTotal, 
        'cc1', 
        'COTACAO'
      );
      
      expect(podeAprovar).toBe(false);
    });
  });
  
  describe('Gestão de Centro de Custo', () => {
    test('GESTOR_CENTRO_CUSTO deve poder aprovar apenas seu CC', async () => {
      const usuario = { 
        role: 'GESTOR_CENTRO_CUSTO', 
        id: 'user1',
        centrosCusto: ['cc1'] 
      };
      
      const podeAprovarCC1 = await verificarPermissaoAprovacao(
        usuario, 
        10000, 
        'cc1', 
        'COTACAO'
      );
      
      const podeAprovarCC2 = await verificarPermissaoAprovacao(
        usuario, 
        10000, 
        'cc2', 
        'COTACAO'
      );
      
      expect(podeAprovarCC1).toBe(true);
      expect(podeAprovarCC2).toBe(false);
    });
  });
});
```

### 7.2 Testes de Integração

```typescript
describe('Integração de Permissões', () => {
  test('Fluxo completo de aprovação com diferentes níveis', async () => {
    // 1. Solicitante cria solicitação
    // 2. Comprador cria cotação
    // 3. Aprovador nível 1 aprova cotação
    // 4. Aprovador nível 2 aprova solicitação final
    // 5. Verificar estado final
  });
  
  test('Delegação de aprovação deve funcionar corretamente', async () => {
    // 1. Aprovador delega para outro usuário
    // 2. Usuário delegado aprova
    // 3. Verificar logs de auditoria
  });
});
```

## 8. Monitoramento de Permissões

### 8.1 Alertas de Segurança

```typescript
// Detectar tentativas de acesso não autorizado
const detectarAcessoNaoAutorizado = async () => {
  const tentativasNegadas = await prisma.logAcesso.findMany({
    where: {
      resultado: 'NEGADO',
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
      }
    },
    include: { usuario: true }
  });
  
  // Agrupar por usuário
  const tentativasPorUsuario = tentativasNegadas.reduce((acc, log) => {
    acc[log.usuarioId] = (acc[log.usuarioId] || 0) + 1;
    return acc;
  }, {});
  
  // Alertar se muitas tentativas
  Object.entries(tentativasPorUsuario).forEach(([usuarioId, tentativas]) => {
    if (tentativas > 10) {
      enviarAlertaSeguranca(usuarioId, tentativas);
    }
  });
};
```

### 8.2 Dashboard de Permissões

```typescript
// Métricas para dashboard
const obterMetricasPermissoes = async (empresaId: string) => {
  return {
    usuariosPorRole: await contarUsuariosPorRole(empresaId),
    aprovacoesPorNivel: await contarAprovacoesPorNivel(empresaId),
    tentativasNegadas: await contarTentativasNegadas(empresaId),
    delegacoesAtivas: await contarDelegacoesAtivas(empresaId),
    configuracoesPersonalizadas: await contarConfiguracoesPersonalizadas(empresaId)
  };
};
```
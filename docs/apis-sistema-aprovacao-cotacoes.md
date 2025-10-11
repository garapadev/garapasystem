# APIs do Sistema de Aprovação de Cotações

## 1. Endpoints Principais

### 1.1 Gestão de Cotações

#### GET /api/cotacoes/pendentes-aprovacao
**Descrição**: Lista cotações pendentes de aprovação para o usuário logado

**Parâmetros Query**:
```typescript
{
  page?: number;
  limit?: number;
  status?: StatusAprovacaoCotacao;
  valorMin?: number;
  valorMax?: number;
  dataInicio?: string;
  dataFim?: string;
  fornecedor?: string;
  categoria?: string;
}
```

**Resposta**:
```typescript
{
  data: {
    cotacoes: Array<{
      id: string;
      numero: string;
      titulo: string;
      solicitacao: {
        numero: string;
        titulo: string;
        solicitante: string;
      };
      valorTotal: number;
      dataAbertura: string;
      prazoResposta: string;
      statusAprovacao: StatusAprovacaoCotacao;
      quantidadePropostas: number;
      propostas: Array<{
        id: string;
        fornecedor: string;
        valorTotal: number;
        prazoEntrega: number;
        pontuacao?: number;
      }>;
      aprovacao: {
        nivel: number;
        isObrigatorio: boolean;
        dataLimite: string;
      };
    }>;
    total: number;
    totalPages: number;
    currentPage: number;
  };
  success: boolean;
}
```

#### GET /api/cotacoes/:id/detalhes-aprovacao
**Descrição**: Obtém detalhes completos de uma cotação para aprovação

**Resposta**:
```typescript
{
  data: {
    cotacao: {
      id: string;
      numero: string;
      titulo: string;
      descricao: string;
      solicitacao: {
        numero: string;
        titulo: string;
        descricao: string;
        solicitante: Usuario;
        centroCusto: string;
        urgencia: string;
      };
      itens: Array<{
        id: string;
        produto: string;
        descricao: string;
        quantidade: number;
        unidade: string;
        especificacoes: string;
      }>;
      propostas: Array<{
        id: string;
        fornecedor: {
          id: string;
          nome: string;
          cnpj: string;
          avaliacaoMedia: number;
        };
        valorTotal: number;
        prazoEntrega: number;
        condicoesPagamento: string;
        observacoes: string;
        itens: Array<{
          produtoId: string;
          valorUnitario: number;
          valorTotal: number;
          marca: string;
          modelo: string;
        }>;
        pontuacao: {
          total: number;
          preco: number;
          prazo: number;
          qualidade: number;
          pagamento: number;
        };
        vantagens: string[];
        desvantagens: string[];
      }>;
      analiseComparativa: {
        menorPreco: number;
        maiorPreco: number;
        precoMedio: number;
        economiaMaxima: number;
        melhorPrazo: number;
        piorPrazo: number;
      };
      configuracaoAprovacao: {
        nivel: number;
        valorLimite: number;
        tempoLimite: number;
        criteriosObrigatorios: string[];
      };
    };
  };
  success: boolean;
}
```

#### POST /api/cotacoes/:id/aprovar
**Descrição**: Aprova uma cotação específica

**Body**:
```typescript
{
  propostaVencedoraId: string;
  justificativa: string;
  criteriosAvaliacao: {
    preco: number;
    prazo: number;
    qualidade: number;
    pagamento: number;
    experiencia: number;
  };
  analiseCusto: string;
  analiseQualidade: string;
  analisePrazo: string;
  analiseRisco: string;
  vantagens: string;
  desvantagens?: string;
  observacoes?: string;
}
```

**Resposta**:
```typescript
{
  data: {
    aprovacao: {
      id: string;
      status: "APROVADA";
      dataAprovacao: string;
      propostaVencedora: {
        id: string;
        fornecedor: string;
        valorTotal: number;
      };
      economiaGerada: number;
      proximaEtapa: "APROVACAO_FINAL";
    };
  };
  success: boolean;
  message: string;
}
```

#### POST /api/cotacoes/:id/rejeitar
**Descrição**: Rejeita uma cotação

**Body**:
```typescript
{
  motivo: string;
  justificativa: string;
  sugestoes?: string;
  solicitarNovaCotacao: boolean;
}
```

#### POST /api/cotacoes/:id/delegar
**Descrição**: Delega aprovação para outro usuário

**Body**:
```typescript
{
  usuarioId: string;
  motivo: string;
  prazoLimite?: string;
  observacoes?: string;
}
```

### 1.2 Gestão de Solicitações (Segunda Etapa)

#### GET /api/solicitacoes/pendentes-aprovacao-final
**Descrição**: Lista solicitações com cotação aprovada, pendentes de aprovação final

**Resposta**:
```typescript
{
  data: {
    solicitacoes: Array<{
      id: string;
      numero: string;
      titulo: string;
      solicitante: string;
      valorTotal: number;
      cotacaoAprovada: {
        numero: string;
        propostaVencedora: {
          fornecedor: string;
          valorTotal: number;
          prazoEntrega: number;
        };
        dataAprovacao: string;
        aprovadoPor: string;
        economiaGerada: number;
      };
      statusAprovacaoFinal: StatusAprovacao;
      dataLimiteAprovacao: string;
    }>;
  };
  success: boolean;
}
```

#### POST /api/solicitacoes/:id/aprovar-final
**Descrição**: Aprovação final da solicitação de compra

**Body**:
```typescript
{
  justificativa: string;
  observacoes?: string;
  gerarPedidoAutomatico: boolean;
  dataEntregaDesejada?: string;
}
```

#### POST /api/solicitacoes/:id/rejeitar-final
**Descrição**: Rejeita a aprovação final da solicitação

**Body**:
```typescript
{
  motivo: string;
  justificativa: string;
  voltarParaCotacao: boolean;
  sugestoes?: string;
}
```

### 1.3 Configurações de Aprovação

#### GET /api/configuracoes-aprovacao
**Descrição**: Lista configurações de aprovação da empresa

#### POST /api/configuracoes-aprovacao
**Descrição**: Cria nova configuração de aprovação

**Body**:
```typescript
{
  tipo: TipoConfiguracaoAprovacao;
  valorMinimo: number;
  valorMaximo?: number;
  niveisRequeridos: number;
  nivel1AprovadorRole: string;
  nivel2AprovadorRole?: string;
  nivel3AprovadorRole?: string;
  tempoLimiteHoras?: number;
  aprovacaoAutomatica: boolean;
  criteriosAutomaticos?: object;
  permiteDelegacao: boolean;
  notificacoes: {
    email: boolean;
    sistema: boolean;
    whatsapp: boolean;
  };
}
```

#### PUT /api/configuracoes-aprovacao/:id
**Descrição**: Atualiza configuração de aprovação

#### DELETE /api/configuracoes-aprovacao/:id
**Descrição**: Remove configuração de aprovação

### 1.4 Relatórios e Dashboards

#### GET /api/relatorios/aprovacoes
**Descrição**: Relatório de aprovações

**Parâmetros Query**:
```typescript
{
  dataInicio: string;
  dataFim: string;
  tipo?: TipoAprovacao;
  status?: string;
  aprovador?: string;
  formato?: 'json' | 'excel' | 'pdf';
}
```

#### GET /api/dashboard/aprovacoes
**Descrição**: Dashboard de aprovações

**Resposta**:
```typescript
{
  data: {
    resumo: {
      totalPendentes: number;
      totalAprovadas: number;
      totalRejeitadas: number;
      valorTotalPendente: number;
      tempoMedioAprovacao: number;
    };
    cotacoesPendentes: number;
    solicitacoesPendentes: number;
    aprovacoesVencidas: number;
    economiaGerada: number;
    graficos: {
      aprovacoesUltimos30Dias: Array<{
        data: string;
        aprovadas: number;
        rejeitadas: number;
      }>;
      distribuicaoPorAprovador: Array<{
        aprovador: string;
        quantidade: number;
        tempoMedio: number;
      }>;
      economiasPorMes: Array<{
        mes: string;
        economia: number;
      }>;
    };
  };
  success: boolean;
}
```

## 2. Webhooks e Notificações

### 2.1 Webhooks de Aprovação

#### POST /webhooks/cotacao-aprovada
**Payload**:
```typescript
{
  event: "cotacao.aprovada";
  timestamp: string;
  data: {
    cotacaoId: string;
    solicitacaoId: string;
    aprovadorId: string;
    propostaVencedoraId: string;
    valorTotal: number;
    economiaGerada: number;
  };
}
```

#### POST /webhooks/cotacao-rejeitada
**Payload**:
```typescript
{
  event: "cotacao.rejeitada";
  timestamp: string;
  data: {
    cotacaoId: string;
    solicitacaoId: string;
    aprovadorId: string;
    motivo: string;
  };
}
```

#### POST /webhooks/solicitacao-aprovada-final
**Payload**:
```typescript
{
  event: "solicitacao.aprovada_final";
  timestamp: string;
  data: {
    solicitacaoId: string;
    cotacaoId: string;
    aprovadorId: string;
    valorTotal: number;
    gerarPedido: boolean;
  };
}
```

#### POST /webhooks/aprovacao-delegada
**Payload**:
```typescript
{
  event: "aprovacao.delegada";
  timestamp: string;
  data: {
    aprovacaoId: string;
    delegadoPor: string;
    delegadoPara: string;
    motivo: string;
    tipo: TipoAprovacao;
  };
}
```

### 2.2 Sistema de Notificações

#### POST /api/notificacoes/enviar
**Descrição**: Envia notificação personalizada

**Body**:
```typescript
{
  tipo: "email" | "sistema" | "whatsapp";
  destinatarios: string[];
  assunto: string;
  mensagem: string;
  dados?: object;
  template?: string;
  prioridade: "baixa" | "media" | "alta" | "urgente";
}
```

#### GET /api/notificacoes/templates
**Descrição**: Lista templates de notificação disponíveis

#### Templates Padrão:

1. **cotacao-pendente-aprovacao**
2. **cotacao-aprovada**
3. **cotacao-rejeitada**
4. **solicitacao-pendente-aprovacao-final**
5. **solicitacao-aprovada-final**
6. **aprovacao-delegada**
7. **lembrete-aprovacao-pendente**
8. **aprovacao-vencida**

## 3. APIs de Integração

### 3.1 Integração com Módulo de Estoque

#### POST /api/integracoes/estoque/verificar-disponibilidade
**Descrição**: Verifica disponibilidade de produtos antes da aprovação

**Body**:
```typescript
{
  itens: Array<{
    produtoId: string;
    quantidade: number;
  }>;
}
```

#### POST /api/integracoes/estoque/reservar-produtos
**Descrição**: Reserva produtos após aprovação da cotação

### 3.2 Integração com Módulo Financeiro

#### POST /api/integracoes/financeiro/verificar-orcamento
**Descrição**: Verifica disponibilidade orçamentária

**Body**:
```typescript
{
  centroCustoId: string;
  valor: number;
  categoria: string;
  mes: number;
  ano: number;
}
```

#### POST /api/integracoes/financeiro/comprometer-orcamento
**Descrição**: Compromete valor no orçamento após aprovação

### 3.3 Integração com Módulo de Fornecedores

#### GET /api/integracoes/fornecedores/:id/historico-aprovacoes
**Descrição**: Histórico de aprovações do fornecedor

#### GET /api/integracoes/fornecedores/:id/performance-entregas
**Descrição**: Performance de entregas do fornecedor

## 4. APIs de Auditoria e Logs

### 4.1 Logs de Aprovação

#### GET /api/logs/aprovacoes
**Descrição**: Lista logs de aprovação

**Parâmetros Query**:
```typescript
{
  solicitacaoId?: string;
  cotacaoId?: string;
  usuarioId?: string;
  acao?: AcaoAprovacao;
  dataInicio?: string;
  dataFim?: string;
  page?: number;
  limit?: number;
}
```

#### GET /api/logs/aprovacoes/:id/detalhes
**Descrição**: Detalhes de um log específico

### 4.2 Auditoria de Alterações

#### GET /api/auditoria/cotacoes/:id
**Descrição**: Histórico de alterações de uma cotação

#### GET /api/auditoria/solicitacoes/:id
**Descrição**: Histórico de alterações de uma solicitação

## 5. APIs de Análise e BI

### 5.1 Análises de Performance

#### GET /api/analises/tempo-aprovacao
**Descrição**: Análise de tempo de aprovação

**Resposta**:
```typescript
{
  data: {
    tempoMedio: number;
    tempoMediano: number;
    tempoMinimo: number;
    tempoMaximo: number;
    distribuicao: Array<{
      faixa: string;
      quantidade: number;
      percentual: number;
    }>;
    porAprovador: Array<{
      aprovador: string;
      tempoMedio: number;
      quantidade: number;
    }>;
  };
}
```

#### GET /api/analises/economia-gerada
**Descrição**: Análise de economia gerada

#### GET /api/analises/taxa-aprovacao
**Descrição**: Taxa de aprovação por período

### 5.2 Indicadores de Performance

#### GET /api/kpis/aprovacoes
**Descrição**: KPIs de aprovação

**Resposta**:
```typescript
{
  data: {
    sla: {
      cumprimento: number; // Percentual
      meta: number;
      status: "verde" | "amarelo" | "vermelho";
    };
    produtividade: {
      aprovacoesHoje: number;
      aprovacoesUltimos7Dias: number;
      aprovacoesUltimos30Dias: number;
    };
    qualidade: {
      taxaRejeicao: number;
      motivosRejeicao: Array<{
        motivo: string;
        quantidade: number;
      }>;
    };
    economia: {
      totalEconomizado: number;
      percentualEconomia: number;
      metaEconomia: number;
    };
  };
}
```

## 6. Middleware e Validações

### 6.1 Middleware de Autorização

```typescript
// Verificar se usuário pode aprovar cotação
const verificarPermissaoAprovacaoCotacao = (req, res, next) => {
  const { cotacaoId } = req.params;
  const { usuarioId, nivelAprovacao, valorLimite } = req.user;
  
  // Verificar nível e valor limite
  // Verificar se não é o próprio solicitante
  // Verificar configurações da empresa
};

// Verificar se usuário pode aprovar solicitação final
const verificarPermissaoAprovacaoFinal = (req, res, next) => {
  // Lógica similar para aprovação final
};
```

### 6.2 Validações de Negócio

```typescript
// Validar se cotação pode ser aprovada
const validarAprovacaoCotacao = async (cotacaoId, propostaId) => {
  // Verificar se cotação está no status correto
  // Verificar se proposta existe e é válida
  // Verificar se não há aprovação pendente
  // Verificar critérios obrigatórios
};

// Validar se solicitação pode ter aprovação final
const validarAprovacaoFinal = async (solicitacaoId) => {
  // Verificar se tem cotação aprovada
  // Verificar orçamento disponível
  // Verificar se não foi aprovada anteriormente
};
```

## 7. Rate Limiting e Segurança

### 7.1 Rate Limiting

```typescript
// Limites por endpoint
const rateLimits = {
  '/api/cotacoes/*/aprovar': '5 per minute',
  '/api/cotacoes/*/rejeitar': '10 per minute',
  '/api/solicitacoes/*/aprovar-final': '3 per minute',
  '/api/notificacoes/enviar': '20 per minute',
};
```

### 7.2 Validações de Segurança

1. **Autenticação JWT**: Todos os endpoints requerem token válido
2. **Autorização RBAC**: Verificação de roles e permissões
3. **Validação de Entrada**: Sanitização de todos os inputs
4. **Auditoria**: Log de todas as ações sensíveis
5. **Criptografia**: Dados sensíveis criptografados
6. **HTTPS**: Comunicação segura obrigatória

## 8. Documentação OpenAPI

### 8.1 Especificação Swagger

```yaml
openapi: 3.0.0
info:
  title: API Sistema de Aprovação de Cotações
  version: 1.0.0
  description: APIs para gestão do sistema de aprovação de cotações

paths:
  /api/cotacoes/pendentes-aprovacao:
    get:
      summary: Lista cotações pendentes de aprovação
      tags: [Cotações]
      security:
        - bearerAuth: []
      parameters:
        - name: page
          in: query
          schema:
            type: integer
        - name: limit
          in: query
          schema:
            type: integer
      responses:
        200:
          description: Lista de cotações
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CotacoesPendentesResponse'
```

### 8.2 Schemas de Dados

```yaml
components:
  schemas:
    CotacaoAprovacao:
      type: object
      properties:
        id:
          type: string
        numero:
          type: string
        titulo:
          type: string
        valorTotal:
          type: number
        statusAprovacao:
          $ref: '#/components/schemas/StatusAprovacaoCotacao'
```

## 9. Testes de API

### 9.1 Testes Unitários

```typescript
describe('Aprovação de Cotações', () => {
  test('deve aprovar cotação com dados válidos', async () => {
    const response = await request(app)
      .post('/api/cotacoes/123/aprovar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        propostaVencedoraId: 'prop123',
        justificativa: 'Melhor custo-benefício',
        criteriosAvaliacao: {
          preco: 9,
          prazo: 8,
          qualidade: 9
        }
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### 9.2 Testes de Integração

```typescript
describe('Fluxo Completo de Aprovação', () => {
  test('deve completar fluxo de duas etapas', async () => {
    // 1. Criar solicitação
    // 2. Criar cotação
    // 3. Adicionar propostas
    // 4. Aprovar cotação
    // 5. Aprovar solicitação final
    // 6. Verificar estado final
  });
});
```

## 10. Monitoramento e Métricas

### 10.1 Métricas de API

1. **Latência**: Tempo de resposta por endpoint
2. **Throughput**: Requisições por segundo
3. **Taxa de Erro**: Percentual de erros 4xx/5xx
4. **Disponibilidade**: Uptime do serviço

### 10.2 Métricas de Negócio

1. **Tempo Médio de Aprovação**: Por tipo e valor
2. **Taxa de Aprovação**: Percentual de aprovações vs rejeições
3. **Economia Gerada**: Valor economizado nas aprovações
4. **SLA de Aprovação**: Cumprimento dos prazos estabelecidos
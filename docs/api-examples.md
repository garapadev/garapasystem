# Exemplos Práticos - API GarapaSystem

## Configuração Inicial

### Variáveis de Ambiente
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL="postgresql://user:password@localhost:5432/garapasystem"
API_BASE_URL=http://localhost:3000/api
```

### Headers Padrão
```javascript
const defaultHeaders = {
  'Authorization': 'Bearer YOUR_API_KEY',
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};
```

## Cenários de Uso Completos

### 1. Fluxo Completo: Cliente → Orçamento → Ordem de Serviço → Tarefa

#### Passo 1: Criar Cliente
```javascript
// POST /api/clientes
const novoCliente = {
  nome: "Empresa ABC Ltda",
  email: "contato@empresaabc.com",
  telefone: "(11) 3333-4444",
  documento: "12.345.678/0001-90",
  tipo: "juridica",
  enderecos: [{
    logradouro: "Av. Paulista, 1000",
    numero: "1000",
    complemento: "Sala 101",
    bairro: "Bela Vista",
    cidade: "São Paulo",
    estado: "SP",
    cep: "01310-100",
    principal: true
  }],
  contatos: [{
    nome: "João Silva",
    email: "joao@empresaabc.com",
    telefone: "(11) 99999-8888",
    cargo: "Gerente",
    principal: true
  }]
};

const cliente = await fetch('/api/clientes', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify(novoCliente)
}).then(res => res.json());

console.log('Cliente criado:', cliente.id);
```

#### Passo 2: Criar Orçamento
```javascript
// POST /api/orcamentos
const novoOrcamento = {
  clienteId: cliente.id,
  titulo: "Implementação Sistema ERP",
  descricao: "Orçamento para implementação completa do sistema ERP",
  status: "rascunho",
  validadeAte: "2024-02-15T23:59:59Z",
  observacoes: "Prazo de implementação: 90 dias",
  itens: [
    {
      descricao: "Licença do sistema ERP",
      quantidade: 1,
      valorUnitario: 15000.00,
      categoria: "software"
    },
    {
      descricao: "Implementação e configuração",
      quantidade: 80,
      valorUnitario: 150.00,
      categoria: "servico"
    },
    {
      descricao: "Treinamento da equipe",
      quantidade: 16,
      valorUnitario: 200.00,
      categoria: "treinamento"
    }
  ]
};

const orcamento = await fetch('/api/orcamentos', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify(novoOrcamento)
}).then(res => res.json());

console.log('Orçamento criado:', orcamento.id);
```

#### Passo 3: Aprovar Orçamento e Criar Ordem de Serviço
```javascript
// PUT /api/orcamentos/[id] - Aprovar orçamento
await fetch(`/api/orcamentos/${orcamento.id}`, {
  method: 'PUT',
  headers: defaultHeaders,
  body: JSON.stringify({
    ...orcamento,
    status: 'aprovado',
    dataAprovacao: new Date().toISOString()
  })
});

// POST /api/ordens-servico
const novaOrdem = {
  clienteId: cliente.id,
  orcamentoId: orcamento.id,
  titulo: "OS - Implementação Sistema ERP",
  descricao: "Ordem de serviço para implementação do sistema ERP conforme orçamento aprovado",
  status: "aberta",
  prioridade: "alta",
  dataAgendamento: "2024-01-22T09:00:00Z",
  responsavelId: "clb_123", // ID do colaborador responsável
  itens: orcamento.itens.map(item => ({
    ...item,
    status: "pendente"
  }))
};

const ordemServico = await fetch('/api/ordens-servico', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify(novaOrdem)
}).then(res => res.json());

console.log('Ordem de serviço criada:', ordemServico.id);
```

#### Passo 4: Criar Tarefas Relacionadas
```javascript
// POST /api/tasks - Criar múltiplas tarefas
const tarefas = [
  {
    titulo: "Análise de requisitos",
    descricao: "Levantar requisitos específicos do cliente",
    status: "pendente",
    prioridade: "alta",
    dataVencimento: "2024-01-25T17:00:00Z",
    responsavelId: "clb_123",
    clienteId: cliente.id,
    ordemServicoId: ordemServico.id,
    categoria: "analise"
  },
  {
    titulo: "Configuração do ambiente",
    descricao: "Preparar ambiente de desenvolvimento e produção",
    status: "pendente",
    prioridade: "media",
    dataVencimento: "2024-01-30T17:00:00Z",
    responsavelId: "clb_124",
    clienteId: cliente.id,
    ordemServicoId: ordemServico.id,
    categoria: "configuracao"
  }
];

for (const tarefa of tarefas) {
  const novaTarefa = await fetch('/api/tasks', {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(tarefa)
  }).then(res => res.json());
  
  console.log('Tarefa criada:', novaTarefa.id);
}
```

### 2. Integração com WhatsApp

#### Conectar WhatsApp
```javascript
// POST /api/whatsapp/connect
const conexao = await fetch('/api/whatsapp/connect', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify({
    sessionName: 'principal',
    webhook: 'https://seu-sistema.com/webhook/whatsapp'
  })
}).then(res => res.json());

console.log('QR Code:', conexao.qrCode);
```

#### Enviar Mensagem
```javascript
// POST /api/whatsapp/send-message
const mensagem = await fetch('/api/whatsapp/send-message', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify({
    to: '5511999998888',
    message: 'Olá! Seu orçamento foi aprovado. Em breve entraremos em contato.',
    clienteId: cliente.id
  })
}).then(res => res.json());

console.log('Mensagem enviada:', mensagem.id);
```

### 3. Sincronização de E-mails

#### Configurar Conta de E-mail
```javascript
// POST /api/email-config
const emailConfig = await fetch('/api/email-config', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify({
    email: 'suporte@empresa.com',
    senha: 'senha-do-email',
    servidor: 'imap.gmail.com',
    porta: 993,
    ssl: true,
    ativo: true
  })
}).then(res => res.json());
```

#### Sincronizar E-mails
```javascript
// POST /api/email-sync
const sincronizacao = await fetch('/api/email-sync', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify({
    configId: emailConfig.id,
    dataInicio: '2024-01-01T00:00:00Z',
    dataFim: '2024-01-31T23:59:59Z'
  })
}).then(res => res.json());

console.log('Sincronização iniciada:', sincronizacao.jobId);
```

### 4. Sistema de Webhooks

#### Criar Webhook
```javascript
// POST /api/webhooks
const webhook = await fetch('/api/webhooks', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify({
    nome: 'Notificações de Tarefas',
    url: 'https://seu-sistema.com/webhook/tarefas',
    eventos: [
      'task.created',
      'task.updated',
      'task.completed',
      'task.overdue'
    ],
    ativo: true,
    headers: {
      'X-Webhook-Secret': 'seu-secret-aqui',
      'Content-Type': 'application/json'
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 5000
    }
  })
}).then(res => res.json());

console.log('Webhook criado:', webhook.id);
```

#### Processar Webhook (Lado do Receptor)
```javascript
// Endpoint no seu sistema para receber webhooks
app.post('/webhook/tarefas', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  // Verificar assinatura do webhook
  const signature = req.headers['x-webhook-signature'];
  if (!verifyWebhookSignature(req.body, signature, 'seu-secret-aqui')) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  switch (event) {
    case 'task.created':
      console.log('Nova tarefa criada:', data.after.titulo);
      // Enviar notificação por email/slack
      break;
      
    case 'task.completed':
      console.log('Tarefa concluída:', data.after.titulo);
      // Atualizar dashboard interno
      break;
      
    case 'task.overdue':
      console.log('Tarefa em atraso:', data.after.titulo);
      // Enviar alerta urgente
      break;
  }
  
  res.status(200).json({ received: true });
});
```

### 5. Relatórios e Analytics

#### Dashboard de Tarefas
```javascript
// GET /api/tasks/dashboard
const dashboard = await fetch('/api/tasks/dashboard?periodo=30', {
  headers: defaultHeaders
}).then(res => res.json());

console.log('Estatísticas:', {
  totalTarefas: dashboard.total,
  concluidas: dashboard.concluidas,
  pendentes: dashboard.pendentes,
  atrasadas: dashboard.atrasadas,
  produtividade: dashboard.produtividade
});
```

#### Relatório de Vendas
```javascript
// GET /api/relatorios/vendas
const relatorioVendas = await fetch('/api/relatorios/vendas?mes=2024-01', {
  headers: defaultHeaders
}).then(res => res.json());

console.log('Vendas do mês:', {
  totalOrcamentos: relatorioVendas.totalOrcamentos,
  orcamentosAprovados: relatorioVendas.aprovados,
  valorTotal: relatorioVendas.valorTotal,
  ticketMedio: relatorioVendas.ticketMedio
});
```

### 6. Gerenciamento de Permissões

#### Criar API Key com Permissões Específicas
```javascript
// POST /api/api-keys
const apiKey = await fetch('/api/api-keys', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify({
    nome: 'Integração CRM',
    descricao: 'Chave para integração com sistema CRM externo',
    permissoes: [
      'clientes.read',
      'clientes.write',
      'orcamentos.read',
      'tasks.read'
    ],
    expiresAt: '2024-12-31T23:59:59Z',
    rateLimit: {
      windowMs: 60000, // 1 minuto
      maxRequests: 100
    }
  })
}).then(res => res.json());

console.log('API Key criada:', apiKey.key);
```

#### Verificar Permissões
```javascript
// GET /api/auth/permissions
const permissoes = await fetch('/api/auth/permissions', {
  headers: defaultHeaders
}).then(res => res.json());

console.log('Permissões do usuário:', permissoes);

// Verificar permissão específica
function hasPermission(permission) {
  return permissoes.includes(permission) || permissoes.includes('admin');
}

if (hasPermission('clientes.write')) {
  // Usuário pode criar/editar clientes
}
```

## Tratamento de Erros Avançado

### Classe de Erro Personalizada
```javascript
class GarapaSystemError extends Error {
  constructor(response, data) {
    super(data.message || 'Erro na API');
    this.name = 'GarapaSystemError';
    this.status = response.status;
    this.code = data.code;
    this.details = data.details;
    this.timestamp = data.timestamp;
  }
}

async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: defaultHeaders,
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new GarapaSystemError(response, data);
    }

    return data;
  } catch (error) {
    if (error instanceof GarapaSystemError) {
      // Tratar erros específicos da API
      switch (error.status) {
        case 401:
          // Redirecionar para login
          window.location.href = '/login';
          break;
        case 403:
          // Mostrar mensagem de permissão negada
          alert('Você não tem permissão para esta ação');
          break;
        case 429:
          // Implementar retry com backoff
          await new Promise(resolve => setTimeout(resolve, 5000));
          return apiRequest(url, options);
        case 422:
          // Mostrar erros de validação
          if (error.details) {
            Object.entries(error.details).forEach(([field, messages]) => {
              console.error(`${field}: ${messages.join(', ')}`);
            });
          }
          break;
        default:
          console.error('Erro da API:', error.message);
      }
      throw error;
    } else {
      // Erro de rede ou outro tipo
      console.error('Erro de rede:', error);
      throw error;
    }
  }
}
```

### Retry com Exponential Backoff
```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      // Só fazer retry em erros temporários
      if (error.status && ![429, 500, 502, 503, 504].includes(error.status)) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Uso
const cliente = await retryWithBackoff(() => 
  apiRequest('/api/clientes/123')
);
```

## Testes Automatizados

### Teste de Integração com Jest
```javascript
// tests/api/clientes.test.js
describe('API Clientes', () => {
  let apiKey;
  let clienteId;

  beforeAll(async () => {
    // Configurar API key para testes
    apiKey = process.env.TEST_API_KEY;
  });

  afterEach(async () => {
    // Limpar dados de teste
    if (clienteId) {
      await fetch(`/api/clientes/${clienteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
    }
  });

  test('deve criar um cliente', async () => {
    const novoCliente = {
      nome: 'Cliente Teste',
      email: 'teste@exemplo.com',
      telefone: '(11) 99999-9999'
    };

    const response = await fetch('/api/clientes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novoCliente)
    });

    expect(response.status).toBe(201);
    
    const cliente = await response.json();
    clienteId = cliente.id;
    
    expect(cliente.nome).toBe(novoCliente.nome);
    expect(cliente.email).toBe(novoCliente.email);
  });

  test('deve validar dados obrigatórios', async () => {
    const clienteInvalido = {
      nome: '', // Nome vazio
      email: 'email-invalido' // Email inválido
    };

    const response = await fetch('/api/clientes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clienteInvalido)
    });

    expect(response.status).toBe(422);
    
    const error = await response.json();
    expect(error.details).toHaveProperty('nome');
    expect(error.details).toHaveProperty('email');
  });
});
```

### Monitoramento de Performance
```javascript
// utils/performance-monitor.js
class PerformanceMonitor {
  static async measureApiCall(name, apiCall) {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`API Call ${name}: ${duration.toFixed(2)}ms`);
      
      // Enviar métricas para serviço de monitoramento
      this.sendMetrics(name, duration, 'success');
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.error(`API Call ${name} failed: ${duration.toFixed(2)}ms`, error);
      
      this.sendMetrics(name, duration, 'error');
      throw error;
    }
  }

  static sendMetrics(name, duration, status) {
    // Implementar envio para DataDog, New Relic, etc.
    if (window.gtag) {
      window.gtag('event', 'api_call', {
        event_category: 'performance',
        event_label: name,
        value: Math.round(duration),
        custom_map: { status }
      });
    }
  }
}

// Uso
const clientes = await PerformanceMonitor.measureApiCall(
  'get_clientes',
  () => fetch('/api/clientes').then(res => res.json())
);
```

---

*Exemplos atualizados em: Janeiro 2024*
*Versão da API: 0.2.37.13*
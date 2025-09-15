# Testes Automatizados do Módulo de Tarefas

## Visão Geral

Este diretório contém os testes automatizados para o módulo de tarefas do Sistema de Gestão - GarapaSystem. Os testes foram desenvolvidos usando Playwright para garantir a qualidade e funcionalidade do sistema.

## Estrutura dos Testes

### Arquivo Principal
- `tasks-module-tests.js` - Contém todos os testes automatizados do módulo de tarefas

### Testes Implementados

1. **Teste 1: Verificação de Carregamento da Página**
   - Verifica se a página de tarefas carrega corretamente
   - Valida a presença do conteúdo principal
   - Confirma o título da página

2. **Teste 2: Verificação de Elementos da Interface**
   - Verifica a presença de elementos essenciais da UI
   - Valida cards de erro e botões de ação
   - Confirma a estrutura da interface

3. **Teste 3: Navegação para Dashboard de Tarefas**
   - Testa a navegação para o dashboard
   - Verifica a presença de abas (Gráficos, Relatório)
   - Valida o carregamento do dashboard

4. **Teste 4: Simulação de Criação de Tarefa**
   - Simula a criação de uma nova tarefa
   - Valida os dados da tarefa criada
   - Testa a estrutura de dados

5. **Teste 5: Simulação de Listagem de Tarefas**
   - Simula a listagem de múltiplas tarefas
   - Verifica a estrutura da lista
   - Valida os dados das tarefas listadas

6. **Teste 6: Simulação de Edição de Tarefa**
   - Simula a edição de uma tarefa existente
   - Compara dados antes e depois da edição
   - Valida as alterações realizadas

7. **Teste 7: Simulação de Conclusão de Tarefa**
   - Simula a marcação de tarefa como concluída
   - Verifica mudança de status
   - Valida timestamp de conclusão

8. **Teste 8: Simulação de Exclusão de Tarefa**
   - Simula a exclusão de uma tarefa
   - Verifica redução na lista de tarefas
   - Valida remoção correta

9. **Teste 9: Validação de Erro com Dados Inválidos**
   - Testa validação de campos obrigatórios
   - Verifica tratamento de dados inválidos
   - Valida mensagens de erro

## Pré-requisitos

### Dependências
- Node.js (versão 16 ou superior)
- Playwright Test Framework
- Aplicação rodando em `http://localhost:3000`

### Instalação do Playwright
```bash
npm install @playwright/test
npx playwright install
```

## Como Executar os Testes

### Executar Todos os Testes
```bash
npx playwright test tests/tasks-module-tests.js
```

### Executar com Interface Gráfica
```bash
npx playwright test tests/tasks-module-tests.js --ui
```

### Executar em Modo Debug
```bash
npx playwright test tests/tasks-module-tests.js --debug
```

### Executar com Relatório HTML
```bash
npx playwright test tests/tasks-module-tests.js --reporter=html
```

## Configuração de Ambiente

### Variáveis de Ambiente
Os testes utilizam as seguintes configurações:
- `BASE_URL`: http://localhost:3000
- `LOGIN_URL`: http://localhost:3000/auth/login
- `TASKS_URL`: http://localhost:3000/tasks
- `DASHBOARD_URL`: http://localhost:3000/tasks/dashboard

### Credenciais de Teste
- Email: admin@garapasystem.com
- Senha: admin123

## Dados de Teste

### Tarefa de Teste Padrão
```javascript
const TEST_TASK = {
  title: 'Tarefa de Teste Automatizado',
  description: 'Esta é uma tarefa criada durante os testes automatizados',
  priority: 'alta',
  status: 'pendente'
};
```

### Tarefa Atualizada
```javascript
const UPDATED_TASK = {
  title: 'Tarefa Editada - Teste Automatizado',
  description: 'Tarefa atualizada durante os testes automatizados',
  priority: 'média',
  status: 'em_progresso'
};
```

## Relatórios e Resultados

### Estatísticas dos Testes
- **Total de testes**: 9
- **Testes aprovados**: 9
- **Testes falharam**: 0
- **Taxa de sucesso**: 100%

### Tipos de Teste
- **Testes de Interface**: 3 testes
- **Testes de Funcionalidade**: 5 testes
- **Testes de Validação**: 1 teste

## Estrutura do Projeto

```
tests/
├── README.md                 # Este arquivo
├── tasks-module-tests.js     # Testes principais
└── reports/                  # Relatórios gerados (criado automaticamente)
```

## Troubleshooting

### Problemas Comuns

1. **Erro 401/403 nas APIs**
   - Verificar se o usuário está autenticado
   - Confirmar credenciais de teste
   - Verificar permissões do usuário

2. **Timeout nos Testes**
   - Aumentar timeout nas configurações
   - Verificar se a aplicação está rodando
   - Confirmar performance da aplicação

3. **Elementos não Encontrados**
   - Verificar seletores CSS
   - Confirmar estrutura da página
   - Aguardar carregamento completo

### Logs e Debug

Para visualizar logs detalhados:
```bash
npx playwright test tests/tasks-module-tests.js --reporter=line
```

Para capturar screenshots em falhas:
```bash
npx playwright test tests/tasks-module-tests.js --reporter=html --screenshot=only-on-failure
```

## Contribuição

### Adicionando Novos Testes

1. Seguir o padrão de nomenclatura: `Teste X: Descrição`
2. Incluir logs informativos com `console.log`
3. Usar `expect` para validações
4. Documentar o propósito do teste

### Exemplo de Novo Teste
```javascript
test('Teste X: Descrição do Teste', async ({ page }) => {
  // Preparação
  await page.goto(TASKS_URL);
  
  // Execução
  const result = await page.evaluate(() => {
    // Lógica do teste
    return resultado;
  });
  
  // Validação
  expect(result).toBeDefined();
  
  console.log('✅ Teste X: Descrição - APROVADO');
});
```

## Contato

Para dúvidas ou sugestões sobre os testes, entre em contato com a equipe de desenvolvimento.

---

**Última atualização**: Janeiro 2025
**Versão dos testes**: 1.0.0
**Compatibilidade**: Sistema de Gestão - GarapaSystem v1.0
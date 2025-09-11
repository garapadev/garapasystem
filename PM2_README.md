# Gerenciamento de Processos com PM2

Este projeto agora utiliza PM2 para gerenciar todos os processos do sistema de forma robusta e confiável.

## 🚀 Serviços Configurados

### 1. **garapasystem-server**
- **Descrição**: Servidor principal Next.js com Socket.IO
- **Script**: `server.ts`
- **Porta**: 3000
- **Logs**: `./logs/server-*.log`

### 2. **helpdesk-email-worker**
- **Descrição**: Worker de processamento de emails do helpdesk
- **Script**: `start-helpdesk-worker.js`
- **Logs**: `./logs/worker-*.log`
- **Restart automático**: A cada 6 horas

### 3. **ticket-automation-service**
- **Descrição**: Serviço de automação de tickets
- **Script**: `./src/scripts/start-ticket-automation.ts`
- **Logs**: `./logs/automation-*.log`

## 📋 Comandos Disponíveis

### Iniciar Serviços
```bash
# Desenvolvimento
npm run pm2:dev

# Produção
npm run pm2:prod

# Comando direto
npm run pm2:start
```

### Gerenciar Serviços
```bash
# Ver status de todos os processos
npm run pm2:status

# Reiniciar todos os serviços
npm run pm2:restart

# Recarregar (zero-downtime)
npm run pm2:reload

# Parar todos os serviços
npm run pm2:stop

# Remover todos os processos
npm run pm2:delete
```

### Monitoramento
```bash
# Ver logs em tempo real
npm run pm2:logs

# Monitor interativo
npm run pm2:monit

# Ver logs específicos
pm2 logs garapasystem-server
pm2 logs helpdesk-email-worker
pm2 logs ticket-automation-service
```

## 🔧 Configuração Avançada

### Arquivo de Configuração
O arquivo `ecosystem.config.js` contém todas as configurações dos processos:

- **Restart automático**: Configurado para todos os serviços
- **Limite de memória**: Configurado por serviço
- **Logs estruturados**: Separados por serviço
- **Variáveis de ambiente**: Diferentes para dev/prod

### Logs
Todos os logs são salvos na pasta `./logs/`:
- `server-*.log` - Servidor principal
- `worker-*.log` - Worker de emails
- `automation-*.log` - Automação de tickets

### Restart Automático
- **helpdesk-email-worker**: Restart a cada 6 horas (cron: `0 */6 * * *`)
- **Todos os serviços**: Restart automático em caso de falha
- **Limite de restarts**: 10 tentativas com delay de 4 segundos

## 🛠️ Troubleshooting

### Verificar Status
```bash
npm run pm2:status
```

### Ver Logs de Erro
```bash
# Logs gerais
npm run pm2:logs

# Logs específicos com mais detalhes
pm2 logs ticket-automation-service --lines 50
```

### Reiniciar Serviço Específico
```bash
pm2 restart garapasystem-server
pm2 restart helpdesk-email-worker
pm2 restart ticket-automation-service
```

### Limpar Logs
```bash
pm2 flush  # Limpa todos os logs
```

## 🔄 Deploy e Produção

### Configuração de Produção
```bash
# Iniciar em modo produção
npm run pm2:prod

# Salvar configuração atual
pm2 save

# Configurar startup automático
pm2 startup
```

### Monitoramento Contínuo
```bash
# Dashboard web (se instalado PM2 Plus)
pm2 plus

# Monitor de recursos
pm2 monit
```

## ⚡ Vantagens do PM2

1. **Alta Disponibilidade**: Restart automático em caso de falha
2. **Zero Downtime**: Reload sem interrupção do serviço
3. **Monitoramento**: Logs estruturados e métricas em tempo real
4. **Escalabilidade**: Fácil configuração de cluster mode
5. **Gestão de Memória**: Restart automático por limite de memória
6. **Cron Jobs**: Restart programado para limpeza de memória
7. **Logs Centralizados**: Todos os logs em um local organizado

## 🚨 Importante

- Sempre use os comandos npm para gerenciar os processos
- Verifique os logs regularmente para identificar problemas
- O PM2 mantém os processos rodando mesmo após reinicialização do sistema
- Use `pm2 save` após fazer alterações para persistir a configuração

---

**Configurado com ❤️ para o GarapaSystem**
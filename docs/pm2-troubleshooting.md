# PM2 Troubleshooting - Problemas com CSS e Assets

## Problema Identificado

Quando o PM2 é reiniciado, frequentemente ocorrem os seguintes problemas:

1. **CSS perdido ou não carregado**
2. **Erro 404 em arquivos da pasta `.next`**
3. **Erro: `ENOENT: no such file or directory, open '/app/.next/server/pages/_document.js'`**
4. **Fast Refresh forçando reload completo**

## Causa Raiz

O problema ocorre porque:

- O PM2 reinicia o processo Node.js mas não garante que o build do Next.js esteja atualizado
- A pasta `.next` pode estar corrompida ou incompleta
- O Next.js em modo desenvolvimento pode ter conflitos com hot reload quando gerenciado pelo PM2
- Cache do webpack pode estar desatualizado

## Soluções Implementadas

### 1. Scripts Seguros para PM2

Criamos scripts que garantem um build limpo antes de iniciar:

- `scripts/pm2-safe-start.sh` - Para desenvolvimento
- `scripts/pm2-safe-start-prod.sh` - Para produção

### 2. Novos Comandos NPM

```bash
# Comandos seguros (recomendados)
npm run pm2:start      # Inicia com build garantido
npm run pm2:dev        # Mesmo que pm2:start
npm run pm2:prod       # Inicia em produção com build

# Comando de emergência
npm run pm2:clean-restart  # Limpa tudo e reinicia

# Comandos antigos (não recomendados)
npm run pm2:start-unsafe   # Inicia sem build
```

### 3. Processo do Script Seguro

1. **Para todos os processos PM2**
2. **Remove pasta `.next` e cache**
3. **Executa `npm run build`**
4. **Verifica se o build foi criado**
5. **Inicia PM2 apenas se o build for bem-sucedido**

### 4. Configuração Atualizada do PM2

Adicionamos `pre_start: 'npm run build'` no `ecosystem.config.js` como backup.

## Como Usar

### Para Desenvolvimento
```bash
npm run pm2:dev
```

### Para Produção
```bash
npm run pm2:prod
```

### Se Ainda Houver Problemas
```bash
npm run pm2:clean-restart
```

## Verificação de Problemas

### Verificar Status
```bash
npm run pm2:status
```

### Verificar Logs
```bash
npm run pm2:logs
```

### Verificar se Build Existe
```bash
ls -la .next/
```

## Prevenção

1. **Sempre use os scripts seguros** em vez dos comandos diretos do PM2
2. **Monitore os logs** para identificar problemas cedo
3. **Execute build manual** se suspeitar de problemas: `npm run build`
4. **Limpe cache periodicamente**: `rm -rf .next node_modules/.cache`

## Troubleshooting Rápido

Se o CSS não carregar após reiniciar PM2:

```bash
# Solução rápida
pm2 stop all
rm -rf .next
npm run build
npm run pm2:start
```

## Logs Importantes

Fique atento a estes erros nos logs:
- `ENOENT: no such file or directory, open '/app/.next/server/pages/_document.js'`
- `GET /_next/static/webpack/*.webpack.hot-update.json 404`
- `Fast Refresh had to perform a full reload`
- `Cannot read properties of undefined (reading 'clientModules')`

Todos estes indicam que o build do Next.js está corrompido ou incompleto.
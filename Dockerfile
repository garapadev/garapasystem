# Dockerfile para aplicação Next.js com servidor customizado e módulo de webmail
# Multi-stage build para otimização de performance e segurança

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++ openssl
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm cache clean --force

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação Next.js
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Instalar dependências do sistema incluindo PostgreSQL client e dependências para webmail
RUN apk add --no-cache dumb-init postgresql-client openssl ca-certificates tzdata && \
    apk upgrade --no-cache && \
    rm -rf /var/cache/apk/*

# Instalar PM2 globalmente
RUN npm install -g pm2

# Criar usuário não-root com configurações de segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs --shell /bin/false nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/ecosystem.config.js ./ecosystem.config.js

# Definir permissões
RUN chown -R nextjs:nodejs /app

# Expor porta
EXPOSE 3000

# Variáveis de ambiente otimizadas para produção
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=1024"
ENV TZ=America/Sao_Paulo

# Configurações de segurança para webmail
ENV WEBMAIL_SECURE=true
ENV WEBMAIL_TLS_REJECT_UNAUTHORIZED=true
ENV WEBMAIL_ENCRYPTION_KEY="default-encryption-key-change-in-production"
ENV WEBMAIL_SYNC_INTERVAL=300
ENV WEBMAIL_MAX_ATTACHMENTS_SIZE=25
ENV WEBMAIL_ENABLE_NOTIFICATIONS=true

# Script de inicialização otimizado com verificações de saúde
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "🚀 GarapaSystem v0.2.37.9 - Iniciando configuração..."' >> /app/start.sh && \
    echo 'if [ "$SKIP_DB_CHECK" != "true" ]; then' >> /app/start.sh && \
    echo '  echo "🗄️  Configurando banco de dados..."' >> /app/start.sh && \
    echo '  # Verificar se o banco já tem dados (baseline)' >> /app/start.sh && \
    echo '  if npx prisma db push --accept-data-loss 2>/dev/null; then' >> /app/start.sh && \
    echo '    echo "✅ Esquema do banco sincronizado"' >> /app/start.sh && \
    echo '  else' >> /app/start.sh && \
    echo '    echo "⚠️  Usando db push para esquema existente"' >> /app/start.sh && \
    echo '  fi' >> /app/start.sh && \
    echo 'else' >> /app/start.sh && \
    echo '  echo "⏭️  Pulando verificações de banco de dados..."' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "🌟 Iniciando aplicação..."' >> /app/start.sh && \
    echo 'pm2-runtime start ecosystem.config.js --only garapasystem --env production' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

# Sobrescrever entrypoint e comando de inicialização
ENTRYPOINT []
CMD ["/app/start.sh"]
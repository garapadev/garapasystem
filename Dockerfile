# Dockerfile para aplicação Next.js com servidor customizado
# Multi-stage build para otimização

# Stage 1: Dependencies
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
RUN npm install

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copiar dependências do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação Next.js
RUN npm run build

# Stage 3: Runner
FROM node:18-alpine AS runner
WORKDIR /app

# Instalar dependências do sistema incluindo PostgreSQL client
RUN apk add --no-cache dumb-init postgresql-client

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Definir permissões
RUN chown -R nextjs:nodejs /app

# Expor porta
EXPOSE 3000

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Script de inicialização personalizado
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Iniciando configuração do banco..."' >> /app/start.sh && \
    echo 'npx prisma db push --accept-data-loss' >> /app/start.sh && \
    echo 'echo "🌱 Executando seed..."' >> /app/start.sh && \
    echo 'npm run db:seed' >> /app/start.sh && \
    echo 'echo "✅ Configuração concluída! Iniciando aplicação..."' >> /app/start.sh && \
    echo 'exec dumb-init npx tsx server.ts' >> /app/start.sh && \
    chmod +x /app/start.sh && \
    chown nextjs:nodejs /app/start.sh

# Sobrescrever entrypoint e comando de inicialização
ENTRYPOINT []
CMD ["/app/start.sh"]
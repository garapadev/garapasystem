FROM node:20-alpine AS base
WORKDIR /app

# Instalar dependências do sistema necessárias (opcional)
RUN apk add --no-cache bash openssl

# Copiar arquivos de projeto essenciais para build (cache de dependências)
COPY package*.json ./

# Copiar configs e assets necessários para o build do Next
COPY tsconfig.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./
COPY tailwind.config.ts ./
COPY middleware.ts ./
COPY public ./public

# Copiar código da aplicação
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src
COPY server.ts ./
COPY ecosystem.config.js ./

# Instalar dependências sem executar scripts (tenta ci, senão install)
RUN npm config set fund false && npm config set audit false && \
    if [ -f package-lock.json ]; then \
      (npm ci --ignore-scripts || npm install --ignore-scripts); \
    else \
      npm install --ignore-scripts; \
    fi

# Gerar cliente Prisma (não conecta ao DB; seguro no build)
RUN npx prisma generate

# Build do Next (gera .next)
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache bash openssl

ENV NODE_ENV=production

# Copiar apenas o necessário
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/src ./src
COPY --from=base /app/server.ts ./server.ts
COPY --from=base /app/ecosystem.config.js ./ecosystem.config.js
COPY --from=base /app/tsconfig.json ./tsconfig.json
COPY --from=base /app/next.config.ts ./next.config.ts
COPY --from=base /app/public ./public
COPY --from=base /app/.next ./.next

# Expor porta
EXPOSE 3000

# Entrypoint: orquestrar upgrade e iniciar via PM2 Runtime somente em runtime
CMD ["bash", "-lc", "node ./scripts/orchestrate-upgrade.js && npx pm2-runtime start ecosystem.config.js --only garapasystem --env production"]
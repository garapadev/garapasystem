FROM node:20-alpine AS base
WORKDIR /app

# Instalar dependências do sistema necessárias (opcional)
RUN apk add --no-cache bash openssl

# Copiar arquivos de projeto
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* .npmrc* ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src
COPY server.ts ./
COPY ecosystem.config.js ./

# Instalar dependências
RUN npm ci

# Gerar cliente Prisma e preparar DB (não roda migrações aqui)
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
COPY --from=base /app/.next ./.next

# Expor porta
EXPOSE 3000

# Entrypoint: orquestrar upgrade e iniciar via PM2 Runtime
CMD ["bash", "-lc", "node ./scripts/orchestrate-upgrade.js && pm2-runtime start ecosystem.config.js --only garapasystem --env production"]
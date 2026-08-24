# --- Estágio 1: Builder (Usa a imagem completa para compilações e dependências) ---
FROM node:24.15.0 AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
# Instala tudo (incluindo dependências de desenvolvimento para o build)
RUN npm ci

COPY . .

# Limpa o lixo de desenvolvimento mantendo apenas dependências de produção
RUN npm prune --production

# --- Estágio 2: Production (Imagem Slim) ---
FROM node:24.15.0-trixie-slim
WORKDIR /app

# Instala curl e wget para healthcheck e diagnósticos
RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*

# Cria um utilizador sem privilégios para segurança da aplicação DBS
RUN addgroup --system --gid 1001 dbsapi && adduser --system --uid 1001 --gid 1001 dbsapi

# Copia APENAS o necessário do Estágio 1 com as devidas permissões
COPY --from=builder --chown=dbsapi:dbsapi /app/node_modules ./node_modules
COPY --from=builder --chown=dbsapi:dbsapi /app/package.json ./package.json
COPY --from=builder --chown=dbsapi:dbsapi /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=dbsapi:dbsapi /app/src ./src

USER dbsapi
EXPOSE 3333

ENV PORT=3333
ENV NODE_ENV=production

# Roda a aplicação com Node 24 native type stripping
CMD ["node", "--experimental-strip-types", "src/server.ts"]

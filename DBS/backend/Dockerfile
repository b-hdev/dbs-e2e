FROM node:24.15.0 AS builder
WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

COPY . .

RUN npm prune --production

FROM node:24.15.0-trixie-slim
WORKDIR /app

RUN apt-get update && apt-get install -y curl wget && rm -rf /var/lib/apt/lists/*

RUN addgroup --system --gid 1001 dbsapi && adduser --system --uid 1001 --gid 1001 dbsapi

COPY --from=builder --chown=dbsapi:dbsapi /app/node_modules ./node_modules
COPY --from=builder --chown=dbsapi:dbsapi /app/package.json ./package.json
COPY --from=builder --chown=dbsapi:dbsapi /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=dbsapi:dbsapi /app/src ./src

USER dbsapi
EXPOSE 3333

ENV PORT=3333
# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3333/health || exit 1

CMD ["node", "--experimental-strip-types", "src/server.ts"]

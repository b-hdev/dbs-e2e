# Build e Runtime utilizando Node 24 Alpine nativo
FROM node:24-alpine

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install --omit=dev

# Copia código fonte e configurações
COPY . .

EXPOSE 3333

ENV PORT=3333
ENV NODE_ENV=production

CMD ["node", "--experimental-strip-types", "src/server.ts"]

# Estágio 1: Instalar dependências
FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm install

# Estágio 2: Build da aplicação Web (Expo Web Export)
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build:web

# Estágio 3: Servidor de produção com Nginx Alpine
FROM nginx:alpine

# Instala curl para healthcheck
RUN apk add --no-cache curl

# Copia os arquivos gerados no export do Expo
COPY --from=build /app/dist /usr/share/nginx/html

# Copia a configuração do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expõe a porta 80
EXPOSE 80

# Healthcheck do container
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]

# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Cache bağımlılıkları
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

# Kaynak kodları kopyala ve build al
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Build dosyalarını nginx'e kopyala
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx config dosyasını doğru konuma kopyala
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

# Health check için minimal curl
RUN apk add --no-cache curl

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["nginx", "-g", "daemon off;"] 
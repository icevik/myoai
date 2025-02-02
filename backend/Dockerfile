# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Cache bağımlılıkları
COPY package*.json ./
RUN npm ci --only=production

# Kaynak kodları kopyala
COPY . .

# Production stage
FROM node:18-alpine

WORKDIR /app

# Curl yükle (sadece health check için)
RUN apk add --no-cache curl

# Production bağımlılıklarını kopyala
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/. .

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Production modunda çalıştır
ENV NODE_ENV=production
CMD ["node", "server.js"] 
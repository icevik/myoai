FROM node:18-alpine as builder

WORKDIR /app

# Curl yükle
RUN apk add --no-cache curl

# Sadece package.json ve package-lock.json kopyala
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install --legacy-peer-deps --production

# Kaynak kodları kopyala
COPY . .

# Production build
RUN npm run build

# Production image
FROM nginx:alpine

# Build dosyalarını nginx'e kopyala
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["nginx", "-g", "daemon off;"] 
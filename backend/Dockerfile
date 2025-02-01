FROM node:18-alpine

WORKDIR /app

# Curl yükle
RUN apk add --no-cache curl

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

CMD ["node", "server.js"] 
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN apk add --no-cache curl && \
    npm install --legacy-peer-deps

COPY . .

ENV HOST=0.0.0.0
ENV WDS_SOCKET_PORT=0
ENV REACT_APP_API_URL=http://34.28.93.220:5000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

CMD ["npm", "start"] 
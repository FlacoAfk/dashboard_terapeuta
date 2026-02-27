# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup -S nodejs && adduser -S nodeapp -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY . .

USER nodeapp
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/health/live || exit 1

CMD ["node", "src/server.js"]

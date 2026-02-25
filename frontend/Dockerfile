# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:web

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY --from=build /app/dist-web .
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

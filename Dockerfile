# Target 1: Alpine (small)
FROM node:25-alpine3.21 AS alpine

RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
CMD ["node", "server.js"]

# Target 2: Official Puppeteer (stable)
FROM ghcr.io/puppeteer/puppeteer:24.26.1 AS puppeteer

WORKDIR /app
COPY package.json .
RUN npm install
COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]
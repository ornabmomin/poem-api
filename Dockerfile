FROM node:25-alpine3.21 AS alpine

RUN apk add --no-cache \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    dumb-init

ENV NODE_ENV=production

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm prune --production && npm cache clean --force
COPY server.js .
COPY src ./src

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000
ENTRYPOINT [ "/usr/bin/dumb-init", "--" ]
CMD ["node", "server.js"]
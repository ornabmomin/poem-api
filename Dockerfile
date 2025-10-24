FROM ghcr.io/puppeteer/puppeteer:24.26.1

WORKDIR /app

COPY package.json .
RUN npm install

COPY server.js .

EXPOSE 3000
CMD ["node", "server.js"]
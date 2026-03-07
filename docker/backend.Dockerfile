FROM node:25-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --production

COPY backend ./backend

CMD ["node", "backend/server.js"]


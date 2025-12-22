FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production --omit=dev

COPY . .

RUN mkdir -p /app/uploads /app/files \
    && addgroup -S app \
    && adduser -S app -G app \
    && chown -R app:app /app

USER app

EXPOSE 3002
ENV NODE_ENV=production

CMD ["node", "index.js"]

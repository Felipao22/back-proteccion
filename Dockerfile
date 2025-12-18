FROM node:20-alpine

WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install --production

# Copiar código
COPY . .

# Crear carpeta uploads dentro del contenedor
RUN mkdir -p /app/uploads

# Exponer puerto interno
EXPOSE 3001

# Variables por defecto
ENV NODE_ENV=production

CMD ["node", "index.js"]

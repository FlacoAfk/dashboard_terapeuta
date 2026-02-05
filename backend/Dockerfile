FROM node:24-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]

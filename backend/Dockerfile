FROM node:24-alpine

WORKDIR /app

# Instalar dependencias necesarias para bcrypt (compilación nativa)
RUN apk add --no-cache python3 make g++

# Instalar dependencias
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el código fuente
COPY . .

# Exponer el puerto
EXPOSE 3001

# Comando de inicio
CMD ["npm", "start"]

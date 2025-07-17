FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json
COPY package.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto del servidor
EXPOSE 5000

# Comando para ejecutar el servidor
CMD ["npm", "start"]

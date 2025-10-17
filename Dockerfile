# Dockerfile para la aplicación KSAMATI
# Etapa 1: Construir la aplicación React
FROM node:18-alpine AS frontend-build

WORKDIR /app

# Copiar archivos de configuración del cliente
COPY client/package*.json ./client/
RUN cd client && npm ci --only=production

# Copiar código fuente del cliente y construir
COPY client/ ./client/
RUN cd client && npm run build

# Etapa 2: Configurar el servidor Node.js
FROM node:18-alpine AS production

WORKDIR /app

# Instalar dependencias del servidor
COPY package*.json ./
RUN npm ci --only=production

# Copiar código del servidor
COPY server/ ./server/

# Copiar build de React desde la etapa anterior
COPY --from=frontend-build /app/client/build ./client/build

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ksamti -u 1001

# Cambiar propiedad de archivos
RUN chown -R ksamti:nodejs /app
USER ksamti

# Exponer puerto
EXPOSE 5000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=5000

# Comando para iniciar la aplicación
CMD ["node", "server/index.js"]

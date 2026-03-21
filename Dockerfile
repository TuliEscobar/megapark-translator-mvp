# Etapa 1: Build del Frontend (React/Vite)
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY traductor-app/package*.json ./
RUN npm install
COPY traductor-app/ ./
# Pasamos la variable de entorno vacía temporalmente (se debe inyectar en runtime)
ENV VITE_GEMINI_API_KEY=""
RUN npm run build

# Etapa 2: Setup del Backend (Express)
FROM node:22-alpine AS backend-setup
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ ./

# Etapa 3: Ensamblaje Final para Producción (Nginx u Express sirviendo estáticos)
# Usaremos Express para servir los archivos del frontend y simplificar el despliegue a 1 solo contenedor
FROM node:22-alpine
WORKDIR /app

# Copiamos backend
COPY --from=backend-setup /app/backend /app/backend
# Copiamos el build de frontend dentro del backend para que Express lo sirva
COPY --from=frontend-build /app/frontend/dist /app/backend/public

# Configuramos el entorno de producción
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

WORKDIR /app/backend
CMD ["node", "src/server.js"]

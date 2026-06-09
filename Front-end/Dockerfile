# === ETAPA 1: COMPILACIÓN ===
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Instalamos todas las dependencias para poder compilar
RUN npm ci

COPY . .
# Compila la aplicación de React/Vite (genera la carpeta /app/dist)
RUN npm run build

# === ETAPA 2: SERVIDOR DE PRODUCCIÓN ===
FROM nginx:alpine

# Copiamos los archivos compilados estáticos desde la etapa anterior al directorio de Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Configuramos Nginx para que soporte las rutas de React (Single Page Application)
RUN echo 'server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]

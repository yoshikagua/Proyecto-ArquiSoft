FROM php:8.2-cli-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    unzip \
    git \
    libpq-dev \
    curl

# Extensiones PHP necesarias (solo las críticas)
RUN docker-php-ext-install pdo pdo_pgsql

# Instalar Composer
RUN curl -sS https://getcomposer.org/installer | php -- \
    --install-dir=/usr/local/bin --filename=composer

WORKDIR /app

# Copiar primero composer (mejor cache de Docker)
COPY composer.json ./

RUN composer install --no-interaction --prefer-dist --ignore-platform-req=ext-sockets

# Copiar el resto del proyecto
COPY . .

# El CMD será sobrescrito por docker-compose si es necesario
# Por defecto, ejecuta PHP en modo server con router

# Ejecutar email
CMD ["php", "email.php"]
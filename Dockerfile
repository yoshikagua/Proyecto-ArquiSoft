FROM php:8.2-cli

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y \
    unzip \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Extensiones PHP necesarias
RUN docker-php-ext-install pdo pdo_pgsql sockets

# Instalar Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copiar primero composer (mejor cache de Docker)
COPY composer.json composer.lock* ./

RUN composer install --no-interaction --prefer-dist

# Copiar el resto del proyecto
COPY . .

# Ejecutar email
CMD ["php", "email.php"]
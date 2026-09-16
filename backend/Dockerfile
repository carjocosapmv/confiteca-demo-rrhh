FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    libpq-dev libzip-dev libsqlite3-dev zip unzip git curl \
    && docker-php-ext-install pdo_pgsql pdo_sqlite bcmath zip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY . .

RUN composer install --no-dev --optimize-autoloader \
    && mkdir -p storage/framework/cache/data \
    && mkdir -p storage/framework/sessions \
    && mkdir -p storage/framework/views \
    && mkdir -p storage/logs \
    && php artisan storage:link || true \
    && chmod -R 777 storage bootstrap/cache database

EXPOSE 8000

RUN chmod +x start.sh
CMD ["./start.sh"]

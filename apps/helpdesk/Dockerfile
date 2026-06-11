# syntax=docker/dockerfile:1

# --------------------------------------------------------------------------- #
# Stage 1: Install Composer dependencies
# --------------------------------------------------------------------------- #
FROM php:8.3-cli-alpine AS composer-deps

RUN apk add --no-cache \
        curl \
        unzip \
        libzip-dev \
    && docker-php-ext-install zip pdo pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
        --no-dev \
        --optimize-autoloader \
        --no-scripts \
        --no-interaction \
        --prefer-dist

# --------------------------------------------------------------------------- #
# Stage 2: Production image — php-fpm + nginx managed by supervisord
# --------------------------------------------------------------------------- #
FROM php:8.3-fpm-alpine AS app

# Install system packages
RUN apk add --no-cache \
        nginx \
        supervisor \
        curl \
        libzip-dev \
        icu-dev \
        oniguruma-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
    && docker-php-ext-configure gd \
           --with-freetype \
           --with-jpeg \
    && docker-php-ext-install \
           pdo \
           pdo_mysql \
           zip \
           intl \
           mbstring \
           gd \
           pcntl \
           bcmath \
           opcache

RUN { \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.interned_strings_buffer=8'; \
        echo 'opcache.max_accelerated_files=10000'; \
        echo 'opcache.revalidate_freq=0'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'opcache.enable_cli=1'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

WORKDIR /var/www/html

COPY --from=composer-deps /app/vendor ./vendor

COPY . .

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
    && mkdir -p storage/framework/{sessions,views,cache} \
                storage/logs \
                bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && rm -f /etc/nginx/conf.d/default.conf

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]

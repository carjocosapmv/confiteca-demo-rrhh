#!/bin/bash
set -e

# Demo deployment entrypoint.
# Every value that differs per environment comes from env vars — nothing about
# the hosting provider is hardcoded here.

# Preserve APP_KEY across redeploys so existing encrypted cookies stay valid.
# Parsed with bash builtins only: the runtime image has no grep/rg guarantee.
APP_KEY_EXISTING=""
if [ -f .env ]; then
    while IFS= read -r line; do
        case "$line" in
            APP_KEY=*) APP_KEY_EXISTING="${line#APP_KEY=}" ;;
        esac
    done < .env
fi

: "${APP_KEY:=$APP_KEY_EXISTING}"
: "${APP_NAME:=Confiteca}"
: "${APP_URL:=http://localhost:8000}"
: "${DB_CONNECTION:=sqlite}"
: "${SANCTUM_STATEFUL_DOMAINS:=localhost,localhost:5173,localhost:8080}"
: "${SESSION_SECURE_COOKIE:=true}"
: "${PORT:=8000}"

cat > .env << EOF
APP_ENV=production
APP_DEBUG=false
APP_NAME="${APP_NAME}"
APP_KEY=${APP_KEY}
APP_URL=${APP_URL}

DB_CONNECTION=${DB_CONNECTION}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

SESSION_DRIVER=file
SESSION_SECURE_COOKIE=${SESSION_SECURE_COOKIE}

CACHE_STORE=array

SANCTUM_STATEFUL_DOMAINS=${SANCTUM_STATEFUL_DOMAINS}
CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
EOF

if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

if [ "$DB_CONNECTION" = "sqlite" ]; then
    : "${DB_DATABASE:=/var/www/database/database.sqlite}"
    touch "$DB_DATABASE"
fi

# DEMO BEHAVIOUR: this is a sales demo, not a production system.
# Resetting to a clean, scripted dataset on every boot is intentional so the
# demo always looks the same. Set DEMO_RESET=false to preserve data.
if [ "${DEMO_RESET:-true}" = "true" ]; then
    echo "Resetting demo database..."
    php artisan migrate:fresh --force --seed
else
    php artisan migrate --force
fi

echo "Starting server on port ${PORT}..."
php artisan serve --host=0.0.0.0 --port="$PORT"

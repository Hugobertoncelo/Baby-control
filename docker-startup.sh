#!/bin/sh
mkdir -p /db

mkdir -p /app
ln -sf /db /app/db

if [ -n "$TZ" ]; then
  echo "$TZ" > /etc/TZ
  if [ -f "/usr/share/zoneinfo/$TZ" ]; then
    ln -sf "/usr/share/zoneinfo/$TZ" /etc/localtime
  fi
fi

echo "Checking for ENC_HASH in .env file..."
ENV_FILE="/app/env/.env"

ENC_HASH_EXISTS=$(grep -E "^ENC_HASH=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2 | tr -d '"')

if [ -z "$ENC_HASH_EXISTS" ]; then
    echo "ENC_HASH not found. Generating unique ENC_HASH for this container..."
    
    RANDOM_HASH=$(openssl rand -hex 32)
    
    echo "" >> "$ENV_FILE"
    echo "# Encryption hash for data encryption (generated at container startup)" >> "$ENV_FILE"
    echo "ENC_HASH=\"$RANDOM_HASH\"" >> "$ENV_FILE"
    
    echo "ENC_HASH generated and added to .env file"
else
    echo "ENC_HASH already exists in .env file"
fi

echo "Generating Prisma clients..."
DATABASE_URL="file:/db/baby-control.db" npm run prisma:generate
LOG_DATABASE_URL="file:/db/baby-control-logs.db" npm run prisma:generate:log

echo "Running database migrations..."
DATABASE_URL="file:/db/baby-control.db" npx prisma migrate deploy

echo "Creating log database schema..."
LOG_DATABASE_URL="file:/db/baby-control-logs.db" npx prisma db push --schema=prisma/log-schema.prisma --accept-data-loss --skip-generate

echo "Seeding database..."
DATABASE_URL="file:/db/baby-control.db" npx prisma db seed

echo "Starting application..."
exec "$@"

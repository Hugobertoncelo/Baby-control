PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")

echo "Checking and updating environment configuration..."

echo "Checking for ENC_HASH in .env file..."
ENV_FILE="$PROJECT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating .env file..."
    touch "$ENV_FILE"
fi

ENC_HASH_EXISTS=$(grep -E "^ENC_HASH=" "$ENV_FILE" | cut -d '=' -f2)

if [ -z "$ENC_HASH_EXISTS" ]; then
    echo "Adding ENC_HASH to .env file..."
    RANDOM_HASH=$(openssl rand -hex 32)
    echo "" >> "$ENV_FILE"
    echo "DATABASE_URL=\"file:../db/baby-control.db\"" >> "$ENV_FILE"
    echo "LOG_DATABASE_URL=\"file:../db/api-logs.db\"" >> "$ENV_FILE"
    echo "ENABLE_LOG=false" >> "$ENV_FILE"
    echo "NODE_ENV=development" >> "$ENV_FILE"
    echo "PORT=3000" >> "$ENV_FILE"
    echo "TZ=UTC" >> "$ENV_FILE"
    echo "AUTH_LIFE=86400" >> "$ENV_FILE"
    echo "IDLE_TIME=28800" >> "$ENV_FILE"
    echo "APP_VERSION=0.96.28" >> "$ENV_FILE"
    echo "COOKIE_SECURE=false" >> "$ENV_FILE"
    echo "ENC_HASH=\"$RANDOM_HASH\"" >> "$ENV_FILE"
    echo "Environment variables and ENC_HASH generated and added to .env file"
else
    echo "ENC_HASH already exists in .env file"
fi

echo "Environment configuration check completed."
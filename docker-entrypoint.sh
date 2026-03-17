#!/bin/sh
set -e

echo "============================================"
echo "  Summit Finance Docker Entrypoint"
echo "============================================"

# Wait for database to be ready
wait_for_db() {
  echo "Waiting for database to be ready..."

  DB_HOST=$(echo $DATABASE_URL | sed -n 's|.*@\([^:/]*\).*|\1|p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
  DB_PORT=${DB_PORT:-5432}

  MAX_RETRIES=30
  RETRY_COUNT=0

  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
      echo "Database is ready!"
      return 0
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for database... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
  done

  echo "ERROR: Database not available after $MAX_RETRIES attempts"
  exit 1
}

# Run database migrations
run_db_setup() {
  echo ""
  echo "Running database setup..."

  if [ "$SKIP_DB_SETUP" = "true" ]; then
    echo "Skipping database setup (SKIP_DB_SETUP=true)"
    return 0
  fi

  # Use drizzle-kit push for schema sync (reliable for both fresh and existing DBs)
  echo "Syncing database schema..."
  if pnpm run push 2>&1; then
    echo "Database schema synced successfully!"
  else
    echo "WARNING: Schema sync failed, continuing anyway..."
  fi
}

echo ""
echo "Environment:"
echo "  NODE_ENV: ${NODE_ENV:-production}"
echo "  SKIP_DB_SETUP: ${SKIP_DB_SETUP:-false}"
echo ""

wait_for_db
run_db_setup

echo ""
echo "============================================"
echo "  Starting Summit Finance"
echo "============================================"
echo ""

exec "$@"

#!/bin/sh
set -e

echo "Running database migrations..."
# DATABASE_URL is injected by docker-compose; drizzle config also tries .env.local (missing in container).
# Pass it explicitly so drizzle-kit picks it up regardless.
DATABASE_URL="$DATABASE_URL" npx drizzle-kit push

echo "Starting server..."
exec node server.js

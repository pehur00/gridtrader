#!/bin/bash

# Simple migration script using psql
# Loads environment from .env and runs all SQL migrations

set -e

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Migration directory
MIGRATIONS_DIR="src/db/migrations"

echo "Running database migrations..."
echo "Database: $DB_NAME on $DB_HOST:$DB_PORT"

# Run all SQL migration files in order
for file in "$MIGRATIONS_DIR"/*.sql; do
  if [ -f "$file" ]; then
    echo "Running migration: $(basename "$file")"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file"
    echo "✓ $(basename "$file") completed"
  fi
done

echo "All migrations completed successfully!"

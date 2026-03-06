#!/bin/bash

# ─────────────────────────────────────────────────────────────────────
#  Database Backup Script
#  - Creates a timestamped .sql dump of the PostgreSQL database
#  - Retains only the last 3 days of backups
# ─────────────────────────────────────────────────────────────────────

# Configuration
# Note: Ensure this script is run from the project root or adjust paths
BACKUP_DIR="./backups"
DB_NAME="smart_money_manager"
DB_USER="postgres"
RETENTION_DAYS=3

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Timestamp for filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
FILENAME="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo "🚀 [$(date)] Starting backup of $DB_NAME..."

# Execute pg_dump inside the docker container
# -T is used to prevent "input device is not a TTY" error in cron/Jenkins
docker compose exec -T db pg_dump -U "$DB_USER" "$DB_NAME" > "$FILENAME"

if [ $? -eq 0 ]; then
    echo "✅ Backup successfully created: $FILENAME"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Delete backups older than specified retention days
echo "🧹 Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "db_backup_*.sql" -type f -mtime +"$RETENTION_DAYS" -delete

echo "✨ Backup process complete."

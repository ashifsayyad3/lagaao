#!/bin/bash
# Daily MySQL backup for LAGAAO
BACKUP_DIR="/var/backups/lagaao"
DATE=$(date +%Y-%m-%d-%H%M)
DB_NAME="lagaao"
DB_USER="${MYSQL_APP_USER:-lagaao_user}"
DB_PASS="${MYSQL_APP_PASSWORD:-SecureAppPass@123}"

mkdir -p "$BACKUP_DIR"

# Dump database
mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" | gzip > "$BACKUP_DIR/lagaao-$DATE.sql.gz"

# Keep last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "$(date) Backup created: lagaao-$DATE.sql.gz"
